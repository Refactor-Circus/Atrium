<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Guardian;

/**
 * The scope types Atrium sends Guardian for scoped roles, assignments and
 * two-factor policies (D-048), resolved once per process.
 *
 * Each key of `atrium.integrations.guardian.scope_types` (`organization`,
 * `team`) names a scope; its value is the morph type Guardian stores for it.
 * A null value reads `guardian.adopt.scope_types.{key}`, the type Guardian
 * already maps Roster's scopes to. A value that does not resolve to a
 * non-empty string is dropped, so the front end offers no scope it cannot name.
 *
 * Shared by the screens' `scope_types` option and the `guardian.access` hook.
 */
final class GuardianScopeTypes
{
    /**
     * @var array<string, string>|null
     */
    private static ?array $resolved = null;

    /**
     * Every resolved scope type, by scope key, in config order.
     *
     * @return array<string, string>
     */
    public static function all(): array
    {
        return self::$resolved ??= self::resolve();
    }

    /**
     * The type of one scope key, or null while it does not resolve.
     */
    public static function get(string $key): ?string
    {
        return self::all()[$key] ?? null;
    }

    /**
     * The resolved types as the front end reads them: a list of
     * `{key, type}`, so an empty one is still a JSON list.
     *
     * @return list<array{key: string, type: string}>
     */
    public static function options(): array
    {
        $options = [];

        foreach (self::all() as $key => $type) {
            $options[] = ['key' => $key, 'type' => $type];
        }

        return $options;
    }

    /**
     * Resolve again on the next call, as a new process would.
     */
    public static function forget(): void
    {
        self::$resolved = null;
    }

    /**
     * @return array<string, string>
     */
    private static function resolve(): array
    {
        $configured = config('atrium.integrations.guardian.scope_types', []);
        $types = [];

        foreach (is_array($configured) ? $configured : [] as $key => $type) {
            if (! is_string($key) || $key === '') {
                continue;
            }

            $type ??= config('guardian.adopt.scope_types.'.$key);

            if (is_string($type) && trim($type) !== '') {
                $types[$key] = trim($type);
            }
        }

        return $types;
    }
}
