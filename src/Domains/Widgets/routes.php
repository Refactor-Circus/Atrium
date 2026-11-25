<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Widgets\Http\Controllers\WidgetController;

// Loaded inside Atrium's API group: `atrium.routes.prefix`, `atrium.routes.middleware`
// and the `atrium.` name prefix.
Route::get('widgets', [WidgetController::class, 'index'])->name('widgets.index');
