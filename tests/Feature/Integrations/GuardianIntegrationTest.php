<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Pennant\Feature;
use Laravel\Pennant\PennantServiceProvider;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationFeatures;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Integrations\Guardian\GuardianFeature;
use RefactorCircus\Atrium\Integrations\Guardian\GuardianIntegration;
use RefactorCircus\Atrium\Integrations\Guardian\GuardianScopeTypes;
use RefactorCircus\Atrium\Support\Iconify;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;
use Workbench\App\Models\User;

/*
 * The Guardian integration (AC 79 to 82): gated as AC 39 to 41 say, with its
 * API base from `guardian.routes.prefix` and its API off as it ships (D-059);
 * nine nav items in one "Security" group, no widgets, panel or search sources
 * (D-057); and 15 screens whose static options read Guardian's config
 * (D-048, D-054), declared as data only.
 */

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();
    GuardianScopeTypes::forget();
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
    GuardianScopeTypes::forget();
});

/**
 * Guardian's own route config as it ships: off, under `guardian`.
 */
function guardianShippedRoutes(): void
{
    config()->set('guardian.routes', ['enabled' => false, 'prefix' => 'guardian']);
}

/**
 * Guardian installed with its API on under `guardian`, then registered.
 */
function registeredGuardian(string ...$alsoInstalled): RegisteredIntegration
{
    IntegrationFixture::installed('guardian', ...$alsoInstalled);
    config()->set('guardian.routes', ['enabled' => true, 'prefix' => 'guardian']);

    $guardian = IntegrationFixture::register()->get('guardian');

    expect($guardian)->not->toBeNull();

    /** @var RegisteredIntegration $guardian */
    return $guardian;
}

/**
 * @return array<string, ScreenDeclaration>
 */
function guardianScreens(): array
{
    return registeredGuardian()->screens;
}

function guardianApiWarning(): Closure
{
    return fn (string $message): bool => str_contains($message, 'guardian.routes.enabled')
        && str_contains($message, 'atrium.integrations.guardian.api_base');
}

describe('gating', function (): void {
    it('is the conventional class and feature for the guardian key', function (): void {
        expect(IntegrationRegistry::classFor('guardian'))->toBe(GuardianIntegration::class)
            ->and(IntegrationRegistry::featureFor('guardian'))->toBe(GuardianFeature::class);
    });

    it('registers while Guardian is installed, enabled and serving its API, at /guardian', function (): void {
        $guardian = registeredGuardian();

        expect($guardian->label)->toBe('Guardian')
            ->and($guardian->apiBase)->toBe('/guardian')
            ->and($guardian->features)->toBe([GuardianFeature::class]);
    });

    it('reads the API base from guardian.routes.prefix, trimmed, and lets api_base win', function (): void {
        IntegrationFixture::installed('guardian');
        config()->set('guardian.routes', ['enabled' => true, 'prefix' => '/api/security/']);

        expect(IntegrationFixture::register()->get('guardian')?->apiBase)->toBe('/api/security');

        app()->forgetInstance(IntegrationRegistry::class);
        config()->set('atrium.integrations.guardian.api_base', 'https://security.example.com/guardian');

        expect(IntegrationFixture::register()->get('guardian')?->apiBase)->toBe('https://security.example.com/guardian');
    });

    it('registers nothing while Guardian is not installed', function (): void {
        IntegrationFixture::installed('roster');
        config()->set('guardian.routes', ['enabled' => true, 'prefix' => 'guardian']);

        expect(IntegrationFixture::register()->get('guardian'))->toBeNull();
    });

    it('registers nothing while the integration is disabled', function (mixed $enabled): void {
        config()->set('atrium.integrations.guardian.enabled', $enabled);

        IntegrationFixture::installed('guardian');
        config()->set('guardian.routes', ['enabled' => true, 'prefix' => 'guardian']);

        expect(IntegrationFixture::register()->all())->toBe([]);
    })->with([
        'false' => [false],
        'the string "false"' => ['false'],
    ]);

    it('registers nothing while guardian.routes.enabled is false, its shipped default, and warns once', function (): void {
        Log::spy();

        IntegrationFixture::installed('guardian');
        guardianShippedRoutes();

        expect(IntegrationFixture::register()->all())->toBe([]);

        app()->forgetInstance(IntegrationRegistry::class);

        expect(IntegrationFixture::register()->all())->toBe([]);

        Log::shouldHaveReceived('warning')->withArgs(guardianApiWarning())->once();
    });

    it('registers once guardian.routes.enabled is turned on', function (): void {
        IntegrationFixture::installed('guardian');
        guardianShippedRoutes();

        expect(IntegrationFixture::register()->get('guardian'))->toBeNull();

        config()->set('guardian.routes.enabled', true);

        expect(IntegrationFixture::register()->get('guardian')?->apiBase)->toBe('/guardian');
    });

    it('registers without Roster installed, and beside it', function (): void {
        expect(array_keys(IntegrationFixture::register()->all()))->not->toContain('roster');

        registeredGuardian();

        expect(array_keys(app(IntegrationRegistry::class)->all()))->toBe(['guardian']);

        app()->forgetInstance(IntegrationRegistry::class);
        IntegrationFixture::serveApi('roster');

        registeredGuardian('roster');

        expect(array_keys(app(IntegrationRegistry::class)->all()))->toBe(['guardian', 'roster']);
    });
});

