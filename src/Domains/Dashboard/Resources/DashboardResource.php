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
 * in by uuid with `placementData()` (see DashboardManager::resource()), so
 * the resource never runs a resolver or reads the request. What the user may
 * do to the dashboard goes in the response's `meta.abilities`, never in the
 * resource.
 *
 * @mixin DashboardModel
 */
final class DashboardResource extends JsonResource
{
    /**
     * Each placement's data, by uuid, for the placements that send it.
     *
     * @var array<string, array{data: array<array-key, mixed>|null, error?: array{message: string}}>
     */
    private array $placementData = [];

    /**
     * Send the given data with the placements it names by uuid. A placement
     * left out sends no `data` key.
     *
     * @param  array<string, array{data: array<array-key, mixed>|null, error?: array{message: string}}>  $data
     */
    public function placementData(array $data): static
    {
        $this->placementData = $data;

        return $this;
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
                ->map(fn (DashboardWidgetModel $placement): array => new DashboardWidgetResource($placement)->data($this->placementData[$placement->uuid] ?? null)->resolve($request))
                ->all()),
        ];
    }
}
