<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Resources;

use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Keystone\Http\Resources\JsonResource;

/**
 * One widget placed on a dashboard, named by its `uuid`.
 *
 * `data` is present only when the placement's data was resolved for this
 * payload: inline for a widget that is not lazy (null for an orphaned one,
 * or one the user may not see), and from `atrium.dashboards.widgets.show`
 * for a lazy one. A lazy placement on the dashboard has no `data` key at
 * all. `error` is present only when resolving failed and was isolated.
 *
 * An orphaned placement (its widget no longer registered) has a null
 * `component`, `title` and `icon`, and is never lazy.
 *
 * @mixin DashboardWidgetModel
 */
final class DashboardWidgetResource extends JsonResource
{
    /**
     * @param  DashboardWidgetModel  $resource
     * @param  array{data: array<array-key, mixed>|null, error?: array{message: string}}|null  $resolved  the placement's data, or null when it is not sent
     */
    public function __construct($resource, private readonly ?array $resolved = null)
    {
        parent::__construct($resource);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $definition = $this->definition();

        $placement = [
            'uuid' => $this->uuid,
            'key' => $this->widget_key,
            'component' => $definition?->component,
            'title' => $definition?->label,
            'icon' => $definition?->icon,
            'lazy' => $definition !== null && $definition->lazy,
            'grid' => [
                'row' => $this->grid_row,
                'column' => $this->grid_column,
                'width' => $this->grid_width,
                'height' => $this->grid_height,
            ],
            'settings' => self::object($this->settings ?? []),
        ];

        if ($this->resolved === null) {
            return $placement;
        }

        $placement['data'] = $this->resolved['data'] === null ? null : self::object($this->resolved['data']);

        if (isset($this->resolved['error'])) {
            $placement['error'] = $this->resolved['error'];
        }

        return $placement;
    }

    /**
     * An empty array as `{}`, so a widget's settings and data are always a
     * JSON object.
     *
     * @param  array<array-key, mixed>  $value
     * @return array<array-key, mixed>|object
     */
    private static function object(array $value): array|object
    {
        return $value === [] ? (object) [] : $value;
    }
}
