<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Laravel\Pennant\Feature;
use Laravel\Pennant\PennantServiceProvider;
use RefactorCircus\Atrium\Domains\Integrations\IntegrationsServiceProvider;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationHooks;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;
use Workbench\App\Models\User;

/*
 * The cross-package hooks (AC 65 to 68): Cortex's redirect domains on Roster's
 * screens, Impex's run link on Showroom's transfers, and Keen's history
 * section and activity tab on the other integrations' screens, and Guardian's
 * access, security, SSO and SCIM tabs and SSO identities section on Roster's
 * (AC 97). Each registers
 * only while both its integrations are registered, sends only static data
 * (its hook configuration), and shows per request only while both are active.
 */

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();
    IntegrationHooks::forgetWarnings();
    Gate::define('viewAtrium', fn ($user = null): bool => true);

    $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
    IntegrationHooks::forgetWarnings();
});

/**
 * The packages installed and served, the integrations registered, then the
 * hooks, as boot does.
 */
function hooksRegistered(string ...$packages): void
{
    IntegrationFixture::installed(...$packages);
    IntegrationFixture::serveApi(...$packages);
    IntegrationFixture::register();

    app(IntegrationHooks::class)->register();
}

/**
 * Every package a hook joins.
 */
function hooksEverything(): void
{
    hooksRegistered('cortex', 'impex', 'keen', 'roster', 'showroom');
}

/**
 * The tabs registered for exactly one screen, as `key => data`.
 *
 * @return array<string, array<string, mixed>>
 */
function hooksTabs(string $screen): array
{
    $tabs = [];

    foreach (app(ScreenExtensions::class)->tabs($screen) as $tab) {
        $tabs[$tab->key] = $tab->resolveData(null, Screen::make($screen));
    }

    return $tabs;
}

/**
 * The sections registered for exactly one screen and slot, as `key => data`.
 *
 * @return array<string, array<string, mixed>>
 */
function hooksSections(string $screen, string $slot): array
{
    $sections = [];

    foreach (app(ScreenExtensions::class)->sections($screen, $slot) as $section) {
        $sections[$section->key] = $section->resolveData(null, Screen::make($screen));
    }

    return $sections;
}

/**
 * @param  array<string, mixed>  $query
 * @return array<string, mixed>
 */
function hooksScreen(object $test, string $screen, array $query = []): array
{
    return $test->actingAs($test->user)->getJson(route('atrium.screens.show', ['screen' => $screen, ...$query]))->assertOk()->json('data');
}

describe('Cortex redirect domains (AC 65)', function (): void {
    it('registers the cortex.mcp tab on roster.organization and the section in roster.user\'s aside by default', function (): void {
        hooksRegistered('cortex', 'roster');

        expect(hooksTabs('roster.organization'))->toBe(['cortex.mcp' => ['owner_type' => 'roster.organization']])
            ->and(hooksSections('roster.user', 'aside'))->toBe(['cortex.redirect-domains' => ['owner_type' => 'roster.user']])
            ->and(hooksTabs('roster.user'))->toBe([])
            ->and(hooksSections('roster.organization', 'aside'))->toBe([]);
    });

    it('follows a changed config', function (): void {
        config()->set('atrium.integrations.cortex.redirect_domains.screens', ['roster.organization' => 'before', 'roster.*' => 'tab']);

        hooksRegistered('cortex', 'roster');

        expect(hooksSections('roster.organization', 'before'))->toBe(['cortex.redirect-domains' => ['owner_type' => 'roster.organization']])
            ->and(hooksTabs('roster.user'))->toBe(['cortex.mcp' => ['owner_type' => 'roster.user']])
            ->and(hooksTabs('roster.organization'))->toBe(['cortex.mcp' => ['owner_type' => 'roster.organization']])
            // Only detail screens with a record type own domains.
            ->and(hooksTabs('roster.users'))->toBe([])
            ->and(hooksTabs('roster.team'))->toBe([])
            ->and(hooksSections('roster.user', 'aside'))->toBe([]);
    });

    it('registers nothing for an empty list', function (): void {
        config()->set('atrium.integrations.cortex.redirect_domains.screens', []);

        hooksRegistered('cortex', 'roster');

        expect(hooksTabs('roster.organization'))->toBe([])
            ->and(hooksSections('roster.user', 'aside'))->toBe([]);
    });

    it('registers nothing while Cortex or Roster is not registered', function (array $packages): void {
        hooksRegistered(...$packages);

        expect(hooksTabs('roster.organization'))->not->toHaveKey('cortex.mcp')
            ->and(hooksSections('roster.user', 'aside'))->toBe([]);
    })->with([
        'without Roster' => [['cortex']],
        'without Cortex' => [['roster']],
        'with Keen, without Cortex' => [['roster', 'keen']],
    ]);

    it('registers nothing while Cortex is installed but not enabled', function (): void {
        config()->set('atrium.integrations.cortex.enabled', false);

        hooksRegistered('cortex', 'roster');

        expect(hooksTabs('roster.organization'))->toBe([]);
    });
});

