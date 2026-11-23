<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Navigation\Http\Controllers;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Navigation\Http\Requests\ShowShellRequest;

final class ShellController
{
    public function show(ShowShellRequest $request): JsonResponse
    {
        return $request->persist();
    }
}
