<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Screens\Data\ResolvedScreen;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;

/**
 * Register `acme.x` as a tab, or as a section in `before`, configured by the
 * closure.
 *
 * @param  Closure(TabDefinition|SectionDefinition): mixed  $configure
 */
function visibilityRegister(string $kind, Closure $configure): void
{
    if ($kind === 'tab') {
        $tab = TabDefinition::make('acme.x')->view('acme::x');
        $configure($tab);
        Atrium::screens()->tab('test.screen', $tab);

        return;
    }

    $section = SectionDefinition::make('acme.x')->view('acme::x');
    $configure($section);
    Atrium::screens()->section('test.screen', 'before', $section);
}

/**
 * A detail screen whose host grants only the `granted` permission.
 */
function visibilityScreen(bool $access = true): Screen
{
    $screen = Screen::standard('test.screen', 'detail');

    return $access ? $screen->access(fn (string $permission): bool => $permission === 'granted') : $screen;
}

function visibilityResolve(?Screen $screen = null, ?Request $request = null): ResolvedScreen
{
    return Atrium::screens()->resolve($screen ?? visibilityScreen(), $request ?? Request::create('/'));
}

/**
 * Whether `acme.x` shows on the resolved screen.
 */
function visibilityShows(string $kind, ResolvedScreen $resolved): bool
{
    $definitions = $kind === 'tab' ? $resolved->tabs : $resolved->sections('before');

    return in_array('acme.x', array_map(fn (TabDefinition|SectionDefinition $definition): string => $definition->key, $definitions), true);
}

/**
 * A list screen with a `row.actions` row slot holding `acme.x`.
 */
function visibilityRowScreen(SectionDefinition $section): Screen
{
    Atrium::screens()->section('test.list', 'row.actions', $section);

    return Screen::standard('test.list', 'list');
}

it('shows an extension only when it says who may see it', function (string $kind, Closure $configure, bool $access, bool $visible): void {
    visibilityRegister($kind, $configure);

    expect(visibilityShows($kind, visibilityResolve(visibilityScreen($access))))->toBe($visible);
})->with(['tab', 'section'])->with([
    'a granted permission' => [fn (TabDefinition|SectionDefinition $d): mixed => $d->permission('granted'), true, true],
    'a refused permission' => [fn (TabDefinition|SectionDefinition $d): mixed => $d->permission('refused'), true, false],
    'a permission on a screen without access' => [fn (TabDefinition|SectionDefinition $d): mixed => $d->permission('granted'), false, false],
    'a closure answering true' => [fn (TabDefinition|SectionDefinition $d): mixed => $d->authorize(fn (): bool => true), true, true],
    'a closure answering false' => [fn (TabDefinition|SectionDefinition $d): mixed => $d->authorize(fn (): bool => false), true, false],
    'a closure answering something truthy' => [fn (TabDefinition|SectionDefinition $d): mixed => $d->authorize(fn (): int => 1), true, false],
    'public' => [fn (TabDefinition|SectionDefinition $d): mixed => $d->public(), true, true],
    'neither' => [fn (TabDefinition|SectionDefinition $d): mixed => $d, true, false],
    'both passing' => [fn (TabDefinition|SectionDefinition $d): mixed => $d->permission('granted')->authorize(fn (): bool => true), true, true],
    'the permission failing' => [fn (TabDefinition|SectionDefinition $d): mixed => $d->permission('refused')->authorize(fn (): bool => true), true, false],
    'the closure failing' => [fn (TabDefinition|SectionDefinition $d): mixed => $d->permission('granted')->authorize(fn (): bool => false), true, false],
]);

it('hides an extension whose authorize closure throws, reporting it once and calling it once', function (string $kind): void {
    Exceptions::fake();
    $calls = 0;

    // A plain closure, not an arrow function: an arrow function would capture
    // $calls by value and the counter would never reach the test.
    visibilityRegister($kind, function (TabDefinition|SectionDefinition $d) use (&$calls): mixed {
        return $d->authorize(function () use (&$calls): bool {
            $calls++;

            throw new RuntimeException('authorize failed');
        });
    });

    Route::get('screen-test', function (Request $request) use ($kind) {
        $first = visibilityResolve(request: $request);
        $second = visibilityResolve(request: $request);

        return response()->json([visibilityShows($kind, $first), visibilityShows($kind, $second), visibilityShows($kind, $second)]);
    });

    $this->get('/screen-test')->assertOk()->assertExactJson([false, false, false]);

    expect($calls)->toBe(1);

    Exceptions::assertReportedCount(1);
    Exceptions::assertReported(fn (RuntimeException $exception): bool => $exception->getMessage() === 'authorize failed');
})->with(['tab', 'section']);

it('asks the host about a row section\'s permission with the row as the record', function (): void {
    $seen = [];
    $row = new User;
    $row->id = 5;

    $screen = visibilityRowScreen(SectionDefinition::make('acme.x')->view('acme::x')->permission('granted'))
        ->access(function (string $permission, Request $request, ?Model $record) use (&$seen): bool {
            $seen[] = [$permission, $record];

            return true;
        });

    expect(visibilityResolve($screen)->rowSections('row.actions', $row))->toHaveCount(1)
        ->and($seen)->toBe([['granted', $row]]);
});

