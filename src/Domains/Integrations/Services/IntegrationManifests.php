<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Services;

use JsonException;
use RefactorCircus\Atrium\Domains\Integrations\Data\IntegrationManifest;
use RefactorCircus\Atrium\Domains\Integrations\Exceptions\InvalidIntegrationException;
use RefactorCircus\Atrium\Domains\Integrations\Support\ManifestSchema;
use stdClass;

/**
 * Reads and checks integration manifests (D-090): `integration.json`, which a
 * package ships in `dist/atrium/` and names in `extra.atrium.integration`, or
 * one an app registers with `Atrium::integration()`.
 *
 * A manifest must match the schema (`ManifestSchema`), and then these rules,
 * which the SDK's `validateIntegrationManifest()` checks the same way:
 *
 * - screen keys, widget keys, live keys and hook tab and section keys start
 *   with `{key}.`; screen and nav paths with `/{key}/`;
 * - screen, widget and search source keys are unique;
 * - `$config` (and a `fallback`) reads only `{key}.*` or
 *   `atrium.integrations.{key}.*`; `$screen` and `$subject_scope` appear only
 *   in hook data, `$option` only in an `options` hook's; a `$subject_scope`
 *   reads a `map`;
 * - a `map` hook has one tab, one section or one of each, a `targets` hook
 *   one section, an `options` hook one tab, and its placements name only
 *   what it declares.
 *
 * Anything else throws InvalidIntegrationException naming the manifest and
 * the JSON pointer of the first problem.
 */
