<?php

declare(strict_types=1);

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\Blade;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;
use RefactorCircus\Keystone\Audit\Contracts\AuditTrail;
use RefactorCircus\Keystone\Audit\Data\AuditEntry;
use RefactorCircus\Keystone\Audit\Data\AuditFilter;
use RefactorCircus\Keystone\Audit\Data\AuditPage;
use RefactorCircus\Keystone\Packages\Package;
use RefactorCircus\Keystone\Packages\PackageRegistry;

beforeEach(function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    app(PackageRegistry::class)->register(Package::make('billing', 'Billing')->label('Billing'));
});

/**
 * An installed audit log holding one entry per page, remembering what it was asked.
 */
function billingTrail(?string $next = null): object
{
    $trail = new class($next) implements AuditTrail
    {
        public ?AuditFilter $filter = null;

        public function __construct(private ?string $next) {}

        public function available(): bool
        {
            return true;
        }

        public function entries(AuditFilter $filter): AuditPage
        {
            $this->filter = $filter;

            return new AuditPage([new AuditEntry(1, 'billing', 'invoice.paid', 'atrium', CarbonImmutable::now(), subjectLabel: 'INV-1')], $this->next);
        }
    };

    app()->instance(AuditTrail::class, $trail);

    return $trail;
}

it('shows a package its own audit log', function (): void {
    $trail = billingTrail();

    $this->get('/atrium/history/billing?action=invoice.&subject_type=invoice&subject_id=1')
        ->assertOk()
        ->assertSee('Billing audit log')
        ->assertSee('invoice.paid')
        ->assertSee('INV-1');

    expect($trail->filter?->source)->toBe('billing')
        ->and($trail->filter?->action)->toBe('invoice.')
        ->and($trail->filter?->subjectId)->toBe('1');
});

it('pages through older entries', function (): void {
    billingTrail(next: 'abc');

    $this->get('/atrium/history/billing')->assertOk()->assertSee('cursor=abc', false);
    $this->get('/atrium/history/billing?cursor=abc')->assertOk()->assertSee('Newest');
});

it('answers 404 without an audit log or for an unknown package', function (): void {
    $this->get('/atrium/history/billing')->assertNotFound();

    billingTrail();

    $this->get('/atrium/history/nope')->assertNotFound();
});

it('refuses those the package history endpoint would refuse', function (): void {
    billingTrail();
    app(PackageRegistry::class)->get('billing')->authorizeHistory(fn (): bool => false);

    $this->get('/atrium/history/billing')->assertForbidden();
});

it('gives plugins an audit log link that shows only when it would open', function (): void {
    $plugin = new class extends Plugin
    {
        public function key(): string
        {
            return 'billing';
        }

        public function navigation(): array
        {
            return [$this->historyNavItem('billing')->group('Billing')];
        }
    };

    app(PluginRegistry::class)->register($plugin);

    $this->get('/atrium')->assertOk()->assertDontSee('/atrium/history/billing', false);

    billingTrail();

    $this->get('/atrium')->assertOk()->assertSee('/atrium/history/billing', false)->assertSee('Audit log');
});

it('links a history panel to the package audit log', function (): void {
    billingTrail(next: 'abc');

    $user = new User;
    $user->id = 7;

    expect(Blade::render('<x-atrium::audit-trail source="billing" :subject="$subject" />', ['subject' => $user]))
        ->toContain('/atrium/history/billing?subject_type=')
        ->toContain('subject_id=7');
});

it('offers nothing for a package that turns its auditing off', function (): void {
    billingTrail();
    config()->set('billing.audit.enabled', false);

    $this->get('/atrium/history/billing')->assertNotFound();

    expect(Blade::render('<x-atrium::audit-trail source="billing" />'))->not->toContain('data-testid="audit-trail"');

    config()->set('billing.audit.enabled', true);

    expect(Blade::render('<x-atrium::audit-trail source="billing" />'))->toContain('data-testid="audit-trail"');
});
