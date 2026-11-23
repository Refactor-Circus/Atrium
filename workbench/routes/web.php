<?php

use Illuminate\Support\Facades\Route;
use Workbench\App\Http\Middleware\AuthenticateWorkbenchToken;
use Workbench\App\Providers\WorkbenchServiceProvider;

// Atrium renders no HTML: `composer serve` serves its JSON API, and the Nuxt
// playground renders it. testbench.yaml starts at /atrium, which says where
// each lives.
Route::redirect('/', '/atrium');

Route::get('atrium', fn (): array => [
    'message' => 'Atrium is headless: run the Nuxt playground (pnpm -C nuxt dev) and open it.',
    'playground' => WorkbenchServiceProvider::PLAYGROUND_ORIGINS[0],
    'api' => url((string) config('atrium.routes.prefix')),
    'token' => 'Authorization: Bearer '.AuthenticateWorkbenchToken::TOKEN.' (workbench only)',
]);
