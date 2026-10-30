<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Testing;

use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;

/**
 * Keeps one test's screen extensions out of the next. Snapshots the registry
 * once the application has booted, so every provider's `boot()`
 * registrations are kept, and restores that snapshot after each test, so
 * whatever a test registers is gone.
 *
 * Use it on a Laravel or Testbench test case, which calls its hooks:
 *
 *     uses(TestCase::class, ResetsScreenExtensions::class)->in('Feature');
 *
 * @phpstan-import-type Registrations from ScreenExtensions
 */
trait ResetsScreenExtensions
{
    /** @var Registrations|null */
    private ?array $screenExtensionsSnapshot = null;

    /**
     * Called by the test case once the application has booted.
     */
    protected function setUpResetsScreenExtensions(): void
    {
        $this->screenExtensionsSnapshot = app(ScreenExtensions::class)->snapshot();
    }

    /**
     * Called by the test case before the application is destroyed.
     */
    protected function tearDownResetsScreenExtensions(): void
    {
        if ($this->screenExtensionsSnapshot !== null) {
            app(ScreenExtensions::class)->restore($this->screenExtensionsSnapshot);
        }
    }
}
