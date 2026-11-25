<?php

declare(strict_types=1);

use Illuminate\Support\HtmlString;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Exceptions\UnserializableDataException;

/*
 * Live nav keys (AC 43): an item whose badge or children the layer computes
 * from a package API names the layer's resolver with `live()`.
 */

it('has no live key until one is set', function (): void {
    expect(NavItem::make('Runs')->live)->toBeNull();
});

it('keeps the live key and its options', function (): void {
    $item = NavItem::make('History')->live('keen.history', ['sort' => 90, 'exclude' => [], 'groups' => ['showroom' => 'showroom']]);

    expect($item->live)->toBe([
        'key' => 'keen.history',
        'options' => ['sort' => 90, 'exclude' => [], 'groups' => ['showroom' => 'showroom']],
    ]);
});

it('defaults the options to none', function (): void {
    expect(NavItem::make('Runs')->live('impex.active-runs')->live)->toBe(['key' => 'impex.active-runs', 'options' => []]);
});

it('returns the item for chaining', function (): void {
    $item = NavItem::make('Runs');

    expect($item->live('impex.active-runs'))->toBe($item);
});

it('accepts keys of the form {package}.{resolver}', function (string $key): void {
    expect(NavItem::make('Runs')->live($key)->live['key'] ?? null)->toBe($key);
})->with(['impex.active-runs', 'keen.history', 'roster-x.users.count', 'a1.b2']);

it('refuses a key outside the pattern', function (string $key): void {
    NavItem::make('Runs')->live($key);
})->with([
    'no package' => ['history'],
    'upper case' => ['Keen.history'],
    'a space' => ['keen.his tory'],
    'a trailing newline' => ["keen.history\n"],
    'an empty resolver' => ['keen.'],
    'a slash' => ['keen/history'],
    'empty' => [''],
])->throws(InvalidArgumentException::class, '^[a-z0-9-]+\.[a-z0-9.-]+$');

it('checks the options with JsonData', function (mixed $value): void {
    NavItem::make('Runs')->live('impex.active-runs', ['value' => $value]);
})->with([
    // Pest calls a closure it finds in a dataset, so the closure under test
    // is what this one returns.
    'a closure' => [fn (): Closure => fn (): int => 1],
    'HTML' => [new HtmlString('<b>1</b>')],
    'an object' => [new stdClass],
])->throws(UnserializableDataException::class, 'Nav item [Runs] live options returned unserializable data at [value]');