final class IntegrationManifests
{
    /**
     * The manifest in the file.
     *
     * @param  string|null  $key  The key the manifest must have (its module's).
     *
     * @throws InvalidIntegrationException for a missing, unreadable or invalid manifest
     */
    public function read(string $path, ?string $key = null): IntegrationManifest
    {
        if (! is_file($path)) {
            throw InvalidIntegrationException::invalidManifest($path, '', 'the file does not exist');
        }

        try {
            $json = json_decode((string) file_get_contents($path), false, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw InvalidIntegrationException::invalidManifest($path, '', 'it is not valid JSON ('.$exception->getMessage().')');
        }

        return $this->make($json, $path, $key);
    }

    /**
     * A manifest given as decoded JSON (objects as `stdClass`) or an array.
     *
     * @throws InvalidIntegrationException for an invalid manifest
     */
    public function make(mixed $json, string $source, ?string $key = null): IntegrationManifest
    {
        if (is_array($json)) {
            $json = json_decode((string) json_encode($json, JSON_THROW_ON_ERROR), false, 512, JSON_THROW_ON_ERROR);
        }

        $error = self::error($json);

        if ($error !== null) {
            throw InvalidIntegrationException::invalidManifest($source, $error[0], $error[1]);
        }

        /** @var stdClass $json */
        if ($key !== null && $json->key !== $key) {
            throw InvalidIntegrationException::invalidManifest($source, '/key', "it is [{$json->key}], but its module's key is [{$key}]");
        }

        return new IntegrationManifest($json->key, $source, $json);
    }

    /**
     * The first problem with a manifest, as `[pointer, message]`, or null.
     *
     * @return array{string, string}|null
     */
    public static function error(mixed $json): ?array
    {
        return ManifestSchema::validate($json) ?? ($json instanceof stdClass ? new self()->rules($json) : null);
    }

    /**
     * @return array{string, string}|null
     */
    private function rules(stdClass $json): ?array
    {
        $key = $json->key;
        $prefix = $key.'.';

        foreach (['screens', 'widgets', 'search_sources'] as $list) {
            $seen = [];

            foreach ($json->{$list} ?? [] as $index => $item) {
                if (isset($seen[$item->key])) {
                    return ["/{$list}/{$index}/key", "[{$item->key}] is declared twice"];
                }

                $seen[$item->key] = true;
            }
        }

        foreach ($json->screens ?? [] as $index => $screen) {
            if (! str_starts_with($screen->key, $prefix)) {
                return ["/screens/{$index}/key", "[{$screen->key}] must start with [{$prefix}]"];
            }

            if (! str_starts_with($screen->path, '/'.$key.'/')) {
                return ["/screens/{$index}/path", "[{$screen->path}] must start with [/{$key}/]"];
            }

            if (isset($screen->options)) {
                $error = $this->values($screen->options, "/screens/{$index}/options", $key, null);

                if ($error !== null) {
                    return $error;
                }
            }
        }

        foreach ($json->widgets ?? [] as $index => $widget) {
            if (! str_starts_with($widget->key, $prefix)) {
                return ["/widgets/{$index}/key", "[{$widget->key}] must start with [{$prefix}]"];
            }
        }

        $error = $this->navigation($json->navigation ?? [], '/navigation', $key);

        if ($error !== null) {
            return $error;
        }

        foreach ($json->hooks ?? [] as $index => $hook) {
            $error = $this->hook($hook, "/hooks/{$index}", $key);

            if ($error !== null) {
                return $error;
            }
        }

        return null;
    }

    /**
     * @param  list<stdClass>  $items
     * @return array{string, string}|null
     */
    private function navigation(array $items, string $pointer, string $key): ?array
    {
        foreach ($items as $index => $item) {
            $at = "{$pointer}/{$index}";

            if (isset($item->path) && ! str_starts_with($item->path, '/'.$key.'/')) {
                return ["{$at}/path", "[{$item->path}] must start with [/{$key}/]: an integration links only to its own pages"];
            }

            if (isset($item->live) && ! str_starts_with($item->live->key, $key.'.')) {
                return ["{$at}/live/key", "[{$item->live->key}] must start with [{$key}.]"];
            }

            foreach (['sort', 'when'] as $field) {
                if (isset($item->{$field})) {
                    $error = $this->value($item->{$field}, "{$at}/{$field}", $key, null);

                    if ($error !== null) {
                        return $error;
                    }
                }
            }

            if (isset($item->live->options)) {
                $error = $this->values($item->live->options, "{$at}/live/options", $key, null);

                if ($error !== null) {
                    return $error;
                }
            }

            $error = $this->navigation($item->children ?? [], "{$at}/children", $key);

            if ($error !== null) {
                return $error;
            }
        }

        return null;
    }

    /**
     * @return array{string, string}|null
     */
    private function hook(stdClass $hook, string $pointer, string $key): ?array
    {
        $tabs = ManifestSchema::fields($hook->tabs ?? null);
        $sections = ManifestSchema::fields($hook->sections ?? null);

        foreach (['tabs' => $tabs, 'sections' => $sections] as $kind => $extensions) {
            foreach ($extensions as $name => $extension) {
                $at = "{$pointer}/{$kind}/".ManifestSchema::escape($name);

                if (! str_starts_with($name, $key.'.')) {
                    return [$at, "[{$name}] must start with [{$key}.]"];
                }

                if (isset($extension->data)) {
                    $error = $this->values($extension->data, "{$at}/data", $key, $hook->format);

                    if ($error !== null) {
                        return $error;
                    }
                }
            }
        }

        $counts = [count($tabs), count($sections)];
        $shape = match ($hook->format) {
            'map' => $counts[0] <= 1 && $counts[1] <= 1 && $counts !== [0, 0] ? null : 'a map hook declares one tab, one section, or one of each',
            'targets' => $counts === [0, 1] ? null : 'a targets hook declares exactly one section',
            'options' => $counts === [1, 0] ? null : 'an options hook declares exactly one tab',
            default => $counts !== [0, 0] ? null : 'a lists hook declares at least one tab or section',
        };

        if ($shape !== null) {
            return [$pointer, $shape];
        }

        foreach (ManifestSchema::fields($hook->default) as $target => $placement) {
            $at = "{$pointer}/default/".ManifestSchema::escape($target);

            if ($hook->format === 'map' && ($placement === 'tab' ? $tabs === [] : $sections === [])) {
                return [$at, $placement === 'tab' ? 'the hook declares no tab' : 'the hook declares no section to place in ['.$placement.']'];
            }

            if ($hook->format !== 'lists' || ! is_array($placement)) {
                continue;
            }

            foreach ($placement as $index => $entry) {
                $name = is_string($entry) ? $entry : (string) array_values(get_object_vars($entry))[0];

                if (! isset((is_string($entry) ? $tabs : $sections)[$name])) {
                    return ["{$at}/{$index}", "[{$name}] is no ".(is_string($entry) ? 'tab' : 'section').' this hook declares'];
                }
            }
        }

        return null;
    }

    /**
     * @return array{string, string}|null
     */
    private function values(mixed $values, string $pointer, string $key, ?string $hookFormat): ?array
    {
        foreach (ManifestSchema::fields($values) as $name => $value) {
            $error = $this->value($value, $pointer.'/'.ManifestSchema::escape((string) $name), $key, $hookFormat);

            if ($error !== null) {
                return $error;
            }
        }

        return null;
    }

    /**
     * The expressions in a value: where each may appear, and what `$config`
     * may read.
     *
     * @param  string|null  $hookFormat  The format of the hook whose data this is; null outside hook data.
     * @return array{string, string}|null
     */
    private function value(mixed $value, string $pointer, string $key, ?string $hookFormat): ?array
    {
        if (is_array($value)) {
            foreach ($value as $index => $item) {
                $error = $this->value($item, "{$pointer}/{$index}", $key, $hookFormat);

                if ($error !== null) {
                    return $error;
                }
            }

            return null;
        }

        if (! $value instanceof stdClass) {
            return null;
        }

        if (isset($value->{'$config'})) {
            foreach (['$config', 'fallback'] as $field) {
                if (isset($value->{$field}) && ! str_starts_with($value->{$field}, $key.'.') && ! str_starts_with($value->{$field}, 'atrium.integrations.'.$key.'.')) {
                    return ["{$pointer}/".ManifestSchema::escape($field), "[{$value->{$field}}] is not config of this integration: read only [{$key}.*] or [atrium.integrations.{$key}.*]"];
                }
            }

            return null;
        }

        if (isset($value->{'$screen'}) && $hookFormat === null) {
            return [$pointer, '$screen is only allowed in hook data'];
        }

        if (isset($value->{'$option'}) && $hookFormat !== 'options') {
            return [$pointer, '$option is only allowed in the data of an options hook'];
        }

        if (isset($value->{'$subject_scope'})) {
            if ($hookFormat === null) {
                return [$pointer, '$subject_scope is only allowed in hook data'];
            }

            if (($value->{'$subject_scope'}->type ?? null) !== 'map') {
                return ["{$pointer}/\$subject_scope/type", '$subject_scope reads a config value of type map'];
            }

            return $this->value($value->{'$subject_scope'}, "{$pointer}/\$subject_scope", $key, $hookFormat);
        }

        if (isset($value->{'$screen'}) || isset($value->{'$option'})) {
            return null;
        }

        return $this->values($value, $pointer, $key, $hookFormat);
    }
}
