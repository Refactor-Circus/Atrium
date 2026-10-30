<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Screens\Data;

use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use InvalidArgumentException;

/**
 * A screen declaring itself to the extension registry, built by its host per
 * request: its key (`{package}.{screen}`), record, kind, built-in tabs,
 * reserved tab keys and the slots packages may add sections to. The host passes it to
 * `ScreenExtensions::resolve()` after its own authorization.
 *
 * It states only generic facts, so packages can extend it without the host
 * knowing they exist.
 */
final class Screen
{
    public const string DETAIL = 'detail';

    public const string LIST = 'list';

    /**
     * The tab holding the page on a screen without built-in tabs.
     */
    public const string OVERVIEW = 'overview';

    /**
     * An exact screen key: the package, a dot, then the screen.
     */
    public const string KEY_PATTERN = '/^[a-z0-9-]+\.[a-z0-9.-]+$/D';

    /**
     * Extension keys and slot names.
     */
    public const string NAME_PATTERN = '/^[a-z0-9][a-z0-9._-]*$/D';

    public private(set) string $key;

    /**
     * The key's first segment.
     */
    public private(set) string $package;

    public private(set) ?Model $record = null;

    /**
     * `detail` or `list`.
     */
    public private(set) string $kind = self::DETAIL;

    /**
     * The built-in tabs, in order; the synthetic `overview` tab when the
     * host gives none.
     *
     * @var non-empty-list<TabDefinition>
     */
    public private(set) array $tabs;

    /**
     * The built-in tab opened without `?tab=`; the first built-in when it
     * names none of them.
     */
    public private(set) ?string $defaultTab = null;

    /**
     * Tab keys reserved without a tab, such as built-in tabs this viewer may
     * not open: a registered tab with one is skipped and reported, as for a
     * built-in key. They never render and `?tab=` cannot open them.
     *
     * @var list<string>
     */
    public private(set) array $reserved = [];

    /** @var list<string> */
    public private(set) array $slots = [];

    /** @var list<string> */
    public private(set) array $rowSlots = [];

    /** @var (Closure(string, Request, ?Model): bool)|null */
    private ?Closure $access = null;

    public function __construct(string $key)
    {
        if (preg_match(self::KEY_PATTERN, $key) !== 1) {
            throw new InvalidArgumentException("Screen key [{$key}] must be {package}.{screen} and match ".self::KEY_PATTERN.'.');
        }

        $this->key = $key;
        $this->package = strstr($key, '.', true) ?: $key;
        $this->tabs = [self::overview()];
    }

    public static function make(string $key): self
    {
        return new self($key);
    }

    /**
     * A screen with the standard slots: `header.actions`, `before` and
     * `after`, plus `aside` on a detail screen or the row slot `row.actions`
     * on a list screen.
     */
    public static function standard(string $key, string $kind): self
    {
        $screen = self::make($key)->kind($kind)->slots('header.actions', 'before', 'after');

        return $kind === self::DETAIL ? $screen->slots('aside') : $screen->rowSlots('row.actions');
    }

    public function record(?Model $record): self
    {
        $this->record = $record;

        return $this;
    }

    public function kind(string $kind): self
    {
        if (! in_array($kind, [self::DETAIL, self::LIST], true)) {
            throw new InvalidArgumentException("Screen kind [{$kind}] must be [detail] or [list].");
        }

        $this->kind = $kind;

        return $this;
    }

    /**
     * The host's own tabs, in order, each with a `key` and optionally a
     * `label` (the key by default) and an Atrium `icon`. Registered tabs
     * follow them and may not reuse their keys.
     *
     * @param  array<array-key, array<string, string>>  $builtIn  Entries of `key`, `label` and `icon`.
     */
    public function tabs(array $builtIn): self
    {
        $tabs = [];

        foreach ($builtIn as $entry) {
            $key = $entry['key'] ?? null;

            if (! is_string($key)) {
                throw new InvalidArgumentException("Every built-in tab of screen [{$this->key}] needs a string key.");
            }

            if (isset($tabs[$key])) {
                throw new InvalidArgumentException("Screen [{$this->key}] declares the built-in tab [{$key}] twice.");
            }

            $tabs[$key] = TabDefinition::make($key)
                ->label($entry['label'] ?? $key)
                ->icon($entry['icon'] ?? TabDefinition::DEFAULT_ICON);
        }

        $this->tabs = $tabs === [] ? [self::overview()] : array_values($tabs);

        return $this;
    }

    public function defaultTab(string $key): self
    {
        $this->defaultTab = $key;

        return $this;
    }

    /**
     * Reserve tab keys without rendering them, after any already reserved:
     * the keys of built-in tabs this viewer may not open. A registered tab
     * with one is skipped and reported, as for a built-in key, so it shows
     * to no one, and `?tab=` naming one opens the default tab.
     */
    public function reserve(string ...$keys): static
    {
        foreach ($keys as $key) {
            if (preg_match(self::NAME_PATTERN, $key) !== 1) {
                throw new InvalidArgumentException("Reserved tab key [{$key}] on screen [{$this->key}] must match ".self::NAME_PATTERN.'.');
            }

            if (! in_array($key, $this->reserved, true)) {
                $this->reserved[] = $key;
            }
        }

        return $this;
    }

    /**
     * Slots sections may be added to, after any already declared.
     */
    public function slots(string ...$slots): self
    {
        $this->slots = $this->declare($this->slots, $this->rowSlots, $slots);

        return $this;
    }

    /**
     * Slots rendered once per row, whose sections receive the row as their
     * record, after any already declared.
     */
    public function rowSlots(string ...$slots): self
    {
        $this->rowSlots = $this->declare($this->rowSlots, $this->slots, $slots);

        return $this;
    }

    /**
     * Decide the extensions' `permission()`s. Without it, every extension
     * with a permission is hidden.
     *
     * @param  Closure(string $permission, Request $request, ?Model $record): bool  $access
     */
    public function access(Closure $access): self
    {
        $this->access = $access;

        return $this;
    }

    /**
     * Whether the host grants the permission to the request's viewer on the
     * record (the screen's, or a row's).
     */
    public function permits(string $permission, Request $request, ?Model $record): bool
    {
        return $this->access !== null && ($this->access)($permission, $request, $record) === true;
    }

    /**
     * @param  list<string>  $declared
     * @param  list<string>  $other  The other kind of slot, which may not share a name.
     * @param  array<array-key, string>  $slots
     * @return list<string>
     */
    private function declare(array $declared, array $other, array $slots): array
    {
        foreach ($slots as $slot) {
            if (preg_match(self::NAME_PATTERN, $slot) !== 1) {
                throw new InvalidArgumentException("Slot name [{$slot}] on screen [{$this->key}] must match ".self::NAME_PATTERN.'.');
            }

            if (in_array($slot, $other, true)) {
                throw new InvalidArgumentException("Slot [{$slot}] on screen [{$this->key}] cannot be both a slot and a row slot.");
            }

            if (! in_array($slot, $declared, true)) {
                $declared[] = $slot;
            }
        }

        return $declared;
    }

    private static function overview(): TabDefinition
    {
        return TabDefinition::make(self::OVERVIEW)->label('Overview');
    }
}
