<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Support;

use Illuminate\Contracts\Config\Repository;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use stdClass;

/**
 * Reads a manifest value (D-090): plain JSON as it is, and the expressions
 * in it, when the integration registers.
 *
 * - `{"$config": key, "type": cast, "default": value, …}`: a config value of
 *   the package's own (`{pkg}.*`) or of its integration's
 *   (`atrium.integrations.{pkg}.*`), cast (see `cast()`); missing or null is
 *   the default.
 * - `{"$screen": "subject_type" | "package" | "key", "kinds": [...]}`: the
 *   screen a hook extension is placed on; left out on a screen of another kind.
 * - `{"$option": name, "type": cast, "default": value}`: an option of an
 *   `options` hook's placement.
 * - `{"$subject_scope": map, "self": "user"}`: the scope a screen's record
 *   is (the last `.` part of its subject type), looked up in the map; null when
 *   it is `self`, and the extension is skipped where it does not resolve.
 *
 * The manifest's schema and rules have already been checked, so every
 * expression here is well formed.
 */
final class ManifestValues
{
    /**
     * Returned for a value to leave out (a `$screen` of another kind).
     */
    public const string OMIT = "\0omit";

    /**
     * @param  array<array-key, mixed>  $options  An `options` hook's placement options.
     */
    public function __construct(
        private readonly Repository $config,
        private readonly ?string $package = null,
        private readonly ?ScreenDeclaration $screen = null,
        private readonly array $options = [],
    ) {}

