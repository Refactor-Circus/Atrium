<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\PennantPlus;

use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Support\Integration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;

/**
 * What Atrium shows of PennantPlus (refactor-circus/pennantplus), as data
 * only: v1's one nav item and its one screen, `pennantplus.features`, the
 * list of stored feature flag values. The layer's page
 * (`/pennantplus/features`) calls PennantPlus's own API for everything it
 * shows and changes; the API's 403 stands in for v1's "manages feature
 * flags" check (`pennantplus.ability`).
 *
 * v1 placed the item in its own `System` group, sorted 90 among the groups;
 * an integration describes no groups, so the item carries that sort itself,
 * and the group takes it from its first item.
 */
final class PennantPlusIntegration extends Integration
{
    public function label(): string
    {
        return self::trans('label');
    }

    public function navigation(): array
    {
        return [
            NavItem::make(self::trans('features'))
                ->url('/pennantplus/features')
                ->icon('i-lucide-flag')
                ->group(self::trans('group'))
                ->sort(90),
        ];
    }

    public function screens(): array
    {
        return [
            ScreenDeclaration::make('pennantplus.features', Screen::LIST, '/pennantplus/features'),
        ];
    }

    /**
     * A line of `lang/en/integrations/pennantplus.php`, or its key when missing.
     */
    private static function trans(string $key): string
    {
        $line = __('atrium::integrations/pennantplus.'.$key);

        return is_string($line) ? $line : $key;
    }
}
