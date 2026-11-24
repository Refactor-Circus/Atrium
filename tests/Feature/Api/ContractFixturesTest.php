<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Feature\Api;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Laravel\Pennant\Feature;
use Laravel\Pennant\PennantServiceProvider;
use PHPUnit\Framework\AssertionFailedError;
use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\UuidInterface;
use RefactorCircus\Atrium\Integrations\Cortex\CortexFeature;
use RefactorCircus\Atrium\Integrations\Polycart\PolycartFeature;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;
use RefactorCircus\Atrium\Tests\TestCase;
use Symfony\Component\HttpFoundation\Response;
use Workbench\App\Models\User;
use Workbench\App\Providers\WorkbenchServiceProvider;
use Workbench\Database\Seeders\DatabaseSeeder;

/**
 * The contract between the API and the Nuxt layer (AC 31, D-007).
 *
 * Each test builds a payload the layer reads - the shell, a dashboard, a
 * resolved screen, the settings list - from the workbench app as
 * `composer serve` runs it (its plugin, gates and seeded data), with seeded
 * uuids and frozen time, and compares it with the layer's fixture in
 * `ui/sdk/test/fixtures`. Vitest type-checks the same files against the
 * layer's types and renders its components from them, so a payload change
 * fails here until the fixture, and with it the layer, is updated.
 *
 * A plain run only compares. Regenerate the fixtures after an intended change:
 *
 *     UPDATE_FIXTURES=1 vendor/bin/pest tests/Feature/Api/ContractFixturesTest.php
 *
 * The same app is what `composer serve` serves (AC 21), so its demo plugin's
 * API routes and its page are checked here too.
 */
class ContractFixturesTest extends TestCase
{
    private const string FIXTURES = __DIR__.'/../../../ui/sdk/test/fixtures';

    private const string NOW = '2026-11-23 10:00:00';

    private User $admin;

    protected function getPackageProviders($app): array
    {
        return [...parent::getPackageProviders($app), WorkbenchServiceProvider::class];
    }

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $config = $app->make(Repository::class);
        $config->set('app.name', 'Acme Shop');
        $config->set('app.url', 'http://localhost');
        $config->set('app.locale', 'en');
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(Carbon::parse(self::NOW, 'UTC'));

        $sequence = 0;

        Str::createUuidsUsing(function () use (&$sequence): UuidInterface {
            $sequence++;

            return Uuid::fromString(sprintf('019ab000-0000-7000-8000-%012d', $sequence));
        });

        $this->seed(DatabaseSeeder::class);

