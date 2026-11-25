<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Services;

use Closure;
use Illuminate\Container\Container;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Container\Container as ContainerContract;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Support\ManifestSchema;
use RefactorCircus\Atrium\Domains\Integrations\Support\ManifestValues;
use RefactorCircus\Atrium\Domains\Integrations\Support\SubjectScopeUnresolved;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;
use stdClass;

/**
 * The cross-package hooks (AC 65 to 68, 97; D-090): the tabs and sections an
 * integration's manifest adds to the screens of the others, under `hooks`.
 * Registered once the integrations have, in integration key order, then in
 * manifest order.
 *
 * A hook's placements are its manifest `default`, or the host's
 * `atrium.integrations.{pkg}.{config}` when set, in one of four formats:
 *
 * - `map`: target => `tab` (the hook's one tab) or a slot (its one section);
 * - `lists`: target => a list in which a plain value is a tab key and a
 *   `slot => key` entry a section key (D-047);
 * - `targets`: `{config}.screens` (targets), `{config}.slot` and
 *   `{config}.exclude` (patterns of screen keys left out), for its one section;
 * - `options`: target => options for its one tab, read by `$option`.
 *
 * An extension goes on each screen a registered integration declares that a
 * target matches (and the hook's `screens` filter keeps), one exact screen
 * key at a time, so it carries that screen's data; so a hook is absent while
 * the other integration is not registered. Each shows, per request, only
 * while both integrations are active (D-027). A target is `*`, `{package}.*`
 * or a screen key, a slot matches `Screen::NAME_PATTERN`: an invalid one in
 * the host's config throws InvalidArgumentException in `local` and `testing`,
 * and is reported and skipped anywhere else (D-034).
 *
 * Registration may run again (a later integration registered); each extension
 * is added once per screen.
 */
final class IntegrationHooks
{
    private const string PACKAGE_TARGET = '/^[a-z0-9-]+\.\*$/D';

    /**
     * What has been added, by kind, screen, slot and extension key.
     *
     * @var array<string, true>
     */
    private array $added = [];

    /**
     * The `$subject_scope` scopes this process has warned do not resolve.
     *
     * @var array<string, true>
     */
    private static array $warned = [];

    public function __construct(
        private readonly ContainerContract $app,
        private readonly Repository $config,
        private readonly IntegrationRegistry $integrations,
        private readonly IntegrationFeatures $features,
    ) {}

    /**
     * Run every registered integration's hooks.
     */
    public function register(): void
    {
        foreach ($this->integrations->all() as $owner) {
            foreach ($owner->hooks as $hook) {
                $this->hook($owner, $hook);
            }
        }
    }

    /**
     * Forget which scopes this process has warned about, so a test sees its
     * own warning.
     */
    public static function forgetWarnings(): void
    {
        self::$warned = [];
    }

    private function hook(RegisteredIntegration $owner, stdClass $hook): void
    {
        $key = isset($hook->config) ? 'atrium.integrations.'.$owner->key.'.'.$hook->config : null;
        $default = ManifestValues::plain($hook->default);

        match ($hook->format) {
            'map' => $this->map($owner, $hook, $key, $key === null ? $default : $this->config->get($key, $default)),
            'lists' => $this->lists($owner, $hook, $key, $key === null ? $default : $this->config->get($key, $default)),
            'targets' => $this->targets($owner, $hook, $key, is_array($default) ? $default : []),
            'options' => $this->options($owner, $hook, $key, $key === null ? $default : $this->config->get($key, $default)),
            // The schema allows no other format.
            default => null,
        };
    }

