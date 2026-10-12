<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Actions;

use Illuminate\Support\Facades\DB;
use RefactorCircus\Atrium\Domains\Dashboard\Data\SaveDashboardLayoutData;
use RefactorCircus\Atrium\Domains\Dashboard\Data\WidgetPlacementData;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavedActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavingActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Keystone\Actions\Action;

class SaveDashboardLayoutAction extends Action
{
    /**
     * Replace a dashboard's widget placements with the given layout.
     *
     * Placements are addressed positionally rather than by id, so the caller
     * sends the layout it wants and the action reconciles.
     */
    protected function handle(DashboardModel $dashboard, SaveDashboardLayoutData $data): DashboardModel
    {
        DashboardLayoutSavingActionEvent::dispatch($dashboard, $data);

        $result = $this->perform($dashboard, $data->widgets);

        DashboardLayoutSavedActionEvent::dispatch($result, array_map(
            fn (WidgetPlacementData $widget): string => $widget->widgetKey,
            array_values($data->widgets),
        ));

        return $result;
    }

    /**
     * @param  array<int, WidgetPlacementData>  $widgets
     */
    private function perform(DashboardModel $dashboard, array $widgets): DashboardModel
    {
        DB::transaction(function () use ($dashboard, $widgets): void {
            $dashboard->widgets()->delete();

            foreach (array_values($widgets) as $index => $widget) {
                $dashboard->widgets()->create([
                    ...$widget->toArray(),
                    'sort' => $index,
                ]);
            }
        });

        return $dashboard->refresh();
    }
}
