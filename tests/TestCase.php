<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Console\Kernel as ConsoleKernel;
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

    protected function defineEnvironment($app): void
    {
        tap($app->make(Repository::class), function (Repository $config): void {
            $config->set('app.key', 'base64:'.base64_encode(random_bytes(32)));

            $config->set('view.paths', array_merge(
                (array) $config->get('view.paths', []),
                [__DIR__.'/Fixtures/views'],
            ));

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
