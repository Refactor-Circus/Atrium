<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Fixtures;

use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;
use RefactorCircus\Atrium\Domains\Search\Data\SearchResult;
use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;

class BrowserPlugin extends Plugin
{
    public function key(): string
    {
        return 'browser';
    }

    public function navigation(): array
    {
        return [
            NavItem::make('Browser Page')->url('/atrium')->group('Testing')->sort(50),
        ];
    }

    public function widgets(): array
    {
        return [
            WidgetDefinition::make('browser.widget')
                ->label('Browser Widget')
                ->description('Used by the browser test suite.'),
        ];
    }

    public function search(): ?SearchSource
    {
        return SearchSource::make('browser')
            ->label('Browser')
            ->using(fn (string $query): array => [
                SearchResult::make('Result for '.$query, '/atrium')->subtitle('From the browser plugin'),
            ]);
    }
}
