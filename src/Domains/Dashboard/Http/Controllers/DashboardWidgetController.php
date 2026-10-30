<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Dashboard\Services\DashboardManager;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;

/**
 * Renders one placed widget's body, for widgets defined `->lazy()`. It
 * answers whoever may see the dashboard the widget is on, as the dashboard
 * page does, behind the same route gate. It is the `atrium.dashboard-widget`
 * screen, with the widget as its record.
 */
class DashboardWidgetController
{
    public function __construct(
        protected DashboardManager $dashboards,
        protected ScreenExtensions $screens,
    ) {}

    public function show(Request $request, DashboardModel $dashboard, DashboardWidgetModel $widget): Response
    {
        abort_unless($this->dashboards->isVisible($request, $dashboard), 404);

        $definition = $widget->definition();

        abort_if($definition === null, 404);

        // Extensions' `permission()`s are Gate abilities, asked about the
        // widget.
        $screen = Screen::standard('atrium.dashboard-widget', Screen::DETAIL)
            ->record($widget)
            ->access(fn (string $permission, Request $request, ?Model $record): bool => Gate::forUser($request->user())
                ->allows($permission, $record ? [$record] : []));

        /** @var view-string $view */
        $view = 'atrium::dashboard.widget-body';

        // `widgetScreen`, not `resolved`: the dashboard page includes the same
        // view inline for widgets that are not lazy, with its own screen in
        // scope as `resolved`.
        return response(view($view, [
            'widgetScreen' => $this->screens->resolve($screen, $request),
            'placement' => $widget,
            'definition' => $definition,
        ])->render());
    }
}
