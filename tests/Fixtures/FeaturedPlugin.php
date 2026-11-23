<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Fixtures;

use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;

class FeaturedPlugin extends Plugin
{
    public function key(): string
    {
        return 'featured';
    }

    public function features(): array
    {
        return ['beta'];
    }

    public function navigation(): array
    {
        return [
            NavItem::make('Featured Home')->url('/atrium/featured')->group('Featured'),
            NavItem::make('Featured Admin')->url('/atrium/featured/admin')->group('Featured Admin'),
        ];
    }

    public function navigationGroups(): array
    {
        return [
            NavGroup::make('Featured Admin')->can('manage-featured'),
        ];
    }

    public function routes(): void
    {
        Route::get('/', fn (): array => ['page' => 'featured'])->name('index');
    }
}
