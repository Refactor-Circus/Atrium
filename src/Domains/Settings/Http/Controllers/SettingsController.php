<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Settings\Http\Controllers;

use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;

class SettingsController
{
    public function __construct(
        protected SettingsRegistry $settings,
        protected ScreenExtensions $screens,
    ) {}

    public function index(Request $request): View
    {
        /** @var view-string $view */
        $view = 'atrium::settings.index';

        return view($view, [
            'resolved' => $this->screens->resolve(Screen::standard('atrium.settings', Screen::LIST), $request),
            'panels' => $this->settings->panels($request),
        ]);
    }

    public function show(Request $request, string $panel): View
    {
        $found = $this->settings->find($request, $panel);

        abort_if($found === null, 404);

        // A panel is not a model, so the screen has no record.
        $screen = Screen::standard('atrium.settings-panel', Screen::DETAIL);

        /** @var view-string $view */
        $view = 'atrium::settings.show';

        return view($view, [
            'resolved' => $this->screens->resolve($screen, $request),
            'panels' => $this->settings->panels($request),
            'panel' => $found,
        ]);
    }
}
