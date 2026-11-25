<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Resources;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Http\Request;
use Illuminate\JsonSchema\Types\Type;
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
     * A placement as `toArray()` sends it. `data` and `error` are not
     * required: a lazy placement on the dashboard has no `data` key, and only
     * an isolated failure sends `error`.
     *
     * @return array<string, Type>
     */
    public static function schema(JsonSchema $schema): array
    {
        $cell = fn (): Type => $schema->integer()->nullable()->required();

        return [
            'uuid' => $schema->string()->required(),
            'key' => $schema->string()->description('The widget definition key.')->required(),
            'component' => $schema->string()->nullable()->description('The registered component; null for an orphaned placement.')->required(),
            'title' => $schema->string()->nullable()->required(),
            'icon' => $schema->string()->nullable()->description('An Iconify name.')->required(),
            'lazy' => $schema->boolean()->required(),
            'grid' => $schema->object([
                'row' => $cell(),
                'column' => $cell(),
                'width' => $cell(),
                'height' => $cell(),
            ])->required(),
            'settings' => $schema->object()->description('The placement\'s settings, a JSON object.')->required(),
            'data' => $schema->object()->nullable()->description('The resolved data; absent on a lazy placement, null when it failed or is not available.'),
            'error' => $schema->object([
                'message' => $schema->string()->required(),
            ])->description('Present only when resolving failed and was isolated.'),
        ];
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
