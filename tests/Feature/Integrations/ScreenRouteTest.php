<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Gate;
use Laravel\Pennant\Feature;
use Laravel\Pennant\PennantServiceProvider;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;
use RefactorCircus\Atrium\Integrations\Cortex\CortexFeature;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;
use Workbench\App\Models\User;

/*
 * `atrium.screens.show` (AC 44): a screen an active integration declares,
 * with the tabs and sections other packages registered for it, resolved
 * without loading any model. The fixture integration declares
 * `cortex.records` (list) and `cortex.record` (detail).
 */

beforeEach(function (): void {
    Gate::define('viewAtrium', fn ($user = null): bool => true);

    $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);
    $this->calls = new ArrayObject;

    IntegrationFixture::registerFakes('cortex');
});

/**
 * A resolver that counts its calls under its name and reports the record it
 * was given.
 *
 * @return Closure(?Model, Screen): array<string, mixed>
 */
function screenRouteResolver(ArrayObject $calls, string $name): Closure
{
    $calls[$name] = 0;

    return function (?Model $record, Screen $screen) use ($calls, $name): array {
        $calls[$name]++;

        return ['from' => $name, 'record_loaded' => $record !== null, 'screen' => $screen->key];
    };
}

/**
 * Two public tabs on the detail screen and a section in its `before` slot.
 */
function screenRouteRegister(ArrayObject $calls): void
{
    Atrium::screens()
        ->tab('cortex.record', TabDefinition::make('acme.first')->label('First')->public()->resolve(screenRouteResolver($calls, 'first tab')))
        ->tab('cortex.record', TabDefinition::make('acme.second')->label('Second')->public()->resolve(screenRouteResolver($calls, 'second tab')))
        ->section('cortex.record', 'before', SectionDefinition::make('acme.before')->public()->resolve(screenRouteResolver($calls, 'before')));
}

/**
 * @param  array<string, mixed>  $query
 * @return array<string, mixed>
 */
function screenRouteGet(object $test, string $screen, array $query = []): array
{
    return $test->actingAs($test->user)->getJson(route('atrium.screens.show', ['screen' => $screen, ...$query]))->assertOk()->json('data');
}

it('answers a declared detail screen with its declaration, the record echoed and its extensions', function (): void {
    $this->actingAs($this->user)->getJson(route('atrium.screens.show', ['screen' => 'cortex.record', 'record' => '42']))
        ->assertOk()
        ->assertExactJson(['data' => [
            'key' => 'cortex.record',
            'kind' => 'detail',
            'path' => '/cortex/records/:record',
            'subject_type' => 'cortex.record',
            'record' => '42',
            'open_tab' => 'overview',
            'tabs' => [
                ['key' => 'overview', 'label' => 'Overview', 'icon' => 'i-lucide-layout-grid', 'built_in' => true, 'component' => null],
            ],
            'sections' => ['header.actions' => [], 'before' => [], 'after' => [], 'aside' => []],
            'rows' => [],
        ]]);
});

it('answers a declared list screen, with its row slot sent as a plain slot', function (): void {
    Atrium::screens()->section('cortex.records', 'row.actions', SectionDefinition::make('acme.row-link')->public()->resolve(fn (): array => ['static' => true]));

    $screen = screenRouteGet($this, 'cortex.records');

    expect($screen['kind'])->toBe('list')
        ->and($screen['path'])->toBe('/cortex/records')
        ->and($screen['subject_type'])->toBeNull()
        ->and($screen['record'])->toBeNull()
        ->and(array_keys($screen['sections']))->toBe(['header.actions', 'before', 'after', 'row.actions'])
        ->and($screen['sections']['row.actions'])->toBe([
            ['key' => 'acme.row-link', 'label' => 'acme.row-link', 'component' => 'acme.row-link', 'data' => ['static' => true]],
        ]);
});

it('echoes the record as a string and loads no model for it', function (string $record): void {
    screenRouteRegister($this->calls);

    $screen = screenRouteGet($this, 'cortex.record', ['record' => $record]);

    expect($screen['record'])->toBe($record)
        ->and($screen['sections']['before'][0]['data'])->toBe(['from' => 'before', 'record_loaded' => false, 'screen' => 'cortex.record']);
})->with([
    'a number' => ['7'],
    'a slug' => ['acme-shop'],
    'a uuid' => ['019ab000-0000-7000-8000-000000000001'],
]);

