<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Data\SearchSourceDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Integrations\Roster\RosterFeature;
use RefactorCircus\Atrium\Integrations\Roster\RosterIntegration;
use RefactorCircus\Atrium\Support\Iconify;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;

/*
 * The Roster integration (AC 39, 40, 45, 53, 60, 62, 69, 99): its four nav
 * items, two widgets and two search sources, and its 11 screens, declared as
 * data only. Roles and permissions moved to the Guardian integration. Roster ships with its API off (`roster.routes.enabled`), so the
 * integration registers only once the host turns it on.
 */

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

/**
 * Roster installed with its API on under `roster/api`, then registered.
 */
function registeredRoster(): RegisteredIntegration
{
    IntegrationFixture::installed('roster');
    IntegrationFixture::serveApi('roster');

    $roster = IntegrationFixture::register()->get('roster');

    expect($roster)->not->toBeNull();

    /** @var RegisteredIntegration $roster */
    return $roster;
}

/**
 * The labels the integration takes from `lang/en/integrations/roster.php`.
 *
 * @return list<string>
 */
function rosterLabelKeys(): array
{
    $source = (string) file_get_contents(__DIR__.'/../../../src/Integrations/Roster/RosterIntegration.php');

    preg_match_all("/'atrium::integrations\\/roster\\.([a-z_]+)'/", $source, $matches);

    return array_values(array_unique($matches[1]));
}

describe('registration', function (): void {
    it('is the conventional class for the roster key', function (): void {
        expect(IntegrationRegistry::classFor('roster'))->toBe(RosterIntegration::class);
    });

    it('registers while Roster is installed, enabled and serving its API', function (): void {
        $roster = registeredRoster();

        expect($roster->label)->toBe('Roster')
            ->and($roster->apiBase)->toBe('/roster/api')
            ->and($roster->features)->toBe([RosterFeature::class]);
    });

    it('reads the API base from roster.routes.prefix, and lets api_base win', function (): void {
        IntegrationFixture::installed('roster');
        config()->set('roster.routes', ['enabled' => true, 'prefix' => '/api/people/']);

        expect(IntegrationFixture::register()->get('roster')?->apiBase)->toBe('/api/people');

        app()->forgetInstance(IntegrationRegistry::class);
        config()->set('atrium.integrations.roster.api_base', 'https://people.example.com/api');

        expect(IntegrationFixture::register()->get('roster')?->apiBase)->toBe('https://people.example.com/api');
    });

    it('registers nothing while Roster is not installed', function (): void {
        IntegrationFixture::installed();
        IntegrationFixture::serveApi('roster');

        expect(IntegrationFixture::register()->all())->toBe([])
            ->and(app(WidgetRegistry::class)->get('roster.user-status'))->toBeNull();
    });

    it('registers nothing while the integration is disabled', function (mixed $enabled): void {
        config()->set('atrium.integrations.roster.enabled', $enabled);

        IntegrationFixture::installed('roster');
        IntegrationFixture::serveApi('roster');

        expect(IntegrationFixture::register()->all())->toBe([])
            ->and(app(WidgetRegistry::class)->get('roster.user-status'))->toBeNull();
    })->with([
        'false' => [false],
        'the string "false"' => ['false'],
    ]);

    it('registers nothing while roster.routes.enabled is false, its shipped default, and warns once', function (): void {
        Log::spy();

        IntegrationFixture::installed('roster');
        config()->set('roster.routes', ['enabled' => false, 'prefix' => 'roster/api']);

        expect(IntegrationFixture::register()->all())->toBe([])
            ->and(app(WidgetRegistry::class)->get('roster.user-status'))->toBeNull();

        app()->forgetInstance(IntegrationRegistry::class);

        expect(IntegrationFixture::register()->all())->toBe([]);

        Log::shouldHaveReceived('warning')
            ->withArgs(fn (string $message): bool => str_contains($message, 'roster.routes.enabled') && str_contains($message, 'atrium.integrations.roster.api_base'))
            ->once();
    });

    it('registers once roster.routes.enabled is turned on', function (): void {
        IntegrationFixture::installed('roster');
        config()->set('roster.routes', ['enabled' => false, 'prefix' => 'roster/api']);

        expect(IntegrationFixture::register()->get('roster'))->toBeNull();

        config()->set('roster.routes.enabled', true);

        expect(IntegrationFixture::register()->get('roster')?->apiBase)->toBe('/roster/api');
    });
});

