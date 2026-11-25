<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\EnsureFeaturesAreEnabled;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;

// Loaded inside Atrium's API group: `atrium.routes.prefix`, `atrium.routes.middleware`
// and the `atrium.` name prefix. Each plugin's routes sit under `plugins/{key}`,
// named `atrium.plugins.{key}.*`, and go away with its features, as its links do.
foreach (app(PluginRegistry::class)->all() as $plugin) {
    $key = $plugin->key();
    $features = $plugin->features();

    $group = Route::prefix('plugins/'.$key)->name('plugins.'.$key.'.');

    if ($features !== []) {
        $group->middleware(EnsureFeaturesAreEnabled::class.':'.implode(',', $features));
    }

    $group->group(fn () => $plugin->routes());
}
