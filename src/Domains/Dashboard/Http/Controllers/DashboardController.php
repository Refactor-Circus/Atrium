<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\DeleteDashboardRequest;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\IndexDashboardRequest;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\ShowDashboardRequest;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\ShowDefaultDashboardRequest;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\StoreDashboardRequest;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\UpdateDashboardRequest;

final class DashboardController
{
    public function default(ShowDefaultDashboardRequest $request): JsonResponse
    {
        return $request->persist();
    }

    public function index(IndexDashboardRequest $request): JsonResponse
    {
        return $request->persist();
    }

    public function show(ShowDashboardRequest $request): JsonResponse
    {
        return $request->persist();
    }

    public function store(StoreDashboardRequest $request): JsonResponse
    {
        return $request->persist();
    }

    public function update(UpdateDashboardRequest $request): JsonResponse
    {
        return $request->persist();
    }

    public function destroy(DeleteDashboardRequest $request): Response
    {
        return $request->persist();
    }
}