describe('declarations', function (): void {
    it('declares the four nav items left after roles and permissions moved to Guardian, in the Roster group, linking to the layer pages', function (): void {
        $items = array_map(fn (NavItem $item): array => [
            'label' => $item->label,
            'icon' => $item->icon,
            'url' => $item->url,
            'group' => $item->group,
            'sort' => $item->sort,
            'live' => $item->live,
        ], registeredRoster()->navigation);

        expect($items)->toBe([
            ['label' => 'Users', 'icon' => 'i-lucide-users', 'url' => '/roster/users', 'group' => 'Roster', 'sort' => 10, 'live' => null],
            ['label' => 'Organizations', 'icon' => 'i-lucide-building-2', 'url' => '/roster/organizations', 'group' => 'Roster', 'sort' => 20, 'live' => null],
            ['label' => 'Impersonations', 'icon' => 'i-lucide-eye', 'url' => '/roster/impersonations', 'group' => 'Roster', 'sort' => 45, 'live' => null],
            ['label' => 'Imports & exports', 'icon' => 'i-lucide-arrow-up-down', 'url' => '/roster/transfers', 'group' => 'Roster', 'sort' => 48, 'live' => null],
        ]);
    });

    it('computes no badge for its nav items, and adds them to the navigation', function (): void {
        $roster = registeredRoster();

        foreach ($roster->navigation as $item) {
            expect($item->resolveBadge())->toBeNull();
        }

        $labels = array_map(fn (NavItem $item): string => $item->label, app(NavigationRegistry::class)->items(Request::create('/')));

        expect($labels)->toContain('Users', 'Organizations', 'Impersonations', 'Imports & exports')
            ->not->toContain('Roles', 'Permissions');
    });

    it('declares the two v1 widgets, keeping their keys, with no resolver and static data', function (): void {
        $widgets = array_map(fn (WidgetDefinition $widget): array => [
            'key' => $widget->key,
            'component' => $widget->component,
            'label' => $widget->label,
            'description' => $widget->description,
            'icon' => $widget->icon,
            'size' => [$widget->defaultWidth, $widget->defaultHeight],
            'lazy' => $widget->lazy,
            'data' => $widget->resolveData(),
        ], registeredRoster()->widgets);

        expect($widgets)->toBe([
            [
                'key' => 'roster.user-status',
                'component' => 'roster.user-status',
                'label' => 'Users by status',
                'description' => 'How many users are active, suspended and deactivated.',
                'icon' => 'i-lucide-users',
                'size' => [6, 2],
                'lazy' => false,
                'data' => [],
            ],
            [
                'key' => 'roster.organizations',
                'component' => 'roster.organizations',
                'label' => 'Organizations',
                'description' => 'How many organizations, teams and pending invitations exist.',
                'icon' => 'i-lucide-building-2',
                'size' => [6, 1],
                'lazy' => false,
                'data' => [],
            ],
        ])
            ->and(app(WidgetRegistry::class)->get('roster.user-status'))->not->toBeNull()
            ->and(app(WidgetRegistry::class)->get('roster.organizations'))->not->toBeNull();
    });

    it('has no settings panel', function (): void {
        expect(registeredRoster()->settings)->toBeNull();
    });

    it('declares the two v1 search sources, keeping their keys', function (): void {
        $sources = array_map(fn (SearchSourceDeclaration $source): array => [
            'key' => $source->key,
            'label' => $source->label,
            'icon' => $source->icon,
        ], registeredRoster()->searchSources);

        expect($sources)->toBe([
            ['key' => 'roster-users', 'label' => 'Users', 'icon' => 'i-lucide-users'],
            ['key' => 'roster-organizations', 'label' => 'Organizations', 'icon' => 'i-lucide-building-2'],
        ]);
    });

    it('declares the 11 screens left of AC 69 (AC 99), with their kinds, layer paths and subject aliases', function (): void {
        $screens = array_map(fn (ScreenDeclaration $screen): array => [
            $screen->kind,
            $screen->path,
            $screen->subjectType,
        ], registeredRoster()->screens);

        expect($screens)->toBe([
            'roster.users' => ['list', '/roster/users', null],
            'roster.user-create' => ['detail', '/roster/users/create', null],
            'roster.user' => ['detail', '/roster/users/:user', 'roster.user'],
            'roster.organizations' => ['list', '/roster/organizations', null],
            'roster.organization-create' => ['detail', '/roster/organizations/create', null],
            'roster.organization' => ['detail', '/roster/organizations/:organization', 'roster.organization'],
            'roster.team' => ['detail', '/roster/organizations/:organization/teams/:team', null],
            'roster.impersonations' => ['list', '/roster/impersonations', null],
            'roster.transfers' => ['list', '/roster/transfers', null],
            'roster.transfer' => ['detail', '/roster/transfers/:transfer', null],
            'roster.invitation' => ['detail', '/roster/invitations/:token', null],
        ]);
    });

    it('uses only Iconify icons', function (): void {
        $roster = registeredRoster();

        $icons = [
            ...array_map(fn (NavItem $item): ?string => $item->icon, $roster->navigation),
            ...array_map(fn (WidgetDefinition $widget): ?string => $widget->icon, $roster->widgets),
            ...array_map(fn (SearchSourceDeclaration $source): ?string => $source->icon, $roster->searchSources),
        ];

        foreach ($icons as $icon) {
            expect($icon)->toBeString()->toMatch(Iconify::PATTERN);
        }
    });

    it('writes its declarations to the layer fixture', function (): void {
        registeredRoster();

        IntegrationFixture::assertMatchesFixture('roster');
    });
});

