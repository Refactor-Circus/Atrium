<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Hooks;

use Illuminate\Support\Str;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;

/**
 * Keen's history on the other integrations' screens (AC 67), from
 * `atrium.integrations.keen.history`:
 *
 * - the `keen.history` section, in `slot`, on every integration screen
 *   matched by `screens` and not by `exclude`: a detail screen sends
 *   `{source, subject_type}` (its package and its record's morph alias), and
 *   the layer adds `subject_id` from the record; a list screen sends
 *   `{source}` only;
 * - the `keen.activity` tab on the detail screens of each `tabs` entry,
 *   sending `{source, subject_type, scope}`: with `scope` (the default) the
 *   layer filters by `scope_type`/`scope_id`, the record as a scope, and
 *   otherwise by subject.
 *
 * Both list `keen.entries.index` in the layer, which renders nothing for a
 * package `keen.packages.index` does not list.
 */
final class KeenHistory extends Hook
{
    public const string SECTION = 'keen.history';

    public const string TAB = 'keen.activity';

    private const string KEY = 'atrium.integrations.keen.history';

    /**
     * The v1 defaults, for a config without the keys.
     */
    private const array SCREENS = ['*'];

    private const string SLOT = 'after';

    private const array EXCLUDE = ['keen.*', 'atrium.*'];

    private const array TABS = ['roster.organization' => ['scope' => true]];

    public function register(Hooks $hooks): void
    {
        $keen = $this->integrations->get('keen');

        if ($keen === null) {
            return;
        }

        $slot = $this->slot();

        if ($slot !== null) {
            $this->sections($hooks, $keen, $slot);
        }

        $this->tabs($hooks, $keen);
    }

    private function sections(Hooks $hooks, RegisteredIntegration $keen, string $slot): void
    {
        $exclude = self::strings($this->config->get(self::KEY.'.exclude', self::EXCLUDE));

        foreach (self::strings($this->config->get(self::KEY.'.screens', self::SCREENS)) as $target) {
            if (! self::validTarget($target)) {
                self::invalid('['.self::KEY.'.screens] holds the invalid screen target ['.$target.']: use *, {package}.* or a screen key ({package}.{screen}).');

                continue;
            }

            foreach ($this->screens($target) as [$integration, $screen]) {
                if (Str::is($exclude, $screen->key)) {
                    continue;
                }

                $data = $screen->kind === Screen::DETAIL
                    ? ['source' => $integration->key, 'subject_type' => $screen->subjectType]
                    : ['source' => $integration->key];

                $hooks->section($screen->key, $slot, SectionDefinition::make(self::SECTION)
                    ->label(self::trans('atrium::integrations/hooks.history'))
                    ->authorize($this->whileActive($keen, $integration))
                    ->resolve(fn (): array => $data));
            }
        }
    }

    private function tabs(Hooks $hooks, RegisteredIntegration $keen): void
    {
        $tabs = $this->config->get(self::KEY.'.tabs', self::TABS);

        foreach (is_array($tabs) ? $tabs : [] as $target => $options) {
            if (! self::validTarget($target)) {
                self::invalid('['.self::KEY.'.tabs] holds the invalid screen target ['.self::describe($target).']: use *, {package}.* or a screen key ({package}.{screen}).');

                continue;
            }

            $scope = filter_var(is_array($options) ? $options['scope'] ?? true : true, FILTER_VALIDATE_BOOLEAN);

            foreach ($this->screens($target) as [$integration, $screen]) {
                if ($screen->kind !== Screen::DETAIL || $screen->subjectType === null) {
                    continue;
                }

                $data = ['source' => $integration->key, 'subject_type' => $screen->subjectType, 'scope' => $scope];

                $hooks->tab($screen->key, TabDefinition::make(self::TAB)
                    ->label(self::trans('atrium::integrations/hooks.activity'))
                    ->icon('i-lucide-clipboard-list')
                    ->authorize($this->whileActive($keen, $integration))
                    ->resolve(fn (): array => $data));
            }
        }
    }

    /**
     * The section's slot, or null when it is invalid.
     */
    private function slot(): ?string
    {
        $slot = $this->config->get(self::KEY.'.slot', self::SLOT);

        if (! self::validSlot($slot)) {
            self::invalid('['.self::KEY.'.slot] holds the invalid slot ['.self::describe($slot).']: it must match '.Screen::NAME_PATTERN.'.');

            return null;
        }

        return $slot;
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
}
