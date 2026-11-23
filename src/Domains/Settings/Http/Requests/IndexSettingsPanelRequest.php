<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Settings\Http\Requests;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Http\Resources\ResolvedScreenResource;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanelRow;
use RefactorCircus\Atrium\Domains\Settings\Http\Requests\Concerns\ResolvesSettingsScreen;
use RefactorCircus\Atrium\Domains\Settings\Http\Resources\SettingsPanelResource;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * The panels this user may see, as summaries, with the `atrium.settings`
 * list screen; each panel is a row of it, so its `row.actions` sections are
 * sent per panel key.
 *
 * Panels are registered, not stored, so there is no model to authorize: the
 * route group's `viewAtrium` gate decides, and the panels are filtered for
 * this user.
 */
final class IndexSettingsPanelRequest extends Request
{
    use ResolvesSettingsScreen;

    public function persist(): JsonResponse
    {
        $panels = array_values(app(SettingsRegistry::class)->panels($this));

        $screen = new ResolvedScreenResource($this->resolveScreen('atrium.settings', Screen::LIST))
            ->withRows(array_map(SettingsPanelRow::for(...), $panels));

        return SettingsPanelResource::collection($panels)
            ->additional(['screen' => $screen->resolve($this)])
            ->response();
    }
}
