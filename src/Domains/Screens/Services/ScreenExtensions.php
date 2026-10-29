<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Screens\Services;

use Illuminate\Container\Container;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RefactorCircus\Atrium\Domains\Screens\Data\ResolvedScreen;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * The tabs and sections packages add to screens, registered from a
 * provider's `boot()` through `Atrium::screens()`.
 *
 * A target is an exact screen key (`roster.user`), every screen of a package
 * (`roster.*`) or every screen (`*`). A registration for a screen nobody
 * declares is kept and never renders. Registration validates and keeps a
 * copy, so later calls on the caller's instance change nothing, and nothing
 * can be unregistered at runtime.
 *
 * The registry holds registrations only; a screen's host resolves them per
 * request with `resolve()`, and ScreenVisibility remembers the answers.
 *
 * @phpstan-type Registrations array{
 *     tabs: array<string, array<array-key, array{int, TabDefinition}>>,
 *     sections: array<string, array<array-key, array<array-key, array{int, SectionDefinition}>>>,
 *     sequence: int,
 * }
 */
final class ScreenExtensions
{
    /**
     * Every screen of one package.
     */
    private const string PACKAGE_TARGET = '/^[a-z0-9-]+\.\*$/D';

    /**
     * Tabs by target, then key, each with its registration number.
     *
     * @var array<string, array<array-key, array{int, TabDefinition}>>
     */
    private array $tabs = [];

    /**
     * Sections by target, slot, then key, each with its registration number.
     *
     * @var array<string, array<array-key, array<array-key, array{int, SectionDefinition}>>>
     */
    private array $sections = [];

    /**
     * The last registration number, which orders wildcard registrations
     * across their targets.
     */
    private int $sequence = 0;

    /**
     * Add a tab to the target's screens.
     *
     * @throws InvalidArgumentException for a bad target, a tab with neither a view nor a component, or (in local and testing) a key the target already has
     */
    public function tab(string $target, TabDefinition $tab): self
    {
        $this->assertTarget($target);

        $tab = clone $tab;
        $this->assertRenders('Tab', $tab, $target);

        if (isset($this->tabs[$target][$tab->key])) {
            $this->duplicate(new InvalidArgumentException("Tab [{$tab->key}] is already registered for [{$target}]."));

            return $this;
        }

        $this->tabs[$target][$tab->key] = [++$this->sequence, $tab];

        return $this;
    }

    /**
     * Add a section to a slot of the target's screens. It renders only on
     * screens declaring that slot.
     *
     * @throws InvalidArgumentException for a bad target or slot, a section with neither a view nor a component, or (in local and testing) a key the target's slot already has
     */
    public function section(string $target, string $slot, SectionDefinition $section): self
    {
        $this->assertTarget($target);

        if (preg_match(Screen::NAME_PATTERN, $slot) !== 1) {
            throw new InvalidArgumentException("Slot name [{$slot}] must match ".Screen::NAME_PATTERN.'.');
        }

        $section = clone $section;
        $this->assertRenders('Section', $section, $target);

        if (isset($this->sections[$target][$slot][$section->key])) {
            $this->duplicate(new InvalidArgumentException("Section [{$section->key}] is already registered for [{$target}] in slot [{$slot}]."));

            return $this;
        }

        $this->sections[$target][$slot][$section->key] = [++$this->sequence, $section];

        return $this;
    }

    /**
     * Copies of the tabs registered for exactly this target, in registration
     * order.
     *
     * @return list<TabDefinition>
     */
    public function tabs(string $target): array
    {
        return array_values(array_map(fn (array $entry): TabDefinition => clone $entry[1], $this->tabs[$target] ?? []));
    }

    /**
     * Copies of the sections registered for exactly this target and slot, in
     * registration order.
     *
     * @return list<SectionDefinition>
     */
    public function sections(string $target, string $slot): array
    {
        return array_values(array_map(fn (array $entry): SectionDefinition => clone $entry[1], $this->sections[$target][$slot] ?? []));
    }

    /**
     * The current registrations, to hand back to `restore()`.
     *
     * @return Registrations
     */
    public function snapshot(): array
    {
        return [
            'tabs' => self::copy($this->tabs),
            'sections' => array_map(self::copy(...), $this->sections),
            'sequence' => $this->sequence,
        ];
    }

    /**
     * Replace every registration with a snapshot's.
     *
     * @param  Registrations  $snapshot
     */
    public function restore(array $snapshot): void
    {
        $this->tabs = self::copy($snapshot['tabs']);
        $this->sections = array_map(self::copy(...), $snapshot['sections']);
        $this->sequence = $snapshot['sequence'];
    }

    /**
     * Forget every registration. For the registry's own tests; apps' tests
     * use `Testing\ResetsScreenExtensions`.
     */
    public function flush(): void
    {
        $this->tabs = [];
        $this->sections = [];
        $this->sequence = 0;
    }

