<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Data;

use RefactorCircus\Keystone\Data\Attributes\ListOf;
use RefactorCircus\Keystone\Data\Data;

/**
 * Input for SaveDashboardLayoutAction: the dashboard's widget placements, in
 * order, each a WidgetPlacementData.
 */
final readonly class SaveDashboardLayoutData extends Data
{
    /**
     * @param  array<int, WidgetPlacementData>  $widgets
     */
    public function __construct(
        #[ListOf(WidgetPlacementData::class)]
        public array $widgets = [],
    ) {}

    /**
     * The placements are checked here, under `widgets.*`, so each is built
     * from what was validated.
     *
     * @return array<string, array<int, mixed>>
     */
    public static function rules(): array
    {
        $rules = ['widgets' => ['array']];

        foreach (WidgetPlacementData::rules() as $key => $rule) {
            $rules['widgets.*.'.$key] = $rule;
        }

        return $rules;
    }
}
