<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Feature\Screens;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Http\Resources\ResolvedScreenResource;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Models\User;

/**
 * A screen host for the screen-extension tests, as a package's API serves a
 * screen: it authorizes first, declares itself with `Screen::standard()`,
 * resolves its extensions and answers with ResolvedScreenResource.
 *
 * `test.host` is a detail screen with a record and `test.list` a list screen
 * with three rows; either takes another screen key as its parameter. Tests
 * shape it through config: `screen-host.tabs` (built-in tabs, as
 * `Screen::tabs()` takes them), `screen-host.reserved` (tab keys passed to
 * `Screen::reserve()`) and `screen-host.slots` (extra slots the screen
 * declares). Defining the `viewScreenHost` gate makes the host authorize
 * through it.
 */
final class JsonScreenHost
{
    public static function register(): void
    {
        Route::get('test/host/{screen?}', fn (Request $request, string $screen = 'test.host'): JsonResponse => self::show(
            $request,
            Screen::standard($screen, Screen::DETAIL)->record(self::user(10, 'Host record')),
            [],
        ))->where('screen', '[a-z0-9.-]+')->name('test.host');

        Route::get('test/list/{screen?}', fn (Request $request, string $screen = 'test.list'): JsonResponse => self::show(
            $request,
            Screen::standard($screen, Screen::LIST),
            [self::user(1, 'Row 1'), self::user(2, 'Row 2'), self::user(3, 'Row 3')],
        ))->where('screen', '[a-z0-9.-]+')->name('test.list');

        Route::getRoutes()->refreshNameLookups();
    }

    /**
     * @param  list<Model>  $rows
     */
    private static function show(Request $request, Screen $screen, array $rows): JsonResponse
    {
        // The host's own authorization comes first, so nothing registered
        // runs for a viewer it refuses.
        abort_if(Gate::has('viewScreenHost') && Gate::denies('viewScreenHost'), 403);

        /** @var array<array-key, array<string, string>> $tabs */
        $tabs = config('screen-host.tabs', []);

        /** @var list<string> $slots */
        $slots = config('screen-host.slots', []);

        /** @var list<string> $reserved */
        $reserved = config('screen-host.reserved', []);

        $screen->tabs($tabs)
            ->reserve(...$reserved)
            ->slots(...$slots)
            ->access(fn (string $permission, Request $request, ?Model $record): bool => Gate::forUser($request->user())
                ->allows($permission, $record === null ? [] : [$record]));

        return new ResolvedScreenResource(Atrium::screens()->resolve($screen, $request))->withRows($rows)->response();
    }

    /**
     * A keyed record that needs no database.
     */
    private static function user(int $id, string $name): User
    {
        return new User()->forceFill(['id' => $id, 'name' => $name]);
    }
}