it('asks and resolves again for rows with the same id in two model classes', function (): void {
    $first = new class extends Model {};
    $first->id = 1;
    $second = new class extends Model {};
    $second->id = 1;
    // Another instance of the same class with the same key.
    $twin = clone $first;

    $asked = 0;
    $resolved = 0;

    $resolvedScreen = visibilityResolve(visibilityRowScreen(SectionDefinition::make('acme.x')->view('acme::x')
        ->authorize(function (Request $request, ?Model $record) use (&$asked, $first): bool {
            $asked++;

            return $record !== null && $record::class === $first::class;
        })
        ->resolve(function (?Model $record) use (&$resolved): array {
            $resolved++;

            return ['class' => $record === null ? null : $record::class];
        })));

    $forFirst = $resolvedScreen->rowSections('row.actions', $first);

    expect($forFirst)->toHaveCount(1)
        ->and($resolvedScreen->rowSections('row.actions', $second))->toBe([])
        ->and($asked)->toBe(2)
        ->and($resolvedScreen->data($forFirst[0], $first))->toBe(['class' => $first::class])
        // A hidden row's data is never resolved.
        ->and($resolvedScreen->data($forFirst[0], $second))->toBe([])
        ->and($resolved)->toBe(1);

    // The same class and key is the same row: nothing runs again.
    expect($resolvedScreen->rowSections('row.actions', $twin))->toHaveCount(1)
        ->and($resolvedScreen->data($forFirst[0], $twin))->toBe(['class' => $first::class])
        ->and($resolvedScreen->rowSections('row.actions', $second))->toBe([])
        ->and($asked)->toBe(2)
        ->and($resolved)->toBe(1);
});

it('keeps separate data for rows with the same id in two model classes', function (): void {
    $first = new class extends Model {};
    $first->id = 1;
    $second = new class extends Model {};
    $second->id = 1;
    $resolved = 0;

    $resolvedScreen = visibilityResolve(visibilityRowScreen(SectionDefinition::make('acme.x')->view('acme::x')->public()
        ->resolve(function (?Model $record) use (&$resolved): array {
            $resolved++;

            return ['class' => $record === null ? null : $record::class];
        })));

    $section = $resolvedScreen->rowSections('row.actions', $first)[0];

    expect($resolvedScreen->data($section, $first))->toBe(['class' => $first::class])
        ->and($resolvedScreen->data($section, $second))->toBe(['class' => $second::class])
        ->and($resolvedScreen->data($section, $first))->toBe(['class' => $first::class])
        ->and($resolved)->toBe(2);
});

it('asks and resolves again for a new unsaved row after the last one is freed', function (): void {
    $asked = 0;
    $resolved = 0;
    $make = fn (): Model => new class extends Model {};

    $resolvedScreen = visibilityResolve(visibilityRowScreen(SectionDefinition::make('acme.x')->view('acme::x')
        ->authorize(function () use (&$asked): bool {
            $asked++;

            return true;
        })
        ->resolve(function () use (&$resolved): array {
            $resolved++;

            return [];
        })));

    $row = $make();
    $section = $resolvedScreen->rowSections('row.actions', $row)[0];
    $resolvedScreen->data($section, $row);
    $resolvedScreen->rowSections('row.actions', $row);
    $resolvedScreen->data($section, $row);

    expect($asked)->toBe(1)
        ->and($resolved)->toBe(1);

    unset($row);
    gc_collect_cycles();

    $row = $make();
    $resolvedScreen->rowSections('row.actions', $row);
    $resolvedScreen->data($section, $row);

    expect($asked)->toBe(2)
        ->and($resolved)->toBe(2);
});

it('evaluates afresh for another viewer once the scoped instances are forgotten', function (string $kind): void {
    $asked = 0;
    $resolved = 0;

    visibilityRegister($kind, function (TabDefinition|SectionDefinition $d) use (&$asked, &$resolved): mixed {
        return $d
            ->authorize(function (Request $request) use (&$asked): bool {
                $asked++;

                return $request->user()?->getAuthIdentifier() === 1;
            })
            ->resolve(function () use (&$resolved): array {
                $resolved++;

                return [];
            });
    });

    $ada = new User;
    $ada->id = 1;
    $bob = new User;
    $bob->id = 2;

    $asAda = Request::create('/?tab=acme.x');
    $asAda->setUserResolver(fn (): User => $ada);
    $asBob = Request::create('/');
    $asBob->setUserResolver(fn (): User => $bob);

    $forAda = visibilityResolve(request: $asAda);
    $extension = $kind === 'tab' ? $forAda->openRegisteredTab : ($forAda->sections('before')[0] ?? null);

    expect(visibilityShows($kind, $forAda))->toBeTrue()
        ->and($extension)->not->toBeNull()
        ->and($forAda->data($extension))->toBe([]);

    app()->forgetScopedInstances();

    expect(visibilityShows($kind, visibilityResolve(request: $asBob)))->toBeFalse()
        ->and($asked)->toBe(2);

    app()->forgetScopedInstances();

    $again = visibilityResolve(request: $asAda);
    $extension = $kind === 'tab' ? $again->openRegisteredTab : $again->sections('before')[0];
    $again->data($extension);

    expect($asked)->toBe(3)
        ->and($resolved)->toBe(2);
})->with(['tab', 'section']);
