<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Feature\Api;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Testing\TestResponse;
use Orchestra\Testbench\Attributes\DefineEnvironment;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\Authorize;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Tests\Fixtures\RoutedPlugin;
use RefactorCircus\Atrium\Tests\TestCase;
use Symfony\Component\HttpFoundation\Response;
use Workbench\App\Models\User;

/**
 * Responses by auth state (AC 5): guests, the `viewAtrium` gate and
 * view-only users, on every Atrium route, plugin routes included.
 */
final class AuthApiTest extends TestCase
{
    /**
     * Accept headers a guest may send; null leaves the test client's default.
     *
     * @var list<string|null>
     */
    private const array ACCEPTS = ['application/json', 'text/html', '*/*', null];

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app->make(Repository::class)->set('atrium.plugins', [RoutedPlugin::class]);
    }

    /**
     * Install a stand-in token guard in front of Authorize, as a host adds
     * `auth:sanctum`: the bearer token is the user's id.
     */
    protected function useTestGuard($app): void
    {
        $config = $app->make(Repository::class);

        $config->set('auth.guards.atrium-test', ['driver' => 'atrium-test', 'provider' => 'users']);
        $config->set('atrium.routes.middleware', ['api', 'auth:atrium-test', Authorize::class]);

        $app->make('auth')->viaRequest('atrium-test', function (Request $request): ?User {
            $token = $request->bearerToken();

            return $token === null ? null : User::query()->find($token);
        });
    }

    /**
     * Every Atrium route as [method, url]. Its parameters need not exist:
     * the gate answers before any model is bound.
     *
     * @return array<string, array{0: string, 1: string}>
     */
    private function everyRoute(): array
    {
        $parameters = [
            'dashboard' => 'missing',
            'widget' => '01900000-0000-7000-8000-000000000000',
            'panel' => 'missing',
            'screen' => 'missing.screen',
        ];

        $routes = [];

        foreach (Route::getRoutes()->getRoutes() as $route) {
            $name = $route->getName();

            if (! is_string($name) || ! str_starts_with($name, 'atrium.')) {
                continue;
            }

            $routes[$name] = [
                $route->methods()[0],
                route($name, array_intersect_key($parameters, array_flip($route->parameterNames()))),
            ];
        }

        $this->assertArrayHasKey('atrium.plugins.routed.index', $routes);
        $this->assertArrayHasKey('atrium.screens.show', $routes);
        $this->assertCount(15, $routes);

        return $routes;
    }

    /**
     * @return TestResponse<Response>
     */
    private function send(string $method, string $url, ?string $accept, ?User $user = null): TestResponse
    {
        $server = $accept === null ? [] : ['HTTP_ACCEPT' => $accept];

        if ($user !== null) {
            $server['HTTP_AUTHORIZATION'] = 'Bearer '.$user->getKey();
        }

        return $this->call($method, $url, server: $server);
    }

    private function user(): User
    {
        return User::forceCreate(['name' => 'Ann', 'email' => 'ann@example.com', 'password' => bcrypt('x')]);
    }

    private function assertJsonResponse(TestResponse $response, int $status, string $context): void
    {
        $this->assertSame($status, $response->getStatusCode(), $context.': '.$response->getContent());
        $this->assertStringContainsString('application/json', (string) $response->headers->get('Content-Type'), $context);
    }

    public function test_a_guest_gets_401_json_on_every_route_with_no_guard_configured(): void
    {
        $this->assertSame(['api', Authorize::class], config('atrium.routes.middleware'));

        // Even where the gate would let anyone through.
        $this->withEnvironment('local');

        foreach ($this->everyRoute() as $name => [$method, $url]) {
            foreach (self::ACCEPTS as $accept) {
                $response = $this->send($method, $url, $accept);

                $this->assertJsonResponse($response, 401, $name.' Accept: '.($accept ?? 'default'));
                $response->assertExactJson(['message' => 'Unauthenticated.']);
            }
        }
    }

    #[DefineEnvironment('useTestGuard')]
    public function test_a_guest_gets_401_json_from_the_hosts_guard_never_a_redirect(): void
    {
        foreach ($this->everyRoute() as $name => [$method, $url]) {
            foreach (self::ACCEPTS as $accept) {
                $response = $this->send($method, $url, $accept);

                $this->assertJsonResponse($response, 401, $name.' Accept: '.($accept ?? 'default'));
                $response->assertExactJson(['message' => 'Unauthenticated.']);
            }
        }
    }

    #[DefineEnvironment('useTestGuard')]
    public function test_the_gate_refuses_a_signed_in_user_outside_local_on_every_route(): void
    {
        $this->withEnvironment('production');
        $user = $this->user();

        foreach ($this->everyRoute() as $name => [$method, $url]) {
            $response = $this->send($method, $url, 'text/html', $user);

            $this->assertJsonResponse($response, 403, $name);
            $response->assertJsonPath('message', 'This action is unauthorized.');
        }
    }

    #[DefineEnvironment('useTestGuard')]
    public function test_the_gate_lets_a_signed_in_user_through_in_local(): void
    {
        $this->withEnvironment('local');
        $user = $this->user();

        $this->send('GET', route('atrium.shell'), 'application/json', $user)
            ->assertOk()
            ->assertJsonPath('data.user.email', 'ann@example.com');

        $this->send('GET', route('atrium.plugins.routed.index'), 'application/json', $user)
            ->assertOk()
            ->assertExactJson(['from' => 'plugin']);
    }

    #[DefineEnvironment('useTestGuard')]
    public function test_a_defined_gate_decides_in_every_environment(): void
    {
        $this->withEnvironment('production');
        $user = $this->user();

        $asked = 0;

        Gate::define('viewAtrium', function (User $signedIn, Request $request) use (&$asked, $user): bool {
            $asked++;

            return $signedIn->is($user) && $request->routeIs('atrium.*');
        });

        $this->send('GET', route('atrium.shell'), 'application/json', $user)->assertOk();
        $this->send('GET', route('atrium.plugins.routed.index'), 'application/json', $user)->assertOk();

        $this->assertSame(2, $asked);
    }

    #[DefineEnvironment('useTestGuard')]
    public function test_a_defined_gate_refuses_even_in_local(): void
    {
        $this->withEnvironment('local');
        $user = $this->user();

        Gate::define('viewAtrium', fn (User $signedIn): bool => false);

        $this->assertJsonResponse($this->send('GET', route('atrium.shell'), 'text/html', $user), 403, 'shell');
        $this->assertJsonResponse($this->send('GET', route('atrium.plugins.routed.index'), 'text/html', $user), 403, 'plugin');
    }

    public function test_a_view_only_user_gets_403_on_every_mutation(): void
    {
        $this->withEnvironment('local');
        $user = $this->user();

        $shared = DashboardModel::query()->create(['name' => 'Company', 'is_shared' => true]);
        $shared->widgets()->create(['widget_key' => 'gone.widget']);

        $this->actingAs($user)->getJson(route('atrium.dashboards.show', $shared))
            ->assertOk()
            ->assertJsonPath('meta.abilities', ['update' => false, 'delete' => false]);

        $this->actingAs($user)
            ->putJson(route('atrium.dashboards.update', $shared), ['name' => 'Mine now', 'version' => 1])
            ->assertForbidden();

        $this->actingAs($user)
            ->putJson(route('atrium.dashboards.layout', $shared), ['version' => 1, 'widgets' => []])
            ->assertForbidden();

        $this->actingAs($user)
            ->deleteJson(route('atrium.dashboards.destroy', $shared))
            ->assertForbidden();

        $fresh = $shared->fresh();

        $this->assertNotNull($fresh);
        $this->assertSame('Company', $fresh->name);
        $this->assertSame(1, $fresh->version);
        $this->assertSame(1, $fresh->widgets()->count());
    }
}
