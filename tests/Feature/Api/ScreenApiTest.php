<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\HtmlString;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Exceptions\UnserializableDataException;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Models\User;

/*
 * A resolved screen over the API (AC 11, 33), served by ResolvedScreenResource
 * on the settings panel screen (`atrium.settings-panel`, a detail screen).
 */

beforeEach(function (): void {
    Gate::define('viewAtrium', fn ($user = null): bool => true);

    app(SettingsRegistry::class)->add(SettingsPanel::make('shop'));

    $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);
    $this->calls = new ArrayObject;
});

/**
 * A resolver that counts its calls under its name.
 *
 * @return Closure(): array<string, mixed>
 */
function screenApiResolver(ArrayObject $calls, string $name): Closure
{
    $calls[$name] = 0;

    return function () use ($calls, $name): array {
        $calls[$name]++;

        return ['from' => $name];
    };
}

/**
 * Two public tabs and a section in every slot of the panel screen, each
 * counting its resolver.
 */
function screenApiRegister(ArrayObject $calls): void
{
    Atrium::screens()
        ->tab('atrium.settings-panel', TabDefinition::make('acme.first')->label('First')->icon('i-lucide-list')->public()->resolve(screenApiResolver($calls, 'first tab')))
        ->tab('atrium.settings-panel', TabDefinition::make('acme.second')->label('Second')->component('acme-second')->public()->resolve(screenApiResolver($calls, 'second tab')));

    foreach (['header.actions', 'before', 'after', 'aside'] as $slot) {
        Atrium::screens()->section('atrium.settings-panel', $slot, SectionDefinition::make('acme.'.$slot)->public()->resolve(screenApiResolver($calls, $slot)));
    }
}

/**
 * The screen of the shop panel's response.
 *
 * @param  array<string, mixed>  $query
 * @return array<string, mixed>
 */
function screenApiGet(object $test, array $query = []): array
{
    return $test->actingAs($test->user)->getJson(route('atrium.settings.show', ['panel' => 'shop', ...$query]))->assertOk()->json('screen');
}

it('resolves every slot\'s sections, and no registered tab\'s data, on the built-in tab', function (): void {
    screenApiRegister($this->calls);

    $screen = screenApiGet($this);

    expect($screen['open_tab'])->toBe('overview')
        ->and($screen['tabs'])->toBe([
            ['key' => 'overview', 'label' => 'Overview', 'icon' => 'i-lucide-layout-grid', 'built_in' => true, 'component' => null],
            ['key' => 'acme.first', 'label' => 'First', 'icon' => 'i-lucide-list', 'built_in' => false, 'component' => 'acme.first'],
            ['key' => 'acme.second', 'label' => 'Second', 'icon' => 'i-lucide-layout-grid', 'built_in' => false, 'component' => 'acme-second'],
        ])
        ->and($screen['sections']['before'])->toBe([
            ['key' => 'acme.before', 'label' => 'acme.before', 'component' => 'acme.before', 'data' => ['from' => 'before']],
        ])
        ->and($this->calls->getArrayCopy())->toBe([
            'first tab' => 0,
            'second tab' => 0,
            'header.actions' => 1,
            'before' => 1,
            'after' => 1,
            'aside' => 1,
        ]);
});

it('resolves only the open tab\'s data, and only header.actions around it', function (): void {
    screenApiRegister($this->calls);

    $screen = screenApiGet($this, ['tab' => 'acme.second']);

    expect($screen['open_tab'])->toBe('acme.second')
        ->and($screen['tabs'][1])->not->toHaveKey('data')
        ->and($screen['tabs'][2]['data'])->toBe(['from' => 'second tab'])
        ->and($screen['sections'])->toBe([
            'header.actions' => [['key' => 'acme.header.actions', 'label' => 'acme.header.actions', 'component' => 'acme.header.actions', 'data' => ['from' => 'header.actions']]],
            'before' => [],
            'after' => [],
            'aside' => [],
        ])
        ->and($this->calls->getArrayCopy())->toBe([
            'first tab' => 0,
            'second tab' => 1,
            'header.actions' => 1,
            'before' => 0,
            'after' => 0,
            'aside' => 0,
        ]);
});

it('falls back to the default tab for an unknown ?tab=', function (mixed $tab): void {
    screenApiRegister($this->calls);

    $screen = screenApiGet($this, ['tab' => $tab]);

    expect($screen['open_tab'])->toBe('overview')
        ->and(array_filter($screen['tabs'], fn (array $entry): bool => array_key_exists('data', $entry)))->toBe([])
        ->and($this->calls['first tab'] + $this->calls['second tab'])->toBe(0)
        ->and($this->calls['before'])->toBe(1);
})->with([
    'an unknown key' => ['acme.unknown'],
    'an array' => [['acme.first']],
]);