describe('the Impex run link (AC 66)', function (): void {
    it('registers impex.run-link in showroom.transfers\' row.actions by default', function (): void {
        hooksRegistered('impex', 'showroom');

        expect(hooksSections('showroom.transfers', 'row.actions'))->toBe(['impex.run-link' => []])
            ->and(hooksSections('showroom.products', 'row.actions'))->toBe([]);
    });

    it('follows a changed config', function (): void {
        config()->set('atrium.integrations.impex.run_link.screens', ['showroom.products' => 'row.actions']);

        hooksRegistered('impex', 'showroom');

        expect(hooksSections('showroom.products', 'row.actions'))->toBe(['impex.run-link' => []])
            ->and(hooksSections('showroom.transfers', 'row.actions'))->toBe([]);
    });

    it('registers nothing while Impex or Showroom is not registered', function (array $packages): void {
        hooksRegistered(...$packages);

        expect(hooksSections('showroom.transfers', 'row.actions'))->toBe([]);
    })->with([
        'without Showroom' => [['impex']],
        'without Impex' => [['showroom']],
    ]);
});

describe('Keen history (AC 67)', function (): void {
    it('puts the keen.history section after every integration screen but Keen\'s own', function (): void {
        hooksEverything();

        expect(hooksSections('roster.user', 'after'))->toBe(['keen.history' => ['source' => 'roster', 'subject_type' => 'roster.user']])
            ->and(hooksSections('roster.users', 'after'))->toBe(['keen.history' => ['source' => 'roster']])
            ->and(hooksSections('showroom.product', 'after'))->toBe(['keen.history' => ['source' => 'showroom', 'subject_type' => 'showroom_product']])
            ->and(hooksSections('showroom.transfers', 'after'))->toBe(['keen.history' => ['source' => 'showroom']])
            ->and(hooksSections('impex.runs', 'after'))->toBe(['keen.history' => ['source' => 'impex']])
            ->and(hooksSections('cortex.tools', 'after'))->toBe(['keen.history' => ['source' => 'cortex']])
            // A detail screen without a record type still names none.
            ->and(hooksSections('impex.run', 'after'))->toBe(['keen.history' => ['source' => 'impex', 'subject_type' => null]])
            ->and(hooksSections('keen.entries', 'after'))->toBe([])
            ->and(hooksSections('keen.entry', 'after'))->toBe([])
            ->and(hooksSections('keen.history', 'after'))->toBe([]);
    });

    it('covers every screen of every registered integration except the excluded ones', function (): void {
        hooksEverything();

        $registry = app(IntegrationRegistry::class);
        $missing = [];

        foreach ($registry->all() as $integration) {
            foreach ($integration->screens as $key => $screen) {
                $has = array_key_exists('keen.history', hooksSections($key, 'after'));

                if ($has === str_starts_with($key, 'keen.')) {
                    $missing[] = $key;
                }
            }
        }

        expect($registry->all())->toHaveKeys(['cortex', 'impex', 'keen', 'roster', 'showroom'])
            ->and($missing)->toBe([]);
    });

    it('adds the scoped keen.activity tab on roster.organization by default', function (): void {
        hooksRegistered('keen', 'roster');

        expect(hooksTabs('roster.organization'))->toBe(['keen.activity' => ['source' => 'roster', 'subject_type' => 'roster.organization', 'scope' => true]])
            ->and(hooksTabs('roster.user'))->toBe([]);
    });

    it('follows a changed config', function (): void {
        config()->set('atrium.integrations.keen.history', [
            'screens' => ['roster.*', 'showroom.product'],
            'slot' => 'aside',
            'exclude' => ['roster.users'],
            'tabs' => ['roster.user' => ['scope' => false], 'showroom.*' => []],
        ]);

        hooksRegistered('keen', 'roster', 'showroom');

        expect(hooksSections('roster.user', 'aside'))->toBe(['keen.history' => ['source' => 'roster', 'subject_type' => 'roster.user']])
            ->and(hooksSections('roster.user', 'after'))->toBe([])
            ->and(hooksSections('roster.users', 'aside'))->toBe([])
            ->and(hooksSections('showroom.product', 'aside'))->toBe(['keen.history' => ['source' => 'showroom', 'subject_type' => 'showroom_product']])
            ->and(hooksSections('showroom.products', 'aside'))->toBe([])
            ->and(hooksTabs('roster.user'))->toBe(['keen.activity' => ['source' => 'roster', 'subject_type' => 'roster.user', 'scope' => false]])
            ->and(hooksTabs('roster.organization'))->toBe([])
            // A tab with no options is scoped, as in v1.
            ->and(hooksTabs('showroom.product'))->toBe(['keen.activity' => ['source' => 'showroom', 'subject_type' => 'showroom_product', 'scope' => true]])
            ->and(hooksTabs('showroom.products'))->toBe([]);
    });

    it('registers nothing while Keen is not registered', function (): void {
        hooksRegistered('cortex', 'impex', 'roster', 'showroom');

        expect(hooksSections('roster.user', 'after'))->toBe([])
            ->and(hooksSections('showroom.transfers', 'after'))->toBe([])
            ->and(hooksTabs('roster.organization'))->toBe(['cortex.mcp' => ['owner_type' => 'roster.organization']]);
    });

    it('registers on no screen of an integration that is not registered', function (): void {
        hooksRegistered('keen', 'impex');

        expect(hooksSections('impex.runs', 'after'))->toHaveKey('keen.history')
            ->and(hooksSections('roster.user', 'after'))->toBe([])
            ->and(hooksTabs('roster.organization'))->toBe([]);
    });
});

