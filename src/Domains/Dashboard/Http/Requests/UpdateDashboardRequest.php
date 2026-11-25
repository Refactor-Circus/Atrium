<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Requests;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\UpdateDashboardAction;
use RefactorCircus\Atrium\Domains\Dashboard\Data\UpdateDashboardData;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\Concerns\ResolvesRouteDashboard;
use RefactorCircus\Atrium\Domains\Dashboard\Services\DashboardManager;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * Renames a dashboard or makes it the default. The client sends the
 * `version` it loaded; a dashboard changed since answers 409.
 */
final class UpdateDashboardRequest extends Request
{
    use ResolvesRouteDashboard;

    public function authorize(): bool
    {
        return $this->allows('update', $this->dashboard());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return UpdateDashboardData::rules();
    }

    public function persist(): JsonResponse
    {
        $dashboard = app(UpdateDashboardAction::class)->execute(
            $this->dashboard(),
            UpdateDashboardData::fromValidated($this->validated()),
        );

        return app(DashboardManager::class)->resource($dashboard, $this)->response($this);
    }
}
