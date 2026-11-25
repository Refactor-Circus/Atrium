<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Exceptions;

/**
 * A widget, screen extension or settings panel resolved data the JSON API
 * cannot send: a closure, HTML, another object with no JSON form, a cycle,
 * or data nested too deep. It is the resolving package's bug, so it is a
 * 500 rather than `{}` sent in the value's place.
 */
final class UnserializableDataException extends AtriumException
{
    protected int $status = 500;

    private function __construct(
        public readonly string $owner,
        public readonly string $path,
        string $message,
    ) {
        parent::__construct($message);
    }

    /**
     * A value JSON cannot carry: `Widget [orders] returned unserializable
     * data at [rows.0.cell]: Closure`.
     */
    public static function forValue(string $owner, string $path, mixed $value): self
    {
        return new self($owner, $path, "{$owner} returned unserializable data at [{$path}]: ".get_debug_type($value));
    }

    /**
     * An object whose serialized form contains the object itself.
     */
    public static function forCycle(string $owner, string $path, object $value): self
    {
        return new self($owner, $path, "{$owner} returned a cyclic structure at [{$path}]: ".get_debug_type($value));
    }

    /**
     * Data nested deeper than the limit, such as an array that contains
     * itself by reference.
     */
    public static function forDepth(string $owner, string $path, int $limit): self
    {
        return new self($owner, $path, "{$owner} returned data nested deeper than {$limit} levels at [{$path}]");
    }
}
