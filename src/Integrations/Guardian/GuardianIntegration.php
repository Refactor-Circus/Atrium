<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Guardian;

use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Support\Integration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;

/**
 * What Atrium shows of Guardian (refactor-circus/guardian), as data only:
 * the "Security" nav group, and the screens of the current user's security,
 * the two-factor challenge and setup, roles, permissions and their
 * assignments (moved from Roster, AC 99), one user's security, the security
 * administration and SSO connections. There are no widgets, settings panel
 * or search sources (D-057). The module's pages call Guardian's own API for
 * everything they show and change; Guardian answers 403 where a viewer may
 * not.
 *
 * Guardian ships its API off (`guardian.routes.enabled`), so this registers
 * only once the host turns it on behind its auth middleware, or points
 * `atrium.integrations.guardian.api_base` at it (D-059). It registers
 * whether or not Roster is installed; only its hooks on Roster's screens
 * need Roster.
 *
 * The screens' static options read Guardian's config as Atrium reads
 * `{pkg}.routes.*`, with Guardian's own defaults (D-054): token abilities and
 * lifetime, the IP rule mode, and the resolved scope types (D-048).
 */
final class GuardianIntegration extends Integration
{
    /**
     * Guardian's default `guardian.tokens.max_lifetime_days`.
     */
    public const int TOKEN_MAX_LIFETIME_DAYS = 365;

    public function label(): string
    {
        return self::trans('label');
    }

    public function navigation(): array
    {
        $group = self::trans('group');
        $items = [
            ['security', '/guardian/security', 'i-lucide-shield-user'],
            ['roles', '/guardian/roles', 'i-lucide-shield-check'],
            ['permissions', '/guardian/permissions', 'i-lucide-key-round'],
            ['role_assignments', '/guardian/role-assignments', 'i-lucide-user-check'],
            ['security_events', '/guardian/security-events', 'i-lucide-scroll-text'],
            ['lockouts', '/guardian/lockouts', 'i-lucide-lock'],
            ['ip_rules', '/guardian/ip-rules', 'i-lucide-network'],
            ['two_factor_policies', '/guardian/two-factor-policies', 'i-lucide-smartphone'],
            ['password_policy', '/guardian/password-policy', 'i-lucide-rectangle-ellipsis'],
        ];

        return array_map(
            fn (array $item, int $index): NavItem => NavItem::make(self::trans($item[0]))
                ->path($item[1])
                ->icon($item[2])
                ->group($group)
                ->sort(60 + $index),
            $items,
            array_keys($items),
        );
    }

    /**
     * The screens of AC 82, at their `/guardian/` front-end paths (D-022).
     */
    public function screens(): array
    {
        $scopeTypes = ['scope_types' => GuardianScopeTypes::options()];

        return [
            ScreenDeclaration::make('guardian.security', Screen::DETAIL, '/guardian/security')
                ->options($this->tokenOptions()),
            ScreenDeclaration::make('guardian.two-factor-challenge', Screen::DETAIL, '/guardian/two-factor/challenge'),
            ScreenDeclaration::make('guardian.two-factor-setup', Screen::DETAIL, '/guardian/two-factor/setup'),
            ScreenDeclaration::make('guardian.roles', Screen::LIST, '/guardian/roles')->options($scopeTypes),
            ScreenDeclaration::make('guardian.role', Screen::DETAIL, '/guardian/roles/:role')->options($scopeTypes),
            ScreenDeclaration::make('guardian.permissions', Screen::LIST, '/guardian/permissions'),
            ScreenDeclaration::make('guardian.role-assignments', Screen::LIST, '/guardian/role-assignments')->options($scopeTypes),
            ScreenDeclaration::make('guardian.user', Screen::DETAIL, '/guardian/users/:user')
                ->options([...$scopeTypes, 'token_abilities' => $this->tokenAbilities()]),
            ScreenDeclaration::make('guardian.security-events', Screen::LIST, '/guardian/security-events'),
            ScreenDeclaration::make('guardian.security-event', Screen::DETAIL, '/guardian/security-events/:event'),
            ScreenDeclaration::make('guardian.lockouts', Screen::LIST, '/guardian/lockouts'),
            ScreenDeclaration::make('guardian.ip-rules', Screen::LIST, '/guardian/ip-rules')
                ->options(['mode' => $this->ipRuleMode()]),
            ScreenDeclaration::make('guardian.two-factor-policies', Screen::LIST, '/guardian/two-factor-policies')->options($scopeTypes),
            ScreenDeclaration::make('guardian.password-policy', Screen::DETAIL, '/guardian/password-policy'),
            ScreenDeclaration::make('guardian.sso-connection', Screen::DETAIL, '/guardian/sso-connections/:connection'),
        ];
    }

    /**
     * @return array{token_abilities: list<string>, token_max_lifetime_days: int|null}
     */
    private function tokenOptions(): array
    {
        return [
            'token_abilities' => $this->tokenAbilities(),
            'token_max_lifetime_days' => $this->tokenMaxLifetimeDays(),
        ];
    }

    /**
     * `guardian.tokens.abilities`, its strings only; `['*']` when none is left.
     *
     * @return list<string>
     */
    private function tokenAbilities(): array
    {
        $abilities = config('guardian.tokens.abilities', ['*']);
        $abilities = array_values(array_unique(array_filter(
            is_array($abilities) ? $abilities : [],
            fn (mixed $ability): bool => is_string($ability) && $ability !== '',
        )));

        return $abilities === [] ? ['*'] : $abilities;
    }

    /**
     * `guardian.tokens.max_lifetime_days`: a positive number of days, null
     * when Guardian sets no limit, or Guardian's default for anything else.
     */
    private function tokenMaxLifetimeDays(): ?int
    {
        $days = config('guardian.tokens.max_lifetime_days', self::TOKEN_MAX_LIFETIME_DAYS);

        if ($days === null) {
            return null;
        }

        $days = filter_var($days, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        return is_int($days) ? $days : self::TOKEN_MAX_LIFETIME_DAYS;
    }

    /**
     * `guardian.ip_rules.mode`: `allowlist`, or Guardian's default `denylist`.
     */
    private function ipRuleMode(): string
    {
        return config('guardian.ip_rules.mode') === 'allowlist' ? 'allowlist' : 'denylist';
    }

    private static function trans(string $key): string
    {
        $line = __('atrium::integrations/guardian.'.$key);

        return is_string($line) ? $line : $key;
    }
}