it('answers 403 for ?tab= naming a tab the viewer may not see', function (): void {
    Atrium::screens()->tab('atrium.settings-panel', TabDefinition::make('acme.hidden')->authorize(fn (): bool => false));

    $this->actingAs($this->user)->getJson(route('atrium.settings.show', ['panel' => 'shop', 'tab' => 'acme.hidden']))->assertForbidden();
});

it('leaves out extensions the viewer may not see, asking the Gate about permission()s', function (bool $allowed): void {
    Gate::define('acme.see', fn (User $user): bool => $allowed);

    Atrium::screens()
        ->tab('atrium.settings-panel', TabDefinition::make('acme.gated')->permission('acme.see'))
        ->section('atrium.settings-panel', 'before', SectionDefinition::make('acme.gated')->permission('acme.see'));

    $screen = screenApiGet($this);

    expect(array_column($screen['tabs'], 'key'))->toBe($allowed ? ['overview', 'acme.gated'] : ['overview'])
        ->and(array_column($screen['sections']['before'], 'key'))->toBe($allowed ? ['acme.gated'] : []);
})->with(['allowed' => [true], 'denied' => [false]]);

it('sends an empty data object for an extension without a resolver', function (): void {
    Atrium::screens()->section('atrium.settings-panel', 'before', SectionDefinition::make('acme.plain')->public());

    $content = $this->actingAs($this->user)->getJson(route('atrium.settings.show', 'shop'))->assertOk()->getContent();

    expect($content)->toContain('"component":"acme.plain","data":{}');
});

describe('an extension resolver that fails', function (): void {
    beforeEach(function (): void {
        Atrium::screens()
            ->tab('atrium.settings-panel', TabDefinition::make('acme.broken-tab')->public()->resolve(fn (): array => throw new RuntimeException('Tab down')))
            ->section('atrium.settings-panel', 'before', SectionDefinition::make('acme.broken')->public()->resolve(fn (): array => throw new RuntimeException('Section down')))
            ->section('atrium.settings-panel', 'before', SectionDefinition::make('acme.unserializable')->public()->resolve(fn (): array => ['html' => new HtmlString('<b>x</b>')]))
            ->section('atrium.settings-panel', 'before', SectionDefinition::make('acme.fine')->public()->resolve(fn (): array => ['ok' => true]));
    });

    it('is isolated to its own section outside local and testing, and reported', function (): void {
        $this->withEnvironment('production');
        Exceptions::fake();

        $sections = screenApiGet($this)['sections']['before'];

        expect($sections)->toBe([
            ['key' => 'acme.broken', 'label' => 'acme.broken', 'component' => 'acme.broken', 'data' => null, 'error' => ['message' => 'Section failed to load']],
            ['key' => 'acme.unserializable', 'label' => 'acme.unserializable', 'component' => 'acme.unserializable', 'data' => null, 'error' => ['message' => 'Section failed to load']],
            ['key' => 'acme.fine', 'label' => 'acme.fine', 'component' => 'acme.fine', 'data' => ['ok' => true]],
        ]);

        Exceptions::assertReported(fn (RuntimeException $exception): bool => $exception->getMessage() === 'Section down');
        Exceptions::assertReported(UnserializableDataException::class);
    });

    it('is isolated to the open tab outside local and testing, and reported', function (): void {
        $this->withEnvironment('production');
        Exceptions::fake();

        $screen = screenApiGet($this, ['tab' => 'acme.broken-tab']);

        expect($screen['tabs'][1])->toBe([
            'key' => 'acme.broken-tab',
            'label' => 'acme.broken-tab',
            'icon' => 'i-lucide-layout-grid',
            'built_in' => false,
            'component' => 'acme.broken-tab',
            'data' => null,
            'error' => ['message' => 'Tab failed to load'],
        ]);

        Exceptions::assertReported(fn (RuntimeException $exception): bool => $exception->getMessage() === 'Tab down');
    });

    it('propagates in testing as a 500', function (array $query): void {
        $this->actingAs($this->user)->getJson(route('atrium.settings.show', ['panel' => 'shop', ...$query]))->assertStatus(500);
    })->with([
        'a section' => [[]],
        'the open tab' => [['tab' => 'acme.broken-tab']],
    ]);

    it('propagates in local as a 500', function (): void {
        $this->withEnvironment('local');

        $this->actingAs($this->user)->getJson(route('atrium.settings.show', 'shop'))->assertStatus(500);
    });
});