describe('feature flags', function (): void {
    /**
     * Whether Guardian is active for a request by `$user`.
     */
    function guardianActiveFor(User $user): bool
    {
        $request = Request::create('/');
        $request->setUserResolver(fn (): User => $user);

        return app(IntegrationFeatures::class)->active(registeredGuardian(), $request);
    }

    beforeEach(function (): void {
        app()->register(PennantServiceProvider::class);
        config()->set('pennant.default', 'array');

        $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);
    });

    it('is on for a user while GuardianFeature resolves on', function (): void {
        expect(guardianActiveFor($this->user))->toBeTrue();
    });

    it('is off for a user whose GuardianFeature is deactivated', function (): void {
        Feature::for($this->user)->deactivate(GuardianFeature::class);

        expect(guardianActiveFor($this->user))->toBeFalse();
    });

    it('is on for every user while Pennant is unavailable', function (): void {
        Feature::for($this->user)->deactivate(GuardianFeature::class);
        app(IntegrationFeatures::class)->detectPennantUsing(fn (): bool => false);

        expect(guardianActiveFor($this->user))->toBeTrue();
    });
});

describe('declarations', function (): void {
    it('declares the nine nav items of AC 82, in order, in one Security group', function (): void {
        $items = array_map(fn (NavItem $item): array => [
            'label' => $item->label,
            'icon' => $item->icon,
            'path' => $item->path,
            'group' => $item->group,
        ], registeredGuardian()->navigation);

        expect($items)->toBe([
            ['label' => 'My security', 'icon' => 'i-lucide-shield-user', 'path' => '/guardian/security', 'group' => 'Security'],
            ['label' => 'Roles', 'icon' => 'i-lucide-shield-check', 'path' => '/guardian/roles', 'group' => 'Security'],
            ['label' => 'Permissions', 'icon' => 'i-lucide-key-round', 'path' => '/guardian/permissions', 'group' => 'Security'],
            ['label' => 'Role assignments', 'icon' => 'i-lucide-user-check', 'path' => '/guardian/role-assignments', 'group' => 'Security'],
            ['label' => 'Security events', 'icon' => 'i-lucide-scroll-text', 'path' => '/guardian/security-events', 'group' => 'Security'],
            ['label' => 'Lockouts', 'icon' => 'i-lucide-lock', 'path' => '/guardian/lockouts', 'group' => 'Security'],
            ['label' => 'IP rules', 'icon' => 'i-lucide-network', 'path' => '/guardian/ip-rules', 'group' => 'Security'],
            ['label' => 'Two-factor policies', 'icon' => 'i-lucide-smartphone', 'path' => '/guardian/two-factor-policies', 'group' => 'Security'],
            ['label' => 'Password policy', 'icon' => 'i-lucide-rectangle-ellipsis', 'path' => '/guardian/password-policy', 'group' => 'Security'],
        ]);
    });

    it('sorts the nav items in their declared order, with no badge, and adds them to the navigation', function (): void {
        $guardian = registeredGuardian();
        $sorts = array_map(fn (NavItem $item): int => $item->sort, $guardian->navigation);
        $sorted = $sorts;
        sort($sorted);

        expect($sorts)->toBe($sorted)
            ->and(array_unique($sorts))->toHaveCount(9);

        foreach ($guardian->navigation as $item) {
            expect($item->resolveBadge())->toBeNull()
                ->and($item->icon)->toMatch(Iconify::PATTERN);
        }

        $labels = array_map(fn (NavItem $item): string => $item->label, app(NavigationRegistry::class)->items(Request::create('/')));

        expect($labels)->toContain('My security', 'Roles', 'Password policy');
    });

    it('declares no widgets, settings panel or search sources (D-057)', function (): void {
        $guardian = registeredGuardian();

        expect($guardian->widgets)->toBe([])
            ->and($guardian->settings)->toBeNull()
            ->and($guardian->searchSources)->toBe([])
            ->and(app(SettingsRegistry::class)->panels(Request::create('/')))->toBe([]);
    });

    it('declares the 15 screens of AC 82, with their kinds and layer paths', function (): void {
        $screens = array_map(fn (ScreenDeclaration $screen): array => [$screen->kind, $screen->path, $screen->subjectType], guardianScreens());

        expect($screens)->toBe([
            'guardian.security' => ['detail', '/guardian/security', null],
            'guardian.two-factor-challenge' => ['detail', '/guardian/two-factor/challenge', null],
            'guardian.two-factor-setup' => ['detail', '/guardian/two-factor/setup', null],
            'guardian.roles' => ['list', '/guardian/roles', null],
            'guardian.role' => ['detail', '/guardian/roles/:role', null],
            'guardian.permissions' => ['list', '/guardian/permissions', null],
            'guardian.role-assignments' => ['list', '/guardian/role-assignments', null],
            'guardian.user' => ['detail', '/guardian/users/:user', null],
            'guardian.security-events' => ['list', '/guardian/security-events', null],
            'guardian.security-event' => ['detail', '/guardian/security-events/:event', null],
            'guardian.lockouts' => ['list', '/guardian/lockouts', null],
            'guardian.ip-rules' => ['list', '/guardian/ip-rules', null],
            'guardian.two-factor-policies' => ['list', '/guardian/two-factor-policies', null],
            'guardian.password-policy' => ['detail', '/guardian/password-policy', null],
            'guardian.sso-connection' => ['detail', '/guardian/sso-connections/:connection', null],
        ]);
    });

    it('sends Guardian\'s defaults as the screens\' static options while Guardian\'s config is absent', function (): void {
        $options = array_map(fn (ScreenDeclaration $screen): array => $screen->options, guardianScreens());

        expect($options)->toBe([
            'guardian.security' => ['token_abilities' => ['*'], 'token_max_lifetime_days' => 365],
            'guardian.two-factor-challenge' => [],
            'guardian.two-factor-setup' => [],
            'guardian.roles' => ['scope_types' => []],
            'guardian.role' => ['scope_types' => []],
            'guardian.permissions' => [],
            'guardian.role-assignments' => ['scope_types' => []],
            'guardian.user' => ['scope_types' => [], 'token_abilities' => ['*']],
            'guardian.security-events' => [],
            'guardian.security-event' => [],
            'guardian.lockouts' => [],
            'guardian.ip-rules' => ['mode' => 'denylist'],
            'guardian.two-factor-policies' => ['scope_types' => []],
            'guardian.password-policy' => [],
            'guardian.sso-connection' => [],
        ]);
    });

    it('reads token abilities, the token lifetime and the IP rule mode from Guardian\'s config (D-054)', function (): void {
        config()->set('guardian.tokens', ['driver' => 'sanctum', 'abilities' => ['read', 'write', 5, ''], 'max_lifetime_days' => '30']);
        config()->set('guardian.ip_rules.mode', 'allowlist');

        $screens = guardianScreens();

        expect($screens['guardian.security']->options)->toBe(['token_abilities' => ['read', 'write'], 'token_max_lifetime_days' => 30])
            ->and($screens['guardian.user']->options['token_abilities'])->toBe(['read', 'write'])
            ->and($screens['guardian.ip-rules']->options)->toBe(['mode' => 'allowlist']);
    });

    it('sends no token lifetime when Guardian sets none, and its default for a bad one', function (mixed $days, ?int $sent): void {
        config()->set('guardian.tokens.max_lifetime_days', $days);

        expect(guardianScreens()['guardian.security']->options['token_max_lifetime_days'])->toBe($sent);
    })->with([
        'no limit' => [null, null],
        'zero' => [0, 365],
        'not a number' => ['soon', 365],
    ]);

    it('falls back to every ability and the deny list for config it cannot read', function (): void {
        config()->set('guardian.tokens.abilities', 'read');
        config()->set('guardian.ip_rules.mode', 'everything');

        $screens = guardianScreens();

        expect($screens['guardian.security']->options['token_abilities'])->toBe(['*'])
            ->and($screens['guardian.ip-rules']->options)->toBe(['mode' => 'denylist']);
    });

    it('sends the resolved scope types to the role, assignment, user and policy screens', function (): void {
        config()->set('guardian.adopt.scope_types', ['organization' => 'org', 'team' => 'team']);

        $screens = guardianScreens();
        $expected = [['key' => 'organization', 'type' => 'org'], ['key' => 'team', 'type' => 'team']];

        foreach (['guardian.roles', 'guardian.role', 'guardian.role-assignments', 'guardian.user', 'guardian.two-factor-policies'] as $key) {
            expect($screens[$key]->options['scope_types'])->toBe($expected, $key);
        }
    });

    it('writes its declarations to the layer fixture', function (): void {
        registeredGuardian();

        IntegrationFixture::assertMatchesFixture('guardian');
    });
});

