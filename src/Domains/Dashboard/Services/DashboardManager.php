<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Resources\DashboardResource;
use RefactorCircus\Keystone\Auth\Authorizer;
use RefactorCircus\Keystone\Packages\PackageRegistry;

class DashboardManager
{
    public function __construct(
        protected PlacementResolver $placements,
        protected PackageRegistry $packages,
    ) {}

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
     * The dashboard with the given slug among those the request's user may
     * view. Slugs are not unique across owners, so the slug is looked up
     * there rather than across every dashboard; the user's own comes before a
     * shared one.
     */
    public function findVisible(Request $request, string $slug): ?DashboardModel
    {
        return DashboardModel::query()
            ->visibleTo($this->owner($request))
            ->where('slug', $slug)
            ->orderBy('is_shared')
            ->orderBy('id')
            ->first();
    }

    /**
     * The dashboard to show when none is specified: the default, else the
     * first. Null when the user has none; reading never creates one.
     */
    public function current(Request $request): ?DashboardModel
    {
        $dashboards = $this->visible($request);

        return $dashboards->firstWhere('is_default', true) ?? $dashboards->first();
    }

    /**
     * The dashboard as the API sends it: with its placements and their data,
     * and what the request's user may do to it in `meta.abilities`.
     */
    public function resource(DashboardModel $dashboard, Request $request): DashboardResource
    {
        $dashboard->load('widgets');

        return DashboardResource::make($dashboard, $this->placements->eager($dashboard, $request))
            ->additional(['meta' => ['abilities' => $this->abilities($dashboard, $request)]]);
    }

    /**
     * What the request's user may do to the dashboard, as the requests that
     * change it decide: through the dashboard policy from `atrium.policies`.
     *
     * @return array{update: bool, delete: bool}
     */
    public function abilities(DashboardModel $dashboard, Request $request): array
    {
        $authorizer = Authorizer::for($this->packages->forOrFail(self::class));

        return [
            'update' => $authorizer->can($request->user(), 'update', $dashboard),
            'delete' => $authorizer->can($request->user(), 'delete', $dashboard),
        ];
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
