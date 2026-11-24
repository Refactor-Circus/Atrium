<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Feature\Frontend;

use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Tests\TestCase;

/**
 * A host that serves its own front end turns Atrium's page off
 * (`atrium.client.enabled`): the API stays, the page and its assets go.
 */
class ClientDisabledTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('atrium.client.enabled', false);
    }

    public function test_it_serves_no_page_and_no_assets(): void
    {
        $this->assertFalse(Route::has('atrium.app'));
        $this->assertFalse(Route::has('atrium.assets'));
        $this->assertTrue(Route::has('atrium.shell'));
    }
}
