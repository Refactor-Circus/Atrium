<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Actions;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\Concerns\ClaimsDashboardVersion;
use RefactorCircus\Atrium\Domains\Dashboard\Data\UpdateDashboardData;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatedActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatingActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Keystone\Actions\Action;

class UpdateDashboardAction extends Action
{
    use ClaimsDashboardVersion;

    /**
     * Change a dashboard's name or default flag, moving its version on after
     * checking it against the one the change was made from.
     *
     * @throws ValidationException with status 409, keyed `version`, when the dashboard changed since that version
     */
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
            $this->claimVersion($dashboard, $data->version);

            // Only the fields given: `toArray()` leaves out what is Missing.
            // The version is checked, never written as given.
            $dashboard->update(Arr::except($data->toArray(), ['version']));
        });

        return $dashboard->refresh();
    }
}
