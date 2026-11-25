<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Fixtures;

use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;

class RoutedPlugin extends Plugin
{
    public function key(): string
    {
        return 'routed';
    }

    /**
     * Served as `atrium.plugins.routed.index`, at `{prefix}/plugins/routed`.
     */
    public function routes(): void
    {
        Route::get('/', fn (): array => ['from' => 'plugin'])->name('index');
    }
}