    private function map(RegisteredIntegration $owner, stdClass $hook, ?string $key, mixed $placements): void
    {
        $tab = self::only($hook->tabs ?? null);
        $section = self::only($hook->sections ?? null);

        if (! is_array($placements)) {
            self::invalid('['.$key.'] must map screen keys to '.($tab !== null ? '`tab` or ' : '').'a slot name, such as [\'roster.user\' => \'aside\'].');

            return;
        }

        foreach ($placements as $target => $placement) {
            if (! self::validTarget($target)) {
                self::invalid('['.$key.'] holds the invalid screen target ['.self::describe($target).']: use *, {package}.* or a screen key ({package}.{screen}).');

                continue;
            }

            $asTab = $placement === 'tab' && $tab !== null;

            if (! $asTab && (! self::validSlot($placement) || $section === null)) {
                self::invalid('['.$key.'] places ['.$target.'] in the invalid slot ['.self::describe($placement).']: use '.($tab !== null ? '`tab` or ' : '').'a slot name matching '.Screen::NAME_PATTERN.'.');

                continue;
            }

            foreach ($this->screens($owner, $hook, $target) as [$integration, $screen]) {
                if ($asTab) {
                    $this->tab($owner, $integration, $screen, $tab[0], $tab[1]);
                } else {
                    $this->section($owner, $integration, $screen, $placement, $section[0], $section[1]);
                }
            }
        }
    }

    private function lists(RegisteredIntegration $owner, stdClass $hook, ?string $key, mixed $placements): void
    {
        $tabs = ManifestSchema::fields($hook->tabs ?? null);
        $sections = ManifestSchema::fields($hook->sections ?? null);

        if (! is_array($placements)) {
            self::invalid('['.$key.'] must map screen keys to lists of '.$owner->label.' tab and section keys, such as [\'roster.user\' => [\''.(array_key_first($tabs) ?? 'tab').'\', \'aside\' => \''.(array_key_first($sections) ?? 'section').'\']].');

            return;
        }

        foreach ($placements as $target => $entries) {
            if (! self::validTarget($target)) {
                self::invalid('['.$key.'] holds the invalid screen target ['.self::describe($target).']: use *, {package}.* or a screen key ({package}.{screen}).');

                continue;
            }

            if (! is_array($entries)) {
                self::invalid('['.$key.'] places ['.$target.'] at ['.self::describe($entries).']: the entry must be a list of '.$owner->label.' tab and section keys.');

                continue;
            }

            foreach ($entries as $slot => $extension) {
                // The manifest's JSON form of a section entry: {"aside": "key"}.
                if (is_int($slot) && is_array($extension) && count($extension) === 1 && is_string(array_key_first($extension))) {
                    $slot = array_key_first($extension);
                    $extension = $extension[$slot];
                }

                if (is_int($slot)) {
                    if (! is_string($extension) || ! isset($tabs[$extension])) {
                        self::invalid('['.$key.'] places the unknown '.$owner->label.' tab ['.self::describe($extension).'] on ['.$target.']: use one of '.implode(', ', array_keys($tabs)).'.');

                        continue;
                    }
                } elseif (! self::validSlot($slot)) {
                    self::invalid('['.$key.'] places ['.self::describe($extension).'] on ['.$target.'] in the invalid slot ['.$slot.']: use a slot name matching '.Screen::NAME_PATTERN.'.');

                    continue;
                } elseif (! is_string($extension) || ! isset($sections[$extension])) {
                    self::invalid('['.$key.'] places the unknown '.$owner->label.' section ['.self::describe($extension).'] on ['.$target.']: use one of '.implode(', ', array_keys($sections)).'.');

                    continue;
                }

                foreach ($this->screens($owner, $hook, $target) as [$integration, $screen]) {
                    if (is_int($slot)) {
                        $this->tab($owner, $integration, $screen, $extension, $tabs[$extension]);
                    } else {
                        $this->section($owner, $integration, $screen, $slot, $extension, $sections[$extension]);
                    }
                }
            }
        }
    }

