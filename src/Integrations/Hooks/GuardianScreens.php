<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Hooks;

use Illuminate\Support\Facades\Log;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Integrations\Guardian\GuardianScopeTypes;

/**
 * Guardian's tabs and sections on the other integrations' screens (AC 97),
 * as `atrium.integrations.guardian.screens` places them. As in Guardian v1's
 * `guardian.atrium.screens`, each target maps to a list in which a plain
 * value is a tab key and a `slot => key` entry is a section key (D-047):
 *
 * - the `guardian.access` tab: role assignments. On a screen whose record is
 *   a scope (its subject type ends in a `scope_types` key, such as
 *   `roster.organization`) it sends `{scope_type}`, the type Guardian stores
 *   for that scope; while that does not resolve the tab is skipped, with one
 *   warning per process naming `atrium.integrations.guardian.scope_types`
 *   (D-048). On a user screen (a subject type ending in `user`) it sends
 *   `{scope_type: null}`.
 * - the `guardian.user-security` tab and the `guardian.sso-identities`
 *   section: `{}`, the record is the user.
 * - the `guardian.sso` and `guardian.scim` tabs: `{scim_path}`, Guardian's
 *   SCIM prefix as a path; the record is the organization.
 *
 * Each is placed only on detail screens that declare a subject type, while
 * Guardian and the screen's integration are both registered, and shows only
 * while both are active. Targets, slots and keys are validated as AC 68 says.
 */
final class GuardianScreens extends Hook
{
    public const string ACCESS = 'guardian.access';

    public const string USER_SECURITY = 'guardian.user-security';

    public const string SSO = 'guardian.sso';

    public const string SCIM = 'guardian.scim';

    public const string SSO_IDENTITIES = 'guardian.sso-identities';

    /**
     * Guardian's tabs: label key and icon.
     *
     * @var array<string, array{string, string}>
     */
    private const array TABS = [
        self::ACCESS => ['atrium::integrations/hooks.guardian_access', 'i-lucide-key-round'],
        self::USER_SECURITY => ['atrium::integrations/hooks.guardian_user_security', 'i-lucide-shield'],
        self::SSO => ['atrium::integrations/hooks.guardian_sso', 'i-lucide-log-in'],
        self::SCIM => ['atrium::integrations/hooks.guardian_scim', 'i-lucide-server'],
    ];

    /**
     * Guardian's sections: label key.
     *
     * @var array<string, string>
     */
    private const array SECTIONS = [
        self::SSO_IDENTITIES => 'atrium::integrations/hooks.guardian_sso_identities',
    ];

    private const string KEY = 'atrium.integrations.guardian.screens';

    private const string SCOPE_TYPES_KEY = 'atrium.integrations.guardian.scope_types';

    /**
     * The default placements, for a config without the key.
     */
    private const array DEFAULT = [
        'roster.organization' => [self::ACCESS, self::SSO, self::SCIM],
        'roster.user' => [self::ACCESS, self::USER_SECURITY, 'aside' => self::SSO_IDENTITIES],
    ];

    /**
     * The scope keys this process has warned do not resolve.
     *
     * @var array<string, true>
     */
    private static array $warned = [];

    public function register(Hooks $hooks): void
    {
        $guardian = $this->integrations->get('guardian');

        if ($guardian === null) {
            return;
        }

        $placements = $this->config->get(self::KEY, self::DEFAULT);

        if (! is_array($placements)) {
            self::invalid('['.self::KEY.'] must map screen keys to lists of Guardian tab and section keys, such as [\'roster.user\' => [\'guardian.access\', \'aside\' => \'guardian.sso-identities\']].');

            return;
        }

        foreach ($placements as $target => $entries) {
            if (! self::validTarget($target)) {
                self::invalid('['.self::KEY.'] holds the invalid screen target ['.self::describe($target).']: use *, {package}.* or a screen key ({package}.{screen}).');

                continue;
            }

            if (! is_array($entries)) {
                self::invalid('['.self::KEY.'] places ['.$target.'] at ['.self::describe($entries).']: the entry must be a list of Guardian tab and section keys.');

                continue;
            }

            foreach ($entries as $slot => $key) {
                $this->place($hooks, $guardian, $target, $slot, $key);
            }
        }
    }

