<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Requests;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\CreateDashboardAction;
use RefactorCircus\Atrium\Domains\Dashboard\Data\CreateDashboardData;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Services\DashboardManager;
use RefactorCircus\Atrium\Http\Requests\Request;

final class StoreDashboardRequest extends Request
{
    public function authorize(): bool
    {
        return $this->allows('create', DashboardModel::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return CreateDashboardData::rules();
    }

    public function persist(): JsonResponse
    {
        $manager = app(DashboardManager::class);

        $dashboard = app(CreateDashboardAction::class)->execute(
            CreateDashboardData::fromValidated($this->validated()),
            $manager->owner($this),
        );

        return $manager->resource($dashboard, $this)->response($this)->setStatusCode(201);
    }
}
