<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Widgets\Http\Controllers;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Widgets\Http\Requests\IndexWidgetRequest;

final class WidgetController
{
    public function index(IndexWidgetRequest $request): JsonResponse
    {
        return $request->persist();
    }
}
