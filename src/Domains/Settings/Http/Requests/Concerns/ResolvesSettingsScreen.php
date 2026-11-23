<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Settings\Http\Requests\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Screens\Data\ResolvedScreen;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;

/**
 * The settings pages declare themselves as screens, so packages add tabs and
 * sections to them. A panel is not a model, so neither screen has a record.
 */
trait ResolvesSettingsScreen
{
    /**
     * The standard screen, resolved for this request. Extensions'
     * `permission()`s are Gate abilities, asked about the record when there
     * is one (a row's).
     */
    protected function resolveScreen(string $key, string $kind): ResolvedScreen
    {
        $screen = Screen::standard($key, $kind)
            ->access(fn (string $permission, Request $request, ?Model $record): bool => Gate::forUser($request->user())
                ->allows($permission, $record === null ? [] : [$record]));

        return app(ScreenExtensions::class)->resolve($screen, $this);
    }
}
