<?php

declare(strict_types=1);

use Pest\Plugins\Parallel;
use RefactorCircus\Atrium\Tests\BrowserTestCase;
use RefactorCircus\Atrium\Tests\RenamedTablesTestCase;
use RefactorCircus\Atrium\Tests\TestCase;

// pest-plugin-browser removes its output directories with @rmdir() when it
// boots. A missing directory raises a (suppressed) warning that failOnWarning
// turns into a failed run, even with every test passing, so make sure each
// one it removes exists; empty directories remove cleanly.
foreach (['Traces', 'Screenshots', 'Screenshots/Sliders', 'Screenshots/ImageDiffView'] as $directory) {
    if (! is_dir(__DIR__.'/Browser/'.$directory)) {
        @mkdir(__DIR__.'/Browser/'.$directory, recursive: true);
    }
}

// It only removes files, though, and warns on a directory it cannot unlink
// and on a Screenshots directory that is not empty. The screen-extensions
// matrix saves into a directory of its own, so clear it first, as the plugin
// does the rest of the last run's screenshots; ScreenExtensionsTest makes it
// again. Parallel workers leave it alone, as the plugin does, so they never
// race each other to delete it.
if (! Parallel::isWorker() && is_dir(__DIR__.'/Browser/Screenshots/screen-extensions')) {
    foreach (glob(__DIR__.'/Browser/Screenshots/screen-extensions/*') ?: [] as $screenshot) {
        unlink($screenshot);
    }

    rmdir(__DIR__.'/Browser/Screenshots/screen-extensions');
}

uses(TestCase::class)->in(__DIR__.'/Feature');

// The Feature suite's dashboard flows again, with every table renamed.
uses(RenamedTablesTestCase::class)->in(__DIR__.'/Modes/RenamedTables');

// Browser tests need Atrium's published assets on disk so Alpine boots.
uses(BrowserTestCase::class)->in(__DIR__.'/Browser');
