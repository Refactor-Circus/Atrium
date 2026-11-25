<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Navigation\Http\Controllers\ShellController;

Route::get('shell', [ShellController::class, 'show'])->name('shell');
