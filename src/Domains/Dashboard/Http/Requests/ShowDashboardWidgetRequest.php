<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Requests;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\Concerns\ResolvesRouteDashboard;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Dashboard\Resources\DashboardWidgetResource;
use RefactorCircus\Atrium\Domains\Dashboard\Services\PlacementResolver;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * One placement with its data, for widgets defined `->lazy()`. The
 * `{widget:uuid}` is bound through the dashboard it is on, so a placement on
 * another dashboard is not found. An orphaned placement, or one whose widget
 * the user may not see, is not found either.
 *
 * A failing resolver fails this response alone, never the dashboard's.
 */
final class ShowDashboardWidgetRequest extends Request
{
    use ResolvesRouteDashboard;

    public function authorize(): bool
    {
        return $this->allows('view', $this->widget());
    }

    public function persist(): JsonResponse
    {
        $widget = $this->widget();
        $definition = $widget->definition();

        abort_if($definition === null || ! $definition->isAuthorized($this), 404);

        return new DashboardWidgetResource($widget)->data(app(PlacementResolver::class)->one($widget))->response($this);
    }

    protected function widget(): DashboardWidgetModel
    {
        $widget = $this->route('widget');

        abort_unless($widget instanceof DashboardWidgetModel && (string) $widget->dashboard_id === (string) $this->dashboard()->getKey(), 404);

        return $widget;
    }
}
