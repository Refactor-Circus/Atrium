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
     * A placement has its own `data` key, so Laravel would otherwise take it
     * for the response wrapper and leave the placement unwrapped.
     */
    public static bool $forceWrapping = true;

    /**
     * The placement's data, or null when it is not sent.
     *
     * @var array{data: array<array-key, mixed>|null, error?: array{message: string}}|null
     */
    private ?array $resolved = null;

    /**
     * Send the placement with its resolved data (and its isolated `error`,
     * if any). Null sends no `data` key.
     *
     * @param  array{data: array<array-key, mixed>|null, error?: array{message: string}}|null  $resolved
     */
    public function data(?array $resolved): static
    {
        $this->resolved = $resolved;

        return $this;
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
