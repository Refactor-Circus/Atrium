<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Keen;

use Illuminate\Contracts\Config\Repository;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Support\Integration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;

/**
 * Keen, the suite's audit log: every package's entries, one entry in full,
 * and each audited package's history, as the layer pages under `/keen/`.
 *
 * Its nav holds the audit log and, while
 * `atrium.integrations.keen.history.nav.enabled` is on, a History item whose
 * children the layer's `keen.history` live resolver lists from Keen's
 * `keen.packages.index`, handed the `nav.exclude`, `nav.groups` and
 * `nav.sort` settings as its options. Keen has no widget, settings panel or
 * search source.
 */
final class KeenIntegration extends Integration
{
    /** Where the History item sits when `nav.sort` is not a number. */
    private const int HISTORY_SORT = 90;

    public function __construct(private readonly Repository $config) {}

    public function label(): string
    {
        return $this->trans('atrium::integrations/keen.label');
    }

    public function navigation(): array
    {
        $items = [
            NavItem::make($this->trans('atrium::integrations/keen.audit_log'))
                ->url('/keen/entries')
                ->icon('i-lucide-clipboard-list')
                ->group($this->label())
                ->sort(90),
        ];

        $nav = $this->config->get('atrium.integrations.keen.history.nav', []);
        $nav = is_array($nav) ? $nav : [];

        if (filter_var($nav['enabled'] ?? true, FILTER_VALIDATE_BOOLEAN)) {
            $sort = is_numeric($nav['sort'] ?? null) ? (int) $nav['sort'] : self::HISTORY_SORT;

            $items[] = NavItem::make($this->trans('atrium::integrations/keen.history'))
                ->icon('i-lucide-history')
                ->group($this->label())
                ->sort($sort)
                ->live('keen.history', [
                    'exclude' => self::strings($nav['exclude'] ?? []),
                    'groups' => self::groups($nav['groups'] ?? []),
                    'sort' => $sort,
                ]);
        }

        return $items;
    }

    public function screens(): array
    {
        return [
            ScreenDeclaration::make('keen.entries', Screen::LIST, '/keen/entries'),
            ScreenDeclaration::make('keen.entry', Screen::DETAIL, '/keen/entries/:entry'),
            ScreenDeclaration::make('keen.history', Screen::LIST, '/keen/history/:package'),
        ];
    }

    /**
     * One of the integration's labels, from `lang/{locale}/integrations/keen.php`.
     */
    private function trans(string $key): string
    {
        $label = __($key);

        return is_string($label) ? $label : $key;
    }

    /**
     * The package keys to leave out of the History children.
     *
     * @return list<string>
     */
    private static function strings(mixed $value): array
    {
        $strings = [];

        foreach (is_array($value) ? $value : [$value] as $entry) {
            if (is_string($entry) && $entry !== '') {
                $strings[] = $entry;
            }
        }

        return $strings;
    }

    /**
     * Package key to the Atrium nav group (D-033) its History child sits
     * under.
     *
     * @return array<string, string>
     */
    private static function groups(mixed $value): array
    {
        $groups = [];

        foreach (is_array($value) ? $value : [] as $package => $group) {
            if (is_string($package) && is_string($group) && $group !== '') {
                $groups[$package] = $group;
            }
        }

        return $groups;
    }
}
