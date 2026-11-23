<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Data;

use Illuminate\Validation\Rule;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Support\Tables;
use RefactorCircus\Keystone\Data\Data;

/**
 * One widget placement of a SaveDashboardLayoutData: the widget it places,
 * where on the grid, and the widget's own settings.
 *
 * `uuid` names a placement the dashboard already has, which is then updated
 * in place. A placement without one is new.
 */
final readonly class WidgetPlacementData extends Data
{
    /**
     * @param  array<string, mixed>|null  $settings
     */
    public function __construct(
        public string $widgetKey,
        public int $gridRow = 0,
        public int $gridColumn = 0,
        public int $gridWidth = 4,
        public int $gridHeight = 2,
        public ?array $settings = null,
        public ?string $uuid = null,
    ) {}

    /**
     * With the dashboard being laid out, a `uuid` must name one of its own
     * placements.
     *
     * @return array<string, array<int, mixed>>
     */
    public static function rules(?DashboardModel $dashboard = null): array
    {
        $uuid = ['sometimes', 'nullable', 'string', 'uuid'];

        if ($dashboard !== null) {
            $uuid[] = Rule::exists(Tables::qualified('dashboard_widgets'), 'uuid')->where('dashboard_id', $dashboard->getKey());
        }

        return [
            'uuid' => $uuid,
            'widget_key' => ['required', 'string'],
            'grid_row' => ['integer', 'min:0'],
            'grid_column' => ['integer', 'min:0'],
            'grid_width' => ['integer', 'min:1'],
            'grid_height' => ['integer', 'min:1'],
            'settings' => ['array'],
        ];
    }
}