it('sends record null for no record or a non-string one', function (array $query): void {
    expect(screenRouteGet($this, 'cortex.record', $query)['record'])->toBeNull();
})->with([
    'absent' => [[]],
    'an array' => [['record' => ['7']]],
]);

it('resolves only the open tab\'s data', function (): void {
    screenRouteRegister($this->calls);

    $screen = screenRouteGet($this, 'cortex.record', ['tab' => 'acme.second', 'record' => '42']);

    expect($screen['open_tab'])->toBe('acme.second')
        ->and($screen['tabs'][1])->not->toHaveKey('data')
        ->and($screen['tabs'][2]['data'])->toBe(['from' => 'second tab', 'record_loaded' => false, 'screen' => 'cortex.record'])
        ->and($this->calls->getArrayCopy())->toBe(['first tab' => 0, 'second tab' => 1, 'before' => 0]);
});

it('falls back to the default tab for an unknown ?tab=', function (): void {
    screenRouteRegister($this->calls);

    $screen = screenRouteGet($this, 'cortex.record', ['tab' => 'acme.unknown']);

    expect($screen['open_tab'])->toBe('overview')
        ->and(array_filter($screen['tabs'], fn (array $tab): bool => array_key_exists('data', $tab)))->toBe([])
        ->and($this->calls->getArrayCopy())->toBe(['first tab' => 0, 'second tab' => 0, 'before' => 1]);
});

it('includes the extensions registered for the package and for every screen', function (): void {
    Atrium::screens()
        ->section('cortex.*', 'after', SectionDefinition::make('acme.package-wide')->public())
        ->section('*', 'after', SectionDefinition::make('acme.everywhere')->public());

    expect(array_column(screenRouteGet($this, 'cortex.record')['sections']['after'], 'key'))->toBe(['acme.package-wide', 'acme.everywhere']);
});

it('answers 404 for a screen no active integration declares', function (string $screen): void {
    $this->actingAs($this->user)->getJson(route('atrium.screens.show', $screen))->assertNotFound()->assertJsonStructure(['message']);
})->with([
    'an unknown key of a registered integration' => ['cortex.nothing'],
    'a key of a package that is not registered' => ['roster.records'],
    'a key that is no screen key' => ['nothing'],
    'an Atrium screen' => ['atrium.settings'],
]);

it('answers 404 for a screen of an integration that is flagged off', function (): void {
    app()->register(PennantServiceProvider::class);
    config()->set('pennant.default', 'array');
    Feature::for($this->user)->deactivate(CortexFeature::class);

    $this->actingAs($this->user)->getJson(route('atrium.screens.show', 'cortex.records'))->assertNotFound();
});

describe('an extension resolver that fails (AC 33)', function (): void {
    beforeEach(function (): void {
        Atrium::screens()
            ->section('cortex.record', 'before', SectionDefinition::make('acme.broken')->public()->resolve(fn (): array => throw new RuntimeException('Section down')))
            ->section('cortex.record', 'before', SectionDefinition::make('acme.fine')->public()->resolve(fn (): array => ['ok' => true]));
    });

    it('is isolated to its section outside local and testing, and reported', function (): void {
        $this->withEnvironment('production');
        Exceptions::fake();

        expect(screenRouteGet($this, 'cortex.record')['sections']['before'])->toBe([
            ['key' => 'acme.broken', 'label' => 'acme.broken', 'component' => 'acme.broken', 'data' => null, 'error' => ['message' => 'Section failed to load']],
            ['key' => 'acme.fine', 'label' => 'acme.fine', 'component' => 'acme.fine', 'data' => ['ok' => true]],
        ]);

        Exceptions::assertReported(fn (RuntimeException $exception): bool => $exception->getMessage() === 'Section down');
    });

    it('propagates in testing as a 500', function (): void {
        $this->actingAs($this->user)->getJson(route('atrium.screens.show', 'cortex.record'))->assertStatus(500);
    });
});
