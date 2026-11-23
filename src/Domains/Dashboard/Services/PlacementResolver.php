<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Services;

use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Exceptions\UnserializableDataException;
use RefactorCircus\Atrium\Support\JsonData;

/**
 * Resolves the data a dashboard's placements send, before their resource is
 * built.
 *
 * A placement that is not lazy sends its data with the dashboard, through
 * JsonData::resolve(): outside `local` and `testing` a failing resolver is
 * reported and that placement alone gets `data: null` and an `error`. A lazy
 * placement sends nothing with the dashboard and is fetched on its own,
 * where a failure fails only that response.
 */
final class PlacementResolver
{
    /**
     * The data each placement that is not lazy sends with the dashboard, by
     * uuid. An orphaned placement, or one whose widget the user may not see,
     * sends null. Reads the dashboard's loaded `widgets`.
     *
     * @return array<string, array{data: array<array-key, mixed>|null, error?: array{message: string}}>
     */
    public function eager(DashboardModel $dashboard, Request $request): array
    {
        $resolved = [];

        foreach ($dashboard->widgets as $placement) {
            $definition = $placement->definition();

            if ($definition !== null && $definition->lazy) {
                continue;
            }

            $resolved[$placement->uuid] = $definition === null || ! $definition->isAuthorized($request)
                ? ['data' => null]
                : JsonData::resolve("Widget [{$definition->key}]", fn (): array => $definition->resolveData($placement->settings ?? []));
        }

        return $resolved;
    }

    /**
     * One placement's data, fetched on its own. The caller has checked the
     * placement has a definition the user may see.
     *
     * @return array{data: array<array-key, mixed>}
     *
     * @throws UnserializableDataException
     */
    public function one(DashboardWidgetModel $placement): array
    {
        $definition = $placement->definition();

        if ($definition === null) {
            return ['data' => []];
        }

        return ['data' => JsonData::check($definition->resolveData($placement->settings ?? []), "Widget [{$definition->key}]")];
    }
}
