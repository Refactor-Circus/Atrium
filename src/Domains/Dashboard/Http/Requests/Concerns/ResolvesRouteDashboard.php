<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\Concerns;

use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;

/**
 * The `{dashboard:slug}` a request's route bound, for `authorize()` and
 * `persist()` alike. DashboardServiceProvider binds it among the dashboards
 * the user may view.
 */
trait ResolvesRouteDashboard
{
    protected function dashboard(): DashboardModel
    {
        $dashboard = $this->route('dashboard');

        abort_unless($dashboard instanceof DashboardModel, 404);

        return $dashboard;
    }
}
