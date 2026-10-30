<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Settings\Http\Controllers;

use Illuminate\Contracts\View\View;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanelRow;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;

class SettingsController
{
    public function __construct(
        protected SettingsRegistry $settings,
        protected ScreenExtensions $screens,
    ) {}

    public function index(Request $request): View
    {
        $panels = $this->settings->panels($request);

        /** @var view-string $view */
        $view = 'atrium::settings.index';

        return view($view, [
            'resolved' => $this->screens->resolve($this->access(Screen::standard('atrium.settings', Screen::LIST)), $request),
            'panels' => $panels,
            // Each panel as the model its `row.actions` sections receive.
            'rows' => array_map(SettingsPanelRow::for(...), $panels),
        ]);
    }

    public function show(Request $request, string $panel): View
    {
        $found = $this->settings->find($request, $panel);

        abort_if($found === null, 404);

        // A panel is not a model, so the screen has no record.
        $screen = $this->access(Screen::standard('atrium.settings-panel', Screen::DETAIL));

        /** @var view-string $view */
        $view = 'atrium::settings.show';

        return view($view, [
            'resolved' => $this->screens->resolve($screen, $request),
            'panels' => $this->settings->panels($request),
            'panel' => $found,
        ]);
    }

    /**
     * Extensions' `permission()`s are Gate abilities, asked about the record
     * when there is one.
     */
    protected function access(Screen $screen): Screen
    {
        return $screen->access(fn (string $permission, Request $request, ?Model $record): bool => Gate::forUser($request->user())
            ->allows($permission, $record ? [$record] : []));
    }
}
