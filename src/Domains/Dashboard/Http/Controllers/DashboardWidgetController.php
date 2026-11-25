<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\ShowDashboardWidgetRequest;

final class DashboardWidgetController
{
    public function show(ShowDashboardWidgetRequest $request): JsonResponse
    {
        return $request->persist();
    }
}
