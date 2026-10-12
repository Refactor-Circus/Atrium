<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Facades\Atrium;
use RefactorCircus\Atrium\Support\Tables;
use RefactorCircus\Keystone\Models\Concerns\DispatchesModelEvents;

/**
 * @property int $id
 * @property int $dashboard_id
 * @property string $widget_key
 * @property int $grid_row
 * @property int $grid_column
 * @property int $grid_width
 * @property int $grid_height
 * @property int $sort
 * @property array<string, mixed>|null $settings
 */
class DashboardWidgetModel extends Model
{
    use DispatchesModelEvents;

    protected $guarded = [];

    protected $casts = [
        'settings' => 'array',
        'grid_row' => 'integer',
        'grid_column' => 'integer',
        'grid_width' => 'integer',
        'grid_height' => 'integer',
        'sort' => 'integer',
    ];

    public function getTable(): string
    {
        return Tables::name('dashboard_widgets');
    }

    /**
     * @return BelongsTo<DashboardModel, $this>
     */
    public function dashboard(): BelongsTo
    {
        return $this->belongsTo(DashboardModel::class, 'dashboard_id');
    }

    /**
     * The registered definition for this placement.
     *
     * Returns null when the plugin that provided the widget is no longer
     * installed, so a removed plugin cannot break an existing dashboard.
     */
    public function definition(): ?WidgetDefinition
    {
        return Atrium::widgetRegistry()->get($this->widget_key);
    }

    public function isOrphaned(): bool
    {
        return $this->definition() === null;
    }
}
