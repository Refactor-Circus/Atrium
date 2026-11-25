<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Requests;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Resources\DashboardResource;
use RefactorCircus\Atrium\Domains\Dashboard\Services\DashboardManager;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * The dashboards the user may view, for the switcher: without their
 * placements.
 */
final class IndexDashboardRequest extends Request
{
    public function authorize(): bool
    {
        return $this->allows('viewAny', DashboardModel::class);
    }

    public function persist(): JsonResponse
    {
        return DashboardResource::collection(app(DashboardManager::class)->visible($this))->response($this);
    }
}
