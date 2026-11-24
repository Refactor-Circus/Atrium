<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Support;

use JsonException;
use RuntimeException;
use stdClass;

/**
 * The integration manifest's JSON Schema (`ui/sdk/schema/integration.schema.json`,
 * shipped with the package and published in the SDK), and a validator for the
 * subset of JSON Schema it uses: `$ref` to `#/$defs/…`, `type`, `const`,
 * `enum`, `properties`, `required`, `additionalProperties`, `propertyNames`,
 * `minProperties`, `maxProperties`, `items`, `minItems`, `maxItems`,
 * `minLength`, `pattern`, `minimum`, `allOf`, `anyOf`, `oneOf` and `not`.
 * The SDK's `validateIntegrationManifest()` reads the same file with the same
 * rules, so a module's tests and Atrium agree.
 *
 * It reads JSON decoded without `assoc`: an object is a `stdClass` and an
 * array a list, so `{}` and `[]` stay apart; an empty `[]` also passes where
 * an object is expected, as PHP's `json_encode([])` writes `{}` that way.
 */
final class ManifestSchema
{
    public const string PATH = __DIR__.'/../../../../ui/sdk/schema/integration.schema.json';

    /**
     * @var array<string, mixed>|null
     */
    private static ?array $schema = null;

    /**
     * The first error in the value, as `[pointer, message]`, or null when it
     * is valid.
     *
     * @return array{string, string}|null
     */
    public static function validate(mixed $value): ?array
    {
        $schema = self::schema();

        return self::check($value, $schema, '', $schema);
    }