describe('hook targets and slots (AC 68)', function (): void {
    it('throws on an invalid target or slot in testing', function (string $key, mixed $value, array $packages): void {
        config()->set($key, $value);

        expect(fn () => hooksRegistered(...$packages))->toThrow(InvalidArgumentException::class);
    })->with([
        'a Cortex target' => ['atrium.integrations.cortex.redirect_domains.screens', ['Roster User' => 'tab'], ['cortex', 'roster']],
        'a Cortex slot' => ['atrium.integrations.cortex.redirect_domains.screens', ['roster.user' => 'not a slot!'], ['cortex', 'roster']],
        'a Cortex list that is no list' => ['atrium.integrations.cortex.redirect_domains.screens', 'roster.user', ['cortex', 'roster']],
        'an Impex target' => ['atrium.integrations.impex.run_link.screens', ['showroom.' => 'row.actions'], ['impex', 'showroom']],
        'an Impex slot' => ['atrium.integrations.impex.run_link.screens', ['showroom.transfers' => ''], ['impex', 'showroom']],
        'a Keen screen target' => ['atrium.integrations.keen.history.screens', ['*.*'], ['keen', 'roster']],
        'a Keen slot' => ['atrium.integrations.keen.history.slot', 'After It', ['keen', 'roster']],
        'a Keen tab target' => ['atrium.integrations.keen.history.tabs', ['roster' => ['scope' => true]], ['keen', 'roster']],
    ]);

    it('throws in local too', function (): void {
        $this->withEnvironment('local');
        config()->set('atrium.integrations.impex.run_link.screens', ['bad target' => 'row.actions']);

        expect(fn () => hooksRegistered('impex', 'showroom'))->toThrow(InvalidArgumentException::class);
    });

    it('reports and skips an invalid entry elsewhere, keeping the valid ones', function (): void {
        $this->withEnvironment('production');
        Exceptions::fake();

        config()->set('atrium.integrations.cortex.redirect_domains.screens', ['Roster User' => 'tab', 'roster.user' => 'aside', 'roster.organization' => 'not a slot!']);
        config()->set('atrium.integrations.impex.run_link.screens', ['showroom.' => 'row.actions', 'showroom.transfers' => 'row.actions']);
        config()->set('atrium.integrations.keen.history.screens', ['*.*', 'roster.user']);
        config()->set('atrium.integrations.keen.history.tabs', ['roster' => [], 'roster.organization' => ['scope' => true]]);

        hooksEverything();

        expect(hooksSections('roster.user', 'aside'))->toHaveKey('cortex.redirect-domains')
            ->and(hooksTabs('roster.organization'))->toBe(['keen.activity' => ['source' => 'roster', 'subject_type' => 'roster.organization', 'scope' => true]])
            ->and(hooksSections('showroom.transfers', 'row.actions'))->toBe(['impex.run-link' => []])
            ->and(hooksSections('roster.user', 'after'))->toHaveKey('keen.history')
            ->and(hooksSections('roster.users', 'after'))->toBe([]);

        Exceptions::assertReportedCount(5);
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), '[Roster User]'));
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), '[not a slot!]'));
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), '[showroom.]'));
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), '[*.*]'));
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), '[roster]'));
    });

    it('skips the section, but not the tabs, for an invalid Keen slot elsewhere', function (): void {
        $this->withEnvironment('production');
        Exceptions::fake();
        config()->set('atrium.integrations.keen.history.slot', ['after']);

        hooksRegistered('keen', 'roster');

        expect(hooksSections('roster.user', 'after'))->toBe([])
            ->and(hooksTabs('roster.organization'))->toHaveKey('keen.activity');

        Exceptions::assertReportedCount(1);
    });

    it('validates nothing while the hook\'s integration is not registered', function (): void {
        config()->set('atrium.integrations.cortex.redirect_domains.screens', ['Roster User' => 'tab']);
        config()->set('atrium.integrations.impex.run_link.screens', 'nonsense');
        config()->set('atrium.integrations.keen.history.slot', 'After It');

        hooksRegistered('roster', 'showroom');

        expect(hooksTabs('roster.organization'))->toBe([]);
    });

    it('registers each extension once when registration runs again', function (): void {
        hooksEverything();
        IntegrationFixture::register();
        app(IntegrationHooks::class)->register();

        expect(app(ScreenExtensions::class)->tabs('roster.organization'))->toHaveCount(2)
            ->and(app(ScreenExtensions::class)->sections('roster.user', 'after'))->toHaveCount(1);
    });

    it('adds the hooks of an integration registered later', function (): void {
        hooksRegistered('cortex');

        expect(hooksTabs('roster.organization'))->toBe([]);

        hooksRegistered('cortex', 'roster');

        expect(hooksTabs('roster.organization'))->toBe(['cortex.mcp' => ['owner_type' => 'roster.organization']]);
    });
});

