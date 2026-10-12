<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Policies;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;

/**
 * Widget placements are dashboard content, so each check defers to the
 * dashboard: reading a placement needs `view` on its dashboard, changing one
 * needs `update`.
 */
class DashboardWidgetPolicy extends Policy
{
    public function viewAny(Model&Authenticatable $user, DashboardModel $dashboard): bool
    {
        return $this->allowsOn($user, 'view', $dashboard);
    }

    public function view(Model&Authenticatable $user, DashboardWidgetModel $widget): bool
    {
        return $this->allowsOn($user, 'view', $widget->dashboard);
    }

    public function create(Model&Authenticatable $user, DashboardModel $dashboard): bool
    {
        return $this->allowsOn($user, 'update', $dashboard);
    }

    public function update(Model&Authenticatable $user, DashboardWidgetModel $widget): bool
    {
        return $this->allowsOn($user, 'update', $widget->dashboard);
    }

    public function delete(Model&Authenticatable $user, DashboardWidgetModel $widget): bool
    {
        return $this->allowsOn($user, 'update', $widget->dashboard);
    }
}
