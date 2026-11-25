<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanelRow;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Models\User;

/*
 * Atrium's own settings screens: each declares itself with
 * Screen::standard() and sends its tabs, the open registered tab's data and
 * the sections of every slot it declares. The dashboard screens are covered
 * with the dashboard API.
 */

beforeEach(function (): void {
    Gate::define('viewAtrium', fn ($user = null): bool => true);

    app(SettingsRegistry::class)->add(SettingsPanel::make('full')->label('Full Settings'));

    $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);
});

/**
 * Register a public tab on the screen, and a public section in each of the
 * given slots, counting each section's resolver calls by slot.
 *
 * @param  list<string>  $slots
 */
function atriumScreensRegister(string $screen, array $slots, ArrayObject $calls): void
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
 * Every section key sent in the screen's slots and its rows' slots, by slot.
 *
 * @param  array<string, mixed>  $screen
 * @return array<string, list<string>>
 */
function atriumScreensSlots(array $screen): array
{
    $keys = [];

    foreach ([$screen['sections'], ...array_values($screen['rows'])] as $slots) {
        foreach ($slots as $slot => $sections) {
            foreach ($sections as $section) {
                $keys[$slot][] = $section['key'];
            }
        }
    }

    return $keys;
}

dataset('atrium screens', [
    // The panel is the settings index's one row, so its `row.actions`
    // section is sent, and resolved, once.
    'the settings index' => ['atrium.settings', fn (): string => route('atrium.settings.index'), ['header.actions', 'before', 'row.actions', 'after'], ['aside']],
    'a settings panel' => ['atrium.settings-panel', fn (): string => route('atrium.settings.show', 'full'), ['header.actions', 'before', 'aside', 'after'], ['row.actions']],
]);

it('sends each registered section in its own slot and none in an undeclared one', function (string $screen, Closure $url, array $slots, array $undeclared): void {
    $calls = new ArrayObject;
    atriumScreensRegister($screen, [...$slots, ...$undeclared], $calls);

    $payload = $this->actingAs($this->user)->getJson($url())->assertOk()->json('screen');

    expect($payload['key'])->toBe($screen)
        ->and(atriumScreensSlots($payload))->toEqual(array_combine($slots, array_map(fn (string $slot): array => ['acme.'.$slot], $slots)))
        ->and($calls->getArrayCopy())->toBe([...array_fill_keys($slots, 1), ...array_fill_keys($undeclared, 0)]);
})->with('atrium screens');

it('lists the registered tab and opens it through ?tab=, with only header.actions beside it', function (string $screen, Closure $url, array $slots): void {
    $calls = new ArrayObject;
    atriumScreensRegister($screen, $slots, $calls);

    $this->actingAs($this->user)->getJson($url())
        ->assertOk()
        ->assertJsonPath('screen.tabs.*.key', ['overview', 'acme.tab'])
        ->assertJsonPath('screen.open_tab', 'overview');

    // A fresh request, so nothing is remembered from the one above.
    app()->forgetScopedInstances();
    $calls->exchangeArray(array_fill_keys($slots, 0));

    $payload = $this->actingAs($this->user)->getJson($url().'?tab=acme.tab')->assertOk()->json('screen');

    expect($payload['open_tab'])->toBe('acme.tab')
        ->and($payload['tabs'][1]['data'])->toBe(['marker' => 'the acme panel'])
        ->and(atriumScreensSlots($payload))->toBe(['header.actions' => ['acme.header.actions']])
        ->and($calls->getArrayCopy())->toBe([...array_fill_keys($slots, 0), 'header.actions' => 1]);
})->with('atrium screens');

it('sends only the overview tab and empty slots while nothing is registered', function (string $screen, Closure $url): void {
    $payload = $this->actingAs($this->user)->getJson($url())->assertOk()->json('screen');

    expect(array_column($payload['tabs'], 'key'))->toBe(['overview'])
        ->and(atriumScreensSlots($payload))->toBe([]);
})->with('atrium screens');

it('shows a permission() extension only while the Gate allows it', function (bool $allowed, string $screen, Closure $url): void {
    Gate::define('acme.see', fn (User $user, mixed ...$arguments): bool => $allowed);

    Atrium::screens()
        ->tab($screen, TabDefinition::make('acme.gated-tab')->permission('acme.see'))
        ->section($screen, 'header.actions', SectionDefinition::make('acme.gated')->permission('acme.see'));

    $payload = $this->actingAs($this->user)->getJson($url())->assertOk()->json('screen');

    expect(array_column($payload['tabs'], 'key'))->toBe($allowed ? ['overview', 'acme.gated-tab'] : ['overview'])
        ->and(atriumScreensSlots($payload))->toBe($allowed ? ['header.actions' => ['acme.gated']] : []);
})->with([
    'allowed' => [true],
    'denied' => [false],
])->with('atrium screens');

it('asks the Gate with no arguments, since a settings screen has no record', function (string $screen, Closure $url): void {
    $received = [];

    Gate::define('acme.see', function (User $user, mixed ...$arguments) use (&$received): bool {
        $received[] = $arguments;

        return true;
    });

    Atrium::screens()->section($screen, 'header.actions', SectionDefinition::make('acme.gated')->permission('acme.see'));

    $this->actingAs($this->user)->getJson($url())->assertOk();

    expect($received)->toBe([[]]);
})->with('atrium screens');

it('sends row.actions once per settings panel row, with that row as the record', function (): void {
    app(SettingsRegistry::class)
        ->add(SettingsPanel::make('alpha')->label('Alpha')->sort(1))
        ->add(SettingsPanel::make('beta')->label('Beta')->sort(2));

    $asked = [];
    $resolved = [];

    Atrium::screens()->section('atrium.settings', 'row.actions', SectionDefinition::make('acme.row-action')
        ->authorize(function (Request $request, ?Model $record, Screen $screen) use (&$asked): bool {
            $asked[] = [get_debug_type($record), $record?->getKey(), $record instanceof SettingsPanelRow ? $record->panel->key : null, $screen->key];

            return $record?->getKey() === 'beta';
        })
        ->resolve(function (?Model $record) use (&$resolved): array {
            $resolved[] = $record?->getKey();

            return ['marker' => 'row action'];
        }));

    $rows = $this->actingAs($this->user)->getJson(route('atrium.settings.index'))->assertOk()->json('screen.rows');

    // The rows are the panels in order: alpha, beta, then full.
    expect(array_keys($rows))->toBe(['alpha', 'beta', 'full'])
        ->and(array_map(fn (array $slots): array => array_column($slots['row.actions'], 'key'), $rows))->toBe([
            'alpha' => [],
            'beta' => ['acme.row-action'],
            'full' => [],
        ])
        ->and($asked)->toBe([
            [SettingsPanelRow::class, 'alpha', 'alpha', 'atrium.settings'],
            [SettingsPanelRow::class, 'beta', 'beta', 'atrium.settings'],
            [SettingsPanelRow::class, 'full', 'full', 'atrium.settings'],
        ])
        ->and($resolved)->toBe(['beta']);
});

it('keys an unsaved settings panel row by its panel key and carries the panel', function (): void {
    $panel = SettingsPanel::make('billing')->label('Billing');
    $row = SettingsPanelRow::for($panel);

    expect($row->getKey())->toBe('billing')
        ->and($row->panel)->toBe($panel)
        ->and($row->exists)->toBeFalse();
});
