<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Settings\Http\Controllers\SettingsController;

Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
Route::get('settings/{panel}', [SettingsController::class, 'show'])->name('settings.show');