    /**
     * @param  array<array-key, mixed>  $default
     */
    private function targets(RegisteredIntegration $owner, stdClass $hook, ?string $key, array $default): void
    {
        $section = self::only($hook->sections ?? null);

        if ($section === null) {
            return;
        }

        $read = fn (string $name, mixed $fallback): mixed => $key === null ? $fallback : $this->config->get($key.'.'.$name, $fallback);
        $slot = $read('slot', $default['slot'] ?? null);

        if (! self::validSlot($slot)) {
            self::invalid('['.$key.'.slot] holds the invalid slot ['.self::describe($slot).']: it must match '.Screen::NAME_PATTERN.'.');

            return;
        }

        $exclude = self::strings($read('exclude', $default['exclude'] ?? []));

        foreach (self::strings($read('screens', $default['screens'] ?? [])) as $target) {
            if (! self::validTarget($target)) {
                self::invalid('['.$key.'.screens] holds the invalid screen target ['.$target.']: use *, {package}.* or a screen key ({package}.{screen}).');

                continue;
            }

            foreach ($this->screens($owner, $hook, $target) as [$integration, $screen]) {
                if ($exclude !== [] && Str::is($exclude, $screen->key)) {
                    continue;
                }

                $this->section($owner, $integration, $screen, $slot, $section[0], $section[1]);
            }
        }
    }

    private function options(RegisteredIntegration $owner, stdClass $hook, ?string $key, mixed $placements): void
    {
        $tab = self::only($hook->tabs ?? null);

        if ($tab === null) {
            return;
        }

        foreach (is_array($placements) ? $placements : [] as $target => $options) {
            if (! self::validTarget($target)) {
                self::invalid('['.$key.'] holds the invalid screen target ['.self::describe($target).']: use *, {package}.* or a screen key ({package}.{screen}).');

                continue;
            }

            foreach ($this->screens($owner, $hook, $target) as [$integration, $screen]) {
                $this->tab($owner, $integration, $screen, $tab[0], $tab[1], is_array($options) ? $options : []);
            }
        }
    }

    /**
     * Every screen a registered integration declares that the target matches
     * and the hook's `screens` filter keeps, with its integration, in key
     * order.
     *
     * @return list<array{RegisteredIntegration, ScreenDeclaration}>
     */
    private function screens(RegisteredIntegration $owner, stdClass $hook, string $target): array
    {
        $filter = (object) ManifestSchema::fields($hook->screens ?? null);
        $matches = [];

        foreach ($this->integrations->all() as $integration) {
            if (($filter->others ?? false) === true && $integration->key === $owner->key) {
                continue;
            }

            foreach ($integration->screens as $key => $screen) {
                if (! Str::is($target, $key)
                    || isset($filter->kind) && $screen->kind !== $filter->kind
                    || ($filter->subject ?? false) === true && $screen->subjectType === null) {
                    continue;
                }

                $matches[] = [$integration, $screen];
            }
        }

        return $matches;
    }

    /**
     * @param  array<array-key, mixed>  $options
     */
    private function tab(RegisteredIntegration $owner, RegisteredIntegration $integration, ScreenDeclaration $screen, string $key, stdClass $extension, array $options = []): void
    {
        $data = $this->data($owner, $integration, $screen, $key, 'tab', $extension, $options);

        if ($data === false || ! $this->first("tab\0{$screen->key}\0{$key}")) {
            return;
        }

        $tab = TabDefinition::make($key)
            ->label(self::trans($extension->label))
            ->authorize($this->whileActive($owner, $integration));

        if (isset($extension->icon)) {
            $tab->icon($extension->icon);
        }

        if ($data !== null) {
            $tab->resolve(fn (): array => $data);
        }

        $this->app->make(ScreenExtensions::class)->tab($screen->key, $tab);
    }

    private function section(RegisteredIntegration $owner, RegisteredIntegration $integration, ScreenDeclaration $screen, string $slot, string $key, stdClass $extension): void
    {
        $data = $this->data($owner, $integration, $screen, $key, 'section', $extension);

        if ($data === false || ! $this->first("section\0{$screen->key}\0{$slot}\0{$key}")) {
            return;
        }

        $section = SectionDefinition::make($key)
            ->label(self::trans($extension->label))
            ->authorize($this->whileActive($owner, $integration));

        if ($data !== null) {
            $section->resolve(fn (): array => $data);
        }

        $this->app->make(ScreenExtensions::class)->section($screen->key, $slot, $section);
    }

