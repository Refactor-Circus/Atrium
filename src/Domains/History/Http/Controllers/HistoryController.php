<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\History\Http\Controllers;

use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use RefactorCircus\Keystone\Audit\History;
use RefactorCircus\Keystone\Packages\PackageRegistry;

/**
 * One package's audit log: its entries, newest first, filtered by action or
 * record, a page at a time. Answers 404 until an audit log is installed, and
 * 403 to those the package's history endpoint would refuse.
 */
class HistoryController
{
    public function __invoke(Request $request, string $package, PackageRegistry $packages, History $history): View
    {
        $resolved = $packages->find($package);

        // Only while the package audits: Keen installed, its `audit.enabled` on.
        abort_if($resolved === null || ! $resolved->audits(), 404);

        $filters = $request->validate(History::rules());

        abort_unless($history->allows($resolved, $request->user(), $filters), 403);

        /** @var view-string $view */
        $view = 'atrium::history.show';

        return view($view, [
            'package' => $resolved,
            'filters' => $filters,
            'page' => $history->page($resolved, $filters),
        ]);
    }
}