    /**
     * @return array<string, mixed>
     */
    public static function schema(): array
    {
        if (self::$schema !== null) {
            return self::$schema;
        }

        try {
            $schema = json_decode((string) file_get_contents(self::PATH), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException('Atrium cannot read its integration manifest schema at ['.self::PATH.']: '.$exception->getMessage(), previous: $exception);
        }

        if (! is_array($schema)) {
            throw new RuntimeException('Atrium cannot read its integration manifest schema at ['.self::PATH.'].');
        }

        /** @var array<string, mixed> $schema */
        return self::$schema = $schema;
    }

    /**
     * @param  array<string, mixed>|bool  $schema
     * @param  array<string, mixed>  $root
     * @return array{string, string}|null
     */
    private static function check(mixed $value, array|bool $schema, string $pointer, array $root): ?array
    {
        if ($schema === true) {
            return null;
        }

        if ($schema === false) {
            return [$pointer, 'is not allowed'];
        }

        if (isset($schema['$ref']) && is_string($schema['$ref'])) {
            $error = self::check($value, self::resolve($schema['$ref'], $root), $pointer, $root);

            if ($error !== null) {
                return $error;
            }
        }

        foreach (['type', 'const', 'enum', 'string', 'number', 'array', 'object'] as $step) {
            $error = match ($step) {
                'type' => isset($schema['type']) ? self::type($value, $schema['type'], $pointer) : null,
                'const' => array_key_exists('const', $schema) && ! self::equal($value, $schema['const'])
                    ? [$pointer, 'must be '.self::show($schema['const'])] : null,
                'enum' => isset($schema['enum']) && is_array($schema['enum']) && ! self::inEnum($value, $schema['enum'])
                    ? [$pointer, 'must be one of '.implode(', ', array_map(self::show(...), $schema['enum']))] : null,
                'string' => is_string($value) ? self::string($value, $schema, $pointer) : null,
                'number' => (is_int($value) || is_float($value)) && isset($schema['minimum']) && $value < $schema['minimum']
                    ? [$pointer, 'must be at least '.self::show($schema['minimum'])] : null,
                'array' => self::isList($value) ? self::list($value, $schema, $pointer, $root) : null,
                'object' => self::isObject($value) || $value === [] ? self::object(self::fields($value), $schema, $pointer, $root) : null,
            };

            if ($error !== null) {
                return $error;
            }
        }

        return self::combinators($value, $schema, $pointer, $root);
    }

    /**
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>  $root
     * @return array{string, string}|null
     */
    private static function combinators(mixed $value, array $schema, string $pointer, array $root): ?array
    {
        foreach (is_array($schema['allOf'] ?? null) ? $schema['allOf'] : [] as $part) {
            $error = self::check($value, $part, $pointer, $root);

            if ($error !== null) {
                return $error;
            }
        }

        foreach (['anyOf', 'oneOf'] as $keyword) {
            if (! isset($schema[$keyword]) || ! is_array($schema[$keyword])) {
                continue;
            }

            $errors = [];
            $matches = 0;

            foreach ($schema[$keyword] as $part) {
                $error = self::check($value, $part, $pointer, $root);

                if ($error === null) {
                    $matches++;
                } else {
                    $errors[] = $error;
                }
            }

            if ($matches === 0) {
                return self::deepest($errors, $pointer);
            }

            if ($keyword === 'oneOf' && $matches > 1) {
                return [$pointer, 'matches more than one of the allowed shapes'];
            }
        }

        if (isset($schema['not']) && self::check($value, $schema['not'], $pointer, $root) === null) {
            return [$pointer, 'is not allowed here'.(self::isObject($value) ? ' (an object with a $ key must be an expression)' : '')];
        }

        return null;
    }

    /**
     * The most telling of several branches' errors: the deepest pointer, and
     * at the same depth one that is not about the value's type or constant
     * (the branch that fits the value's shape), else the first.
     *
     * @param  list<array{string, string}>  $errors
     * @return array{string, string}
     */
    private static function deepest(array $errors, string $pointer): array
    {
        $best = null;
        $bestScore = -1;

        foreach ($errors as $error) {
            $score = substr_count($error[0], '/') * 2 + (preg_match('/^must be (a |an |one of |[\[{"0-9tfn])/', $error[1]) === 1 ? 0 : 1);

            if ($score > $bestScore) {
                [$best, $bestScore] = [$error, $score];
            }
        }

        return $best ?? [$pointer, 'matches none of the allowed shapes'];
    }

    /**
     * @return array{string, string}|null
     */
    private static function type(mixed $value, mixed $types, string $pointer): ?array
    {
        $types = is_array($types) ? $types : [$types];

        foreach ($types as $type) {
            $ok = match ($type) {
                'string' => is_string($value),
                'integer' => is_int($value) || is_float($value) && floor($value) === $value,
                'number' => is_int($value) || is_float($value),
                'boolean' => is_bool($value),
                'null' => $value === null,
                'array' => self::isList($value),
                'object' => self::isObject($value) || $value === [],
                default => false,
            };

            if ($ok) {
                return null;
            }
        }

        return [$pointer, 'must be '.implode(' or ', array_map(fn (mixed $type): string => (is_string($type) && in_array($type[0] ?? '', ['a', 'i', 'o'], true) ? 'an ' : 'a ').(is_string($type) ? $type : '?'), $types))];
    }

    /**
     * @param  array<string, mixed>  $schema
     * @return array{string, string}|null
     */
    private static function string(string $value, array $schema, string $pointer): ?array
    {
        if (isset($schema['minLength']) && mb_strlen($value) < $schema['minLength']) {
            return [$pointer, $schema['minLength'] === 1 ? 'must not be empty' : 'must be at least '.self::show($schema['minLength']).' characters'];
        }

        if (isset($schema['pattern']) && is_string($schema['pattern']) && preg_match('~'.str_replace('~', '\~', $schema['pattern']).'~u', $value) !== 1) {
            return [$pointer, self::show($value).' must match '.$schema['pattern']];
        }

        return null;
    }

    /**
     * @param  list<mixed>  $value
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>  $root
     * @return array{string, string}|null
     */
    private static function list(array $value, array $schema, string $pointer, array $root): ?array
    {
        if (isset($schema['minItems']) && count($value) < $schema['minItems']) {
            return [$pointer, 'must hold at least '.self::show($schema['minItems']).' item(s)'];
        }

        if (isset($schema['maxItems']) && count($value) > $schema['maxItems']) {
            return [$pointer, 'must hold at most '.self::show($schema['maxItems']).' item(s)'];
        }

        if (isset($schema['items'])) {
            foreach ($value as $index => $item) {
                $error = self::check($item, $schema['items'], $pointer.'/'.$index, $root);

                if ($error !== null) {
                    return $error;
                }
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $value
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>  $root
     * @return array{string, string}|null
     */
    private static function object(array $value, array $schema, string $pointer, array $root): ?array
    {
        foreach (is_array($schema['required'] ?? null) ? $schema['required'] : [] as $required) {
            if (is_string($required) && ! array_key_exists($required, $value)) {
                return [$pointer, 'must have the property ['.$required.']'];
            }
        }

        if (isset($schema['minProperties']) && count($value) < $schema['minProperties']) {
            return [$pointer, 'must have at least '.self::show($schema['minProperties']).' property'];
        }

        if (isset($schema['maxProperties']) && count($value) > $schema['maxProperties']) {
            return [$pointer, 'must have at most '.self::show($schema['maxProperties']).' property'];
        }

        $properties = is_array($schema['properties'] ?? null) ? $schema['properties'] : [];

        foreach ($value as $name => $item) {
            $name = (string) $name;
            $at = $pointer.'/'.self::escape($name);

            if (isset($schema['propertyNames'])) {
                $error = self::check($name, $schema['propertyNames'], $at, $root);

                if ($error !== null) {
                    return [$at, 'is no allowed property name: '.$error[1]];
                }
            }

            if (array_key_exists($name, $properties)) {
                $error = self::check($item, $properties[$name], $at, $root);
            } elseif (array_key_exists('additionalProperties', $schema)) {
                $additional = $schema['additionalProperties'];
                $error = $additional === false ? [$at, 'is not a known property'] : self::check($item, $additional, $at, $root);
            } else {
                $error = null;
            }

            if ($error !== null) {
                return $error;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $root
     * @return array<string, mixed>|bool
     */
    private static function resolve(string $ref, array $root): array|bool
    {
        $node = $root;

        foreach (explode('/', substr($ref, 2)) as $part) {
            $node = is_array($node) ? ($node[str_replace(['~1', '~0'], ['/', '~'], $part)] ?? null) : null;
        }

        if (! is_array($node) && ! is_bool($node)) {
            throw new RuntimeException("The integration manifest schema has no [{$ref}].");
        }

        /** @var array<string, mixed>|bool $node */
        return $node;
    }

    /**
     * A JSON array, decoded without `assoc`.
     *
     * @phpstan-assert-if-true list<mixed> $value
     */
    public static function isList(mixed $value): bool
    {
        return is_array($value) && array_is_list($value);
    }

    /**
     * A JSON object, decoded without `assoc`.
     *
     * @phpstan-assert-if-true stdClass $value
     */
    public static function isObject(mixed $value): bool
    {
        return $value instanceof stdClass;
    }

    /**
     * An object's fields as an array.
     *
     * @return array<string, mixed>
     */
    public static function fields(mixed $value): array
    {
        /** @var array<string, mixed> */
        return $value instanceof stdClass ? get_object_vars($value) : [];
    }

    /**
     * @param  array<array-key, mixed>  $enum
     */
    private static function inEnum(mixed $value, array $enum): bool
    {
        foreach ($enum as $item) {
            if (self::equal($value, $item)) {
                return true;
            }
        }

        return false;
    }

    private static function equal(mixed $a, mixed $b): bool
    {
        return $a === $b || (is_int($a) || is_float($a)) && (is_int($b) || is_float($b)) && $a == $b;
    }

    public static function escape(string $name): string
    {
        return str_replace(['~', '/'], ['~0', '~1'], $name);
    }

    private static function show(mixed $value): string
    {
        return (string) json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
}
