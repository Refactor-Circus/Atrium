<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Tests\RenamedTablesTestCase;
use RefactorCircus\Atrium\Tests\TestCase;

uses(TestCase::class)->in(__DIR__.'/Feature');

// The Feature suite's dashboard flows again, with every table renamed.
uses(RenamedTablesTestCase::class)->in(__DIR__.'/Modes/RenamedTables');
