<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Resources;

use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Keystone\Http\Resources\JsonResource;

/**
 * A dashboard, named by its slug. Its placements are included when loaded,
 * as on a single dashboard; the list leaves them out.
 *
 * The placements' data is resolved before the resource is built and handed
 * in by uuid (see DashboardManager::resource()), so the resource never runs a
 * resolver or reads the request. What the user may do to the dashboard goes
 * in the response's `meta.abilities`, never in the resource.
 *
 * @mixin DashboardModel
 */
final class DashboardResource extends JsonResource
{
    /**
     * @param  DashboardModel  $resource
     * @param  array<string, array{data: array<array-key, mixed>|null, error?: array{message: string}}>  $resolved  each placement's data, by uuid, for the placements that send it
     */
    public function __construct($resource, private readonly array $resolved = [])
    {
        parent::__construct($resource);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->name,
            'is_default' => $this->is_default,
            'version' => $this->version,
            'widgets' => $this->whenLoaded('widgets', fn (): array => $this->widgets
                ->map(fn (DashboardWidgetModel $placement): array => new DashboardWidgetResource($placement, $this->resolved[$placement->uuid] ?? null)->resolve($request))
                ->all()),
        ];
    }
}
