<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Widgets\Http\Requests;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Widgets\Http\Resources\WidgetDefinitionResource;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * The widgets the user may place: the picker's catalogue. Listing them
 * places none.
 */
final class IndexWidgetRequest extends Request
{
    /**
     * Widgets are placed on dashboards, so whoever may list dashboards may
     * see what can go on them.
     */
    public function authorize(): bool
    {
        return $this->allows('viewAny', DashboardModel::class);
    }

    public function persist(): JsonResponse
    {
        return WidgetDefinitionResource::collection(array_values(app(WidgetRegistry::class)->available($this)))->response($this);
    }
}
