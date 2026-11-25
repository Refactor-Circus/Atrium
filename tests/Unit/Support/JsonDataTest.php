<?php

declare(strict_types=1);

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Htmlable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\HtmlString;
use RefactorCircus\Atrium\Exceptions\AtriumException;
use RefactorCircus\Atrium\Exceptions\UnserializableDataException;
use RefactorCircus\Atrium\Support\JsonData;

enum JsonDataStatus: string
{
    case Open = 'open';
}

enum JsonDataPureEnum
{
    case Open;
}

final class JsonDataSecretModel extends Model
{
    protected $guarded = [];

    protected $hidden = ['secret'];
}

/**
 * Nest a value $levels arrays deep under the key `a`.
 *
 * @return array<string, mixed>
 */
function jsonDataNest(int $levels, mixed $leaf): array
{
    $value = $leaf;

    for ($level = 0; $level < $levels; $level++) {
        $value = ['a' => $value];
    }

    /** @var array<string, mixed> $value */
    return $value;
}

function jsonDataFailure(Closure $callback): UnserializableDataException
{
    try {
        $callback();
    } catch (UnserializableDataException $exception) {
        return $exception;
    }

    throw new RuntimeException('Expected an UnserializableDataException.');
}

it('passes scalars, null, nested arrays, dates and backed enums through unchanged', function (): void {
    $date = Carbon::parse('2026-11-22 10:00:00');
    $immutable = new DateTimeImmutable('2026-11-22 10:00:00');

    $data = [
        'null' => null,
        'int' => 1,
        'float' => 1.5,
        'string' => 'orders',
        'bool' => false,
        'list' => [1, [2, ['three']]],
        'carbon' => $date,
        'immutable' => $immutable,
        'carbon_immutable' => CarbonImmutable::parse('2026-11-22'),
        'enum' => JsonDataStatus::Open,
    ];

    expect(JsonData::check($data, 'Widget [orders]'))->toBe($data);
});

it('serializes a JsonSerializable object to its JSON form', function (): void {
    $value = new class implements JsonSerializable
    {
        /** @return array<string, int> */
        public function jsonSerialize(): array
        {
            return ['total' => 3];
        }
    };

    expect(JsonData::check(['stats' => $value], 'Widget [orders]'))->toBe(['stats' => ['total' => 3]]);
});

it('serializes an Arrayable object through toArray()', function (): void {
    $value = new class implements Arrayable
    {
        /** @return array<string, int> */
        public function toArray(): array
        {
            return ['total' => 4];
        }
    };

    expect(JsonData::check(['stats' => $value], 'Widget [orders]'))->toBe(['stats' => ['total' => 4]]);
});

it('serializes a Collection to an array', function (): void {
    expect(JsonData::check(['rows' => new Collection([1, 2])], 'Widget [orders]'))->toBe(['rows' => [1, 2]]);
});

it('serializes a model through toArray(), so its hidden attributes stay out', function (): void {
    $model = new JsonDataSecretModel(['name' => 'Ada', 'secret' => 'hunter2']);

    expect(JsonData::check(['user' => $model], 'Widget [orders]'))->toBe(['user' => ['name' => 'Ada']]);
});

// Typed `object`, not `mixed`, so Pest calls each dataset closure for its value.
it('rejects data JSON cannot carry', function (object $value, string $type): void {
    $exception = jsonDataFailure(fn (): array => JsonData::check(['value' => $value], 'Widget [orders]'));

    expect($exception->getMessage())->toBe("Widget [orders] returned unserializable data at [value]: {$type}");
})->with([
    'a closure' => [fn (): Closure => fn (): int => 1, 'Closure'],
    'an Htmlable' => [fn (): HtmlString => new HtmlString('<b>x</b>'), HtmlString::class],
    'a plain object' => [fn (): stdClass => new stdClass, 'stdClass'],
    'a pure enum' => [fn (): JsonDataPureEnum => JsonDataPureEnum::Open, JsonDataPureEnum::class],
]);

it('rejects an Htmlable even when it is also Arrayable', function (): void {
    $value = new class implements Arrayable, Htmlable
    {
        /** @return array<int, string> */
        public function toArray(): array
        {
            return [];
        }

        public function toHtml(): string
        {
            return '<b>x</b>';
        }
    };

    expect(fn (): array => JsonData::check(['value' => $value], 'Widget [orders]'))
        ->toThrow(UnserializableDataException::class);
});

it('names the owner and the full path of the bad value', function (): void {
    $exception = jsonDataFailure(fn (): array => JsonData::check(
        ['rows' => [['cell' => fn (): string => 'x']]],
        'Widget [orders]',
    ));

    expect($exception->getMessage())->toBe('Widget [orders] returned unserializable data at [rows.0.cell]: Closure')
        ->and($exception->owner)->toBe('Widget [orders]')
        ->and($exception->path)->toBe('rows.0.cell');
});

it('finds a bad value inside a collection', function (): void {
    $exception = jsonDataFailure(fn (): array => JsonData::check(
        ['rows' => new Collection([['cell' => new stdClass]])],
        'Widget [orders]',
    ));

    expect($exception->getMessage())->toBe('Widget [orders] returned unserializable data at [rows.0.cell]: stdClass');
});

it('is a final Atrium exception with status 500', function (): void {
    $exception = UnserializableDataException::forValue('Widget [orders]', 'rows', fn (): null => null);

    expect($exception)->toBeInstanceOf(AtriumException::class)
        ->and((new ReflectionClass(UnserializableDataException::class))->isFinal())->toBeTrue()
        ->and($exception->render()->getStatusCode())->toBe(500);
});

it('accepts data nested up to the depth limit', function (): void {
    $data = jsonDataNest(JsonData::MAX_DEPTH, 1);

    expect(JsonData::check($data, 'Widget [orders]'))->toBe($data);
});

it('rejects data nested beyond the depth limit', function (): void {
    $exception = jsonDataFailure(fn (): array => JsonData::check(jsonDataNest(JsonData::MAX_DEPTH + 1, 1), 'Widget [orders]'));

    expect($exception->getMessage())->toStartWith('Widget [orders] returned data nested deeper than '.JsonData::MAX_DEPTH.' levels at [a.a.');
});

it('rejects an array that contains itself by reference', function (): void {
    $data = ['name' => 'loop'];
    $data['self'] = &$data;

    expect(fn (): array => JsonData::check($data, 'Widget [orders]'))->toThrow(UnserializableDataException::class);
});

it('rejects an object whose serialized form contains itself', function (): void {
    $value = new class implements JsonSerializable
    {
        /** @return array<string, mixed> */
        public function jsonSerialize(): array
        {
            return ['self' => $this];
        }
    };

    $exception = jsonDataFailure(fn (): array => JsonData::check(['node' => $value], 'Widget [orders]'));

    expect($exception->getMessage())->toStartWith('Widget [orders] returned a cyclic structure at [node.self]: ');
});

it('accepts the same object twice when it does not contain itself', function (): void {
    $shared = new Collection(['x' => 1]);

    expect(JsonData::check(['a' => $shared, 'b' => $shared], 'Widget [orders]'))->toBe(['a' => ['x' => 1], 'b' => ['x' => 1]]);
});
