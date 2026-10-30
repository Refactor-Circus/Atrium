<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;

it('defaults the label to the key, the icon to squares-2x2 and keeps the tab private', function (): void {
    $tab = TabDefinition::make('acme.billing');

    expect($tab->key)->toBe('acme.billing')
        ->and($tab->label)->toBe('acme.billing')
        ->and($tab->icon)->toBe('squares-2x2')
        ->and($tab->view)->toBeNull()
        ->and($tab->component)->toBeNull()
        ->and($tab->permission)->toBeNull()
        ->and($tab->public)->toBeFalse();
});

it('is configured through fluent setters', function (): void {
    $tab = TabDefinition::make('acme.billing');

    expect($tab->label('Billing'))->toBe($tab)
        ->and($tab->icon('banknotes'))->toBe($tab)
        ->and($tab->view('acme::billing'))->toBe($tab)
        ->and($tab->permission('billing.view'))->toBe($tab)
        ->and($tab->resolve(fn (): array => []))->toBe($tab)
        ->and($tab->authorize(fn (): bool => true))->toBe($tab)
        ->and($tab->public())->toBe($tab);

    expect($tab->label)->toBe('Billing')
        ->and($tab->icon)->toBe('banknotes')
        ->and($tab->view)->toBe('acme::billing')
        ->and($tab->permission)->toBe('billing.view')
        ->and($tab->public)->toBeTrue();
});

it('renders with either a view or a component, never both', function (): void {
    $tab = TabDefinition::make('acme.billing')->view('acme::billing');

    $tab->component('acme::billing-tab');

    expect($tab->component)->toBe('acme::billing-tab')
        ->and($tab->view)->toBeNull();

    $tab->view('acme::billing');

    expect($tab->view)->toBe('acme::billing')
        ->and($tab->component)->toBeNull();
});

it('refuses writes to its state from outside', function (string $property, mixed $value): void {
    $tab = TabDefinition::make('acme.billing');

    expect(fn () => $tab->{$property} = $value)->toThrow(Error::class);
})->with([
    'key' => ['key', 'other'],
    'label' => ['label', 'Other'],
    'icon' => ['icon', 'users'],
    'view' => ['view', 'other'],
    'component' => ['component', 'other'],
    'permission' => ['permission', 'other'],
    'public' => ['public', true],
]);

it('keeps its closures private', function (string $property): void {
    $tab = TabDefinition::make('acme.billing')->resolve(fn (): array => [])->authorize(fn (): bool => true);

    expect(fn () => $tab->{$property})->toThrow(Error::class);
})->with(['resolver', 'authorize']);

it('passes the screen as the last argument to both closures', function (): void {
    $screen = Screen::make('test.screen');
    $request = Request::create('/');
    $record = new class extends Model {};
    $seen = [];

    $tab = TabDefinition::make('acme.billing')
        ->authorize(function (Request $given, ?Model $model, Screen $last) use (&$seen): bool {
            $seen['authorize'] = [$given, $model, $last];

            return true;
        })
        ->resolve(function (?Model $model, Screen $last) use (&$seen): array {
            $seen['resolve'] = [$model, $last];

            return ['total' => 3];
        });

    expect($tab->allows($request, $record, $screen, null))->toBeTrue()
        ->and($tab->resolveData($record, $screen))->toBe(['total' => 3])
        ->and($seen['authorize'])->toBe([$request, $record, $screen])
        ->and($seen['resolve'])->toBe([$record, $screen]);
});

it('accepts keys of lowercase letters, digits, dots, dashes and underscores', function (string $key): void {
    expect(TabDefinition::make($key)->key)->toBe($key);
})->with(['acme.billing', 'header.actions', 'a', '123', '007', 'acme_billing-2']);

it('rejects any other key', function (string $key): void {
    expect(fn () => TabDefinition::make($key))->toThrow(InvalidArgumentException::class);
})->with([
    'uppercase' => 'Acme.billing',
    'a space' => 'acme billing',
    'a slash' => 'acme/billing',
    'empty' => '',
    'a leading dot' => '.acme',
    'a trailing newline' => "acme\n",
]);
