<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Data;

use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Keystone\Data\Attributes\ListOf;
use RefactorCircus\Keystone\Data\Data;
use RefactorCircus\Keystone\Data\Missing;

/**
 * Input for SaveDashboardLayoutAction: the dashboard's full layout, in
 * order, each placement a WidgetPlacementData, and the dashboard version the
 * layout was made from.
 *
 * The layout replaces the dashboard's: placements it leaves out are deleted,
 * except orphaned ones. A request must send `version`; code that vouches for
 * the dashboard's state may leave it out, and the save is then not checked
 * against it.
 */
final readonly class SaveDashboardLayoutData extends Data
{
    /**
     * @param  array<int, WidgetPlacementData>  $widgets
     */
    public function __construct(
        #[ListOf(WidgetPlacementData::class)]
        public array $widgets = [],
        public int|Missing $version = new Missing,
    ) {}

    /**
     * The placements are checked here, under `widgets.*`, so each is built
     * from what was validated. With the dashboard, each `uuid` must be one of
     * its placements.
     *
     * @return array<string, array<int, mixed>>
     */
    public static function rules(?DashboardModel $dashboard = null): array
    {
        $rules = [
            'widgets' => ['present', 'array'],
            'version' => ['required', 'integer', 'min:1'],
        ];

        foreach (WidgetPlacementData::rules($dashboard) as $key => $rule) {
            $rules['widgets.*.'.$key] = $rule;
        }

        $rules['widgets.*.uuid'][] = 'distinct';

        return $rules;
    }
}
