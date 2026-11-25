<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Requests;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\SaveDashboardLayoutAction;
use RefactorCircus\Atrium\Domains\Dashboard\Data\SaveDashboardLayoutData;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\Concerns\ResolvesRouteDashboard;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Dashboard\Services\DashboardManager;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * Saves the dashboard's full layout and answers with the dashboard as it now
 * stands, so the client renders new placements with their data and uuids.
 *
 * Placements are named by `uuid`, which must be one of this dashboard's; one
 * without a uuid is new. The client sends the `version` it loaded; a
 * dashboard changed since answers 409.
 */
final class SaveDashboardLayoutRequest extends Request
{
    use ResolvesRouteDashboard;

    /**
     * Saving replaces every placement: it needs `update` on the dashboard,
     * `delete` on each placement it may remove, and `create` on placements
     * when it adds any.
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
        return SaveDashboardLayoutData::rules($this->dashboard());
    }

    public function persist(): JsonResponse
    {
        $dashboard = app(SaveDashboardLayoutAction::class)->execute(
            $this->dashboard(),
            SaveDashboardLayoutData::fromValidated([...$this->validated(), 'widgets' => $this->placements()]),
        );

        return app(DashboardManager::class)->resource($dashboard, $this)->response($this);
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
        $submitted = $this->validated('widgets', []);

        return array_values(array_filter(
            $submitted,
            fn (array $widget): bool => is_string($widget['widget_key'] ?? null) && isset($available[$widget['widget_key']]),
        ));
    }
}