    /**
     * Forget which scope keys this process has warned about, so a test sees
     * its own warning.
     */
    public static function forgetWarnings(): void
    {
        self::$warned = [];
    }

    private function place(Hooks $hooks, RegisteredIntegration $guardian, string $target, int|string $slot, mixed $key): void
    {
        if (is_int($slot)) {
            if (! is_string($key) || ! isset(self::TABS[$key])) {
                self::invalid('['.self::KEY.'] places the unknown Guardian tab ['.self::describe($key).'] on ['.$target.']: use one of '.implode(', ', array_keys(self::TABS)).'.');

                return;
            }
        } elseif (! self::validSlot($slot)) {
            self::invalid('['.self::KEY.'] places ['.self::describe($key).'] on ['.$target.'] in the invalid slot ['.$slot.']: use a slot name matching '.Screen::NAME_PATTERN.'.');

            return;
        } elseif (! is_string($key) || ! isset(self::SECTIONS[$key])) {
            self::invalid('['.self::KEY.'] places the unknown Guardian section ['.self::describe($key).'] on ['.$target.']: use one of '.implode(', ', array_keys(self::SECTIONS)).'.');

            return;
        }

        foreach ($this->screens($target) as [$integration, $screen]) {
            if ($integration->key === $guardian->key || $screen->kind !== Screen::DETAIL || $screen->subjectType === null) {
                continue;
            }

            $data = $this->data($key, $screen);

            if ($data === null) {
                continue;
            }

            if (is_int($slot)) {
                [$label, $icon] = self::TABS[$key];

                $hooks->tab($screen->key, TabDefinition::make($key)
                    ->label(self::trans($label))
                    ->icon($icon)
                    ->authorize($this->whileActive($guardian, $integration))
                    ->resolve(fn (): array => $data));

                continue;
            }

            $hooks->section($screen->key, $slot, SectionDefinition::make($key)
                ->label(self::trans(self::SECTIONS[$key]))
                ->authorize($this->whileActive($guardian, $integration))
                ->resolve(fn (): array => $data));
        }
    }

    /**
     * The static data of one extension on one screen; null to skip it there.
     *
     * @return array<string, mixed>|null
     */
    private function data(string $key, ScreenDeclaration $screen): ?array
    {
        return match ($key) {
            self::ACCESS => $this->access($screen),
            self::SSO, self::SCIM => ['scim_path' => $this->scimPath()],
            default => [],
        };
    }

    /**
     * `guardian.access`: by user on a user screen, else in the scope the
     * screen's record is, while its type resolves.
     *
     * @return array{scope_type: string|null}|null
     */
    private function access(ScreenDeclaration $screen): ?array
    {
        $subject = (string) $screen->subjectType;
        $scope = str_contains($subject, '.') ? substr($subject, (int) strrpos($subject, '.') + 1) : $subject;

        if ($scope === 'user') {
            return ['scope_type' => null];
        }

        $type = GuardianScopeTypes::get($scope);

        if ($type === null) {
            $this->warn($scope, $screen->key);

            return null;
        }

        return ['scope_type' => $type];
    }

    private function scimPath(): string
    {
        $prefix = $this->config->get('guardian.scim.prefix', 'scim/v2');

        return '/'.trim(is_string($prefix) ? $prefix : 'scim/v2', '/');
    }

    private function warn(string $scope, string $screen): void
    {
        if (isset(self::$warned[$scope])) {
            return;
        }

        self::$warned[$scope] = true;

        Log::warning(sprintf(
            'Atrium skipped Guardian\'s [%s] tab on [%s]: the [%s] scope type does not resolve. Set [%s.%s], or [guardian.adopt.scope_types.%s], to the morph type Guardian stores for it.',
            self::ACCESS,
            $screen,
            $scope,
            self::SCOPE_TYPES_KEY,
            $scope,
            $scope,
        ));
    }
}