    /**
     * The value read: arrays and objects (as arrays) with every expression in
     * them read, or `SubjectScopeUnresolved` thrown for a scope that does not
     * resolve.
     */
    public function read(mixed $value): mixed
    {
        if ($value instanceof stdClass) {
            $fields = get_object_vars($value);

            if (isset($fields['$config'])) {
                return $this->config($fields);
            }

            if (isset($fields['$screen'])) {
                return $this->screen($fields);
            }

            if (isset($fields['$option'])) {
                $option = $this->options[$fields['$option']] ?? null;

                return $this->cast($option, $fields);
            }

            if (isset($fields['$subject_scope'])) {
                return $this->subjectScope($fields);
            }

            $value = $fields;
        }

        if (is_array($value)) {
            $read = [];

            foreach ($value as $key => $item) {
                $item = $this->read($item);

                if ($item !== self::OMIT) {
                    $read[$key] = $item;
                }
            }

            return $read;
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $expression
     */
    private function config(array $expression): mixed
    {
        $key = (string) $expression['$config'];

        return $this->cast($this->config->get($key), $expression);
    }

    /**
     * A value cast as the expression says; a missing (null) value is the
     * default, but for a nullable `positive-int`.
     *
     * @param  array<string, mixed>  $expression
     */
    private function cast(mixed $value, array $expression): mixed
    {
        $type = $expression['type'] ?? null;
        $default = self::plain($expression['default'] ?? null);

        if ($value === null) {
            if ($type === 'positive-int' && ($expression['nullable'] ?? false) === true && $this->explicitlyNull($expression)) {
                return null;
            }

            // The default is the value, but a path or a map is still read as one.
            return match ($type) {
                'path' => '/'.trim(is_string($default) ? $default : '', '/'),
                'map' => $this->map($default, $expression),
                default => $default,
            };
        }

        return match ($type) {
            'string' => is_string($value) ? $value : $default,
            'bool' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'int' => is_numeric($value) ? (int) $value : $default,
            'positive-int' => is_int($int = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]])) ? $int : $default,
            'enum' => in_array($value, is_array($expression['values'] ?? null) ? $expression['values'] : [], true) ? $value : $default,
            'strings' => $this->strings($value, $expression, $default),
            'string-map' => self::stringMap($value),
            'path' => '/'.trim(is_string($value) ? $value : (is_string($default) ? $default : ''), '/'),
            'map' => $this->map($value, $expression),
            default => self::plain($value),
        };
    }

    /**
     * Whether a `$config` key is set to null, rather than missing.
     *
     * @param  array<string, mixed>  $expression
     */
    private function explicitlyNull(array $expression): bool
    {
        if (! isset($expression['$config'])) {
            return false;
        }

        $marker = new stdClass;

        return $this->config->get((string) $expression['$config'], $marker) === null;
    }

    /**
     * @param  array<string, mixed>  $expression
     * @return list<string>|mixed
     */
    private function strings(mixed $value, array $expression, mixed $default): mixed
    {
        if (is_string($value) && ($expression['single'] ?? false) === true) {
            $value = [$value];
        }

        $strings = [];

        foreach (is_array($value) ? $value : [] as $entry) {
            if (is_string($entry) && $entry !== '') {
                $strings[] = $entry;
            }
        }

        if (($expression['unique'] ?? false) === true) {
            $strings = array_values(array_unique($strings));
        }

        return $strings === [] && ($expression['non_empty'] ?? false) === true ? $default : $strings;
    }

    /**
     * @return array<string, string>
     */
    private static function stringMap(mixed $value): array
    {
        $map = [];

        foreach (is_array($value) ? $value : [] as $key => $entry) {
            if (is_string($key) && is_string($entry) && $entry !== '') {
                $map[$key] = $entry;
            }
        }

        return $map;
    }

    /**
     * String keys to non-empty trimmed strings; a null value is read from
     * `fallback.{key}`. With `entries: [a, b]`, a list of `{a: key, b: value}`.
     *
     * @param  array<string, mixed>  $expression
     * @return array<string, string>|list<array<string, string>>
     */
    private function map(mixed $value, array $expression): array
    {
        $map = [];
        $fallback = $expression['fallback'] ?? null;

        foreach (is_array($value) ? $value : [] as $key => $entry) {
            if (! is_string($key) || $key === '') {
                continue;
            }

            if ($entry === null && is_string($fallback)) {
                $entry = $this->config->get($fallback.'.'.$key);
            }

            if (is_string($entry) && trim($entry) !== '') {
                $map[$key] = trim($entry);
            }
        }

        $entries = $expression['entries'] ?? null;

        if (! is_array($entries) || count($entries) !== 2) {
            return $map;
        }

        [$first, $second] = array_values($entries);
        $list = [];

        foreach ($map as $key => $entry) {
            $list[] = [(string) $first => $key, (string) $second => $entry];
        }

        return $list;
    }

    /**
     * @param  array<string, mixed>  $expression
     */
    private function screen(array $expression): mixed
    {
        $screen = $this->screen;

        if ($screen === null) {
            return null;
        }

        $kinds = $expression['kinds'] ?? null;

        if (is_array($kinds) && ! in_array($screen->kind, $kinds, true)) {
            return self::OMIT;
        }

        return match ($expression['$screen']) {
            'subject_type' => $screen->subjectType,
            'package' => $this->package,
            default => $screen->key,
        };
    }

    /**
     * @param  array<string, mixed>  $expression
     *
     * @throws SubjectScopeUnresolved
     */
    private function subjectScope(array $expression): ?string
    {
        $subject = (string) $this->screen?->subjectType;
        $scope = str_contains($subject, '.') ? substr($subject, (int) strrpos($subject, '.') + 1) : $subject;

        if (isset($expression['self']) && $scope === $expression['self']) {
            return null;
        }

        $inner = $expression['$subject_scope'];
        $types = $this->read($inner);
        $type = is_array($types) ? ($types[$scope] ?? null) : null;

        if (! is_string($type)) {
            $fields = $inner instanceof stdClass ? get_object_vars($inner) : [];

            throw new SubjectScopeUnresolved($scope, (string) ($fields['$config'] ?? ''), isset($fields['fallback']) ? (string) $fields['fallback'] : null);
        }

        return $type;
    }

    /**
     * A decoded value with its objects as arrays.
     */
    public static function plain(mixed $value): mixed
    {
        if ($value instanceof stdClass) {
            $value = get_object_vars($value);
        }

        return is_array($value) ? array_map(self::plain(...), $value) : $value;
    }
}
