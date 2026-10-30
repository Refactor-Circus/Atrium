<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;

it('derives the package from the first segment of the key', function (string $key, string $package): void {
    expect(Screen::make($key)->package)->toBe($package);
})->with([
    ['atrium.dashboard', 'atrium'],
    ['acme-billing.invoices.show', 'acme-billing'],
    ['test.a', 'test'],
]);

it('starts as a detail screen with no record, no slots and the overview tab', function (): void {
    $screen = Screen::make('test.screen');

    expect($screen->key)->toBe('test.screen')
        ->and($screen->record)->toBeNull()
        ->and($screen->kind)->toBe('detail')
        ->and($screen->slots)->toBe([])
        ->and($screen->rowSlots)->toBe([])
        ->and(array_map(fn (TabDefinition $tab): string => $tab->key, $screen->tabs))->toBe(['overview'])
        ->and($screen->tabs[0]->label)->toBe('Overview');
});

it('accepts only an exact screen key', function (string $key): void {
    expect(fn () => Screen::make($key))->toThrow(InvalidArgumentException::class);
})->with(['*', 'test.*', '*.x', 'test', 'Test.screen', 'test screen', '', '.screen', "test.screen\n"]);

it('declares the standard slots of a detail screen', function (): void {
    $screen = Screen::standard('test.screen', 'detail');

    expect($screen->kind)->toBe('detail')
        ->and($screen->slots)->toBe(['header.actions', 'before', 'after', 'aside'])
        ->and($screen->rowSlots)->toBe([]);
});

it('declares the standard slots of a list screen', function (): void {
    $screen = Screen::standard('test.list', 'list');

    expect($screen->kind)->toBe('list')
        ->and($screen->slots)->toBe(['header.actions', 'before', 'after'])
        ->and($screen->rowSlots)->toBe(['row.actions']);
});

it('lets the host add slots after the standard ones, once each', function (): void {
    $screen = Screen::standard('test.list', 'list')
        ->slots('filters', 'before')
        ->rowSlots('row.badges');

    expect($screen->slots)->toBe(['header.actions', 'before', 'after', 'filters'])
        ->and($screen->rowSlots)->toBe(['row.actions', 'row.badges']);
});

it('rejects a slot name outside the pattern, or one declared as both kinds', function (Closure $declare): void {
    expect(fn () => $declare(Screen::make('test.screen')))->toThrow(InvalidArgumentException::class);
})->with([
    'uppercase' => fn (Screen $screen): Screen => $screen->slots('Before'),
    'a space' => fn (Screen $screen): Screen => $screen->slots('a b'),
    'empty row slot' => fn (Screen $screen): Screen => $screen->rowSlots(''),
    'both kinds' => fn (Screen $screen): Screen => $screen->slots('row.actions')->rowSlots('row.actions'),
]);

it('rejects an unknown kind', function (): void {
    expect(fn () => Screen::make('test.screen')->kind('grid'))->toThrow(InvalidArgumentException::class)
        ->and(fn () => Screen::standard('test.screen', 'grid'))->toThrow(InvalidArgumentException::class);
});

it('keeps the built-in tabs in order, with their labels and icons', function (): void {
    $screen = Screen::make('test.screen')->tabs([
        ['key' => 'members', 'label' => 'Members', 'icon' => 'users'],
        ['key' => 'teams', 'label' => 'Teams'],
    ]);

    expect(array_map(fn (TabDefinition $tab): array => [$tab->key, $tab->label, $tab->icon], $screen->tabs))->toBe([
        ['members', 'Members', 'users'],
        ['teams', 'Teams', 'squares-2x2'],
    ]);
});

it('falls back to the synthetic overview tab when there are no built-in tabs', function (): void {
    $screen = Screen::make('test.screen')->tabs([]);

    expect(array_map(fn (TabDefinition $tab): string => $tab->key, $screen->tabs))->toBe(['overview']);
});

it('rejects a built-in tab without a valid key, or the same key twice', function (array $tabs): void {
    expect(fn () => Screen::make('test.screen')->tabs($tabs))->toThrow(InvalidArgumentException::class);
})->with([
    'no key' => [[['label' => 'Members']]],
    'bad key' => [[['key' => 'Members']]],
    'twice' => [[['key' => 'members'], ['key' => 'members']]],
]);

it('reserves tab keys without making them tabs, once each and in order', function (): void {
    $screen = Screen::make('test.screen')->tabs([['key' => 'members']]);

    expect($screen->reserved)->toBe([])
        ->and($screen->reserve('secrets', 'audit')->reserve('secrets', 'members'))->toBe($screen)
        ->and($screen->reserved)->toBe(['secrets', 'audit', 'members'])
        ->and(array_map(fn (TabDefinition $tab): string => $tab->key, $screen->tabs))->toBe(['members']);
});

it('rejects a reserved key outside the key pattern', function (string $key): void {
    expect(fn () => Screen::make('test.screen')->reserve('fine', $key))
        ->toThrow(InvalidArgumentException::class, "[{$key}]");
})->with(['Upper', 'a b', '', '.dot', '-dash', "x\n"]);

it('remembers the default tab and the record', function (): void {
    $record = new class extends Model {};
    $screen = Screen::make('test.screen')->defaultTab('teams')->record($record);

    expect($screen->defaultTab)->toBe('teams')
        ->and($screen->record)->toBe($record);
});

it('answers permissions through the access closure, and denies them without one', function (): void {
    $request = Request::create('/');
    $record = new class extends Model {};
    $seen = [];

    $screen = Screen::make('test.screen')->access(function (string $permission, Request $given, ?Model $model) use (&$seen): bool {
        $seen = [$permission, $given, $model];

        return $permission === 'granted';
    });

    expect($screen->permits('granted', $request, $record))->toBeTrue()
        ->and($seen)->toBe(['granted', $request, $record])
        ->and($screen->permits('denied', $request, $record))->toBeFalse()
        ->and(Screen::make('test.screen')->permits('granted', $request, $record))->toBeFalse();
});

it('refuses writes to its state from outside', function (string $property, mixed $value): void {
    $screen = Screen::make('test.screen');

    expect(fn () => $screen->{$property} = $value)->toThrow(Error::class);
})->with([
    'key' => ['key', 'other.screen'],
    'package' => ['package', 'other'],
    'record' => ['record', null],
    'kind' => ['kind', 'list'],
    'tabs' => ['tabs', []],
    'slots' => ['slots', []],
    'rowSlots' => ['rowSlots', []],
    'reserved' => ['reserved', []],
]);

it('keeps the access closure private', function (): void {
    $screen = Screen::make('test.screen')->access(fn (): bool => true);

    expect(fn () => $screen->access)->toThrow(Error::class);
});
