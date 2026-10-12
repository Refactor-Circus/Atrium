<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;

class DashboardManager
{
    /**
     * Dashboards the request's user may view: their own, plus shared ones.
     *
     * @return Collection<int, DashboardModel>
     */
    public function visible(Request $request): Collection
    {
        return DashboardModel::query()
            ->visibleTo($this->owner($request))
            ->orderBy('sort')
            ->orderBy('name')
            ->get();
    }

    /**
     * Whether the request may see the given dashboard: it is the user's own
     * or a shared one, as visible() lists them.
     */
    public function isVisible(Request $request, DashboardModel $dashboard): bool
    {
        return DashboardModel::query()
            ->visibleTo($this->owner($request))
            ->whereKey($dashboard->getKey())
            ->exists();
    }

    /**
     * The dashboard to show when none is specified.
     */
    public function current(Request $request, ?string $slug = null): ?DashboardModel
    {
        return $this->pick($this->visible($request), $slug);
    }

    /**
     * The dashboard to show from those already fetched: the one with the
     * given slug, else the default, else the first.
     *
     * @param  Collection<int, DashboardModel>  $dashboards
     */
    public function pick(Collection $dashboards, ?string $slug = null): ?DashboardModel
    {
        if ($slug !== null) {
            return $dashboards->firstWhere('slug', $slug);
        }

        return $dashboards->firstWhere('is_default', true) ?? $dashboards->first();
    }

    /**
     * Whether the request's user may modify the given dashboard, as the
     * dashboard policy from `atrium.policies` decides.
     */
    public function canModify(Request $request, DashboardModel $dashboard): bool
    {
        return Gate::forUser($request->user())->allows('update', $dashboard);
    }

    /**
     * The model whose dashboards a request operates on, when the request has
     * an authenticated user backed by a model.
     */
    public function owner(Request $request): ?Model
    {
        $user = $request->user();

        return $user instanceof Model ? $user : null;
    }
}
