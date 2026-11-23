<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers\DashboardController;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers\DashboardLayoutController;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers\DashboardWidgetController;

// Loaded inside Atrium's API group: `atrium.routes.prefix`, `atrium.routes.middleware`
// and the `atrium.` name prefix. Dashboards are named by slug, placements by uuid.
Route::get('dashboard', [DashboardController::class, 'showDefault'])->name('dashboards.default');
Route::get('dashboards', [DashboardController::class, 'index'])->name('dashboards.index');
Route::post('dashboards', [DashboardController::class, 'store'])->name('dashboards.store');
Route::get('dashboards/{dashboard:slug}', [DashboardController::class, 'show'])->name('dashboards.show');
Route::put('dashboards/{dashboard:slug}', [DashboardController::class, 'update'])->name('dashboards.update');
Route::delete('dashboards/{dashboard:slug}', [DashboardController::class, 'destroy'])->name('dashboards.destroy');
Route::put('dashboards/{dashboard:slug}/layout', [DashboardLayoutController::class, 'update'])->name('dashboards.layout');
Route::get('dashboards/{dashboard:slug}/widgets/{widget:uuid}', [DashboardWidgetController::class, 'show'])->name('dashboards.widgets.show')->scopeBindings();
