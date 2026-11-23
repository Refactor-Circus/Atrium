<?php

declare(strict_types=1);

use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;
use RefactorCircus\Atrium\Support\ScreenAccess;
use RefactorCircus\Keystone\Packages\Package;
use RefactorCircus\Keystone\Packages\PackageRegistry;

it('asks the package policies the way its api does', function (): void {
    app(PackageRegistry::class)->register(Package::make('billing', 'Billing')->authorization());
    Gate::define('refund', fn (User $user): bool => $user->getKey() === 1);

    $ada = new User;
    $ada->id = 1;
    $bob = new User;
    $bob->id = 2;

    request()->setUserResolver(fn (): User => $ada);
    expect(ScreenAccess::allows('billing', 'refund', User::class))->toBeTrue();

    request()->setUserResolver(fn (): User => $bob);
    expect(ScreenAccess::allows('billing', 'refund', User::class))->toBeFalse();

    config()->set('billing.authorization', false);
    expect(ScreenAccess::allows('billing', 'refund', User::class))->toBeTrue();
});

it('reads the loadable features from config', function (): void {
    config()->set('billing.atrium.features', ['billing-beta', 'Missing\\Feature', stdClass::class, 7]);

    $plugin = new class extends Plugin
    {
        public function features(): array
        {
            return $this->featuresFromConfig('billing.atrium.features');
        }
    };

    expect($plugin->features())->toBe(['billing-beta', stdClass::class]);
});

it('passes further policy arguments after the subject', function (): void {
    app(PackageRegistry::class)->register(Package::make('billing', 'Billing')->authorization());
    Gate::define('refund', fn (User $user, string $class, int $amount): bool => $amount < 100);

    $user = new User;
    $user->id = 1;
    request()->setUserResolver(fn (): User => $user);

    expect(ScreenAccess::allows('billing', 'refund', User::class, arguments: [50]))->toBeTrue()
        ->and(ScreenAccess::allows('billing', 'refund', User::class, arguments: [500]))->toBeFalse();
});
