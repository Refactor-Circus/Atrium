<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Fixtures;

use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;
use RefactorCircus\Atrium\Domains\Search\Data\SearchResult;
use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;

class FullPlugin extends Plugin
{
    public function key(): string
    {
        return 'full';
    }

    public function settings(): ?SettingsPanel
    {
        return SettingsPanel::make('full')
            ->label('Full Settings')
            ->description('Everything the full plugin can configure.');
    }

    public function search(): ?SearchSource
    {
        return SearchSource::make('full')
            ->label('Full')
            ->using(fn (string $query): array => [
                SearchResult::make('Match for '.$query, '/atrium/full')->subtitle('From the full plugin'),
            ]);
    }
}
