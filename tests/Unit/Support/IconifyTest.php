<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Support\Iconify;

it('accepts an Iconify name and returns it', function (string $name): void {
    expect(Iconify::assert($name))->toBe($name);
})->with([
    'i-lucide-home',
    'i-heroicons-arrow-down-tray',
    'i-mdi-account-2',
    'i-simple-icons-github',
]);

it('rejects a value that is not an Iconify name', function (string $value): void {
    expect(fn (): string => Iconify::assert($value))->toThrow(InvalidArgumentException::class);
})->with([
    'a collection:name pair' => ['lucide:home'],
    'inline SVG' => ['<svg viewBox="0 0 24 24"><path d="M3 12h18"/></svg>'],
    'a name with no collection' => ['i-home'],
    'a bare icon name' => ['home'],
    'an empty string' => [''],
    'upper-case letters' => ['i-Lucide-home'],
    'a double dash' => ['i-lucide--home'],
    'a trailing dash' => ['i-lucide-home-'],
    'a trailing space' => ['i-lucide-home '],
    'a trailing newline' => ["i-lucide-home\n"],
]);

it('names the bad value and the expected form', function (): void {
    expect(fn (): string => Iconify::assert('lucide:home'))
        ->toThrow(InvalidArgumentException::class, 'Icon [lucide:home] is not an Iconify name; use i-{collection}-{name}, such as i-lucide-home.');
});

it('shortens a long bad value in the message', function (): void {
    $svg = '<svg>'.str_repeat('<path d="M3 12h18"/>', 20).'</svg>';

    try {
        Iconify::assert($svg);
    } catch (InvalidArgumentException $exception) {
        expect($exception->getMessage())->not->toContain($svg)->toStartWith('Icon [<svg>');

        return;
    }

    throw new RuntimeException('Expected an InvalidArgumentException.');
});
