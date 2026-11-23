<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Atrium;
use RefactorCircus\Atrium\Domains\Access\Services\Gatekeeper;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Domains\Themes\Data\Theme;
use RefactorCircus\Atrium\Domains\Themes\Services\ThemeRegistry;
use Workbench\App\Models\User;

/*
 * The shell (AC 4, 14, 36): everything the layer's chrome needs, in one
 * request, serialized by ShellResource.
 */

beforeEach(function (): void {
    Gate::define('viewAtrium', fn ($user = null): bool => true);

    $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);
});

/**
 * A theme registry holding only the given themes, in place of the built-in six.
 */
function shellThemes(Theme ...$themes): ThemeRegistry
{
    $registry = new ThemeRegistry(config(), app(Gatekeeper::class));

    foreach ($themes as $theme) {
        $registry->register($theme);
    }

    app()->instance(ThemeRegistry::class, $registry);

    return $registry;
}

it('answers with the exact shell structure', function (): void {
    config()->set('app.name', 'Acme');
    config()->set('atrium.search.min_length', 3);
    config()->set('atrium.themes.default', 'dusk');
    config()->set('atrium.themes.switcher_feature', null);

    shellThemes(
        Theme::make('atrium')->label('Atrium')->swatch('#4f46e5')->colors(['primary' => '#4f46e5']),
        Theme::make('dusk')->label('Dusk')->swatch('#ea580c')->icon('i-lucide-sunset')->radius('0.5rem')->layout(Theme::TOP)
            ->colors(['primary' => '#ea580c', 'primary-dark' => '#fb923c']),
    );

    app(NavigationRegistry::class)
        ->add(NavItem::make('Reports')->url('/reports')->icon('i-lucide-chart-bar')->sort(1)->badge(fn (): int => 3))
        ->add(NavItem::make('Users')->url('/users')->group('People')->children([
            NavItem::make('Invites')->url('/users/invites')->badge(fn (): string => 'new'),
        ]))
        ->group(NavGroup::make('People')->icon('i-lucide-users'));

    app(SettingsRegistry::class)->add(SettingsPanel::make('shop')->label('Shop')->icon('i-lucide-store')->component('acme-shop'));

    $this->actingAs($this->user)->getJson(route('atrium.shell'))
        ->assertOk()
        ->assertExactJson(['data' => [
            'app' => ['name' => 'Acme'],
            'user' => ['name' => 'Ada', 'email' => 'ada@example.com'],
            'locale' => 'en',
            'api_version' => Atrium::API_VERSION,
            'navigation' => [
                [
                    'key' => 'page-0-reports',
                    'label' => 'Reports',
                    'icon' => 'i-lucide-chart-bar',
                    'grouped' => false,
                    'link' => ['path' => '/reports', 'external' => false],
                    'items' => [
                        ['label' => 'Reports', 'icon' => 'i-lucide-chart-bar', 'link' => ['path' => '/reports', 'external' => false], 'badge' => 3, 'children' => []],
                    ],
                ],
                [
                    'key' => 'group-people',
                    'label' => 'People',
                    'icon' => 'i-lucide-users',
                    'grouped' => true,
                    'link' => ['path' => '/users', 'external' => false],
                    'items' => [
                        ['label' => 'Users', 'icon' => null, 'link' => ['path' => '/users', 'external' => false], 'badge' => null, 'children' => [
                            ['label' => 'Invites', 'icon' => null, 'link' => ['path' => '/users/invites', 'external' => false], 'badge' => 'new', 'children' => []],
                        ]],
                    ],
                ],
            ],
            'themes' => [
                'default' => 'dusk',
                'switchable' => true,
                'all' => [
                    [
                        'key' => 'atrium',
                        'label' => 'Atrium',
                        'layout' => 'sidebar',
                        'swatch' => '#4f46e5',
                        'icon' => null,
                        'properties' => ['--color-primary' => '#4f46e5'],
                    ],
                    [
                        'key' => 'dusk',
                        'label' => 'Dusk',
                        'layout' => 'top',
                        'swatch' => '#ea580c',
                        'icon' => 'i-lucide-sunset',
                        'properties' => [
                            '--color-primary' => '#ea580c',
                            '--color-primary-dark' => '#fb923c',
                            '--radius-radius' => '0.5rem',
                        ],
                    ],
                ],
            ],
            'settings' => [
                ['key' => 'shop', 'label' => 'Shop', 'icon' => 'i-lucide-store', 'component' => 'acme-shop'],
            ],
            'search' => ['min_length' => 3],
        ]]);
});

it('sends every settings panel summary field, and those only', function (): void {
    app(SettingsRegistry::class)->add(SettingsPanel::make('billing')->label('Billing')->description('Not in the summary')
        ->resolve(fn (): array => ['secret' => 'not in the summary']));

    $panel = $this->actingAs($this->user)->getJson(route('atrium.shell'))->assertOk()->json('data.settings.0');

    expect($panel)->toBe(['key' => 'billing', 'label' => 'Billing', 'icon' => null, 'component' => 'billing']);
});

