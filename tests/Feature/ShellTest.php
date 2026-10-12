<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use RefactorCircus\Atrium\Atrium;
use RefactorCircus\Atrium\Domains\Access\Services\Gatekeeper;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\AlphaPlugin;

beforeEach(function (): void {
    app()->detectEnvironment(fn (): string => 'local');
});

it('renders the dashboard shell', function (): void {
    $this->get('/atrium')
        ->assertOk()
        ->assertSee('<aside', false)
        ->assertSee('id="atrium-main"', false);
});

it('renders plugin navigation in the sidebar', function (): void {
    app(PluginRegistry::class)->register(AlphaPlugin::class);

    $this->get('/atrium')->assertOk()->assertSee('Alpha Home');
});

it('emits theme config as css custom properties', function (): void {
    config()->set('atrium.theme', ['primary' => '#ff0000', 'on-primary' => '#ffffff']);

    $this->get('/atrium')
        ->assertOk()
        ->assertSee('--color-primary: #ff0000', false)
        ->assertSee('--color-on-primary: #ffffff', false);
});

it('links the published stylesheet', function (): void {
    $this->get('/atrium')->assertOk()->assertSee('vendor/atrium/atrium.css', false);
});

it('shows an empty state when no dashboard exists', function (): void {
    $this->get('/atrium')->assertOk()->assertSee(__('atrium::atrium.no_widgets'));
});

it('reads the dashboard path from config', function (): void {
    expect(app(Atrium::class)->path())->toBe('atrium');
});

it('adds package styles to the head after its own stylesheet', function (): void {
    app(Atrium::class)->stylesheet('/vendor/billing/billing.css')
        ->css('.billing-wide { width: 30rem; }', 'billing')
        ->css('.billing-wide { width: 32rem; }', 'billing')
        ->css('.billing-narrow { width: 8rem; }');

    $html = $this->get('/atrium')->assertOk()->getContent();
    $head = substr($html, 0, strpos($html, '</head>'));

    expect($head)->toContain('href="/vendor/billing/billing.css"')
        ->toContain('.billing-wide { width: 32rem; }')
        ->not->toContain('width: 30rem')
        ->toContain('.billing-narrow { width: 8rem; }')
        ->and(strpos($head, 'billing.css'))->toBeGreaterThan(strpos($head, 'vendor/atrium/atrium.css'));
});

/**
 * A navigation item that counts how often it is asked whether it is active
 * and where it links, by label.
 */
class CountingNavItem extends NavItem
{
    /** @var array<string, int> */
    public static array $active = [];

    /** @var array<string, int> */
    public static array $urls = [];

    public function isActive(Request $request): bool
    {
        self::$active[$this->label] = (self::$active[$this->label] ?? 0) + 1;

        return parent::isActive($request);
    }

    public function resolveUrl(): ?string
    {
        self::$urls[$this->label] = (self::$urls[$this->label] ?? 0) + 1;

        return parent::resolveUrl();
    }
}

it('works out each navigation item once per page', function (): void {
    CountingNavItem::$active = CountingNavItem::$urls = [];

    app(NavigationRegistry::class)
        ->add(CountingNavItem::make('Reports')->url('/atrium/reports'))
        ->add(CountingNavItem::make('Users')->url('/atrium/users')->group('People')->children([
            CountingNavItem::make('Invites')->url('/atrium/users/invites'),
        ]));

    $this->get('/atrium')->assertOk()->assertSee('Invites');

    expect(CountingNavItem::$active)->each->toBe(1)
        ->and(CountingNavItem::$active)->toHaveKeys(['Reports', 'Users', 'Invites'])
        // Once for the link, and once inside isActive() itself.
        ->and(CountingNavItem::$urls)->each->toBe(2);
});

it('decides once per page whether the theme switcher shows', function (): void {
    $asked = 0;

    config()->set('atrium.themes.switcher_feature', 'theme-switcher');
    app(Gatekeeper::class)->resolveFeaturesUsing(function (string $feature) use (&$asked): bool {
        if ($feature === 'theme-switcher') {
            $asked++;
        }

        return true;
    });

    $this->get('/atrium')->assertOk()->assertSee('data-testid="theme-switcher"', false);

    expect($asked)->toBe(1);
});
