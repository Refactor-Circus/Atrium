<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Showroom;

use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Data\SearchSourceDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Support\Integration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;

/**
 * What Atrium shows of Showroom, the product catalog, ported from Showroom's
 * v1 `ShowroomPlugin`. Everything here is data: the layer's Showroom pages,
 * widgets, panel and search source call Showroom's own API (`showroom.*`) for
 * what they display.
 *
 * Departures from v1 (D-031, D-032): nav items, widgets and the search
 * source no longer hide by policy (a screen shows its no-access state on
 * Showroom's 403), and the widgets read `showroom.stats.show` rather than
 * querying the catalog. Detail screens name a `subject_type` only where
 * Showroom keeps a short morph alias (`showroom_product`,
 * `showroom_product_model`, `showroom_owner`); its other models are aliased
 * by class name, which Atrium never names (AC 45).
 */
final class ShowroomIntegration extends Integration
{
    public function label(): string
    {
        return $this->trans('atrium::integrations/showroom.label');
    }

    /**
     * The v1 Catalog items, at their v1 places in the group.
     */
    public function navigation(): array
    {
        $group = $this->trans('atrium::integrations/showroom.nav.group');

        $item = fn (string $key, string $path, string $icon, int $sort): NavItem => NavItem::make($this->trans($key))
            ->url('/showroom/'.$path)
            ->icon($icon)
            ->group($group)
            ->sort($sort);

        return [
            $item('atrium::integrations/showroom.nav.products', 'products', 'i-lucide-box', 1),
            $item('atrium::integrations/showroom.nav.product_models', 'product-models', 'i-lucide-layers', 2),
            $item('atrium::integrations/showroom.nav.categories', 'categories', 'i-lucide-folder', 3),
            $item('atrium::integrations/showroom.nav.assets', 'assets', 'i-lucide-image', 4),
            $item('atrium::integrations/showroom.nav.owners', 'owners', 'i-lucide-store', 3),
            $item('atrium::integrations/showroom.nav.families', 'families', 'i-lucide-layout-grid', 5),
            $item('atrium::integrations/showroom.nav.attributes', 'attributes', 'i-lucide-tag', 10),
            $item('atrium::integrations/showroom.nav.channels', 'channels', 'i-lucide-globe', 30),
            $item('atrium::integrations/showroom.nav.transfers', 'transfers', 'i-lucide-arrow-up-down', 40),
            $item('atrium::integrations/showroom.nav.association_types', 'association-types', 'i-lucide-link', 35),
            $item('atrium::integrations/showroom.nav.attribute_groups', 'attribute-groups', 'i-lucide-grid-2x2', 20),
        ];
    }

    /**
     * The v1 widgets under their v1 keys, so placements made in v1 still
     * resolve. Their components share one `showroom.stats.show` request.
     */
    public function widgets(): array
    {
        return [
            WidgetDefinition::make('showroom.product-status')
                ->label($this->trans('atrium::integrations/showroom.widgets.product_status'))
                ->description($this->trans('atrium::integrations/showroom.widgets.product_status_description'))
                ->icon('i-lucide-box')
                ->defaultSize(6, 1),

            WidgetDefinition::make('showroom.completeness')
                ->label($this->trans('atrium::integrations/showroom.widgets.completeness'))
                ->description($this->trans('atrium::integrations/showroom.widgets.completeness_description'))
                ->icon('i-lucide-gauge')
                ->defaultSize(6, 2),

            WidgetDefinition::make('showroom.review-queue')
                ->label($this->trans('atrium::integrations/showroom.widgets.review_queue'))
                ->description($this->trans('atrium::integrations/showroom.widgets.review_queue_description'))
                ->icon('i-lucide-list-checks')
                ->defaultSize(6, 2),

            WidgetDefinition::make('showroom.recent-changes')
                ->label($this->trans('atrium::integrations/showroom.widgets.recent_changes'))
                ->description($this->trans('atrium::integrations/showroom.widgets.recent_changes_description'))
                ->icon('i-lucide-history')
                ->defaultSize(6, 2),
        ];
    }

