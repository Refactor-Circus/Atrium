<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Roster;

use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Data\SearchSourceDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Support\Integration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;

/**
 * Roster in Atrium: users, organizations and their teams, impersonations,
 * imports and exports, and the public invitation page, ported from Roster
 * v1's `RosterPlugin` as data only. Roles and permissions moved to the
 * Guardian integration (AC 99, D-046).
 *
 * The nav items, widgets and search sources keep their v1 keys, labels and
 * order. Nothing here loads Roster's code: the module's Vue components call
 * Roster's API (`roster.stats.*`, `roster.search.*` and the screens' own
 * routes), and every user the `viewAtrium` gate admits sees the nav items
 * (D-031); Roster's API answers 403 where v1 hid a link.
 */
final class RosterIntegration extends Integration
{
    /**
     * The subject alias the `roster.user` screen declares (D-034).
     */
    public const string USER = 'roster.user';

    /**
     * The subject alias the `roster.organization` screen declares (D-034).
     */
    public const string ORGANIZATION = 'roster.organization';

    public function label(): string
    {
        return __('atrium::integrations/roster.label');
    }

    public function navigation(): array
    {
        $group = $this->label();

        return [
            NavItem::make(__('atrium::integrations/roster.users'))
                ->icon('i-lucide-users')
                ->path('/roster/users')
                ->group($group)
                ->sort(10),

            NavItem::make(__('atrium::integrations/roster.organizations'))
                ->icon('i-lucide-building-2')
                ->path('/roster/organizations')
                ->group($group)
                ->sort(20),

            NavItem::make(__('atrium::integrations/roster.impersonations'))
                ->icon('i-lucide-eye')
                ->path('/roster/impersonations')
                ->group($group)
                ->sort(45),

            NavItem::make(__('atrium::integrations/roster.transfers'))
                ->icon('i-lucide-arrow-up-down')
                ->path('/roster/transfers')
                ->group($group)
                ->sort(48),
        ];
    }

    /**
     * Declared without a resolver: the `roster.user-status` component reads
     * `roster.stats.users`, and `roster.organizations` reads
     * `roster.stats.organizations`.
     */
    public function widgets(): array
    {
        return [
            WidgetDefinition::make('roster.user-status')
                ->label(__('atrium::integrations/roster.widget_user_status'))
                ->description(__('atrium::integrations/roster.widget_user_status_description'))
                ->icon('i-lucide-users')
                ->defaultSize(6, 2),

            WidgetDefinition::make('roster.organizations')
                ->label(__('atrium::integrations/roster.widget_organizations'))
                ->description(__('atrium::integrations/roster.widget_organizations_description'))
                ->icon('i-lucide-building-2')
                ->defaultSize(6, 1),
        ];
    }

    /**
     * Users and organizations as two sources, each filling its own
     * `atrium.search.results.per_source`: `roster-users` searches
     * `roster.search.users`, and `roster-organizations`
     * `roster.search.organizations`.
     */
    public function searchSources(): array
    {
        return [
            SearchSourceDeclaration::make('roster-users')
                ->label(__('atrium::integrations/roster.users'))
                ->icon('i-lucide-users'),

            SearchSourceDeclaration::make('roster-organizations')
                ->label(__('atrium::integrations/roster.organizations'))
                ->icon('i-lucide-building-2'),
        ];
    }

    /**
     * The v1 screen keys, at the v1 paths minus the `atrium` prefix (D-022).
     * `roster.invitation` is the public invitation page (AC 70).
     */
    public function screens(): array
    {
        return [
            ScreenDeclaration::make('roster.users', Screen::LIST, '/roster/users'),
            ScreenDeclaration::make('roster.user-create', Screen::DETAIL, '/roster/users/create'),
            ScreenDeclaration::make('roster.user', Screen::DETAIL, '/roster/users/:user')->subjectType(self::USER),
            ScreenDeclaration::make('roster.organizations', Screen::LIST, '/roster/organizations'),
            ScreenDeclaration::make('roster.organization-create', Screen::DETAIL, '/roster/organizations/create'),
            ScreenDeclaration::make('roster.organization', Screen::DETAIL, '/roster/organizations/:organization')->subjectType(self::ORGANIZATION),
            ScreenDeclaration::make('roster.team', Screen::DETAIL, '/roster/organizations/:organization/teams/:team'),
            ScreenDeclaration::make('roster.impersonations', Screen::LIST, '/roster/impersonations'),
            ScreenDeclaration::make('roster.transfers', Screen::LIST, '/roster/transfers'),
            ScreenDeclaration::make('roster.transfer', Screen::DETAIL, '/roster/transfers/:transfer'),
            ScreenDeclaration::make('roster.invitation', Screen::DETAIL, '/roster/invitations/:token'),
        ];
    }
}
