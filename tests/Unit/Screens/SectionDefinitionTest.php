<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;

it('defaults the label to the key and keeps the section private', function (): void {
    $section = SectionDefinition::make('acme.summary');

    expect($section->key)->toBe('acme.summary')
        ->and($section->label)->toBe('acme.summary')
        ->and($section->view)->toBeNull()
        ->and($section->component)->toBeNull()
        ->and($section->permission)->toBeNull()
        ->and($section->public)->toBeFalse();
});

it('has no icon', function (): void {
    expect(property_exists(SectionDefinition::class, 'icon'))->toBeFalse()
        ->and(method_exists(SectionDefinition::class, 'icon'))->toBeFalse();
});

it('is configured through fluent setters', function (): void {
    $section = SectionDefinition::make('acme.summary');

    expect($section->label('Summary'))->toBe($section)
        ->and($section->component('acme::summary'))->toBe($section)
        ->and($section->permission('summary.view'))->toBe($section)
        ->and($section->resolve(fn (): array => []))->toBe($section)
        ->and($section->authorize(fn (): bool => true))->toBe($section)
        ->and($section->public())->toBe($section);

    expect($section->label)->toBe('Summary')
        ->and($section->component)->toBe('acme::summary')
        ->and($section->permission)->toBe('summary.view')
        ->and($section->public)->toBeTrue();
});

it('renders with either a view or a component, never both', function (): void {
    $section = SectionDefinition::make('acme.summary')->component('acme::summary');

    $section->view('acme::summary');

    expect($section->view)->toBe('acme::summary')
        ->and($section->component)->toBeNull();

    $section->component('acme::summary');

    expect($section->component)->toBe('acme::summary')
        ->and($section->view)->toBeNull();
});

it('refuses writes to its state from outside', function (string $property, mixed $value): void {
    $section = SectionDefinition::make('acme.summary');

    expect(fn () => $section->{$property} = $value)->toThrow(Error::class);
})->with([
    'key' => ['key', 'other'],
    'label' => ['label', 'Other'],
    'view' => ['view', 'other'],
    'component' => ['component', 'other'],
    'permission' => ['permission', 'other'],
    'public' => ['public', true],
]);

it('keeps its closures private', function (string $property): void {
    $section = SectionDefinition::make('acme.summary')->resolve(fn (): array => [])->authorize(fn (): bool => true);

    expect(fn () => $section->{$property})->toThrow(Error::class);
})->with(['resolver', 'authorize']);

it('passes the screen as the last argument to both closures', function (): void {
    $screen = Screen::make('test.screen');
    $request = Request::create('/');
    $seen = [];

    $section = SectionDefinition::make('acme.summary')
        ->authorize(function (Request $given, ?Model $model, Screen $last) use (&$seen): bool {
            $seen['authorize'] = [$given, $model, $last];

            return true;
        })
        ->resolve(function (?Model $model, Screen $last) use (&$seen): array {
            $seen['resolve'] = [$model, $last];

            return [];
        });

    $section->allows($request, null, $screen, null);
    $section->resolveData(null, $screen);

    expect($seen['authorize'])->toBe([$request, null, $screen])
        ->and($seen['resolve'])->toBe([null, $screen]);
});

it('decides visibility by permission, closure or public', function (): void {
    $screen = Screen::make('test.screen');
    $request = Request::create('/');
    $access = fn (string $permission): bool => $permission === 'granted';

    expect(SectionDefinition::make('a')->allows($request, null, $screen, $access))->toBeFalse()
        ->and(SectionDefinition::make('a')->public()->allows($request, null, $screen, $access))->toBeTrue()
        ->and(SectionDefinition::make('a')->permission('granted')->allows($request, null, $screen, $access))->toBeTrue()
        ->and(SectionDefinition::make('a')->permission('denied')->allows($request, null, $screen, $access))->toBeFalse()
        ->and(SectionDefinition::make('a')->permission('granted')->allows($request, null, $screen, null))->toBeFalse()
        ->and(SectionDefinition::make('a')->authorize(fn (): bool => true)->allows($request, null, $screen, $access))->toBeTrue()
        ->and(SectionDefinition::make('a')->authorize(fn (): bool => false)->allows($request, null, $screen, $access))->toBeFalse()
        ->and(SectionDefinition::make('a')->permission('granted')->authorize(fn (): bool => true)->allows($request, null, $screen, $access))->toBeTrue()
        ->and(SectionDefinition::make('a')->permission('denied')->authorize(fn (): bool => true)->allows($request, null, $screen, $access))->toBeFalse()
        ->and(SectionDefinition::make('a')->permission('granted')->authorize(fn (): bool => false)->allows($request, null, $screen, $access))->toBeFalse();
});

it('rejects keys outside the pattern', function (string $key): void {
    expect(fn () => SectionDefinition::make($key))->toThrow(InvalidArgumentException::class);
})->with(['Upper', 'a b', 'a/b', '']);
