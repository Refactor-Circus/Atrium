<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Policies;

use Illuminate\Database\Eloquent\Model;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Keystone\Policies\Policy as BasePolicy;

/**
 * Shared checks for the bundled policies.
 *
 * Each policy is registered from `atrium.policies`, so an application swaps
 * one by pointing its model at another class there. A model that lives on
 * a dashboard follows whichever dashboard policy is registered through
 * `allowsOn()` (refactor-circus/keystone's Policy).
 */
abstract class Policy extends BasePolicy
{
    /**
     * Whether the user is the dashboard's owner.
     */
    protected function owns(Model $user, DashboardModel $dashboard): bool
    {
        return $dashboard->isOwnedBy($user);
    }
}
