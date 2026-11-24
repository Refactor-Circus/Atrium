<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Console\Kernel as ConsoleKernel;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Orchestra\Testbench\Concerns\WithLaravelMigrations;
use Orchestra\Testbench\TestCase as Orchestra;
use RefactorCircus\Atrium\AtriumServiceProvider;
use RefactorCircus\Atrium\Testing\ResetsScreenExtensions;

abstract class TestCase extends Orchestra
{
    use RefreshDatabase;
    use ResetsScreenExtensions;
    use WithLaravelMigrations;

    protected function getPackageProviders($app): array
    {
        return [
            AtriumServiceProvider::class,
        ];
    }

    /**
     * Pretend the app is running in a non-local environment for the duration
     * of a test, without letting the database teardown prompt for
     * confirmation the way a real production run would.
     */
    protected function withEnvironment(string $environment): void
    {
        $this->app->detectEnvironment(fn (): string => $environment);

        $this->app->make(ConsoleKernel::class);
        $this->app->instance('env', $environment);

        $this->beforeApplicationDestroyed(function (): void {
            $this->app->detectEnvironment(fn (): string => 'testing');
            $this->app->instance('env', 'testing');
        });
    }

    /**
     * The session's CSRF check stays out of the way of API tests, as it does
     * for any Laravel suite: Atrium's API sits in the `web` group by default.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(PreventRequestForgery::class);
    }

    protected function defineEnvironment($app): void
    {
        tap($app->make(Repository::class), function (Repository $config): void {
            $config->set('app.key', 'base64:'.base64_encode(random_bytes(32)));

            // The suite (and the contract fixtures) serve the SPA at the root,
            // so integration links read as the paths the modules route to;
            // tests of the default `/atrium` set it back.
            $config->set('atrium.client_path', '/');

            $config->set('database.default', 'testing');
            $config->set('database.connections.testing', [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
                // Cascade deletes only apply when SQLite enforces them.
                'foreign_key_constraints' => true,
            ]);
        });
    }
}