    /**
     * The v1 panel's key; its component renders `showroom.settings-summary.show`.
     */
    public function settings(): SettingsPanel
    {
        return SettingsPanel::make('showroom')
            ->label($this->trans('atrium::integrations/showroom.settings.label'))
            ->description($this->trans('atrium::integrations/showroom.settings.description'))
            ->icon('i-lucide-box');
    }

    /**
     * Products, assets, categories, owners, families, attributes and
     * attribute groups from `showroom.search.index`, each linking to its
     * detail page.
     */
    public function searchSources(): array
    {
        return [
            SearchSourceDeclaration::make('showroom')
                ->label($this->trans('atrium::integrations/showroom.search.label'))
                ->icon('i-lucide-box'),
        ];
    }

    /**
     * The 27 v1 screen keys, at the v1 Blade paths without the `atrium`
     * prefix. Path parameters are Showroom's API route keys: a product and an
     * owner by its lookup key (the id by default), everything else by code.
     */
    public function screens(): array
    {
        return [
            ScreenDeclaration::make('showroom.products', Screen::LIST, '/showroom/products'),
            ScreenDeclaration::make('showroom.product-create', Screen::DETAIL, '/showroom/products/create'),
            ScreenDeclaration::make('showroom.product', Screen::DETAIL, '/showroom/products/:product')->subjectType('showroom_product'),

            ScreenDeclaration::make('showroom.product-models', Screen::LIST, '/showroom/product-models'),
            ScreenDeclaration::make('showroom.product-model', Screen::DETAIL, '/showroom/product-models/:productModel')->subjectType('showroom_product_model'),

            ScreenDeclaration::make('showroom.families', Screen::LIST, '/showroom/families'),
            ScreenDeclaration::make('showroom.family', Screen::DETAIL, '/showroom/families/:family'),
            ScreenDeclaration::make('showroom.family-variant', Screen::DETAIL, '/showroom/family-variants/:familyVariant'),

            ScreenDeclaration::make('showroom.attributes', Screen::LIST, '/showroom/attributes'),
            ScreenDeclaration::make('showroom.attribute-create', Screen::DETAIL, '/showroom/attributes/create'),
            ScreenDeclaration::make('showroom.attribute', Screen::DETAIL, '/showroom/attributes/:attribute'),

            ScreenDeclaration::make('showroom.attribute-groups', Screen::LIST, '/showroom/attribute-groups'),
            ScreenDeclaration::make('showroom.attribute-group', Screen::DETAIL, '/showroom/attribute-groups/:group'),

            ScreenDeclaration::make('showroom.association-types', Screen::LIST, '/showroom/association-types'),

            ScreenDeclaration::make('showroom.categories', Screen::LIST, '/showroom/categories'),
            ScreenDeclaration::make('showroom.category', Screen::DETAIL, '/showroom/categories/:category'),

            ScreenDeclaration::make('showroom.channels', Screen::LIST, '/showroom/channels'),
            ScreenDeclaration::make('showroom.channel', Screen::DETAIL, '/showroom/channels/:channel'),

            ScreenDeclaration::make('showroom.owners', Screen::LIST, '/showroom/owners'),
            ScreenDeclaration::make('showroom.owner', Screen::DETAIL, '/showroom/owners/:owner')->subjectType('showroom_owner'),
            ScreenDeclaration::make('showroom.owner-types', Screen::LIST, '/showroom/owner-types'),
            ScreenDeclaration::make('showroom.owner-type', Screen::DETAIL, '/showroom/owner-types/:ownerType'),

            ScreenDeclaration::make('showroom.flags', Screen::LIST, '/showroom/flags'),
            ScreenDeclaration::make('showroom.flag', Screen::DETAIL, '/showroom/flags/:flag'),

            ScreenDeclaration::make('showroom.assets', Screen::LIST, '/showroom/assets'),
            ScreenDeclaration::make('showroom.asset', Screen::DETAIL, '/showroom/assets/:asset'),

            ScreenDeclaration::make('showroom.transfers', Screen::LIST, '/showroom/transfers'),
        ];
    }

    /**
     * One of the integration's labels, from `lang/{locale}/integrations/showroom.php`.
     */
    private function trans(string $key): string
    {
        $label = __($key);

        return is_string($label) ? $label : $key;
    }
}
