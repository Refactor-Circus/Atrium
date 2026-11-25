<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\Concerns\ClaimsDashboardVersion;
use RefactorCircus\Atrium\Domains\Dashboard\Data\SaveDashboardLayoutData;
use RefactorCircus\Atrium\Domains\Dashboard\Data\WidgetPlacementData;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavedActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavingActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Keystone\Actions\Action;

class SaveDashboardLayoutAction extends Action
{
    use ClaimsDashboardVersion;

    /**
     * Replace a dashboard's layout with the given one.
     *
     * The layout is the full layout. A placement it names by `uuid` is
     * updated in place, one without a uuid (or with one the dashboard does
     * not have) is created, and a placement it leaves out is deleted - unless
     * it is orphaned (its widget is no longer registered), so a plugin that
     * is disabled for a while gets its placements back. The save moves the
     * dashboard version on, after checking it against the one the layout was
     * made from. All of it runs in one transaction: a failure part way leaves
     * the old placements as they were.
     *
     * @throws ValidationException with status 409, keyed `version`, when the dashboard changed since that version
     */
    protected function handle(DashboardModel $dashboard, SaveDashboardLayoutData $data): DashboardModel
    {
        DashboardLayoutSavingActionEvent::dispatch($dashboard, $data);

        $result = $this->perform($dashboard, $data);

        DashboardLayoutSavedActionEvent::dispatch($result, array_map(
            fn (WidgetPlacementData $widget): string => $widget->widgetKey,
            array_values($data->widgets),
        ));

        return $result;
    }

    private function perform(DashboardModel $dashboard, SaveDashboardLayoutData $data): DashboardModel
    {
        DB::transaction(function () use ($dashboard, $data): void {
            $this->claimVersion($dashboard, $data->version);

            /** @var array<string, DashboardWidgetModel> $existing */
            $existing = $dashboard->widgets()->get()->keyBy('uuid')->all();
            $widgets = array_values($data->widgets);

            $kept = [];

            foreach ($widgets as $widget) {
                if ($widget->uuid !== null && isset($existing[$widget->uuid])) {
                    $kept[$widget->uuid] = true;
                }
            }

            // Delete, then update, then create.
            foreach ($existing as $uuid => $placement) {
                if (! isset($kept[$uuid]) && ! $placement->isOrphaned()) {
                    $placement->delete();
                }
            }

            foreach ($widgets as $index => $widget) {
                if ($widget->uuid !== null && isset($kept[$widget->uuid])) {
                    // A placement keeps the widget it was made for.
                    $existing[$widget->uuid]->update($this->attributes($widget, $index));
                }
            }

            foreach ($widgets as $index => $widget) {
                if ($widget->uuid === null || ! isset($kept[$widget->uuid])) {
                    $dashboard->widgets()->create(['widget_key' => $widget->widgetKey, ...$this->attributes($widget, $index)]);
                }
            }
        });

        return $dashboard->refresh();
    }

    /**
     * Where the placement sits, in payload order, and its settings.
     *
     * @return array<string, mixed>
     */
    private function attributes(WidgetPlacementData $widget, int $index): array
    {
        return [
            'grid_row' => $widget->gridRow,
            'grid_column' => $widget->gridColumn,
            'grid_width' => $widget->gridWidth,
            'grid_height' => $widget->gridHeight,
            'settings' => $widget->settings,
            'sort' => $index,
        ];
    }
}
