<?php

declare(strict_types=1);

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

uses(TestCase::class)->in(__DIR__.'/Feature');

// The Feature suite's dashboard flows again, with every table renamed.
uses(RenamedTablesTestCase::class)->in(__DIR__.'/Modes/RenamedTables');

// Browser tests need Atrium's published assets on disk so Alpine boots.
uses(BrowserTestCase::class)->in(__DIR__.'/Browser');
