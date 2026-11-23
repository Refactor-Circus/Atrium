<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Support;

use BackedEnum;
use DateTimeInterface;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Htmlable;
use JsonSerializable;
use RefactorCircus\Atrium\Exceptions\UnserializableDataException;
use Throwable;

/**
 * Checks resolver data before the JSON API sends it. A resolver could hand
 * a Blade view a closure, a component or HTML; JSON cannot carry them.
 *
 * Accepted: null, scalars, arrays of accepted values, dates, backed enums,
 * and Arrayable or JsonSerializable objects. Those objects are serialized on
 * the way through (Arrayable through `toArray()`, so a model's `$hidden`
 * applies) and their contents are checked too. Htmlable is refused even when
 * it is also Arrayable: HTML in a JSON payload is the front end's XSS risk.
 * The walk stops at a cycle or beyond `MAX_DEPTH` levels.
 */
final class JsonData
{
    /**
     * The deepest a value may be nested below the resolver's array.
     */
    public const int MAX_DEPTH = 64;

    /**
     * The data, with every Arrayable and JsonSerializable object serialized.
     *
     * @param  array<array-key, mixed>  $data
     * @param  string  $owner  who resolved it, as `{Kind} [{key}]`: `Widget [orders]`
     * @return array<array-key, mixed>
     *
     * @throws UnserializableDataException
     */
    public static function check(array $data, string $owner): array
    {
        return self::walkArray($data, $owner, '', 0, []);
    }

    /**
     * Run a resolver and check its data, as `['data' => ...]`.
     *
     * In `local` and `testing` a failure propagates. Anywhere else it is
     * reported and isolated to `['data' => null, 'error' => ['message' =>
     * '{Kind} failed to load']]`, so one broken extension does not take the
     * rest of the response down with it.
     *
     * @param  callable(): array<array-key, mixed>  $resolver
     * @return array{data: array<array-key, mixed>|null, error?: array{message: string}}
     */
    public static function resolve(string $owner, callable $resolver): array
    {
        try {
            return ['data' => self::check($resolver(), $owner)];
        } catch (Throwable $exception) {
            if (app()->environment(['local', 'testing'])) {
                throw $exception;
            }

            report($exception);

            return ['data' => null, 'error' => ['message' => self::kind($owner).' failed to load']];
        }
    }

    /**
     * @param  array<array-key, mixed>  $data
     * @param  array<int, true>  $stack  the ids of the objects being serialized above this value
     * @return array<array-key, mixed>
     */
    private static function walkArray(array $data, string $owner, string $path, int $depth, array $stack): array
    {
        $checked = [];

        foreach ($data as $key => $item) {
            $checked[$key] = self::walkValue($item, $owner, $path === '' ? (string) $key : $path.'.'.$key, $depth + 1, $stack);
        }

        return $checked;
    }

    /**
     * @param  array<int, true>  $stack
     */
    private static function walkValue(mixed $value, string $owner, string $path, int $depth, array $stack): mixed
    {
        if ($depth > self::MAX_DEPTH) {
            throw UnserializableDataException::forDepth($owner, $path, self::MAX_DEPTH);
        }

        if ($value === null || is_scalar($value) || $value instanceof DateTimeInterface || $value instanceof BackedEnum) {
            return $value;
        }

        if (is_array($value)) {
            return self::walkArray($value, $owner, $path, $depth, $stack);
        }

        if ($value instanceof Htmlable || ! ($value instanceof Arrayable || $value instanceof JsonSerializable)) {
            throw UnserializableDataException::forValue($owner, $path, $value);
        }

        $id = spl_object_id($value);

        if (isset($stack[$id])) {
            throw UnserializableDataException::forCycle($owner, $path, $value);
        }

        $stack[$id] = true;

        // Serializing an object does not nest its data any deeper.
        return self::walkValue(
            $value instanceof Arrayable ? $value->toArray() : $value->jsonSerialize(),
            $owner,
            $path,
            $depth,
            $stack,
        );
    }

    /**
     * `Widget` for `Widget [orders]`: the error a client sees names what
     * failed, not its key.
     */
    private static function kind(string $owner): string
    {
        $bracket = strpos($owner, ' [');

        return $bracket === false ? $owner : substr($owner, 0, $bracket);
    }
}
