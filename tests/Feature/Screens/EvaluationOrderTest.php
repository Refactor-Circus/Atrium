<?php

declare(strict_types=1);

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;
use RefactorCircus\Atrium\Tests\Feature\Screens\JsonScreenHost;

beforeEach(function (): void {
    JsonScreenHost::register();
});

/**
 * A resolver that counts its calls under its name.
 *
 * @return Closure(): array<string, mixed>
 */
function evaluationResolver(ArrayObject $calls, string $name): Closure
{
    $calls[$name] = 0;

    return function () use ($calls, $name): array {
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
        ->tab('test.host', TabDefinition::make('acme.tab')->authorize($authorize)->resolve($resolve))
        ->section('test.host', 'before', SectionDefinition::make('acme.section')->authorize($authorize)->resolve($resolve));

    $this->getJson(route('test.host'))->assertForbidden();
    $this->getJson(route('test.host', ['tab' => 'acme.tab']))->assertForbidden();

    expect($asked)->toBe(0)
        ->and($resolved)->toBe(0);
});

it('runs resolvers only for the open registered tab and the sections sent', function (): void {
    $calls = new ArrayObject;

    Atrium::screens()
        ->tab('test.host', TabDefinition::make('acme.open')->public()->resolve(evaluationResolver($calls, 'open tab')))
        ->tab('test.host', TabDefinition::make('acme.unopened')->public()->resolve(evaluationResolver($calls, 'unopened tab')))
        ->tab('test.host', TabDefinition::make('acme.hidden')->resolve(evaluationResolver($calls, 'hidden tab')))
        ->section('test.host', 'header.actions', SectionDefinition::make('acme.shown')->public()->resolve(evaluationResolver($calls, 'shown section')))
        ->section('test.host', 'header.actions', SectionDefinition::make('acme.hidden')->authorize(fn (): bool => false)->resolve(evaluationResolver($calls, 'hidden section')))
        ->section('test.host', 'before', SectionDefinition::make('acme.beside')->public()->resolve(evaluationResolver($calls, 'section beside the tab')));

    $this->getJson(route('test.host', ['tab' => 'acme.open']))
        ->assertOk()
        ->assertJsonPath('data.tabs.1.data.marker', 'open tab data')
        ->assertJsonPath('data.sections', [
            'header.actions' => [['key' => 'acme.shown', 'label' => 'acme.shown', 'component' => 'acme.shown', 'data' => ['marker' => 'shown section data']]],
            'before' => [],
            'after' => [],
            'aside' => [],
        ]);

    expect($calls->getArrayCopy())->toBe([
        'open tab' => 1,
        'unopened tab' => 0,
        'hidden tab' => 0,
        'shown section' => 1,
        'hidden section' => 0,
        'section beside the tab' => 0,
    ]);
});

it('hands each resolver the screen\'s record and the screen', function (): void {
    Atrium::screens()
        ->tab('test.host', TabDefinition::make('acme.tab')->public()
            ->resolve(fn ($record, $screen): array => ['record' => $record?->name, 'screen' => $screen->key]))
        ->section('test.host', 'before', SectionDefinition::make('acme.section')->public()
            ->resolve(fn ($record, $screen): array => ['record' => $record?->name, 'screen' => $screen->key]));

    $this->getJson(route('test.host'))
        ->assertOk()
        ->assertJsonPath('data.sections.before.0.data', ['record' => 'Host record', 'screen' => 'test.host']);

    $this->getJson(route('test.host', ['tab' => 'acme.tab']))
        ->assertOk()
        ->assertJsonPath('data.tabs.1.data', ['record' => 'Host record', 'screen' => 'test.host']);
});
