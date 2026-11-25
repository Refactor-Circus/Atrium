<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Feature;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Support\Facades\Route;
use Orchestra\Testbench\Attributes\DefineEnvironment;
use RefactorCircus\Atrium\Facades\Atrium;
use RefactorCircus\Atrium\Tests\Fixtures\FeaturedPlugin;
use RefactorCircus\Atrium\Tests\TestCase;
use Workbench\App\Models\User;

class PluginFeatureRoutesTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app->make(Repository::class)->set('atrium.plugins', [FeaturedPlugin::class]);
    }

    protected function disableFeaturedPlugin($app): void
    {
        $app->make(Repository::class)->set('atrium.disabled', ['featured']);
    }

    private function user(): User
    {
        return User::forceCreate(['name' => 'Ann', 'email' => 'ann@example.com', 'password' => bcrypt('x')]);
    }

    public function test_plugin_routes_answer_while_its_features_are_on(): void
    {
        $this->withEnvironment('local');

        Atrium::resolveFeaturesUsing(fn (string $feature): bool => true);

        $this->actingAs($this->user())
            ->getJson(route('atrium.plugins.featured.index'))
            ->assertOk()
            ->assertExactJson(['page' => 'featured']);
    }

    public function test_plugin_routes_are_not_found_while_a_feature_is_off(): void
    {
        $this->withEnvironment('local');

        Atrium::resolveFeaturesUsing(fn (string $feature): bool => $feature !== 'beta');

        $this->actingAs($this->user())
            ->get(route('atrium.plugins.featured.index'), ['Accept' => 'text/html'])
            ->assertNotFound()
            ->assertHeader('Content-Type', 'application/json');
    }

    public function test_the_gate_answers_before_the_feature_check(): void
    {
        $this->withEnvironment('local');

        Atrium::resolveFeaturesUsing(fn (string $feature): bool => false);

        $this->getJson(route('atrium.plugins.featured.index'))->assertUnauthorized();
    }

    #[DefineEnvironment('disableFeaturedPlugin')]
    public function test_a_plugin_the_host_disabled_registers_no_route(): void
    {
        $this->withEnvironment('local');

        Atrium::resolveFeaturesUsing(fn (string $feature): bool => true);

        $this->assertFalse(Route::has('atrium.plugins.featured.index'));

        $this->actingAs($this->user())
            ->getJson('/atrium/api/plugins/featured')
            ->assertNotFound();
    }
}
