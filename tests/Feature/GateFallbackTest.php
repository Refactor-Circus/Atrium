<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Access\Contracts\AtriumUser;
use Workbench\App\Models\User;

/*
 * The `viewAtrium` gate's default (D-086): while the app defines none, a
 * user model implementing AtriumUser decides; any other user gets in only
 * in `local`.
 */

final class GateFallbackUser extends User implements AtriumUser
{
    protected $table = 'users';

    public bool $allowed = false;

    public function canAccessAtrium(): bool
    {
        return $this->allowed;
    }
}

function gateFallbackUser(bool $allowed): GateFallbackUser
{
    $user = GateFallbackUser::query()->where('email', 'gate@example.com')->first()
        ?? GateFallbackUser::forceCreate(['name' => 'Gate', 'email' => 'gate@example.com', 'password' => bcrypt('x')]);
    $user->allowed = $allowed;

    return $user;
}

it('lets an AtriumUser decide while the gate is undefined, outside local', function (bool $allowed, int $status): void {
    $this->withEnvironment('production');

    expect(Gate::has('viewAtrium'))->toBeFalse();

    $this->actingAs(gateFallbackUser($allowed))->getJson(route('atrium.shell'))->assertStatus($status);
})->with([
    'allowed' => [true, 200],
    'refused' => [false, 403],
]);

it('refuses any other user outside local, and lets them in locally', function (): void {
    $user = User::forceCreate(['name' => 'Ann', 'email' => 'ann@example.com', 'password' => bcrypt('x')]);

    $this->withEnvironment('production');
    $this->actingAs($user)->getJson(route('atrium.shell'))->assertForbidden();

    $this->withEnvironment('local');
    $this->actingAs($user)->getJson(route('atrium.shell'))->assertOk();
});

it('asks the gate, once the app defines it, before the contract', function (): void {
    $this->withEnvironment('production');
    Gate::define('viewAtrium', fn (): bool => false);

    $this->actingAs(gateFallbackUser(true))->getJson(route('atrium.shell'))->assertForbidden();
});
