<?php

declare(strict_types=1);

use Carbon\CarbonImmutable;
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

    $this->get('/atrium/history/billing')->assertNotFound();

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

it('compiles no audit or history view into the stylesheet', function (): void {
    $sources = array_filter(
        file(dirname(__DIR__, 2).'/resources/css/atrium.css', FILE_IGNORE_NEW_LINES) ?: [],
        fn (string $line): bool => str_starts_with(trim($line), '@source'),
    );

    expect(array_filter($sources, fn (string $line): bool => str_contains($line, 'audit') || str_contains($line, 'history/')))->toBe([]);
});
