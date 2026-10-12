<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers;

use Illuminate\Contracts\View\View;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\CreateDashboardAction;
use RefactorCircus\Atrium\Domains\Dashboard\Data\CreateDashboardData;
use RefactorCircus\Atrium\Domains\Dashboard\Services\DashboardManager;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;

class DashboardController
{
    public function __construct(
        protected DashboardManager $dashboards,
        protected WidgetRegistry $widgets,
    ) {}

    public function index(Request $request): View
    {
        return $this->render($request, null);
    }

    /**
     * The parameter is a slug rather than `{dashboard}`, which is bound to the
     * model by id for the routes that change a dashboard.
     */
    public function show(Request $request, string $slug): View
    {
        return $this->render($request, $slug);
    }

    protected function render(Request $request, ?string $slug): View
    {
        // Fetched once: the switcher lists them and the current one is among them.
        $dashboards = $this->dashboards->visible($request);
        $current = $this->dashboards->pick($dashboards, $slug);

        abort_if($slug !== null && $current === null, 404);

        // A signed-in user with no dashboard yet gets one, so the widget
        // picker is reachable on a first visit rather than dead-ending on an
        // empty state. The dashboard is created empty; no widget is placed.
        if ($current === null && $request->user() !== null) {
            $current = app(CreateDashboardAction::class)->execute(
                new CreateDashboardData(__('atrium::atrium.dashboard')),
                $this->dashboards->owner($request),
            );

            // There were none to see, so the new one is the only one - when
            // it has an owner to be visible to.
            if ($this->dashboards->owner($request) !== null) {
                $dashboards = new Collection([$current]);
            }
        }

        /** @var view-string $view */
        $view = 'atrium::dashboard.index';

        return view($view, [
            'dashboards' => $dashboards,
            'dashboard' => $current,
            'placements' => $current === null ? collect() : $current->widgets,
            'available' => $this->widgets->available($request),
            'editable' => $current !== null && $this->dashboards->canModify($request, $current),
        ]);
    }
}
