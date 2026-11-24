<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Impex;

use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Data\SearchSourceDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Support\Integration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;

/**
 * What Atrium shows of Impex, the workflow engine and integration ledger,
 * ported from Impex's v1 `ImpexPlugin`. Everything here is data: the module's
 * Impex pages, widgets, panel, search source and live resolver call Impex's
 * own API (`impex.*`) for what they display.
 *
 * Departures from v1 (D-031, D-032): nav items no longer hide by permission
 * (a screen shows its no-access state on Impex's 403), Atrium computes no
 * Runs badge (the module's `impex.active-runs` resolver reads
 * `impex.stats.show`), and operator mode is gone with
 * `impex.atrium.show_all`. As in v1, the screens declare no audit subject:
 * Impex's models have no morph alias of their own to name.
 */
final class ImpexIntegration extends Integration
{
    public function label(): string
    {
        return __('atrium::integrations/impex.label');
    }

    public function navigation(): array
    {
        $group = __('atrium::integrations/impex.nav.group');

        return [
            NavItem::make(__('atrium::integrations/impex.nav.runs'))
                ->path('/impex/runs')
                ->icon('i-lucide-circle-play')
                ->group($group)
                ->sort(10)
                ->live('impex.active-runs'),

            NavItem::make(__('atrium::integrations/impex.nav.messages'))
                ->path('/impex/messages')
                ->icon('i-lucide-inbox')
                ->group($group)
                ->sort(20),

            NavItem::make(__('atrium::integrations/impex.nav.flows'))
                ->path('/impex/flows')
                ->icon('i-lucide-list-ordered')
                ->group($group)
                ->sort(30),

            NavItem::make(__('atrium::integrations/impex.nav.channels'))
                ->path('/impex/channels')
                ->icon('i-lucide-radio-tower')
                ->group($group)
                ->sort(40),

            NavItem::make(__('atrium::integrations/impex.nav.subscriptions'))
                ->path('/impex/subscriptions')
                ->icon('i-lucide-rss')
                ->group($group)
                ->sort(50),
        ];
    }

    /**
     * The v1 widgets under their v1 keys, so placements made in v1 still
     * resolve. Their components share one `impex.stats.show` request.
     */
    public function widgets(): array
    {
        return [
            WidgetDefinition::make('impex.run-status')
                ->label(__('atrium::integrations/impex.widgets.run_status'))
                ->description(__('atrium::integrations/impex.widgets.run_status_description'))
                ->icon('i-lucide-activity')
                ->defaultSize(6, 2),

            WidgetDefinition::make('impex.recent-failures')
                ->label(__('atrium::integrations/impex.widgets.recent_failures'))
                ->description(__('atrium::integrations/impex.widgets.recent_failures_description'))
                ->icon('i-lucide-circle-x')
                ->defaultSize(6, 2),

            WidgetDefinition::make('impex.message-volume')
                ->label(__('atrium::integrations/impex.widgets.message_volume'))
                ->description(__('atrium::integrations/impex.widgets.message_volume_description'))
                ->icon('i-lucide-arrow-left-right')
                ->defaultSize(3, 1),
        ];
    }

    /**
     * The v1 panel's key; its component renders `impex.settings-summary.show`.
     */
    public function settings(): SettingsPanel
    {
        return SettingsPanel::make('impex')
            ->label(__('atrium::integrations/impex.settings.label'))
            ->description(__('atrium::integrations/impex.settings.description'))
            ->icon('i-lucide-arrow-left-right');
    }

    /**
     * Runs by flow or id, from `impex.search.index`, linking to `/impex/runs/:id`.
     */
    public function searchSources(): array
    {
        return [
            SearchSourceDeclaration::make('impex')
                ->label(__('atrium::integrations/impex.search.label'))
                ->icon('i-lucide-circle-play'),
        ];
    }

    public function screens(): array
    {
        return [
            ScreenDeclaration::make('impex.runs', Screen::LIST, '/impex/runs'),
            ScreenDeclaration::make('impex.run', Screen::DETAIL, '/impex/runs/:run'),
            ScreenDeclaration::make('impex.flows', Screen::LIST, '/impex/flows'),
            ScreenDeclaration::make('impex.messages', Screen::LIST, '/impex/messages'),
            ScreenDeclaration::make('impex.message', Screen::DETAIL, '/impex/messages/:message'),
            ScreenDeclaration::make('impex.channels', Screen::LIST, '/impex/channels'),
            ScreenDeclaration::make('impex.channel-create', Screen::DETAIL, '/impex/channels/create'),
            ScreenDeclaration::make('impex.channel', Screen::DETAIL, '/impex/channels/:name'),
            ScreenDeclaration::make('impex.subscriptions', Screen::LIST, '/impex/subscriptions'),
            ScreenDeclaration::make('impex.subscription', Screen::DETAIL, '/impex/subscriptions/:subscription'),
        ];
    }
}
