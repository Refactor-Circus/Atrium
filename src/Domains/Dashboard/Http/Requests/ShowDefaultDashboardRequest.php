<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Requests;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Services\DashboardManager;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * The user's default dashboard, else their first, as `show` sends it.
 *
 * A user with none gets `{"data": null}`: reading never creates a dashboard.
 * The client creates the first one with `atrium.dashboards.store`.
 */
final class ShowDefaultDashboardRequest extends Request
{
    public function authorize(): bool
    {
        return $this->allows('viewAny', DashboardModel::class);
    }

    public function persist(): JsonResponse
    {
        $manager = app(DashboardManager::class);
        $dashboard = $manager->current($this);

        if ($dashboard === null) {
            return new JsonResponse(['data' => null]);
        }

        return $manager->resource($dashboard, $this)->response($this);
    }
}