describe('atrium.screens.show with every hook on (AC 68)', function (): void {
    beforeEach(function (): void {
        hooksEverything();
    });

    it('sends roster.organization with the cortex.mcp tab and the scoped keen.activity tab', function (): void {
        $screen = hooksScreen($this, 'roster.organization', ['record' => 'acme']);

        expect($screen['record'])->toBe('acme')
            ->and($screen['subject_type'])->toBe('roster.organization')
            ->and($screen['tabs'])->toBe([
                ['key' => 'overview', 'label' => 'Overview', 'icon' => 'i-lucide-layout-grid', 'built_in' => true, 'component' => null],
                ['key' => 'cortex.mcp', 'label' => 'MCP', 'icon' => 'i-lucide-globe', 'built_in' => false, 'component' => 'cortex.mcp'],
                ['key' => 'keen.activity', 'label' => 'Activity', 'icon' => 'i-lucide-clipboard-list', 'built_in' => false, 'component' => 'keen.activity'],
            ])
            ->and($screen['sections'])->toBe([
                'header.actions' => [],
                'before' => [],
                'after' => [
                    ['key' => 'keen.history', 'label' => 'History', 'component' => 'keen.history', 'data' => ['source' => 'roster', 'subject_type' => 'roster.organization']],
                ],
                'aside' => [],
            ]);
    });

    it('sends the cortex.mcp tab\'s data when it is open', function (): void {
        $screen = hooksScreen($this, 'roster.organization', ['record' => 'acme', 'tab' => 'cortex.mcp']);

        expect($screen['open_tab'])->toBe('cortex.mcp')
            ->and($screen['tabs'][1]['data'])->toBe(['owner_type' => 'roster.organization'])
            ->and($screen['tabs'][2])->not->toHaveKey('data');
    });

    it('sends the keen.activity tab\'s data, scoped, when it is open', function (): void {
        $screen = hooksScreen($this, 'roster.organization', ['record' => 'acme', 'tab' => 'keen.activity']);

        expect($screen['open_tab'])->toBe('keen.activity')
            ->and($screen['tabs'][2]['data'])->toBe(['source' => 'roster', 'subject_type' => 'roster.organization', 'scope' => true]);
    });

    it('sends roster.user with the cortex.redirect-domains aside and the keen.history section', function (): void {
        $screen = hooksScreen($this, 'roster.user', ['record' => '7']);

        expect(array_column($screen['tabs'], 'key'))->toBe(['overview'])
            ->and($screen['sections'])->toBe([
                'header.actions' => [],
                'before' => [],
                'after' => [
                    ['key' => 'keen.history', 'label' => 'History', 'component' => 'keen.history', 'data' => ['source' => 'roster', 'subject_type' => 'roster.user']],
                ],
                'aside' => [
                    ['key' => 'cortex.redirect-domains', 'label' => 'Redirect domains', 'component' => 'cortex.redirect-domains', 'data' => ['owner_type' => 'roster.user']],
                ],
            ]);
    });

    it('sends showroom.transfers with the impex.run-link row action', function (): void {
        $screen = hooksScreen($this, 'showroom.transfers');

        expect($screen['kind'])->toBe('list')
            ->and($screen['sections'])->toBe([
                'header.actions' => [],
                'before' => [],
                'after' => [
                    ['key' => 'keen.history', 'label' => 'History', 'component' => 'keen.history', 'data' => ['source' => 'showroom']],
                ],
                'row.actions' => [
                    ['key' => 'impex.run-link', 'label' => 'Run', 'component' => 'impex.run-link', 'data' => []],
                ],
            ]);
    });

    it('hides a hook whose integration is flagged off for the user', function (): void {
        app()->register(PennantServiceProvider::class);
        config()->set('pennant.default', 'array');
        Feature::for($this->user)->deactivate('cortex.atrium');
        Feature::for($this->user)->deactivate('keen.atrium');

        $screen = hooksScreen($this, 'roster.user', ['record' => '7']);

        expect($screen['sections']['aside'])->toBe([])
            ->and($screen['sections']['after'])->toBe([])
            ->and(array_column(hooksScreen($this, 'roster.organization')['tabs'], 'key'))->toBe(['overview']);
    });
});

