<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Integrations\Http\Controllers\IntegrationScreenController;

Route::get('screens/{screen}', [IntegrationScreenController::class, 'show'])->name('screens.show');