it('sends the app\'s current locale', function (): void {
    app()->setLocale('fr');

    $this->actingAs($this->user)->getJson(route('atrium.shell'))->assertOk()->assertJsonPath('data.locale', 'fr');
});

it('sends atrium.theme as the built-in atrium theme\'s properties', function (): void {
    config()->set('atrium.theme', ['primary' => '#ff0000', 'on-primary' => '#ffffff']);
    app()->forgetInstance(ThemeRegistry::class);

    $themes = $this->actingAs($this->user)->getJson(route('atrium.shell'))->assertOk()->json('data.themes.all');
    $atrium = collect($themes)->firstWhere('key', 'atrium');

    expect($atrium['properties'])->toBe(['--color-primary' => '#ff0000', '--color-on-primary' => '#ffffff'])
        ->and(array_column($themes, 'key'))->toBe(['atrium', 'harbor', 'sunset', 'forest', 'midnight', 'ledger']);
});

it('sends an empty properties object for a theme with none', function (): void {
    shellThemes(Theme::make('plain'));

    $response = $this->actingAs($this->user)->getJson(route('atrium.shell'))
        ->assertOk()
        ->assertJsonPath('data.themes.all.0.swatch', 'var(--color-primary)');

    expect($response->getContent())->toContain('"properties":{}');
});

it('hides the theme switcher while its feature is off', function (): void {
    config()->set('atrium.themes.switcher_feature', 'theme-switcher');
    app(Gatekeeper::class)->resolveFeaturesUsing(fn (string $feature): bool => $feature !== 'theme-switcher');

    $this->actingAs($this->user)->getJson(route('atrium.shell'))->assertOk()->assertJsonPath('data.themes.switchable', false);
});

it('links navigation through ClientPath, relative to atrium.client_path', function (): void {
    config()->set('app.url', 'https://app.test');
    config()->set('atrium.client_path', '/admin');

    app(NavigationRegistry::class)
        ->add(NavItem::make('Orders')->url('https://app.test/admin/orders?status=open')->sort(1))
        ->add(NavItem::make('Docs')->url('https://docs.example.com/atrium')->sort(2))
        ->add(NavItem::make('Home page')->url('https://app.test/')->sort(3));

    $items = array_column($this->actingAs($this->user)->getJson(route('atrium.shell'))->assertOk()->json('data.navigation'), 'items');

    expect(array_column(array_merge(...$items), 'link', 'label'))->toBe([
        'Orders' => ['path' => '/orders?status=open', 'external' => false],
        'Docs' => ['path' => 'https://docs.example.com/atrium', 'external' => true],
        'Home page' => ['path' => 'https://app.test/', 'external' => true],
    ]);
});

it('sends link null for a navigation url ClientPath rejects', function (string $url): void {
    app(NavigationRegistry::class)->add(NavItem::make('Bad')->url($url));

    $this->actingAs($this->user)->getJson(route('atrium.shell'))
        ->assertOk()
        ->assertJsonPath('data.navigation.0.items.0.label', 'Bad')
        ->assertJsonPath('data.navigation.0.items.0.link', null)
        ->assertJsonPath('data.navigation.0.link', null);
})->with([
    'javascript' => ['javascript:alert(1)'],
    'data' => ['data:text/html,<script>alert(1)</script>'],
    'protocol-relative' => ['//evil.test/path'],
    'userinfo' => ['https://app.test@evil.test/'],
]);

it('sends link null for an item whose route is not registered', function (): void {
    app(NavigationRegistry::class)->add(NavItem::make('Gone')->route('nowhere.index'));

    $this->actingAs($this->user)->getJson(route('atrium.shell'))
        ->assertOk()
        ->assertJsonPath('data.navigation.0.items.0.link', null);
});

it('leaves out navigation the user may not see', function (): void {
    app(NavigationRegistry::class)
        ->add(NavItem::make('Shown')->url('/shown'))
        ->add(NavItem::make('Hidden')->url('/hidden')->authorize(fn (): bool => false));

    $this->actingAs($this->user)->getJson(route('atrium.shell'))
        ->assertOk()
        ->assertJsonCount(1, 'data.navigation')
        ->assertJsonPath('data.navigation.0.label', 'Shown');
});

it('leaves out settings panels the user may not see', function (): void {
    app(SettingsRegistry::class)
        ->add(SettingsPanel::make('open')->label('Open'))
        ->add(SettingsPanel::make('closed')->label('Closed')->authorize(fn (): bool => false));

    $this->actingAs($this->user)->getJson(route('atrium.shell'))
        ->assertOk()
        ->assertJsonPath('data.settings', [['key' => 'open', 'label' => 'Open', 'icon' => null, 'component' => 'open']]);
});

it('works out each navigation badge once per request', function (): void {
    $calls = 0;

    app(NavigationRegistry::class)->add(NavItem::make('Inbox')->url('/inbox')->badge(function () use (&$calls): int {
        $calls++;

        return 7;
    }));

    $this->actingAs($this->user)->getJson(route('atrium.shell'))->assertOk()->assertJsonPath('data.navigation.0.items.0.badge', 7);

    expect($calls)->toBe(1);
});
