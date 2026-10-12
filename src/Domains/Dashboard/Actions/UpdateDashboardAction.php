<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Actions;

use Illuminate\Support\Facades\DB;
use RefactorCircus\Atrium\Domains\Dashboard\Data\UpdateDashboardData;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatedActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatingActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Keystone\Actions\Action;

class UpdateDashboardAction extends Action
{
    protected function handle(DashboardModel $dashboard, UpdateDashboardData $data): DashboardModel
    {
        DashboardUpdatingActionEvent::dispatch($dashboard, $data);

        $result = $this->perform($dashboard, $data);

        DashboardUpdatedActionEvent::dispatch($result);

        return $result;
    }

    private function perform(DashboardModel $dashboard, UpdateDashboardData $data): DashboardModel
    {
        DB::transaction(function () use ($dashboard, $data): void {
            // Only the fields given: `toArray()` leaves out what is Missing.
            $dashboard->update($data->toArray());
        });

        return $dashboard->refresh();
    }
}
