<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Dashboard\Services\DashboardManager;

/**
 * Renders one placed widget's body, for widgets defined `->lazy()`. It
 * answers whoever may see the dashboard the widget is on, as the dashboard
 * page does, behind the same route gate.
 */
class DashboardWidgetController
{
    public function __construct(protected DashboardManager $dashboards) {}

    public function show(Request $request, DashboardModel $dashboard, DashboardWidgetModel $widget): Response
    {
        abort_unless($this->dashboards->isVisible($request, $dashboard), 404);

        $definition = $widget->definition();

        abort_if($definition === null, 404);

        /** @var view-string $view */
        $view = 'atrium::dashboard.widget-body';

        return response(view($view, ['placement' => $widget, 'definition' => $definition])->render());
    }
}
