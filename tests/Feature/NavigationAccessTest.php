<?php

declare(strict_types=1);

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Facades\Atrium;
use RefactorCircus\Atrium\Tests\Fixtures\FeaturedPlugin;
use Workbench\App\Models\User;

/**
 * @return array<int, string>
 */
function visibleLabels(): array
{
    return array_map(
        fn (NavItem $item): string => $item->label,
        app(NavigationRegistry::class)->items(Request::create('/atrium')),
    );
}

/**
 * @return array<string, array<int, string>>
 */
function visibleGroups(): array
{
    return array_map(
        fn (array $items): array => array_map(fn (NavItem $item): string => $item->label, $items),
        app(NavigationRegistry::class)->grouped(Request::create('/atrium')),
    );
}

/**
 * Turn features on and off for the rest of the test.
 *
 * @param  array<string, bool>  $features
 */
function features(array $features): void
{
    Atrium::resolveFeaturesUsing(fn (string $feature): bool => $features[$feature] ?? false);
}

it('shows an item only to users the gate allows', function (bool $allowed): void {
    Gate::define('view-reports', fn ($user = null): bool => $allowed);

    Atrium::nav(NavItem::make('Reports')->url('/reports')->can('view-reports'));

    expect(visibleLabels())->toBe($allowed ? ['Reports'] : []);
})->with([true, false]);

it('passes gate arguments through', function (): void {
    Gate::define('view-team', fn (?Authenticatable $user, string $team): bool => $team === 'ops');

    Atrium::nav(NavItem::make('Ops')->url('/ops')->can('view-team', 'ops'));
    Atrium::nav(NavItem::make('Sales')->url('/sales')->can('view-team', ['sales']));

    expect(visibleLabels())->toBe(['Ops']);
});

it('lets a custom resolver decide permissions instead of the gate', function (): void {
    $asked = [];

    Atrium::resolvePermissionsUsing(function (string $ability, array $arguments, Request $request) use (&$asked): bool {
        $asked[] = [$ability, $arguments];

        return $ability === 'roster.users.view';
    });

    Atrium::nav(NavItem::make('Users')->url('/users')->can('roster.users.view'));
    Atrium::nav(NavItem::make('Roles')->url('/roles')->can('roster.roles.view', ['team' => 1]));

    expect(visibleLabels())->toBe(['Users'])
        ->and($asked)->toBe([['roster.users.view', []], ['roster.roles.view', ['team' => 1]]]);
});

it('shows feature-gated items while no feature resolver is registered', function (): void {
    Atrium::nav(NavItem::make('Beta')->url('/beta')->feature('beta'));

    expect(visibleLabels())->toBe(['Beta'])
        ->and(Atrium::featureEnabled('beta'))->toBeTrue();
});

it('hides an item unless every one of its features is on', function (): void {
    features(['beta' => true, 'billing' => false]);

    Atrium::nav(NavItem::make('Beta')->url('/beta')->feature('beta'));
    Atrium::nav(NavItem::make('Billing')->url('/billing')->feature('beta', 'billing'));

    expect(visibleLabels())->toBe(['Beta'])
        ->and(Atrium::featureEnabled('billing'))->toBeFalse();
});

it('combines permissions, features, and the authorize callback', function (): void {
    Gate::define('allowed', fn ($user = null): bool => true);
    features(['on' => true]);

    Atrium::nav(NavItem::make('All pass')->url('/a')->can('allowed')->feature('on')->authorize(fn (): bool => true));
    Atrium::nav(NavItem::make('Callback fails')->url('/b')->can('allowed')->feature('on')->authorize(fn (): bool => false));

    expect(visibleLabels())->toBe(['All pass']);
});

it('hides a whole group when the group is gated', function (): void {
    features(['billing' => false]);

    Atrium::navigationGroup(NavGroup::make('Billing')->feature('billing'));

    Atrium::nav(NavItem::make('Invoices')->url('/invoices')->group('Billing'));
    Atrium::nav(NavItem::make('Payments')->url('/payments')->group('Billing'));
    Atrium::nav(NavItem::make('Home')->url('/home'));

    expect(visibleGroups())->toBe(['' => ['Home']]);
});

it('shows a gated group to users who pass its rules', function (): void {
    Gate::define('manage-billing', fn ($user = null): bool => true);

    Atrium::navigationGroup(NavGroup::make('Billing')->can('manage-billing'));
    Atrium::nav(NavItem::make('Invoices')->url('/invoices')->group('Billing'));

    expect(visibleGroups())->toBe(['Billing' => ['Invoices']]);
});

it('hides children the request may not see, without changing the registered item', function (): void {
    features(['secret' => false]);

    $item = NavItem::make('Reports')->url('/reports')->children([
        NavItem::make('Sales')->url('/reports/sales'),
        NavItem::make('Secret')->url('/reports/secret')->feature('secret'),
    ]);

    Atrium::nav($item);

    $visible = app(NavigationRegistry::class)->items(Request::create('/atrium'))[0];

    expect(array_map(fn (NavItem $child): string => $child->label, $visible->children))->toBe(['Sales'])
        ->and($item->children)->toHaveCount(2);
});

it('drops a parent with no link once all of its children are hidden', function (): void {
    features(['secret' => false]);

    Atrium::nav(NavItem::make('Folder')->children([
        NavItem::make('Secret')->url('/secret')->feature('secret'),
    ]));
    Atrium::nav(NavItem::make('Linked')->url('/linked')->children([
        NavItem::make('Secret')->url('/secret')->feature('secret'),
    ]));

    expect(visibleLabels())->toBe(['Linked']);
});

it('hides a plugin whose features are off, and respects the groups it describes', function (): void {
    app(PluginRegistry::class)->register(FeaturedPlugin::class);

    features(['beta' => false]);

    expect(visibleLabels())->toBe([]);

    features(['beta' => true]);
    Gate::define('manage-featured', fn ($user = null): bool => false);

    expect(visibleGroups())->toBe(['Featured' => ['Featured Home']]);
});

it('lets the host application override a group a plugin describes', function (): void {
    app(PluginRegistry::class)->register(FeaturedPlugin::class);

    Gate::define('manage-featured', fn ($user = null): bool => false);

    Atrium::navigationGroup(NavGroup::make('Featured Admin'));

    expect(visibleGroups())->toHaveKey('Featured Admin');
});

it('gates host routes with the atrium.feature middleware', function (): void {
    Route::get('/beta-only', fn (): string => 'beta')->middleware('atrium.feature:beta,extra');

    features(['beta' => true, 'extra' => true]);
    $this->get('/beta-only')->assertOk();

    features(['beta' => true, 'extra' => false]);
    $this->get('/beta-only')->assertNotFound();
});

it('leaves hidden children out of the shell', function (): void {
    Gate::define('viewAtrium', fn ($user = null): bool => true);

    features(['secret' => false]);

    Atrium::nav(NavItem::make('Reports')->url('/reports')->children([
        NavItem::make('Sales')->url('/reports/sales'),
        NavItem::make('Top secret')->url('/reports/secret')->feature('secret'),
    ]));

    $user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);

    $this->actingAs($user)->getJson(route('atrium.shell'))
        ->assertOk()
        ->assertJsonPath('data.navigation.0.items.0.label', 'Reports')
        ->assertJsonPath('data.navigation.0.items.0.children.*.label', ['Sales']);
});