describe('scope types (D-048)', function (): void {
    it('resolves a null value through guardian.adopt.scope_types.{key}', function (): void {
        config()->set('guardian.adopt.scope_types', ['organization' => 'App\\Models\\Organization', 'team' => 'team']);

        expect(GuardianScopeTypes::all())->toBe(['organization' => 'App\\Models\\Organization', 'team' => 'team'])
            ->and(GuardianScopeTypes::get('organization'))->toBe('App\\Models\\Organization')
            ->and(GuardianScopeTypes::options())->toBe([
                ['key' => 'organization', 'type' => 'App\\Models\\Organization'],
                ['key' => 'team', 'type' => 'team'],
            ]);
    });

    it('lets an explicit value win over Guardian\'s', function (): void {
        config()->set('guardian.adopt.scope_types', ['organization' => 'App\\Models\\Organization', 'team' => 'team']);
        config()->set('atrium.integrations.guardian.scope_types.organization', 'organization');

        expect(GuardianScopeTypes::all())->toBe(['organization' => 'organization', 'team' => 'team']);
    });

    it('drops a value that does not resolve to a non-empty string', function (mixed $value): void {
        config()->set('guardian.adopt.scope_types', ['team' => 'team']);
        config()->set('atrium.integrations.guardian.scope_types', ['organization' => $value, 'team' => null]);

        expect(GuardianScopeTypes::all())->toBe(['team' => 'team'])
            ->and(GuardianScopeTypes::get('organization'))->toBeNull();
    })->with([
        'null, with nothing in Guardian' => [null],
        'empty' => [''],
        'blank' => ['   '],
        'not a string' => [5],
    ]);

    it('resolves nothing without Guardian\'s config or a list', function (): void {
        config()->set('atrium.integrations.guardian.scope_types', 'organization');

        expect(GuardianScopeTypes::all())->toBe([])
            ->and(GuardianScopeTypes::options())->toBe([]);
    });

    it('resolves once per process', function (): void {
        config()->set('guardian.adopt.scope_types', ['organization' => 'first']);

        expect(GuardianScopeTypes::get('organization'))->toBe('first');

        config()->set('guardian.adopt.scope_types', ['organization' => 'second']);

        expect(GuardianScopeTypes::get('organization'))->toBe('first');

        GuardianScopeTypes::forget();

        expect(GuardianScopeTypes::get('organization'))->toBe('second');
    });
});

describe('labels and package code', function (): void {
    it('takes every label from lang/en/integrations/guardian.php', function (): void {
        $source = (string) file_get_contents(__DIR__.'/../../../src/Integrations/Guardian/GuardianIntegration.php');

        preg_match_all("/\\['([a-z_]+)', '\\/guardian\\//", $source, $matches);

        expect($matches[1])->toHaveCount(9);

        foreach (['label', 'group', ...$matches[1]] as $key) {
            expect(trans()->hasForLocale('atrium::integrations/guardian.'.$key, 'en'))->toBeTrue("Missing label [atrium::integrations/guardian.{$key}].");
        }
    });

    it('names nothing of Guardian\'s code, only its config, paths and keys', function (): void {
        foreach (glob(__DIR__.'/../../../src/Integrations/Guardian/*.php') ?: [] as $file) {
            expect(preg_match('/RefactorCircus\\\\{1,2}Guardian\b/i', (string) file_get_contents($file)))->toBe(0, $file);
        }
    });
});
