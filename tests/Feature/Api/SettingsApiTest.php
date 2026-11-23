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
 * Settings over the API (AC 11, 33): the panel list as summaries, one panel
 * as `{key, component, data}`, each with its screen.
 */

beforeEach(function (): void {
    Gate::define('viewAtrium', fn ($user = null): bool => true);

    $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);
});

it('lists the panels as summaries, with the settings screen', function (): void {
    $resolved = 0;

    app(SettingsRegistry::class)
        ->add(SettingsPanel::make('shop')->label('Shop')->icon('i-lucide-store')->sort(2)->resolve(function () use (&$resolved): array {
            $resolved++;

            return ['currency' => 'USD'];
        }))
        ->add(SettingsPanel::make('mail')->label('Mail')->component('acme-mail')->sort(1));

    $this->actingAs($this->user)->getJson(route('atrium.settings.index'))
        ->assertOk()
        ->assertExactJson([
            'data' => [
                ['key' => 'mail', 'label' => 'Mail', 'icon' => null, 'component' => 'acme-mail'],
                ['key' => 'shop', 'label' => 'Shop', 'icon' => 'i-lucide-store', 'component' => 'shop'],
            ],
            'screen' => [
                'key' => 'atrium.settings',
                'kind' => 'list',
                'open_tab' => 'overview',
                'tabs' => [
                    ['key' => 'overview', 'label' => 'Overview', 'icon' => 'i-lucide-layout-grid', 'built_in' => true, 'component' => null],
                ],
                'sections' => ['header.actions' => [], 'before' => [], 'after' => []],
                'rows' => ['mail' => ['row.actions' => []], 'shop' => ['row.actions' => []]],
            ],
        ]);

    expect($resolved)->toBe(0);
});

it('serves one panel as {key, component, data}, with its screen', function (): void {
    app(SettingsRegistry::class)->add(SettingsPanel::make('shop')->label('Shop')->description('Prices and currency')
        ->component('acme-shop')->resolve(fn (): array => ['currency' => 'USD', 'since' => now()->startOfDay()]));

    $this->travelTo('2026-11-23 10:00:00');

    $this->actingAs($this->user)->getJson(route('atrium.settings.show', 'shop'))
        ->assertOk()
        ->assertExactJson([
            'data' => [
                'key' => 'shop',
                'label' => 'Shop',
                'description' => 'Prices and currency',
                'icon' => null,
                'component' => 'acme-shop',
                'data' => ['currency' => 'USD', 'since' => '2026-11-23T00:00:00.000000Z'],
            ],
            'screen' => [
                'key' => 'atrium.settings-panel',
                'kind' => 'detail',
                'open_tab' => 'overview',
                'tabs' => [
                    ['key' => 'overview', 'label' => 'Overview', 'icon' => 'i-lucide-layout-grid', 'built_in' => true, 'component' => null],
                ],
                'sections' => ['header.actions' => [], 'before' => [], 'after' => [], 'aside' => []],
                'rows' => [],
            ],
        ]);
});

it('sends an empty data object for a panel without a resolver', function (): void {
    app(SettingsRegistry::class)->add(SettingsPanel::make('plain'));

    $response = $this->actingAs($this->user)->getJson(route('atrium.settings.show', 'plain'))->assertOk();

    expect($response->getContent())->toContain('"component":"plain","data":{}');
});

it('answers 404 for an unknown panel and one the user may not see', function (): void {
    app(SettingsRegistry::class)->add(SettingsPanel::make('closed')->authorize(fn (): bool => false));

    $this->actingAs($this->user)->getJson(route('atrium.settings.show', 'nope'))->assertNotFound();
    $this->actingAs($this->user)->getJson(route('atrium.settings.show', 'closed'))->assertNotFound();
});

it('opens a registered tab on the panel screen with ?tab=', function (): void {
    app(SettingsRegistry::class)->add(SettingsPanel::make('shop'));

    Atrium::screens()->tab('atrium.settings-panel', TabDefinition::make('acme.audit')->label('Audit')->public()
        ->resolve(fn (): array => ['entries' => 2]));

    $this->actingAs($this->user)->getJson(route('atrium.settings.show', ['panel' => 'shop', 'tab' => 'acme.audit']))
        ->assertOk()
        ->assertJsonPath('screen.open_tab', 'acme.audit')
        ->assertJsonPath('screen.tabs.1', [
            'key' => 'acme.audit',
            'label' => 'Audit',
            'icon' => 'i-lucide-layout-grid',
            'built_in' => false,
            'component' => 'acme.audit',
            'data' => ['entries' => 2],
        ]);
});

it('sends a settings row section once per panel, with the panel row as its record', function (): void {
    app(SettingsRegistry::class)
        ->add(SettingsPanel::make('alpha')->sort(1))
        ->add(SettingsPanel::make('beta')->sort(2));

    $asked = [];

    Atrium::screens()->section('atrium.settings', 'row.actions', SectionDefinition::make('acme.row-action')
        ->authorize(function ($request, $record) use (&$asked): bool {
            $asked[] = $record->panel->key;

            return $record->getKey() === 'beta';
        })
        ->resolve(fn ($record): array => ['panel' => $record->panel->key]));

    $this->actingAs($this->user)->getJson(route('atrium.settings.index'))
        ->assertOk()
        ->assertJsonPath('screen.rows.alpha', ['row.actions' => []])
        ->assertJsonPath('screen.rows.beta', ['row.actions' => [
            ['key' => 'acme.row-action', 'label' => 'acme.row-action', 'component' => 'acme.row-action', 'data' => ['panel' => 'beta']],
        ]]);

    expect($asked)->toBe(['alpha', 'beta']);
});

describe('a panel resolver that fails', function (): void {
    beforeEach(function (): void {
        app(SettingsRegistry::class)
            ->add(SettingsPanel::make('broken')->resolve(fn (): array => throw new RuntimeException('Panel down')))
            ->add(SettingsPanel::make('unserializable')->resolve(fn (): array => ['html' => new HtmlString('<b>x</b>')]));
    });

    it('is isolated outside local and testing: data null, an error, reported, and 200', function (string $panel, string $exception): void {
        $this->withEnvironment('production');
        Exceptions::fake();

        $this->actingAs($this->user)->getJson(route('atrium.settings.show', $panel))
            ->assertOk()
            ->assertJsonPath('data.key', $panel)
            ->assertJsonPath('data.data', null)
            ->assertJsonPath('data.error', ['message' => 'Settings panel failed to load'])
            ->assertJsonPath('screen.key', 'atrium.settings-panel');

        Exceptions::assertReported($exception);
    })->with([
        'throwing' => ['broken', RuntimeException::class],
        'unserializable' => ['unserializable', UnserializableDataException::class],
    ]);

    it('propagates in testing as a 500', function (string $panel): void {
        $this->actingAs($this->user)->getJson(route('atrium.settings.show', $panel))->assertStatus(500);
    })->with(['broken', 'unserializable']);

    it('propagates in local as a 500', function (): void {
        $this->withEnvironment('local');

        $this->actingAs($this->user)->getJson(route('atrium.settings.show', 'broken'))->assertStatus(500);
    });
});
