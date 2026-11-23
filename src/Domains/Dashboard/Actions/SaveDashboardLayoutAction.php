<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RefactorCircus\Atrium\Domains\Dashboard\Data\SaveDashboardLayoutData;
use RefactorCircus\Atrium\Domains\Dashboard\Data\WidgetPlacementData;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavedActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavingActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Keystone\Actions\Action;
use RefactorCircus\Keystone\Data\Missing;

class SaveDashboardLayoutAction extends Action
{
    /**
     * Replace a dashboard's layout with the given one.
     *
     * The layout is the full layout. A placement it names by `uuid` is
     * updated in place, one without a uuid is created, and a placement it
     * leaves out is deleted - unless it is orphaned (its widget is no longer
     * registered), so a plugin that is disabled for a while gets its
     * placements back. The save moves the dashboard version on, after
     * checking it against the one the layout was made from.
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

            $existing = $dashboard->widgets()->get()->keyBy('uuid');
            $widgets = array_values($data->widgets);

            $kept = array_filter(array_map(
                fn (WidgetPlacementData $widget): ?string => $widget->uuid !== null && $existing->has($widget->uuid) ? $widget->uuid : null,
                $widgets,
            ));

            // Delete, then update, then create.
            foreach ($existing->except($kept) as $placement) {
                if (! $placement->isOrphaned()) {
                    $placement->delete();
                }
            }

            foreach ($widgets as $index => $widget) {
                if ($widget->uuid !== null && in_array($widget->uuid, $kept, true)) {
                    // A placement keeps the widget it was made for.
                    $existing->get($widget->uuid)?->update($this->attributes($widget, $index));
                }
            }

            foreach ($widgets as $index => $widget) {
                if ($widget->uuid === null || ! in_array($widget->uuid, $kept, true)) {
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

    /**
     * Move the dashboard version on, in one conditional update, so two saves
     * from the same version cannot both pass. Without an expected version the
     * move is unconditional.
     *
     * @throws ValidationException with status 409
     */
    private function claimVersion(DashboardModel $dashboard, int|Missing $expected): void
    {
        $query = DashboardModel::query()->whereKey($dashboard->getKey());

        if (is_int($expected)) {
            $query->where('version', $expected);
        }

        if ($query->increment('version') === 0) {
            throw ValidationException::withMessages([
                'version' => 'The dashboard has changed since it was loaded. Reload it and try again.',
            ])->status(409);
        }
    }
}
