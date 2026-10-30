<?php

declare(strict_types=1);

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Atrium\ScreenHost\ScreenHostController;

beforeEach(function (): void {
    ScreenHostController::register();
});

/**
 * A resolver that counts its calls under its name.
 *
 * @param  array<string, int>  $calls
 * @return Closure(): array<string, mixed>
 */
function evaluationResolver(array &$calls, string $name): Closure
{
    $calls[$name] = 0;

    return function () use (&$calls, $name): array {
        $calls[$name]++;

        return ['marker' => $name.' data'];
    };
}

it('runs no closure of any extension for a viewer the host refuses', function (): void {
    Gate::define('viewScreenHost', fn (?Authenticatable $user = null): bool => false);

    $asked = 0;
    $resolved = 0;

    $authorize = function () use (&$asked): bool {
        $asked++;

        return true;
    };

    $resolve = function () use (&$resolved): array {
        $resolved++;

        return [];
    };

    Atrium::screens()
        ->tab('test.host', TabDefinition::make('acme.tab')->view('screens.marker')->authorize($authorize)->resolve($resolve))
        ->section('test.host', 'before', SectionDefinition::make('acme.section')->view('screens.marker')->authorize($authorize)->resolve($resolve));

    $this->get(route('test.host'))->assertForbidden();
    $this->get(route('test.host', ['tab' => 'acme.tab']))->assertForbidden();

    expect($asked)->toBe(0)
        ->and($resolved)->toBe(0);
});

it('runs resolvers only for the open registered tab and the sections that render', function (): void {
    config(['screen-host.slots' => ['unrendered']]);

    $calls = [];

    Atrium::screens()
        ->tab('test.host', TabDefinition::make('acme.open')->view('screens.marker')->public()->resolve(evaluationResolver($calls, 'open tab')))
        ->tab('test.host', TabDefinition::make('acme.unopened')->view('screens.marker')->public()->resolve(evaluationResolver($calls, 'unopened tab')))
        ->tab('test.host', TabDefinition::make('acme.hidden')->view('screens.marker')->resolve(evaluationResolver($calls, 'hidden tab')))
        ->section('test.host', 'header.actions', SectionDefinition::make('acme.shown')->view('screens.marker')->public()->resolve(evaluationResolver($calls, 'shown section')))
        ->section('test.host', 'header.actions', SectionDefinition::make('acme.hidden')->view('screens.marker')->authorize(fn (): bool => false)->resolve(evaluationResolver($calls, 'hidden section')))
        ->section('test.host', 'unrendered', SectionDefinition::make('acme.unrendered')->view('screens.marker')->public()->resolve(evaluationResolver($calls, 'unrendered section')));

    $this->get(route('test.host', ['tab' => 'acme.open']))
        ->assertOk()
        ->assertSee('open tab data on test.host')
        ->assertSee('shown section data on test.host')
        ->assertDontSee('unrendered section data');

    expect($calls)->toBe([
        'open tab' => 1,
        'unopened tab' => 0,
        'hidden tab' => 0,
        'shown section' => 1,
        'hidden section' => 0,
        'unrendered section' => 0,
    ]);
});

it('spreads a view\'s data first, so the host\'s screen, record and tab win', function (): void {
    $data = fn (): array => ['screen' => 'from resolver', 'record' => 'from resolver', 'tab' => 'from resolver', 'extra' => 'kept'];

    Atrium::screens()
        ->tab('test.host', TabDefinition::make('acme.tab')->view('screens.spread')->public()->resolve($data))
        ->section('test.host', 'before', SectionDefinition::make('acme.section')->view('screens.spread')->public()->resolve($data));

    $this->get(route('test.host'))
        ->assertOk()
        ->assertSee('screen=test.host;record=Host record;tab=overview;extra=kept');

    $this->get(route('test.host', ['tab' => 'acme.tab']))
        ->assertOk()
        ->assertSee('screen=test.host;record=Host record;tab=acme.tab;extra=kept');
});

it('gives a component its resolver data as one data prop', function (): void {
    $data = fn (): array => ['marker' => 'probed', 'total' => 3];

    Atrium::screens()
        ->tab('test.host', TabDefinition::make('acme.tab')->component('screen-probe')->public()->resolve($data))
        ->section('test.host', 'before', SectionDefinition::make('acme.section')->component('screen-probe')->public()->resolve($data));

    $this->get(route('test.host'))
        ->assertOk()
        ->assertSee('component data: marker,total = probed,3; data only');

    $this->get(route('test.host', ['tab' => 'acme.tab']))
        ->assertOk()
        ->assertSee('component data: marker,total = probed,3; data only');
});
