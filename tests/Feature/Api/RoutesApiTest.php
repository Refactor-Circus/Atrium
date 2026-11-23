<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Feature\Api;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;
use Orchestra\Testbench\Attributes\DefineEnvironment;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\Authorize;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\EnsureFeaturesAreEnabled;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\ForceJsonResponse;
use RefactorCircus\Atrium\Tests\Fixtures\FeaturedPlugin;
use RefactorCircus\Atrium\Tests\Fixtures\RoutedPlugin;
use RefactorCircus\Atrium\Tests\TestCase;
use SplFileInfo;

/**
 * Atrium's API surface (AC 1, 2, 3 and 12): the exact routes, their group and
 * where they are loaded from.
 */
final class RoutesApiTest extends TestCase
{
    /**
     * Every Atrium route: name => [method, uri, binding fields].
     *
     * @var array<string, array{0: string, 1: string, 2: array<string, string>}>
     */
    private const array ROUTES = [
        'atrium.shell' => ['GET', 'atrium/api/shell', []],
        'atrium.dashboards.default' => ['GET', 'atrium/api/dashboard', []],
        'atrium.dashboards.index' => ['GET', 'atrium/api/dashboards', []],
        'atrium.dashboards.show' => ['GET', 'atrium/api/dashboards/{dashboard}', ['dashboard' => 'slug']],
        'atrium.dashboards.store' => ['POST', 'atrium/api/dashboards', []],
        'atrium.dashboards.update' => ['PUT', 'atrium/api/dashboards/{dashboard}', ['dashboard' => 'slug']],
        'atrium.dashboards.destroy' => ['DELETE', 'atrium/api/dashboards/{dashboard}', ['dashboard' => 'slug']],
        'atrium.dashboards.layout' => ['PUT', 'atrium/api/dashboards/{dashboard}/layout', ['dashboard' => 'slug']],
        'atrium.dashboards.widgets.show' => ['GET', 'atrium/api/dashboards/{dashboard}/widgets/{widget}', ['dashboard' => 'slug', 'widget' => 'uuid']],
        'atrium.widgets.index' => ['GET', 'atrium/api/widgets', []],
        'atrium.search' => ['GET', 'atrium/api/search', []],
        'atrium.settings.index' => ['GET', 'atrium/api/settings', []],
        'atrium.settings.show' => ['GET', 'atrium/api/settings/{panel}', []],
        // The screens suite integrations declare (AC 44).
        'atrium.screens.show' => ['GET', 'atrium/api/screens/{screen}', []],
        // Plugin routes (AC 12), from the two fixture plugins configured below.
        'atrium.plugins.routed.index' => ['GET', 'atrium/api/plugins/routed', []],
        'atrium.plugins.featured.index' => ['GET', 'atrium/api/plugins/featured', []],
    ];

