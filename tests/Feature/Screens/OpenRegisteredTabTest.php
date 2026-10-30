<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Atrium\ScreenHost\ScreenHostController;

beforeEach(function (): void {
    ScreenHostController::register();
});

/**
 * A tab and a section, counting its resolver, in every slot of the screen.
 *
 * @param  list<string>  $slots
 * @param  array<string, int>  $calls
 */
function openTabRegister(string $screen, array $slots, array &$calls): void
{
    Atrium::screens()->tab($screen, TabDefinition::make('acme.tab')->label('Acme')->view('screens.marker')->public()
        ->resolve(fn (): array => ['marker' => 'the acme panel']));

    foreach ($slots as $slot) {
        $calls[$slot] = 0;

        Atrium::screens()->section($screen, $slot, SectionDefinition::make('acme.'.$slot)->view('screens.marker')->public()
            ->resolve(function () use (&$calls, $slot): array {
                $calls[$slot]++;

                return ['marker' => 'in '.$slot];
            }));
    }
}

it('renders every slot on a built-in tab and only header.actions around an open registered tab', function (string $route, string $screen, array $slots): void {
    $calls = [];
    openTabRegister($screen, $slots, $calls);

    $builtIn = $this->get(route($route))->assertOk()->assertSee('data-testid="host-content"', false);

    foreach ($slots as $slot) {
        $builtIn->assertSee('data-testid="section-acme.'.$slot.'"', false)->assertSee('in '.$slot.' on '.$screen);
    }

    $builtIn->assertDontSee('data-testid="tab-panel-acme.tab"', false);

    // A fresh request, so nothing is remembered from the one above.
    app()->forgetScopedInstances();
    $calls = array_map(fn (): int => 0, $calls);

    $open = $this->get(route($route, ['tab' => 'acme.tab']))
        ->assertOk()
        ->assertSee('data-testid="tab-panel-acme.tab"', false)
        ->assertSee('the acme panel on '.$screen)
        ->assertSee('data-testid="section-acme.header.actions"', false)
        ->assertDontSee('data-testid="host-content"', false);

    foreach (array_diff($slots, ['header.actions']) as $slot) {
        $open->assertDontSee('data-testid="section-acme.'.$slot.'"', false)->assertDontSee('in '.$slot.' on');
    }

    expect($calls)->toBe([...array_map(fn (): int => 0, $calls), 'header.actions' => 1]);
})->with([
    'a detail screen' => ['test.host', 'test.host', ['header.actions', 'before', 'after', 'aside']],
    'a list screen' => ['test.list', 'test.list', ['header.actions', 'before', 'after', 'row.actions']],
]);
