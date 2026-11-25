<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Tests\RenamedTablesTestCase;
use RefactorCircus\Atrium\Tests\TestCase;

uses(TestCase::class)->in(__DIR__.'/Feature');

// The Feature suite's dashboard flows again, with every table renamed.
uses(RenamedTablesTestCase::class)->in(__DIR__.'/Modes/RenamedTables');

/**
 * Hold Testbench's skeleton app for this test. `vendor/bin/testbench`
 * (OpenApiTest) rewrites the skeleton's configuration and caches while it
 * runs, and the search process driver (SearchTest) runs `php artisan` in
 * that same skeleton, so under `--parallel` the two would race. Released by
 * releaseTestbenchSkeleton(), or when the worker exits.
 */
function lockTestbenchSkeleton(): void
{
    if (isset($GLOBALS['atriumSkeletonLock'])) {
        return;
    }

    $lock = fopen(sys_get_temp_dir().'/atrium-skeleton-'.md5(base_path()).'.lock', 'c');

    if ($lock !== false && flock($lock, LOCK_EX)) {
        $GLOBALS['atriumSkeletonLock'] = $lock;
    }
}

function releaseTestbenchSkeleton(): void
{
    $lock = $GLOBALS['atriumSkeletonLock'] ?? null;
    unset($GLOBALS['atriumSkeletonLock']);

    if (is_resource($lock)) {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}