/**
 * Guardian's scope types as a host that adopted Roster's scopes sets them.
 */
function hooksGuardianScopes(): void
{
    config()->set('guardian.adopt.scope_types.organization', 'roster.organization');
    config()->set('guardian.adopt.scope_types.team', 'roster.team');
}

describe('Guardian on Roster\'s screens (AC 97)', function (): void {
    it('registers the access, SSO and SCIM tabs on roster.organization and the user tabs and identities section on roster.user by default', function (): void {
        hooksGuardianScopes();
        hooksRegistered('guardian', 'roster');

        expect(hooksTabs('roster.organization'))->toBe([
            'guardian.access' => ['scope_type' => 'roster.organization'],
            'guardian.sso' => ['scim_path' => '/scim/v2'],
            'guardian.scim' => ['scim_path' => '/scim/v2'],
        ])
            ->and(hooksTabs('roster.user'))->toBe([
                'guardian.access' => ['scope_type' => null],
                'guardian.user-security' => [],
            ])
            ->and(hooksSections('roster.user', 'aside'))->toBe(['guardian.sso-identities' => []])
            ->and(hooksTabs('roster.team'))->toBe([])
            ->and(hooksTabs('roster.users'))->toBe([]);
    });

    it('labels each tab and section, with an icon on each tab', function (): void {
        hooksGuardianScopes();
        hooksRegistered('guardian', 'roster');

        $tabs = [];

        foreach (app(ScreenExtensions::class)->tabs('roster.organization') as $tab) {
            $tabs[$tab->key] = [$tab->label, $tab->icon];
        }

        expect($tabs)->toBe([
            'guardian.access' => ['Access', 'i-lucide-key-round'],
            'guardian.sso' => ['SSO', 'i-lucide-log-in'],
            'guardian.scim' => ['SCIM', 'i-lucide-server'],
        ])
            ->and(array_map(fn (SectionDefinition $section): string => $section->label, app(ScreenExtensions::class)->sections('roster.user', 'aside')))->toBe(['SSO identities']);
    });

    it('follows a changed config', function (): void {
        hooksGuardianScopes();
        config()->set('atrium.integrations.guardian.screens', [
            'roster.organization' => ['guardian.scim', 'before' => 'guardian.sso-identities'],
            'roster.*' => ['guardian.user-security'],
        ]);

        hooksRegistered('guardian', 'roster');

        expect(hooksTabs('roster.organization'))->toBe(['guardian.scim' => ['scim_path' => '/scim/v2'], 'guardian.user-security' => []])
            ->and(hooksSections('roster.organization', 'before'))->toBe(['guardian.sso-identities' => []])
            ->and(hooksTabs('roster.user'))->toBe(['guardian.user-security' => []])
            ->and(hooksSections('roster.user', 'aside'))->toBe([]);
    });

    it('sends Guardian\'s SCIM prefix as a path', function (mixed $prefix, string $path): void {
        hooksGuardianScopes();
        config()->set('guardian.scim.prefix', $prefix);

        hooksRegistered('guardian', 'roster');

        expect(hooksTabs('roster.organization')['guardian.scim'])->toBe(['scim_path' => $path]);
    })->with([
        'the default' => [null, '/scim/v2'],
        'slashes trimmed' => ['/directory/scim/', '/directory/scim'],
        'a bare prefix' => ['scim', '/scim'],
    ]);

    it('registers nothing for an empty map', function (): void {
        config()->set('atrium.integrations.guardian.screens', []);

        hooksRegistered('guardian', 'roster');

        expect(hooksTabs('roster.organization'))->toBe([])
            ->and(hooksTabs('roster.user'))->toBe([]);
    });

    it('registers nothing while Guardian or Roster is not registered', function (array $packages): void {
        hooksGuardianScopes();
        hooksRegistered(...$packages);

        foreach (['roster.organization', 'roster.user'] as $screen) {
            expect(array_filter(array_keys(hooksTabs($screen)), fn (string $key): bool => str_starts_with($key, 'guardian.')))->toBe([]);
        }

        expect(hooksSections('roster.user', 'aside'))->not->toHaveKey('guardian.sso-identities');
    })->with([
        'without Roster' => [['guardian']],
        'without Guardian' => [['roster', 'cortex', 'keen']],
    ]);

    it('stays away while Guardian is installed but its API is off', function (): void {
        IntegrationFixture::installed('guardian', 'roster');
        IntegrationFixture::serveApi('roster');
        IntegrationFixture::register();
        app(IntegrationHooks::class)->register();

        expect(hooksTabs('roster.organization'))->toBe([]);
    });

    it('places nothing on Guardian\'s own screens', function (): void {
        config()->set('atrium.integrations.guardian.screens', ['guardian.*' => ['guardian.user-security'], '*' => ['aside' => 'guardian.sso-identities']]);

        hooksRegistered('guardian', 'roster');

        expect(hooksTabs('guardian.user'))->toBe([])
            ->and(hooksSections('guardian.sso-connection', 'aside'))->toBe([])
            ->and(hooksSections('roster.user', 'aside'))->toBe(['guardian.sso-identities' => []]);
    });

    it('skips the organization access tab, warning once per process, while the organization scope type does not resolve', function (): void {
        Log::spy();

        hooksRegistered('guardian', 'roster');
        app(IntegrationHooks::class)->register();

        expect(hooksTabs('roster.organization'))->toBe(['guardian.sso' => ['scim_path' => '/scim/v2'], 'guardian.scim' => ['scim_path' => '/scim/v2']])
            ->and(hooksTabs('roster.user'))->toHaveKey('guardian.access');

        // A new registry run in the same process does not warn again.
        app()->forgetInstance(ScreenExtensions::class);
        app()->forgetInstance(IntegrationHooks::class);
        app(IntegrationHooks::class)->register();

        Log::shouldHaveReceived('warning')->withArgs(fn (string $message): bool => str_contains($message, 'atrium.integrations.guardian.scope_types')
            && str_contains($message, '[organization]')
            && str_contains($message, 'guardian.access'))->once();
    });

    it('sends the configured scope type when one is set in Atrium', function (): void {
        config()->set('atrium.integrations.guardian.scope_types', ['organization' => 'org']);

        hooksRegistered('guardian', 'roster');

        expect(hooksTabs('roster.organization')['guardian.access'])->toBe(['scope_type' => 'org']);
    });

    it('throws on an invalid entry in testing and local', function (mixed $screens, string $environment): void {
        $this->withEnvironment($environment);
        config()->set('atrium.integrations.guardian.screens', $screens);

        expect(fn () => hooksRegistered('guardian', 'roster'))->toThrow(InvalidArgumentException::class);
    })->with([
        'an invalid target' => [['Roster User' => ['guardian.access']]],
        'an invalid slot' => [['roster.user' => ['not a slot!' => 'guardian.sso-identities']]],
        'an unknown tab' => [['roster.user' => ['guardian.roles']]],
        'an unknown section' => [['roster.user' => ['aside' => 'guardian.access']]],
        'an entry that is no list' => [['roster.user' => 'guardian.access']],
        'a map that is no map' => ['roster.user'],
    ])->with(['testing', 'local']);

    it('reports and skips an invalid entry elsewhere, keeping the valid ones', function (): void {
        $this->withEnvironment('production');
        Exceptions::fake();
        hooksGuardianScopes();
        config()->set('atrium.integrations.guardian.screens', [
            'Roster User' => ['guardian.access'],
            'roster.user' => ['guardian.roles', 'guardian.user-security', 'not a slot!' => 'guardian.sso-identities', 'aside' => 'guardian.access'],
            'roster.organization' => 'guardian.sso',
        ]);

        hooksRegistered('guardian', 'roster');

        expect(hooksTabs('roster.user'))->toBe(['guardian.user-security' => []])
            ->and(hooksSections('roster.user', 'aside'))->toBe([])
            ->and(hooksTabs('roster.organization'))->toBe([]);

        Exceptions::assertReportedCount(5);
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), '[Roster User]'));
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), '[guardian.roles]'));
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), '[not a slot!]'));
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), 'unknown Guardian section [guardian.access]'));
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), '[roster.organization] at [guardian.sso]'));
    });

    it('hides Guardian\'s extensions while Guardian is flagged off for the user', function (): void {
        app()->register(PennantServiceProvider::class);
        config()->set('pennant.default', 'array');
        hooksGuardianScopes();
        hooksRegistered('guardian', 'roster');
        Feature::for($this->user)->deactivate('guardian.atrium');

        $screen = hooksScreen($this, 'roster.user', ['record' => '7']);

        expect(array_column($screen['tabs'], 'key'))->toBe(['overview'])
            ->and($screen['sections']['aside'])->toBe([]);
    });
});

