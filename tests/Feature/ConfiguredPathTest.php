<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Feature;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\Authorize;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\ForceJsonResponse;
use RefactorCircus\Atrium\Tests\Fixtures\Middleware\MarksAtriumResponse;
use RefactorCircus\Atrium\Tests\Fixtures\RoutedPlugin;
use RefactorCircus\Atrium\Tests\TestCase;
use Workbench\App\Models\User;

/**
 * The API group comes from `atrium.routes.prefix` and
 * `atrium.routes.middleware`, for domain and plugin routes alike.
 */
class ConfiguredPathTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        tap($app->make(Repository::class), function (Repository $config): void {
            $config->set('atrium.routes.prefix', 'control-room/api');
            $config->set('atrium.routes.middleware', ['api', MarksAtriumResponse::class, Authorize::class]);
            $config->set('atrium.plugins', [RoutedPlugin::class]);
        });
    }

    private function user(): User
    {
        return User::forceCreate(['name' => 'Ann', 'email' => 'ann@example.com', 'password' => bcrypt('x')]);
    }

    public function test_the_api_serves_from_the_configured_prefix(): void
    {
        $this->withEnvironment('local');

        $this->actingAs($this->user())
            ->getJson(route('atrium.shell'))
            ->assertOk()
            ->assertHeader('X-Atrium-Host', 'marked');
    }

    public function test_the_default_prefix_is_no_longer_routed(): void
    {
        $this->withEnvironment('local');

        $this->actingAs($this->user())->getJson('/atrium/api/shell')->assertNotFound();
    }

    public function test_plugin_and_domain_routes_share_the_configured_prefix(): void
    {
        $this->assertStringEndsWith('/control-room/api/shell', route('atrium.shell'));
        $this->assertStringEndsWith('/control-room/api/settings', route('atrium.settings.index'));
        $this->assertStringEndsWith('/control-room/api/plugins/routed', route('atrium.plugins.routed.index'));
    }

    public function test_plugin_and_domain_routes_share_the_configured_middleware(): void
    {
        $group = [ForceJsonResponse::class, 'api', MarksAtriumResponse::class, Authorize::class];

        foreach (['atrium.shell', 'atrium.dashboards.index', 'atrium.plugins.routed.index'] as $name) {
            $this->assertSame($group, Route::getRoutes()->getByName($name)?->gatherMiddleware(), $name);
        }

        $this->withEnvironment('local');

        $this->actingAs($this->user())
            ->getJson(route('atrium.plugins.routed.index'))
            ->assertOk()
            ->assertHeader('X-Atrium-Host', 'marked');
    }
}
