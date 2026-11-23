<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\SaveDashboardLayoutRequest;

final class DashboardLayoutController
{
    public function update(SaveDashboardLayoutRequest $request): JsonResponse
    {
        return $request->persist();
    }
}
