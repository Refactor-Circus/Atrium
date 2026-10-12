<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers\DashboardController;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers\DashboardCrudController;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers\DashboardLayoutController;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers\DashboardWidgetController;

Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

Route::post('dashboards', [DashboardCrudController::class, 'store'])->name('dashboards.store');
Route::put('dashboards/{dashboard}', [DashboardCrudController::class, 'update'])->name('dashboards.update');
Route::delete('dashboards/{dashboard}', [DashboardCrudController::class, 'destroy'])->name('dashboards.destroy');
Route::put('dashboards/{dashboard}/layout', [DashboardLayoutController::class, 'update'])->name('dashboards.layout');
Route::get('dashboards/{dashboard}/widgets/{widget}', [DashboardWidgetController::class, 'show'])->name('dashboards.widgets.show')->scopeBindings();

Route::get('d/{slug}', [DashboardController::class, 'show'])->name('dashboard.show');
