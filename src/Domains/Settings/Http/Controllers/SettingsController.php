<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Settings\Http\Controllers;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Settings\Http\Requests\IndexSettingsPanelRequest;
use RefactorCircus\Atrium\Domains\Settings\Http\Requests\ShowSettingsPanelRequest;

final class SettingsController
{
    public function index(IndexSettingsPanelRequest $request): JsonResponse
    {
        return $request->persist();
    }

    public function show(ShowSettingsPanelRequest $request): JsonResponse
    {
        return $request->persist();
    }
}
