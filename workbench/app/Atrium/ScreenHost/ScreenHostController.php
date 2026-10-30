<?php

declare(strict_types=1);

namespace Workbench\App\Atrium\ScreenHost;

use Illuminate\Contracts\View\View;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View as Views;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Models\User;

/**
 * A workbench screen that packages extend through `Atrium::screens()`, as a
 * real host would: it authorizes first, declares itself with
 * `Screen::standard()`, resolves its extensions, and renders the tab bar, the
 * open registered tab's panel and every declared slot.
 *
 * `test.host` is a detail screen with a record and `test.list` a list screen
 * with three rows; either takes another screen key as its parameter. Tests
 * shape it through config: `screen-host.tabs` (built-in tabs, as
 * `Screen::tabs()` takes them) and `screen-host.slots` (extra slots the page
 * declares and never renders). Defining the `viewScreenHost` gate makes the
 * host authorize through it.
 */
final class ScreenHostController
{
    /**
     * Load the host's routes and views into an application that has not
     * discovered the workbench, such as a feature test's.
     */
    public static function register(): void
    {
        $workbench = dirname(__DIR__, 3);

        Views::addNamespace('workbench', $workbench.'/resources/views');
        Route::middleware('web')->group($workbench.'/routes/web.php');
        Route::getRoutes()->refreshNameLookups();
    }

    public function detail(Request $request, string $screen = 'test.host'): View
    {
        return $this->show($request, Screen::standard($screen, Screen::DETAIL)->record(self::user(10, 'Host record')), []);
    }

    public function list(Request $request, string $screen = 'test.list'): View
    {
        return $this->show($request, Screen::standard($screen, Screen::LIST), [
            self::user(1, 'Row 1'),
            self::user(2, 'Row 2'),
            self::user(3, 'Row 3'),
        ]);
    }

    /**
     * @param  list<User>  $rows
     */
    private function show(Request $request, Screen $screen, array $rows): View
    {
        // The host's own authorization comes first, so nothing registered
        // runs for a viewer it refuses.
        abort_if(Gate::has('viewScreenHost') && Gate::denies('viewScreenHost'), 403);

        /** @var array<array-key, array<string, string>> $tabs */
        $tabs = config('screen-host.tabs', []);

        /** @var list<string> $slots */
        $slots = config('screen-host.slots', []);

        $screen->tabs($tabs)
            ->slots(...$slots)
            ->access(fn (string $permission, Request $request, ?Model $record): bool => Gate::forUser($request->user())
                ->allows($permission, $record === null ? [] : [$record]));

        return view('workbench::screen-host', [
            'resolved' => Atrium::screens()->resolve($screen, $request),
            'rows' => $rows,
        ]);
    }

    /**
     * A keyed record that needs no database.
     */
    private static function user(int $id, string $name): User
    {
        return new User()->forceFill(['id' => $id, 'name' => $name]);
    }
}
