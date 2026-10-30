<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Atrium\ScreenHost\ScreenHostController;

beforeEach(function (): void {
    ScreenHostController::register();
});

it('renders a * section on every screen declaring its slot, with that screen', function (): void {
    Atrium::screens()->section('*', 'before', SectionDefinition::make('acme.everywhere')->view('screens.marker')->public()
        ->resolve(fn (?Model $record, Screen $screen): array => ['marker' => 'everywhere for '.$screen->kind]));

    $this->get(route('test.host', ['screen' => 'test.a']))
        ->assertOk()
        ->assertSee('everywhere for detail on test.a');

    $this->get(route('test.list', ['screen' => 'other.screen']))
        ->assertOk()
        ->assertSee('everywhere for list on other.screen');
});

it('renders a package section on that package\'s screens only', function (): void {
    Atrium::screens()->section('test.*', 'before', SectionDefinition::make('acme.test-only')->view('screens.marker')->public()
        ->resolve(fn (): array => ['marker' => 'test package only']));

    $this->get(route('test.host', ['screen' => 'test.a']))
        ->assertOk()
        ->assertSee('test package only on test.a');

    $this->get(route('test.host', ['screen' => 'other.screen']))
        ->assertOk()
        ->assertDontSee('test package only')
        ->assertDontSee('section-acme.test-only', false);
});

it('opens a * tab through ?tab=', function (): void {
    Atrium::screens()->tab('*', TabDefinition::make('acme.everywhere')->label('Everywhere')->view('screens.marker')->public()
        ->resolve(fn (): array => ['marker' => 'the everywhere panel']));

    $this->get(route('test.host', ['screen' => 'other.screen', 'tab' => 'acme.everywhere']))
        ->assertOk()
        ->assertSee('data-testid="tab-panel-acme.everywhere"', false)
        ->assertSee('the everywhere panel on other.screen');
});

it('never runs a wildcard section\'s closures on a screen without its slot', function (): void {
    $calls = 0;

    Atrium::screens()->section('*', 'sidebar', SectionDefinition::make('acme.sidebar')->view('screens.marker')
        ->authorize(function () use (&$calls): bool {
            $calls++;

            return true;
        })
        ->resolve(function () use (&$calls): array {
            $calls++;

            return [];
        }));

    $this->get(route('test.host', ['screen' => 'test.a']))->assertOk()->assertDontSee('section-acme.sidebar', false);
    $this->get(route('test.list', ['screen' => 'other.screen']))->assertOk()->assertDontSee('section-acme.sidebar', false);

    expect($calls)->toBe(0);
});

it('makes no resolver call where a wildcard authorize returns early on the screen key', function (): void {
    $resolvedOn = [];

    Atrium::screens()->section('*', 'before', SectionDefinition::make('acme.picky')->view('screens.marker')
        ->authorize(fn (Request $request, ?Model $record, Screen $screen): bool => $screen->key === 'test.a')
        ->resolve(function (?Model $record, Screen $screen) use (&$resolvedOn): array {
            $resolvedOn[] = $screen->key;

            return ['marker' => 'picky'];
        }));

    $this->get(route('test.host', ['screen' => 'other.screen']))->assertOk()->assertDontSee('picky on');
    $this->get(route('test.list', ['screen' => 'test.b']))->assertOk()->assertDontSee('picky on');
    $this->get(route('test.host', ['screen' => 'test.a']))->assertOk()->assertSee('picky on test.a');

    expect($resolvedOn)->toBe(['test.a']);
});