    /**
     * The group's middleware: JSON rendering forced first, then the
     * configured `atrium.routes.middleware` (default `['api', Authorize]`).
     *
     * @var list<string>
     */
    private const array GROUP = [ForceJsonResponse::class, 'api', Authorize::class];

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app->make(Repository::class)->set('atrium.plugins', [RoutedPlugin::class, FeaturedPlugin::class]);
    }

    protected function disableRoutes($app): void
    {
        $app->make(Repository::class)->set('atrium.routes.enabled', false);
    }

    /**
     * @return array<string, RoutingRoute>
     */
    private function atriumRoutes(): array
    {
        $routes = [];

        foreach (Route::getRoutes()->getRoutes() as $route) {
            $name = $route->getName();

            if (is_string($name) && str_starts_with($name, 'atrium.')) {
                $routes[$name] = $route;
            }
        }

        return $routes;
    }

    public function test_atrium_registers_exactly_its_api_routes(): void
    {
        $names = array_keys($this->atriumRoutes());
        sort($names);

        $expected = array_keys(self::ROUTES);
        sort($expected);

        $this->assertSame($expected, $names);
    }

    public function test_each_route_has_its_method_uri_and_public_binding(): void
    {
        $routes = $this->atriumRoutes();

        foreach (self::ROUTES as $name => [$method, $uri, $bindings]) {
            $route = $routes[$name];

            $this->assertSame($method, $route->methods()[0], $name);
            $this->assertSame($uri, $route->uri(), $name);

            foreach ($route->parameterNames() as $parameter) {
                $this->assertSame($bindings[$parameter] ?? null, $route->bindingFieldFor($parameter), $name.' {'.$parameter.'}');
            }
        }

        $this->assertTrue($routes['atrium.dashboards.widgets.show']->enforcesScopedBindings());
    }

    public function test_no_other_route_is_served_under_the_prefix(): void
    {
        foreach (Route::getRoutes()->getRoutes() as $route) {
            if (str_starts_with($route->uri(), 'atrium')) {
                $this->assertArrayHasKey((string) $route->getName(), self::ROUTES, $route->uri());
            }
        }
    }

    public function test_every_atrium_route_carries_the_group_middleware_with_authorize_last(): void
    {
        $this->assertSame(['api', Authorize::class], config('atrium.routes.middleware'));

        foreach ($this->atriumRoutes() as $name => $route) {
            $middleware = $route->gatherMiddleware();

            $this->assertSame(self::GROUP, array_slice($middleware, 0, count(self::GROUP)), $name);

            // Only a plugin's own feature gate follows the group, and only on
            // its routes; every other route ends with Authorize.
            $expected = $name === 'atrium.plugins.featured.index'
                ? [...self::GROUP, EnsureFeaturesAreEnabled::class.':beta']
                : self::GROUP;

            $this->assertSame($expected, $middleware, $name);
        }
    }

    public function test_authorize_runs_before_route_model_binding(): void
    {
        // Building the HTTP kernel syncs the `api` group and the middleware
        // priority to the router, as serving a request does.
        $this->app->make(HttpKernel::class);

        $router = $this->app->make(Router::class);

        foreach ($this->atriumRoutes() as $name => $route) {
            $stack = array_values($router->gatherRouteMiddleware($route));

            $this->assertSame(ForceJsonResponse::class, $stack[0], $name);
            $this->assertContains(Authorize::class, $stack, $name);
            $this->assertContains(SubstituteBindings::class, $stack, $name);
            $this->assertLessThan(
                array_search(SubstituteBindings::class, $stack, true),
                array_search(Authorize::class, $stack, true),
                $name,
            );
        }
    }

    #[DefineEnvironment('disableRoutes')]
    public function test_disabled_routes_register_nothing(): void
    {
        $this->assertSame([], $this->atriumRoutes());

        foreach (Route::getRoutes()->getRoutes() as $route) {
            $this->assertStringStartsNotWith('atrium', $route->uri());
        }
    }

    public function test_no_domain_has_an_api_routes_file(): void
    {
        $this->assertSame([], glob($this->src().'/Domains/*/api.php') ?: []);
    }

    public function test_nothing_loads_routes_through_the_dashboard_group(): void
    {
        foreach ($this->phpFiles($this->src()) as $file) {
            $this->assertStringNotContainsString('loadDashboardRoutesFrom', (string) file_get_contents($file), $file);
            $this->assertStringNotContainsString('dashboardRouteAttributes', (string) file_get_contents($file), $file);
        }
    }

    public function test_each_domain_loads_its_own_routes_file_through_keystone(): void
    {
        $files = glob($this->src().'/Domains/*/routes.php') ?: [];

        $this->assertNotEmpty($files);

        foreach ($files as $file) {
            $domain = basename(dirname($file));
            $provider = (string) file_get_contents(dirname($file).'/'.$domain.'ServiceProvider.php');

            $this->assertStringContainsString("loadApiRoutesFrom(__DIR__.'/routes.php')", $provider, $domain);
        }
    }

    private function src(): string
    {
        return dirname(__DIR__, 3).'/src';
    }

    /**
     * @return list<string>
     */
    private function phpFiles(string $directory): array
    {
        $files = [];

        /** @var SplFileInfo $file */
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)) as $file) {
            if ($file->getExtension() === 'php') {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }
}
