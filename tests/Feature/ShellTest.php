<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Access\Services\Gatekeeper;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\AlphaPlugin;
use Workbench\App\Models\User;

/*
 * The shell's wiring to the registries; its payload is pinned by
 * Api/ShellApiTest.
 */

beforeEach(function (): void {
    Gate::define('viewAtrium', fn ($user = null): bool => true);

    $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);
});

it('sends plugin navigation in its group', function (): void {
    app(PluginRegistry::class)->register(AlphaPlugin::class);

    $this->actingAs($this->user)->getJson(route('atrium.shell'))
        ->assertOk()
        ->assertJsonPath('data.navigation.0.key', 'group-main')
        ->assertJsonPath('data.navigation.0.label', 'Main')
        ->assertJsonPath('data.navigation.0.items.0.label', 'Alpha Home')
        ->assertJsonPath('data.navigation.0.items.0.link', ['path' => '/atrium/alpha', 'external' => false]);
});

it('resolves each navigation item\'s url once for its link', function (): void {
    $item = new class('Reports') extends NavItem
    {
        public static int $resolved = 0;

        public function resolveUrl(): ?string
        {
            self::$resolved++;

            return parent::resolveUrl();
        }
    };

    app(NavigationRegistry::class)->add($item->url('/reports')->group('Main'));

    $this->actingAs($this->user)->getJson(route('atrium.shell'))->assertOk();

    // Once for the item's link and once for its section's.
    expect($item::$resolved)->toBe(2);
});

it('decides once per request whether the theme switcher shows', function (): void {
    $asked = 0;

    config()->set('atrium.themes.switcher_feature', 'theme-switcher');
    app(Gatekeeper::class)->resolveFeaturesUsing(function (string $feature) use (&$asked): bool {
        if ($feature === 'theme-switcher') {
            $asked++;
        }

        return true;
    });

    $this->actingAs($this->user)->getJson(route('atrium.shell'))->assertOk()->assertJsonPath('data.themes.switchable', true);

    expect($asked)->toBe(1);
});

it('answers the shell under the configured api prefix', function (): void {
    expect(route('atrium.shell', absolute: false))->toBe('/atrium/api/shell');
});
