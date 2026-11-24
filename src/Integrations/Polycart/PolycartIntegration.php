<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Polycart;

use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Data\SearchSourceDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Support\Integration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;

/**
 * What Atrium shows of Polycart (refactor-circus/polycart), as data only,
 * ported from v1's `PolycartPlugin`: the carts and cart types nav items, the
 * `polycart.carts-by-type` and `polycart.recent-carts` widgets (both fed by
 * Polycart's `stats.show` in the layer, so each sends `data: {}`), the
 * `polycart` search source, and its three screens. The layer's pages,
 * widgets and search source call Polycart's own API for everything they show
 * and change; its policies answer 403 where v1 hid a control.
 *
 * Polycart ships its API off (`polycart.routes.enabled`), so this registers
 * only once the host turns it on behind its auth middleware, or points
 * `atrium.integrations.polycart.api_base` at it.
 *
 * v1 described a `Polycart` nav group sorted 30 among the groups; an
 * integration describes no groups, so its items carry that sort themselves
 * (the group takes its first item's), in v1's order.
 *
 * The cart screen declares no `subject_type`: Polycart sets no morph alias,
 * so a cart's morph class is a Polycart class name, which Atrium may not
 * name (AC 45).
 */
final class PolycartIntegration extends Integration
{
    public function label(): string
    {
        return self::trans('label');
    }

    public function navigation(): array
    {
        return [
            NavItem::make(self::trans('carts'))
                ->path('/polycart/carts')
                ->icon('i-lucide-shopping-cart')
                ->group(self::trans('group'))
                ->sort(30),

            NavItem::make(self::trans('types'))
                ->path('/polycart/types')
                ->icon('i-lucide-layers')
                ->group(self::trans('group'))
                ->sort(31),
        ];
    }

    /**
     * Offered in the picker, never placed on anyone's dashboard.
     */
    public function widgets(): array
    {
        return [
            WidgetDefinition::make('polycart.carts-by-type')
                ->label(self::trans('widget_carts_by_type'))
                ->description(self::trans('widget_carts_by_type_description'))
                ->icon('i-lucide-chart-column')
                ->defaultSize(6, 2),

            WidgetDefinition::make('polycart.recent-carts')
                ->label(self::trans('widget_recent_carts'))
                ->description(self::trans('widget_recent_carts_description'))
                ->icon('i-lucide-clock')
                ->defaultSize(6, 2),
        ];
    }

    public function searchSources(): array
    {
        return [
            SearchSourceDeclaration::make('polycart')
                ->label(self::trans('search'))
                ->icon('i-lucide-shopping-cart'),
        ];
    }

    public function screens(): array
    {
        return [
            ScreenDeclaration::make('polycart.carts', Screen::LIST, '/polycart/carts'),
            ScreenDeclaration::make('polycart.cart', Screen::DETAIL, '/polycart/carts/:cart'),
            ScreenDeclaration::make('polycart.types', Screen::LIST, '/polycart/types'),
        ];
    }

    /**
     * A line of `lang/en/integrations/polycart.php`, or its key when missing.
     */
    private static function trans(string $key): string
    {
        $line = __('atrium::integrations/polycart.'.$key);

        return is_string($line) ? $line : $key;
    }
}
