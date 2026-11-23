<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Requests;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\Concerns\ResolvesRouteDashboard;
use RefactorCircus\Atrium\Domains\Dashboard\Services\DashboardManager;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * One dashboard, by slug, with its placements and what the user may do to
 * it.
 */
final class ShowDashboardRequest extends Request
{
    use ResolvesRouteDashboard;

    public function authorize(): bool
    {
        return $this->allows('view', $this->dashboard());
    }

    public function persist(): JsonResponse
    {
        return app(DashboardManager::class)->resource($this->dashboard(), $this)->response($this);
    }
}