        $this->admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    }

    protected function tearDown(): void
    {
        Str::createUuidsNormally();

        parent::tearDown();
    }

    public function test_the_shell_matches_its_fixture(): void
    {
        $this->assertResponseMatchesFixture('shell', $this->actingAs($this->admin)->getJson(route('atrium.shell')));
    }

    /**
     * The shell with suite integrations registered (AC 42): two fixture
     * integrations, one of them flagged off for the user through Pennant.
     */
    public function test_the_shell_with_integrations_matches_its_fixture(): void
    {
        $this->app->register(PennantServiceProvider::class);
        $this->app->make(Repository::class)->set('pennant.default', 'array');

        IntegrationFixture::registerFakes('cortex', 'polycart');

        Feature::for($this->admin)->deactivate(PolycartFeature::class);

        $this->assertResponseMatchesFixture('shell-integrations', $this->actingAs($this->admin)->getJson(route('atrium.shell')));
    }

    public function test_the_default_dashboard_matches_its_fixture(): void
    {
        $this->assertResponseMatchesFixture('dashboard', $this->actingAs($this->admin)->getJson(route('atrium.dashboards.default')));
    }

    public function test_a_resolved_screen_on_its_built_in_tab_matches_its_fixture(): void
    {
        $this->assertResponseMatchesFixture('screen', $this->actingAs($this->admin)->getJson(route('atrium.settings.show', 'demo')));
    }

    public function test_a_resolved_screen_on_a_registered_tab_matches_its_fixture(): void
    {
        $this->assertResponseMatchesFixture('screen-tab', $this->actingAs($this->admin)->getJson(route('atrium.settings.show', [
            'panel' => 'demo',
            'tab' => 'demo.storefront',
        ])));
    }

    public function test_the_settings_list_matches_its_fixture(): void
    {
        $this->assertResponseMatchesFixture('settings', $this->actingAs($this->admin)->getJson(route('atrium.settings.index')));
    }

    public function test_the_payloads_are_deterministic(): void
    {
        $first = $this->actingAs($this->admin)->getJson(route('atrium.dashboards.default'))->getContent();
        $second = $this->actingAs($this->admin)->getJson(route('atrium.dashboards.default'))->getContent();

        $this->assertSame($first, $second);
        $this->assertStringContainsString('"uuid":"019ab000-0000-7000-8000-000000000001"', (string) $first);
    }

    public function test_the_demo_plugin_serves_its_pages_from_api_routes(): void
    {
        $this->assertStringEndsWith('/atrium/api/plugins/demo/orders', route('atrium.plugins.demo.orders'));

        $this->getJson(route('atrium.plugins.demo.users'))->assertUnauthorized();

        $this->actingAs($this->admin)->getJson(route('atrium.plugins.demo.orders'))
            ->assertOk()
            ->assertJsonPath('data.0.number', 'ORD-1048')
            ->assertJsonPath('data.0.status_label', 'Paid');

        $this->actingAs($this->admin)->getJson(route('atrium.plugins.demo.reports.show', 'sales'))
            ->assertOk()
            ->assertJsonPath('data.title', 'Sales');
    }

    public function test_the_workbench_serves_atriums_page_with_its_own_module_to_the_signed_in_user(): void
    {
        $this->actingAs($this->admin)->get('/atrium')
            ->assertOk()
            ->assertSee('id="atrium-boot"', false)
            ->assertSee('/vendor/atrium/demo/', false);
    }

    public function test_the_page_sends_a_guest_to_the_apps_login(): void
    {
        // The workbench's login route (routes/web.php), as `composer serve` has it.
        Route::get('login', fn () => redirect('/_workbench'))->name('login');

        $this->get('/atrium')->assertRedirect('/login');
    }

    public function test_a_plain_run_fails_on_a_difference_and_writes_nothing(): void
    {
        $this->withFixtureDirectory(function (string $directory): void {
            file_put_contents($directory.'/sample.json', "{\n    \"old\": true\n}\n");

            $this->withUpdateFixtures(null, function () use ($directory): void {
                try {
                    $this->assertMatchesFixture('sample', '{"new":true}', $directory);
                    $this->fail('A payload that differs from its fixture must fail.');
                } catch (AssertionFailedError $error) {
                    $this->assertStringContainsString('UPDATE_FIXTURES=1', $error->getMessage());
                }
            });

            $this->assertSame("{\n    \"old\": true\n}\n", file_get_contents($directory.'/sample.json'));
        });
    }

    public function test_a_plain_run_fails_on_a_missing_fixture_and_creates_none(): void
    {
        $this->withFixtureDirectory(function (string $directory): void {
            $this->withUpdateFixtures(null, function () use ($directory): void {
                try {
                    $this->assertMatchesFixture('missing', '{"new":true}', $directory);
                    $this->fail('A payload without a fixture must fail.');
                } catch (AssertionFailedError $error) {
                    $this->assertStringContainsString('UPDATE_FIXTURES=1', $error->getMessage());
                }
            });

            $this->assertFileDoesNotExist($directory.'/missing.json');
        });
    }

    public function test_update_fixtures_writes_the_payload_pretty_printed(): void
    {
        $this->withFixtureDirectory(function (string $directory): void {
            file_put_contents($directory.'/sample.json', "{}\n");

            $this->withUpdateFixtures('1', function () use ($directory): void {
                $this->assertMatchesFixture('sample', '{"data":{"path":"/demo/orders","settings":{},"rows":[]}}', $directory);
            });

            $this->assertSame(
                "{\n    \"data\": {\n        \"path\": \"/demo/orders\",\n        \"settings\": {},\n        \"rows\": []\n    }\n}\n",
                file_get_contents($directory.'/sample.json'),
            );
        });
    }

    /**
     * The helper each package's integration test writes its declarations
     * with (AC 49), under the same rules as the fixtures above.
     */
    public function test_the_integration_fixture_helper_compares_and_writes_only_with_update_fixtures(): void
    {
        IntegrationFixture::registerFakes('cortex');

        $this->withFixtureDirectory(function (string $directory): void {
            $this->withUpdateFixtures(null, function () use ($directory): void {
                try {
                    IntegrationFixture::assertMatchesFixture('cortex', $directory);
                    $this->fail('An integration without a fixture must fail.');
                } catch (AssertionFailedError $error) {
                    $this->assertStringContainsString('UPDATE_FIXTURES=1', $error->getMessage());
                }
            });

            $this->assertFileDoesNotExist($directory.'/cortex.json');

            $this->withUpdateFixtures('1', function () use ($directory): void {
                IntegrationFixture::assertMatchesFixture('cortex', $directory);
            });

            $this->assertSame([
                'key' => 'cortex',
                'label' => 'Cortex',
                'api_base' => '/cortex/api',
                'features' => [CortexFeature::class],
                'navigation' => [[
                    'label' => 'Cortex records',
                    'icon' => 'i-lucide-box',
                    'group' => 'Cortex',
                    'sort' => 50,
                    'link' => ['path' => '/cortex/records', 'external' => false],
                    'badge' => null,
                    'live' => ['key' => 'cortex.active-records', 'options' => ['sort' => 90]],
                    'children' => [],
                ]],
                'widgets' => [[
                    'key' => 'cortex.stats',
                    'label' => 'Cortex stats',
                    'description' => null,
                    'icon' => 'i-lucide-chart-bar',
                    'component' => 'cortex.stats',
                    'lazy' => false,
                    'default_size' => ['width' => 4, 'height' => 2],
                    'min_size' => ['width' => 1, 'height' => 1],
                    'data' => [],
                ]],
                'settings' => [
                    'key' => 'cortex',
                    'label' => 'Cortex',
                    'description' => null,
                    'icon' => 'i-lucide-settings',
                    'component' => 'cortex',
                    'data' => [],
                ],
                'search_sources' => [
                    ['key' => 'cortex', 'integration' => 'cortex', 'label' => 'Cortex records', 'icon' => 'i-lucide-search'],
                ],
                'screens' => [
                    ['key' => 'cortex.records', 'kind' => 'list', 'path' => '/cortex/records', 'subject_type' => null, 'options' => []],
                    ['key' => 'cortex.record', 'kind' => 'detail', 'path' => '/cortex/records/:record', 'subject_type' => 'cortex.record', 'options' => []],
                ],
            ], json_decode((string) file_get_contents($directory.'/cortex.json'), true));

            $contents = (string) file_get_contents($directory.'/cortex.json');

            $this->assertStringContainsString('"data": {}', $contents);
            $this->assertStringEndsWith("}\n", $contents);

            // A plain run now compares equal, and writes nothing.
            $this->withUpdateFixtures(null, function () use ($directory): void {
                IntegrationFixture::assertMatchesFixture('cortex', $directory);
            });

            $this->assertSame($contents, file_get_contents($directory.'/cortex.json'));
        });
    }

    /**
     * Compare a successful response's JSON with the named fixture.
     *
     * @param  TestResponse<Response>  $response
     */
    private function assertResponseMatchesFixture(string $name, TestResponse $response): void
    {
        $response->assertOk();

        $this->assertMatchesFixture($name, (string) $response->getContent(), self::FIXTURES);
    }

    /**
     * Compare the JSON with `{directory}/{name}.json`, as the fixture stores
     * it: pretty-printed, with `{}` and `[]` kept apart. Only with
     * `UPDATE_FIXTURES=1` is the fixture (re)written first.
     */
    private function assertMatchesFixture(string $name, string $json, string $directory): void
    {
        $path = $directory.'/'.$name.'.json';
        $actual = self::encode($json);
        $regenerate = 'If the change is intended, regenerate the fixtures with `UPDATE_FIXTURES=1 vendor/bin/pest tests/Feature/Api/ContractFixturesTest.php` and update the layer types that read them.';

        if (getenv('UPDATE_FIXTURES') === '1') {
            File::ensureDirectoryExists($directory);
            file_put_contents($path, $actual);
        }

        $this->assertFileExists($path, "The [{$name}] fixture is missing. {$regenerate}");
        $this->assertSame((string) file_get_contents($path), $actual, "The [{$name}] payload no longer matches its fixture. {$regenerate}");
    }

    private static function encode(string $json): string
    {
        // Decoded to objects, so an empty object stays `{}` and a list `[]`.
        $decoded = json_decode($json, flags: JSON_THROW_ON_ERROR);

        return json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)."\n";
    }

    /**
     * Run the callback against an empty, temporary fixtures directory.
     *
     * @param  callable(string): void  $callback
     */
    private function withFixtureDirectory(callable $callback): void
    {
        $directory = sys_get_temp_dir().'/atrium-fixtures-'.Str::random(12);
        File::ensureDirectoryExists($directory);

        try {
            $callback($directory);
        } finally {
            File::deleteDirectory($directory);
        }
    }

    /**
     * Run the callback with `UPDATE_FIXTURES` set to the value, or unset,
     * then restore it.
     *
     * @param  callable(): void  $callback
     */
    private function withUpdateFixtures(?string $value, callable $callback): void
    {
        $previous = getenv('UPDATE_FIXTURES');

        putenv($value === null ? 'UPDATE_FIXTURES' : 'UPDATE_FIXTURES='.$value);

        try {
            $callback();
        } finally {
            putenv($previous === false ? 'UPDATE_FIXTURES' : 'UPDATE_FIXTURES='.$previous);
        }
    }
}
