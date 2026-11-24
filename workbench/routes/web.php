<?php

use Illuminate\Support\Facades\Route;
use Workbench\App\Atrium\SuiteStandIn;

// Atrium serves its page at /atrium (atrium.client_path). The workbench
// signs testbench.yaml's `workbench.user` in through /_workbench, which
// Atrium's `auth` middleware sends a guest to as the app's login route.
Route::redirect('/', '/atrium');

Route::get('login', fn () => redirect('/_workbench'))->name('login');

// WORKBENCH ONLY: every suite package's API, answered from its vendored
// openapi.json (DemoSuite points the integrations here).
Route::any('_suite/{path}', SuiteStandIn::class)->where('path', '.*');
