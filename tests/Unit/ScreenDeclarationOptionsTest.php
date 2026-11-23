<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Exceptions\UnserializableDataException;

/*
 * A declared screen's static options (D-042): the configuration its layer
 * page needs, such as `showroom.transfers`' `flow_prefix`, sent as they are in
 * the `atrium.screens.show` payload. They must be JSON-serializable.
 */

it('has no options until they are set', function (): void {
    expect(ScreenDeclaration::make('showroom.transfers', Screen::LIST, '/showroom/transfers')->options)->toBe([]);
});

it('keeps the options it is given', function (): void {
    $screen = ScreenDeclaration::make('showroom.transfers', Screen::LIST, '/showroom/transfers')
        ->options(['flow_prefix' => 'showroom:', 'limit' => 20]);

    expect($screen->options)->toBe(['flow_prefix' => 'showroom:', 'limit' => 20]);
});

it('rejects options JSON cannot carry, naming the screen', function (): void {
    ScreenDeclaration::make('showroom.transfers', Screen::LIST, '/showroom/transfers')
        ->options(['flow_prefix' => fn (): string => 'showroom:']);
})->throws(UnserializableDataException::class, 'Screen [showroom.transfers] options returned unserializable data at [flow_prefix]: Closure');
