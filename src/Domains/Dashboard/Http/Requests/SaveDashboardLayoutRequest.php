<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Requests;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\SaveDashboardLayoutAction;
use RefactorCircus\Atrium\Domains\Dashboard\Data\SaveDashboardLayoutData;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Http\Requests\Request;

class SaveDashboardLayoutRequest extends Request
{
    /**
     * Saving replaces every placement: it needs `update` on the dashboard,
     * `delete` on each placement it removes, and `create` on placements when
     * it adds any.
     */
    public function authorize(): bool
    {
        $dashboard = $this->dashboard();
        $submitted = $this->input('widgets');

        return $this->allows('update', $dashboard)
            && $this->allowsEach('delete', $dashboard->widgets()->get())
            && (! is_array($submitted) || $submitted === [] || $this->allows('create', DashboardWidgetModel::class, [$dashboard]));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return SaveDashboardLayoutData::rules();
    }

    public function persist(): JsonResponse
    {
        $dashboard = app(SaveDashboardLayoutAction::class)->execute(
            $this->dashboard(),
            SaveDashboardLayoutData::fromValidated(['widgets' => $this->placements()]),
        );

        return response()->json([
            'data' => ['saved' => $dashboard->widgets()->count()],
        ]);
    }

    /**
     * Drop placements for widgets this request may not place, so an
     * uninstalled or unauthorized widget cannot be persisted.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function placements(): array
    {
        $available = app(WidgetRegistry::class)->available($this);

        /** @var array<int, array<string, mixed>> $submitted */
        $submitted = $this->validated()['widgets'] ?? [];

        return array_values(array_filter(
            $submitted,
            fn (array $widget): bool => isset($available[$widget['widget_key']]),
        ));
    }

    protected function dashboard(): DashboardModel
    {
        $dashboard = $this->route('dashboard');

        abort_unless($dashboard instanceof DashboardModel, 404);

        return $dashboard;
    }
}
