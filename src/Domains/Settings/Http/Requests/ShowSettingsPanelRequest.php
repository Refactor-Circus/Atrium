<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Settings\Http\Requests;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Http\Resources\ResolvedScreenResource;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Settings\Http\Requests\Concerns\ResolvesSettingsScreen;
use RefactorCircus\Atrium\Domains\Settings\Http\Resources\SettingsPanelResource;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * One panel, as `{key, component, data}`, with the `atrium.settings-panel`
 * detail screen. A panel the user may not see answers 404, as an unknown
 * one does.
 */
final class ShowSettingsPanelRequest extends Request
{
    use ResolvesSettingsScreen;

    public function persist(): JsonResponse
    {
        $panel = $this->panel();

        $screen = new ResolvedScreenResource($this->resolveScreen('atrium.settings-panel', Screen::DETAIL));

        return new SettingsPanelResource($panel)->withData()
            ->additional(['screen' => $screen->resolve($this)])
            ->response();
    }

    protected function panel(): SettingsPanel
    {
        $key = $this->route('panel');
        $panel = is_string($key) ? app(SettingsRegistry::class)->find($this, $key) : null;

        abort_if($panel === null, 404);

        return $panel;
    }
}
