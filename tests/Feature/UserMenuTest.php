<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Workbench\App\Models\User;

beforeEach(function (): void {
    // The dashboard gate is undefined here, which admits everyone locally.
    app()->detectEnvironment(fn (): string => 'local');
});

function signedIn(): User
{
    return User::forceCreate(['name' => 'Ada Lovelace', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);
}

it('offers the signed-in user a sign out through the app\'s logout route', function (): void {
    Route::post('logout', fn () => 'out')->name('logout');
    Route::getRoutes()->refreshNameLookups();

    $html = $this->actingAs(signedIn())->get('/atrium')->assertOk()->getContent();

    expect($html)->toContain('data-testid="user-menu-toggle"')
        ->toContain('Ada Lovelace')
        ->toContain('ada@example.com')
        ->toContain('action="'.route('logout').'"')
        ->toContain('data-testid="sign-out"')
        ->and(strpos($html, 'appearance-toggle'))->toBeLessThan(strpos($html, 'user-menu-toggle'));
});

it('hides the menu when the app has no logout route', function (): void {
    $this->actingAs(signedIn())->get('/atrium')->assertOk()->assertDontSee('data-testid="sign-out"', false);
});

it('hides the menu when sign out is switched off', function (): void {
    Route::post('logout', fn () => 'out')->name('logout');
    Route::getRoutes()->refreshNameLookups();
    config(['atrium.logout_route' => null]);

    $this->actingAs(signedIn())->get('/atrium')->assertOk()->assertDontSee('data-testid="sign-out"', false);
});

it('shows no menu to a guest', function (): void {
    Route::post('logout', fn () => 'out')->name('logout');
    Route::getRoutes()->refreshNameLookups();

    $this->get('/atrium')->assertOk()->assertDontSee('data-testid="user-menu-toggle"', false);
});
