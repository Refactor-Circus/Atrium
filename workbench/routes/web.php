<?php

use Illuminate\Support\Facades\Route;
use Workbench\App\Atrium\ScreenHost\ScreenHostController;

// `composer serve` signs in the seeded admin through /_workbench and starts
// at the dashboard (see testbench.yaml), so the root only points there.
Route::redirect('/', '/atrium');

// The screen-extensions test host: a detail and a list screen, each under
// its own key or the one given.
Route::get('test/host/{screen?}', [ScreenHostController::class, 'detail'])
    ->where('screen', '[a-z0-9.-]+')
    ->name('test.host');

Route::get('test/list/{screen?}', [ScreenHostController::class, 'list'])
    ->where('screen', '[a-z0-9.-]+')
    ->name('test.list');
