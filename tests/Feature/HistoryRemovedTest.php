<?php

declare(strict_types=1);

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;
use RefactorCircus\Keystone\Audit\Contracts\AuditTrail;
use RefactorCircus\Keystone\Audit\Data\AuditEntry;
use RefactorCircus\Keystone\Audit\Data\AuditFilter;
use RefactorCircus\Keystone\Audit\Data\AuditPage;
use RefactorCircus\Keystone\Packages\Package;
use RefactorCircus\Keystone\Packages\PackageRegistry;

/*
 * The history screen, its audit components and the History nav item moved
 * to refactor-circus/keen (D-009, D-014, D-016). Atrium keeps no trace of them.
 */

it('no longer serves a package history page', function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    // An auditing package with an installed audit log: the page would have opened.
    app(PackageRegistry::class)->register(Package::make('billing', 'Billing')->label('Billing'));
    app()->instance(AuditTrail::class, new class implements AuditTrail
    {
        public function available(): bool
        {
            return true;
        }

        public function entries(AuditFilter $filter): AuditPage
        {
            return new AuditPage([new AuditEntry(1, 'billing', 'invoice.paid', 'atrium', CarbonImmutable::now())]);
        }
    });

    // The path is the front end's now: Atrium's page, which renders no
    // history; no route of Atrium's serves one.
    expect(Route::getRoutes()->match(Request::create('/atrium/history/billing'))->getName())->toBe('atrium.app');

    expect(Route::has('atrium.history.show'))->toBeFalse();
});

it('ships neither the history controller nor the audit components', function (): void {
    $root = dirname(__DIR__, 2);

    expect(class_exists('RefactorCircus\\Atrium\\Domains\\History\\Http\\Controllers\\HistoryController'))->toBeFalse()
        ->and(class_exists('RefactorCircus\\Atrium\\Domains\\History\\HistoryServiceProvider'))->toBeFalse()
        ->and(is_dir($root.'/src/Domains/History'))->toBeFalse()
        ->and(file_exists($root.'/resources/views/history/show.blade.php'))->toBeFalse()
        ->and(file_exists($root.'/resources/views/components/audit-trail.blade.php'))->toBeFalse()
        ->and(is_dir($root.'/resources/views/components/audit'))->toBeFalse();
});

it('gives plugins no history nav item', function (): void {
    expect(method_exists(Plugin::class, 'historyNavItem'))->toBeFalse();
});
