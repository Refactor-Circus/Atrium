<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Actions\Concerns;

use Illuminate\Validation\ValidationException;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Keystone\Data\Missing;

/**
 * The optimistic lock on a dashboard: every layout or meta change moves its
 * `version` on, and a change made from a version the dashboard no longer has
 * is refused, so a stale client cannot overwrite a newer layout.
 *
 * Call it inside the action's transaction, before the change.
 */
trait ClaimsDashboardVersion
{
    /**
     * Move the dashboard version on in one conditional update, so two
     * changes from the same version cannot both pass. Without an expected
     * version (code that vouches for the dashboard's state) the move is
     * unconditional.
     *
     * @throws ValidationException with status 409, keyed `version`, when the dashboard changed since that version
     */
    private function claimVersion(DashboardModel $dashboard, int|Missing $expected): void
    {
        $query = DashboardModel::query()->whereKey($dashboard->getKey());

        if (is_int($expected)) {
            $query->where('version', $expected);
        }

        if ($query->increment('version') === 0) {
            throw ValidationException::withMessages([
                'version' => 'The dashboard has changed since it was loaded. Reload it and try again.',
            ])->status(409);
        }
    }
}
