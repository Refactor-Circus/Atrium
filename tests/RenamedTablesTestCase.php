<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests;

use RefactorCircus\Atrium\Support\Tables;

/**
 * Every Atrium table renamed through `atrium.tables` before migrating.
 */
abstract class RenamedTablesTestCase extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        foreach (array_keys(Tables::DEFAULTS) as $key) {
            $app['config']->set('atrium.tables.'.$key, 'crm_'.$key);
        }
    }
}
