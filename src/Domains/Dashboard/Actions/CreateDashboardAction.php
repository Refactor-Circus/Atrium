<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Actions;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use RefactorCircus\Atrium\Domains\Dashboard\Data\CreateDashboardData;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardCreatedActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardCreatingActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Keystone\Actions\Action;

class CreateDashboardAction extends Action
{
    protected function handle(CreateDashboardData $data, ?Model $owner = null): DashboardModel
    {
        DashboardCreatingActionEvent::dispatch($data, $owner);

        $dashboard = $this->perform($data, $owner);

        DashboardCreatedActionEvent::dispatch($dashboard);

        return $dashboard;
    }

    private function perform(CreateDashboardData $data, ?Model $owner): DashboardModel
    {
        return DB::transaction(function () use ($data, $owner): DashboardModel {
            $shared = $data->isShared;

            return DashboardModel::query()->create([
                'name' => $data->name,
                'owner_type' => $shared ? null : $owner?->getMorphClass(),
                'owner_id' => $shared ? null : $owner?->getKey(),
                'is_shared' => $shared,
            ]);
        });
    }
}
