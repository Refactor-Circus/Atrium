<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Support;

use RefactorCircus\Keystone\Database\Tables as KeystoneTables;

/**
 * The table each of Atrium's records lives in, from the `atrium.tables`
 * config key. Models and migrations both ask here, so renaming a table is one
 * config change made before the migrations run.
 *
 * A published config that lists only some tables keeps the defaults for the
 * rest.
 */
final class Tables extends KeystoneTables
{
    protected const string CONFIG = 'atrium.tables';

    /**
     * @var array<string, string>
     */
    public const array DEFAULTS = [
        'dashboards' => 'atrium_dashboards',
        'dashboard_widgets' => 'atrium_dashboard_widgets',
    ];
}
