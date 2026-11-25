<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Exceptions;
use RefactorCircus\Atrium\Exceptions\UnserializableDataException;
use RefactorCircus\Atrium\Support\JsonData;

it('returns the checked data of a resolver that succeeds', function (): void {
    expect(JsonData::resolve('Widget [orders]', fn (): array => ['total' => 3, 'rows' => collect([1, 2])]))
        ->toBe(['data' => ['total' => 3, 'rows' => [1, 2]]]);
});

it('isolates a resolver that throws outside local and testing, and reports it', function (): void {
    Exceptions::fake();
    $this->withEnvironment('production');

    $result = JsonData::resolve('Widget [orders]', fn (): array => throw new RuntimeException('Orders API is down.'));

    expect($result)->toBe(['data' => null, 'error' => ['message' => 'Widget failed to load']]);

    Exceptions::assertReported(fn (RuntimeException $exception): bool => $exception->getMessage() === 'Orders API is down.');
});

it('isolates data that fails the check outside local and testing, and reports it', function (): void {
    Exceptions::fake();
    $this->withEnvironment('production');

    $result = JsonData::resolve('Widget [orders]', fn (): array => ['cell' => fn (): int => 1]);

    expect($result)->toBe(['data' => null, 'error' => ['message' => 'Widget failed to load']]);

    Exceptions::assertReported(UnserializableDataException::class);
});

it('names the kind of owner that failed, never its key', function (): void {
    Exceptions::fake();
    $this->withEnvironment('staging');

    expect(JsonData::resolve('Settings panel [shop]', fn (): array => throw new RuntimeException('x')))
        ->toBe(['data' => null, 'error' => ['message' => 'Settings panel failed to load']]);
});

it('rethrows in local and testing', function (string $environment): void {
    Exceptions::fake();
    $this->withEnvironment($environment);

    expect(fn (): array => JsonData::resolve('Widget [orders]', fn (): array => ['cell' => fn (): int => 1]))
        ->toThrow(UnserializableDataException::class, 'Widget [orders] returned unserializable data at [cell]: Closure');

    Exceptions::assertNothingReported();
})->with(['local', 'testing']);