    /**
     * The extension's static data on one screen: null with no `data`, false to
     * skip it there (a `$subject_scope` that does not resolve).
     *
     * @param  array<array-key, mixed>  $options
     * @return array<array-key, mixed>|false|null
     */
    private function data(RegisteredIntegration $owner, RegisteredIntegration $integration, ScreenDeclaration $screen, string $key, string $kind, stdClass $extension, array $options = []): array|false|null
    {
        if (! isset($extension->data)) {
            return null;
        }

        try {
            $data = new ManifestValues($this->config, $integration->key, $screen, $options)->read($extension->data);
        } catch (SubjectScopeUnresolved $unresolved) {
            $this->warn($owner, $key, $kind, $screen, $unresolved);

            return false;
        }

        return is_array($data) ? $data : [];
    }

    private function warn(RegisteredIntegration $owner, string $key, string $kind, ScreenDeclaration $screen, SubjectScopeUnresolved $unresolved): void
    {
        if (isset(self::$warned[$owner->key."\0".$unresolved->scope])) {
            return;
        }

        self::$warned[$owner->key."\0".$unresolved->scope] = true;

        Log::warning(sprintf(
            'Atrium skipped %s\'s [%s] %s on [%s]: the [%s] scope type does not resolve. Set [%s.%s]%s to the morph type %s stores for it.',
            $owner->label,
            $key,
            $kind,
            $screen->key,
            $unresolved->scope,
            $unresolved->configKey,
            $unresolved->scope,
            $unresolved->fallback === null ? '' : ', or ['.$unresolved->fallback.'.'.$unresolved->scope.'],',
            $owner->label,
        ));
    }

    /**
     * Shows the extension only while both integrations are active for the
     * request.
     *
     * @return Closure(Request): bool
     */
    private function whileActive(RegisteredIntegration ...$integrations): Closure
    {
        return function (Request $request) use ($integrations): bool {
            foreach ($integrations as $integration) {
                if (! $this->features->active($integration, $request)) {
                    return false;
                }
            }

            return true;
        };
    }

    private function first(string $key): bool
    {
        if (isset($this->added[$key])) {
            return false;
        }

        $this->added[$key] = true;

        return true;
    }

    /**
     * The one extension of a map, as `[key, extension]`.
     *
     * @return array{string, stdClass}|null
     */
    private static function only(mixed $extensions): ?array
    {
        $extensions = $extensions instanceof stdClass ? get_object_vars($extensions) : [];
        $key = array_key_first($extensions);

        return is_string($key) && $extensions[$key] instanceof stdClass ? [$key, $extensions[$key]] : null;
    }

    /**
     * @phpstan-assert-if-true non-empty-string $target
     */
    private static function validTarget(mixed $target): bool
    {
        return is_string($target)
            && ($target === '*' || preg_match(self::PACKAGE_TARGET, $target) === 1 || preg_match(Screen::KEY_PATTERN, $target) === 1);
    }

    /**
     * @phpstan-assert-if-true non-empty-string $slot
     */
    private static function validSlot(mixed $slot): bool
    {
        return is_string($slot) && preg_match(Screen::NAME_PATTERN, $slot) === 1;
    }

    /**
     * The value as a list of strings: a lone value is wrapped, and anything
     * but a string dropped.
     *
     * @return list<string>
     */
    private static function strings(mixed $value): array
    {
        $strings = [];

        foreach (is_array($value) ? $value : [$value] as $entry) {
            if (is_string($entry)) {
                $strings[] = $entry;
            }
        }

        return $strings;
    }

    /**
     * Throw where a developer will see it (local, testing and outside an
     * application); elsewhere report it, so boot carries on.
     *
     * @throws InvalidArgumentException in local and testing
     */
    private static function invalid(string $message): void
    {
        $exception = new InvalidArgumentException($message);
        $app = Container::getInstance();

        if (! $app instanceof Application || $app->environment('local', 'testing') === true) {
            throw $exception;
        }

        report($exception);
    }

    private static function trans(string $label): string
    {
        $line = __($label);

        return is_string($line) ? $line : $label;
    }

    /**
     * A config value as it reads in an error message: JSON, or its type when
     * it has none.
     */
    private static function describe(mixed $value): string
    {
        if (is_string($value)) {
            return $value;
        }

        $json = json_encode($value);

        return $json === false ? get_debug_type($value) : $json;
    }
}
