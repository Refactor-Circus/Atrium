<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;
use RefactorCircus\Atrium\Tests\Feature\Screens\JsonScreenHost;

beforeEach(function (): void {
    JsonScreenHost::register();
});

/**
 * The keys of the sections sent in one slot of a host screen.
 *
 * @param  array<string, mixed>  $parameters
 * @return list<string>
 */
function wildcardSectionKeys(object $test, string $route, array $parameters, string $slot = 'before'): array
{
    return array_column($test->getJson(route($route, $parameters))->assertOk()->json('data.sections')[$slot] ?? [], 'key');
}

it('sends a * section on every screen declaring its slot, with that screen', function (): void {
    Atrium::screens()->section('*', 'before', SectionDefinition::make('acme.everywhere')->public()
        ->resolve(fn (?Model $record, Screen $screen): array => ['marker' => 'everywhere for '.$screen->kind.' on '.$screen->key]));

    $this->getJson(route('test.host', ['screen' => 'test.a']))
        ->assertOk()
        ->assertJsonPath('data.sections.before.0.data.marker', 'everywhere for detail on test.a');

    $this->getJson(route('test.list', ['screen' => 'other.screen']))
        ->assertOk()
        ->assertJsonPath('data.sections.before.0.data.marker', 'everywhere for list on other.screen');
});

it('sends a package section on that package\'s screens only', function (): void {
    Atrium::screens()->section('test.*', 'before', SectionDefinition::make('acme.test-only')->public());

    expect(wildcardSectionKeys($this, 'test.host', ['screen' => 'test.a']))->toBe(['acme.test-only'])
        ->and(wildcardSectionKeys($this, 'test.host', ['screen' => 'other.screen']))->toBe([]);
});

it('opens a * tab through ?tab=', function (): void {
    Atrium::screens()->tab('*', TabDefinition::make('acme.everywhere')->label('Everywhere')->public()
        ->resolve(fn (?Model $record, Screen $screen): array => ['marker' => 'the everywhere panel on '.$screen->key]));

    $this->getJson(route('test.host', ['screen' => 'other.screen', 'tab' => 'acme.everywhere']))
        ->assertOk()
        ->assertJsonPath('data.open_tab', 'acme.everywhere')
        ->assertJsonPath('data.tabs.1.data.marker', 'the everywhere panel on other.screen');
});

it('never runs a wildcard section\'s closures on a screen without its slot', function (): void {
    $calls = 0;

    Atrium::screens()->section('*', 'sidebar', SectionDefinition::make('acme.sidebar')
        ->authorize(function () use (&$calls): bool {
            $calls++;

            return true;
        })
        ->resolve(function () use (&$calls): array {
            $calls++;

            return [];
        }));

    $this->getJson(route('test.host', ['screen' => 'test.a']))->assertOk()->assertJsonMissingPath('data.sections.sidebar');
    $this->getJson(route('test.list', ['screen' => 'other.screen']))->assertOk()->assertJsonMissingPath('data.sections.sidebar');

    expect($calls)->toBe(0);
});

it('makes no resolver call where a wildcard authorize returns early on the screen key', function (): void {
    $resolvedOn = [];

    Atrium::screens()->section('*', 'before', SectionDefinition::make('acme.picky')
        ->authorize(fn (Request $request, ?Model $record, Screen $screen): bool => $screen->key === 'test.a')
        ->resolve(function (?Model $record, Screen $screen) use (&$resolvedOn): array {
            $resolvedOn[] = $screen->key;

            return ['marker' => 'picky'];
        }));

    expect(wildcardSectionKeys($this, 'test.host', ['screen' => 'other.screen']))->toBe([])
        ->and(wildcardSectionKeys($this, 'test.list', ['screen' => 'test.b']))->toBe([])
        ->and(wildcardSectionKeys($this, 'test.host', ['screen' => 'test.a']))->toBe(['acme.picky'])
        ->and($resolvedOn)->toBe(['test.a']);
});
