<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Http\Controllers;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Integrations\Http\Requests\ShowIntegrationScreenRequest;

final class IntegrationScreenController
{
    public function show(ShowIntegrationScreenRequest $request): JsonResponse
    {
        return $request->persist();
    }
}
