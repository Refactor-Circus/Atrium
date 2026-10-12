<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Data;

use RefactorCircus\Keystone\Data\Data;

/**
 * One widget placement of a SaveDashboardLayoutData: the widget it places,
 * where on the grid, and the widget's own settings.
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
    ) {}

    /**
     * @return array<string, array<int, mixed>>
     */
    public static function rules(): array
    {
        return [
            'widget_key' => ['required', 'string'],
            'grid_row' => ['integer', 'min:0'],
            'grid_column' => ['integer', 'min:0'],
            'grid_width' => ['integer', 'min:1'],
            'grid_height' => ['integer', 'min:1'],
            'settings' => ['array'],
        ];
    }
}
