<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Exceptions;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;
use RefactorCircus\Atrium\Tests\Feature\Screens\JsonScreenHost;

/*
 * AC 33: outside local and testing, an extension whose resolver fails gets
 * `data: null` and an `error`, and the rest of the screen answers 200; in
 * local and testing the failure propagates.
 */

beforeEach(function (): void {
    JsonScreenHost::register();
});

it('isolates a resolver that throws, an HTTP exception included, outside local and testing', function (): void {
    $this->withEnvironment('production');
    Exceptions::fake();

    Atrium::screens()
        ->section('test.host', 'after', SectionDefinition::make('acme.aborts')->public()->resolve(fn (): array => abort(404)))
        ->section('test.host', 'after', SectionDefinition::make('acme.fails')->public()->resolve(fn (): array => throw new LogicException('The resolver failed.')))
        ->section('test.host', 'after', SectionDefinition::make('acme.fine')->public()->resolve(fn (): array => ['ok' => true]));

    $after = $this->getJson(route('test.host'))->assertOk()->json('data.sections.after');

    expect(array_column($after, 'error', 'key'))->toBe([
        'acme.aborts' => ['message' => 'Section failed to load'],
        'acme.fails' => ['message' => 'Section failed to load'],
    ])
        ->and(array_column($after, 'data', 'key'))->toBe(['acme.aborts' => null, 'acme.fails' => null, 'acme.fine' => ['ok' => true]]);

    Exceptions::assertReported(fn (LogicException $exception): bool => $exception->getMessage() === 'The resolver failed.');
});

it('isolates a row section failing in each row, outside local and testing', function (): void {
    $this->withEnvironment('production');
    Exceptions::fake();

    $calls = 0;

    Atrium::screens()->section('test.list', 'row.actions', SectionDefinition::make('acme.row-broken')->public()
        ->resolve(function () use (&$calls): array {
            $calls++;

            throw new RuntimeException('The row resolver failed.');
        }));

    $rows = $this->getJson(route('test.list'))->assertOk()->json('data.rows');

    expect(array_keys($rows))->toBe([1, 2, 3])
        ->and(array_column(array_merge(...array_column($rows, 'row.actions')), 'error'))->toBe(array_fill(0, 3, ['message' => 'Section failed to load']))
        ->and($calls)->toBe(3);

    Exceptions::assertReported(fn (RuntimeException $exception): bool => $exception->getMessage() === 'The row resolver failed.');
});

it('lets a failing section or open tab fail the request in testing and local', function (string $environment, array $query): void {
    if ($environment === 'local') {
        $this->withEnvironment('local');
    }

    Atrium::screens()
        ->tab('test.host', TabDefinition::make('acme.broken')->public()->resolve(fn (): array => throw new RuntimeException('The tab failed.')))
        ->section('test.host', $query === [] ? 'before' : 'unused', SectionDefinition::make('acme.broken')->public()
            ->resolve(fn (): array => throw new RuntimeException('The section failed.')));

    $this->getJson(route('test.host', $query))->assertStatus(500);
})->with(['testing', 'local'])->with([
    'a section' => [[]],
    'the open tab' => [['tab' => 'acme.broken']],
]);