describe('labels', function (): void {
    it('drops the roles and permissions labels (AC 99)', function (): void {
        expect(trans()->hasForLocale('atrium::integrations/roster.roles', 'en'))->toBeFalse()
            ->and(trans()->hasForLocale('atrium::integrations/roster.permissions', 'en'))->toBeFalse();
    });

    it('takes every label from lang/en/integrations/roster.php', function (): void {
        $keys = rosterLabelKeys();

        expect($keys)->toContain('label', 'users', 'organizations', 'impersonations', 'transfers', 'widget_user_status', 'widget_organizations')
            ->not->toContain('roles', 'permissions');

        foreach ($keys as $key) {
            expect(trans()->hasForLocale('atrium::integrations/roster.'.$key, 'en'))->toBeTrue("Missing label [atrium::integrations/roster.{$key}].");
        }
    });

    it('translates its labels with the app locale', function (): void {
        app('translator')->addLines(['integrations/roster.users' => 'Benutzer'], 'de', 'atrium');
        app()->setLocale('de');

        $labels = array_map(fn (NavItem $item): string => $item->label, registeredRoster()->navigation);

        expect($labels[0])->toBe('Benutzer');
    });
});

describe('no package code', function (): void {
    it('names nothing of Roster\'s code, only its paths and keys', function (): void {
        $source = (string) file_get_contents(__DIR__.'/../../../src/Integrations/Roster/RosterIntegration.php');

        expect(preg_match('/RefactorCircus\\\\{1,2}Roster\b/i', $source))->toBe(0);
    });
});