    /**
     * The screen with its extensions for this request: the built-in tabs,
     * then the visible exact registrations, then the visible wildcard ones,
     * each in registration order; the tab `?tab=` opens; and each declared
     * slot's sections. Call it only once the host has authorized the
     * request.
     *
     * Of two registrations with one key, the more specific target wins
     * (exact, then `{package}.*`, then `*`), and a registered tab may not
     * use a built-in key; what is skipped is reported once per request.
     *
     * @throws AccessDeniedHttpException for `?tab=` naming a registered tab the viewer may not see
     */
    public function resolve(Screen $screen, Request $request): ResolvedScreen
    {
        $visibility = Container::getInstance()->make(ScreenVisibility::class);
        $targets = [$screen->key, $screen->package.'.*', '*'];
        $builtIn = array_map(fn (TabDefinition $tab): string => $tab->key, $screen->tabs);

        $registered = $this->merge($screen, $visibility, 'tab', array_map(fn (string $target): array => $this->tabs[$target] ?? [], array_combine($targets, $targets)), $builtIn);

        $visible = array_values(array_filter(
            $registered,
            fn (TabDefinition $tab): bool => $visibility->allows($screen, ScreenVisibility::TABS, $tab, $request, $screen->record),
        ));

        $sections = [];

        foreach ([...$screen->slots, ...$screen->rowSlots] as $slot) {
            $sections[$slot] = $this->merge($screen, $visibility, "section in slot [{$slot}]", array_map(fn (string $target): array => $this->sections[$target][$slot] ?? [], array_combine($targets, $targets)), []);
        }

        [$openTab, $openRegisteredTab] = $this->openTab($screen, $request, $builtIn, $registered, $visible);

        return new ResolvedScreen(
            $screen,
            [...$screen->tabs, ...$visible],
            $openTab,
            $openRegisteredTab,
            $registered,
            $sections,
            $request,
            $visibility,
        );
    }

    /**
     * The tab to open: a built-in `?tab=` names, a visible registered one it
     * names, or else the default.
     *
     * @param  list<string>  $builtIn
     * @param  list<TabDefinition>  $registered
     * @param  list<TabDefinition>  $visible
     * @return array{string, ?TabDefinition}
     */
    private function openTab(Screen $screen, Request $request, array $builtIn, array $registered, array $visible): array
    {
        // A string only: ?tab[]=x and the like count as no tab.
        $requested = $request->query('tab');
        $requested = is_string($requested) ? $requested : null;

        if ($requested !== null && in_array($requested, $builtIn, true)) {
            return [$requested, null];
        }

        foreach ($registered as $tab) {
            if ($tab->key === $requested) {
                // Answering 403 rather than opening the default reveals that
                // the key exists, which is accepted.
                return in_array($tab, $visible, true) ? [$tab->key, $tab] : throw new AccessDeniedHttpException;
            }
        }

        $default = $screen->defaultTab;

        return [$default !== null && in_array($default, $builtIn, true) ? $default : $screen->tabs[0]->key, null];
    }

    /**
     * One screen's registrations from its targets, most specific first: the
     * first of each key wins and the rest are skipped and reported, as are
     * reserved keys. Exact registrations come first, then wildcard ones,
     * each in registration order. Each is a copy, so nothing the host does
     * to it reaches the registry.
     *
     * @template T of TabDefinition|SectionDefinition
     *
     * @param  array<string, array<array-key, array{int, T}>>  $byTarget
     * @param  list<string>  $reserved
     * @return list<T>
     */
    private function merge(Screen $screen, ScreenVisibility $visibility, string $kind, array $byTarget, array $reserved): array
    {
        /** @var array<array-key, array{int, int, T, string}> $winners */
        $winners = [];

        foreach ($byTarget as $target => $entries) {
            foreach ($entries as [$order, $extension]) {
                $key = $extension->key;

                if (in_array($key, $reserved, true)) {
                    $visibility->report("reserved\0{$screen->key}\0{$kind}\0{$key}\0{$target}", new InvalidArgumentException(
                        "Screen [{$screen->key}] skips the {$kind} [{$key}] registered for [{$target}]: it is a built-in tab key. Prefix registered keys with a vendor, such as vendor.key.",
                    ));

                    continue;
                }

                if (isset($winners[$key])) {
                    $visibility->report("duplicate\0{$screen->key}\0{$kind}\0{$key}\0{$target}", new InvalidArgumentException(
                        "Screen [{$screen->key}] skips the {$kind} [{$key}] registered for [{$target}]: [{$winners[$key][3]}] registers the same key.",
                    ));

                    continue;
                }

                $winners[$key] = [$target === $screen->key ? 0 : 1, $order, clone $extension, $target];
            }
        }

        usort($winners, fn (array $a, array $b): int => [$a[0], $a[1]] <=> [$b[0], $b[1]]);

        return array_map(fn (array $winner): TabDefinition|SectionDefinition => $winner[2], $winners);
    }

    private function assertTarget(string $target): void
    {
        if ($target === '*' || preg_match(Screen::KEY_PATTERN, $target) === 1 || preg_match(self::PACKAGE_TARGET, $target) === 1) {
            return;
        }

        throw new InvalidArgumentException("Screen extension target [{$target}] must be an exact screen key ({package}.{screen}), {package}.* or *.");
    }

    private function assertRenders(string $kind, TabDefinition|SectionDefinition $extension, string $target): void
    {
        if ($extension->view === null && $extension->component === null) {
            throw new InvalidArgumentException("{$kind} [{$extension->key}] registered for [{$target}] needs a view() or a component().");
        }
    }

    /**
     * A duplicate throws where a developer will see it (local, testing and
     * outside an application); elsewhere it is reported, and the first
     * registration is kept, rather than taking down every route and command
     * from boot().
     */
    private function duplicate(InvalidArgumentException $exception): void
    {
        $app = Container::getInstance();

        if (! $app instanceof Application || $app->environment('local', 'testing') === true) {
            throw $exception;
        }

        report($exception);
    }

    /**
     * Copies of a target's registrations, so a snapshot and the registry
     * never share a definition.
     *
     * @template T of TabDefinition|SectionDefinition
     *
     * @param  array<array-key, array<array-key, array{int, T}>>  $registrations
     * @return array<array-key, array<array-key, array{int, T}>>
     */
    private static function copy(array $registrations): array
    {
        return array_map(
            fn (array $entries): array => array_map(fn (array $entry): array => [$entry[0], clone $entry[1]], $entries),
            $registrations,
        );
    }
}
