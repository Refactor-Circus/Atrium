<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Support\Tables;

it('ships the default table names in its config', function (): void {
    $config = require dirname(__DIR__, 2).'/config/atrium.php';

    expect($config['tables'])->toBe(Tables::DEFAULTS);
});

it('keeps the default for tables a published config leaves out', function (): void {
    config()->set('atrium.tables', ['dashboards' => 'crm_dashboards']);

    expect(Tables::name('dashboards'))->toBe('crm_dashboards')
        ->and(Tables::name('dashboard_widgets'))->toBe('atrium_dashboard_widgets')
        ->and((new DashboardModel)->getTable())->toBe('crm_dashboards')
        ->and((new DashboardWidgetModel)->getTable())->toBe('atrium_dashboard_widgets');
});