describe('atrium.screens.show with Cortex, Keen and Guardian on (AC 97)', function (): void {
    beforeEach(function (): void {
        hooksGuardianScopes();
        hooksRegistered('cortex', 'guardian', 'impex', 'keen', 'roster', 'showroom');
    });

    it('sends roster.organization with every tab, the hooks in their integrations\' key order (D-090)', function (): void {
        $screen = hooksScreen($this, 'roster.organization', ['record' => 'acme']);

        expect($screen['tabs'])->toBe([
            ['key' => 'overview', 'label' => 'Overview', 'icon' => 'i-lucide-layout-grid', 'built_in' => true, 'component' => null],
            ['key' => 'cortex.mcp', 'label' => 'MCP', 'icon' => 'i-lucide-globe', 'built_in' => false, 'component' => 'cortex.mcp'],
            ['key' => 'guardian.access', 'label' => 'Access', 'icon' => 'i-lucide-key-round', 'built_in' => false, 'component' => 'guardian.access'],
            ['key' => 'guardian.sso', 'label' => 'SSO', 'icon' => 'i-lucide-log-in', 'built_in' => false, 'component' => 'guardian.sso'],
            ['key' => 'guardian.scim', 'label' => 'SCIM', 'icon' => 'i-lucide-server', 'built_in' => false, 'component' => 'guardian.scim'],
            ['key' => 'keen.activity', 'label' => 'Activity', 'icon' => 'i-lucide-clipboard-list', 'built_in' => false, 'component' => 'keen.activity'],
        ])
            ->and($screen['sections'])->toBe([
                'header.actions' => [],
                'before' => [],
                'after' => [
                    ['key' => 'keen.history', 'label' => 'History', 'component' => 'keen.history', 'data' => ['source' => 'roster', 'subject_type' => 'roster.organization']],
                ],
                'aside' => [],
            ]);
    });

    it('sends each Guardian tab\'s data when it is open', function (string $tab, array $data): void {
        $screen = hooksScreen($this, 'roster.organization', ['record' => 'acme', 'tab' => $tab]);
        $open = array_values(array_filter($screen['tabs'], fn (array $entry): bool => $entry['key'] === $tab))[0];

        expect($screen['open_tab'])->toBe($tab)
            ->and($open['data'])->toBe($data);
    })->with([
        'access' => ['guardian.access', ['scope_type' => 'roster.organization']],
        'sso' => ['guardian.sso', ['scim_path' => '/scim/v2']],
        'scim' => ['guardian.scim', ['scim_path' => '/scim/v2']],
    ]);

    it('sends roster.user with the user tabs, the identities section beside Cortex\'s, and Keen\'s history', function (): void {
        $screen = hooksScreen($this, 'roster.user', ['record' => '7']);

        expect($screen['tabs'])->toBe([
            ['key' => 'overview', 'label' => 'Overview', 'icon' => 'i-lucide-layout-grid', 'built_in' => true, 'component' => null],
            ['key' => 'guardian.access', 'label' => 'Access', 'icon' => 'i-lucide-key-round', 'built_in' => false, 'component' => 'guardian.access'],
            ['key' => 'guardian.user-security', 'label' => 'Security', 'icon' => 'i-lucide-shield', 'built_in' => false, 'component' => 'guardian.user-security'],
        ])
            ->and($screen['sections'])->toBe([
                'header.actions' => [],
                'before' => [],
                'after' => [
                    ['key' => 'keen.history', 'label' => 'History', 'component' => 'keen.history', 'data' => ['source' => 'roster', 'subject_type' => 'roster.user']],
                ],
                'aside' => [
                    ['key' => 'cortex.redirect-domains', 'label' => 'Redirect domains', 'component' => 'cortex.redirect-domains', 'data' => ['owner_type' => 'roster.user']],
                    ['key' => 'guardian.sso-identities', 'label' => 'SSO identities', 'component' => 'guardian.sso-identities', 'data' => []],
                ],
            ]);
    });

    it('sends the user access tab\'s data when it is open', function (): void {
        $screen = hooksScreen($this, 'roster.user', ['record' => '7', 'tab' => 'guardian.access']);

        expect($screen['tabs'][1]['data'])->toBe(['scope_type' => null]);
    });
});

it('registers the hooks at boot, after the integrations', function (): void {
    IntegrationFixture::installed('cortex', 'roster');
    IntegrationFixture::serveApi('cortex', 'roster');

    // The app has booted, so the provider's booted callback runs at once:
    // the integrations register, then the hooks.
    new IntegrationsServiceProvider($this->app)->boot();

    expect(hooksTabs('roster.organization'))->toBe(['cortex.mcp' => ['owner_type' => 'roster.organization']]);
});

it('labels each hook from its manifest, through the host\'s lang JSON (D-090)', function (): void {
    app('translator')->addLines(['*.Redirect domains' => 'Weiterleitungsdomains'], 'de');
    app()->setLocale('de');

    hooksEverything();

    expect(app(ScreenExtensions::class)->sections('roster.user', 'aside')[0]->label)->toBe('Weiterleitungsdomains');
});

it('keeps the hook extension classes to Atrium\'s own definitions', function (): void {
    hooksEverything();

    expect(app(ScreenExtensions::class)->tabs('roster.organization'))->each->toBeInstanceOf(TabDefinition::class)
        ->and(app(ScreenExtensions::class)->sections('roster.user', 'aside'))->each->toBeInstanceOf(SectionDefinition::class);
});
