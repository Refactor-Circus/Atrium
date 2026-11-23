<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;
use RefactorCircus\Atrium\Tests\Feature\Screens\JsonScreenHost;

beforeEach(function (): void {
    JsonScreenHost::register();
});

/**
 * A tab, and a section counting its resolver in every slot of the screen.
 *
 * @param  list<string>  $slots
 */
function openTabRegister(string $screen, array $slots, ArrayObject $calls): void
{
    Atrium::screens()->tab($screen, TabDefinition::make('acme.tab')->label('Acme')->public()
        ->resolve(fn (): array => ['marker' => 'the acme panel']));

    foreach ($slots as $slot) {
        $calls[$slot] = 0;

        Atrium::screens()->section($screen, $slot, SectionDefinition::make('acme.'.$slot)->public()
            ->resolve(function () use ($calls, $slot): array {
                $calls[$slot]++;

                return ['marker' => 'in '.$slot];
            }));
    }
}

/**
 * The keys of every section sent, in the screen's slots and its rows' slots.
 *
 * @param  array<string, mixed>  $screen
 * @return list<string>
 */
function openTabSectionKeys(array $screen): array
{
    $keys = [];

    foreach ([$screen['sections'], ...array_values($screen['rows'])] as $slots) {
        foreach ($slots as $sections) {
            foreach ($sections as $section) {
                $keys[] = $section['key'];
            }
        }
    }

    return array_values(array_unique($keys));
}

it('sends every slot on a built-in tab and only header.actions around an open registered tab', function (string $route, array $slots): void {
    $calls = new ArrayObject;
    openTabRegister($route, $slots, $calls);

    $builtIn = $this->getJson(route($route))->assertOk()->json('data');

    expect($builtIn['open_tab'])->toBe('overview')
        ->and(openTabSectionKeys($builtIn))->toEqualCanonicalizing(array_map(fn (string $slot): string => 'acme.'.$slot, $slots))
        ->and($builtIn['tabs'][1])->not->toHaveKey('data');

    // A fresh request, so nothing is remembered from the one above.
    app()->forgetScopedInstances();
    $calls->exchangeArray(array_map(fn (): int => 0, $calls->getArrayCopy()));

    $open = $this->getJson(route($route, ['tab' => 'acme.tab']))->assertOk()->json('data');

    expect($open['open_tab'])->toBe('acme.tab')
        ->and($open['tabs'][1]['data'])->toBe(['marker' => 'the acme panel'])
        ->and(openTabSectionKeys($open))->toBe(['acme.header.actions'])
        ->and($calls->getArrayCopy())->toBe([...array_map(fn (): int => 0, $calls->getArrayCopy()), 'header.actions' => 1]);
})->with([
    'a detail screen' => ['test.host', ['header.actions', 'before', 'after', 'aside']],
    'a list screen' => ['test.list', ['header.actions', 'before', 'after', 'row.actions']],
]);
