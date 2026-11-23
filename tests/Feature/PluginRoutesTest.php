<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Feature;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\Authorize;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\ForceJsonResponse;
use RefactorCircus\Atrium\Tests\Fixtures\RoutedPlugin;
use RefactorCircus\Atrium\Tests\TestCase;
use Workbench\App\Models\User;

class PluginRoutesTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app->make(Repository::class)->set('atrium.plugins', [RoutedPlugin::class]);
    }

    private function user(): User
    {
        return User::forceCreate(['name' => 'Ann', 'email' => 'ann@example.com', 'password' => bcrypt('x')]);
    }

    public function test_plugin_routes_are_named_under_atrium_plugins_and_the_plugin_key(): void
    {
        $this->assertTrue(Route::has('atrium.plugins.routed.index'));
        $this->assertFalse(Route::has('atrium.routed.index'));
        $this->assertFalse(Route::has('routed.index'));
    }

    public function test_plugin_routes_sit_under_the_api_prefix_and_the_plugin_key(): void
    {
        $this->assertStringEndsWith('/atrium/api/plugins/routed', route('atrium.plugins.routed.index'));
    }

    public function test_plugin_routes_answer_inside_the_api_group(): void
    {
        $this->withEnvironment('local');

        $this->actingAs($this->user())
            ->getJson(route('atrium.plugins.routed.index'))
            ->assertOk()
            ->assertExactJson(['from' => 'plugin']);
    }

    public function test_plugin_routes_carry_the_group_middleware(): void
    {
        $route = Route::getRoutes()->getByName('atrium.plugins.routed.index');

        $this->assertNotNull($route);
        $this->assertSame([ForceJsonResponse::class, 'api', Authorize::class], $route->gatherMiddleware());
    }

    public function test_plugin_routes_answer_a_guest_with_401(): void
    {
        $this->withEnvironment('local');

        $this->get(route('atrium.plugins.routed.index'))
            ->assertUnauthorized()
            ->assertExactJson(['message' => 'Unauthenticated.']);
    }

    public function test_plugin_routes_are_behind_the_gate(): void
    {
        $this->withEnvironment('production');

        $this->actingAs($this->user())
            ->get(route('atrium.plugins.routed.index'))
            ->assertForbidden();
    }
}
