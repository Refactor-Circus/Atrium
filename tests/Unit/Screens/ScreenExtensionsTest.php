<?php

declare(strict_types=1);

use Illuminate\Container\Container;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;

// resolve() looks up the request's ScreenVisibility; a bare container
// builds one without booting the framework.
beforeEach(fn () => Container::setInstance(new Container));

afterEach(fn () => Container::setInstance(null));

function unitTab(string $key): TabDefinition
{
    return TabDefinition::make($key)->view('acme::'.$key)->public();
}

function unitSection(string $key): SectionDefinition
{
    return SectionDefinition::make($key)->view('acme::'.$key)->public();
}

/**
 * @param  list<TabDefinition|SectionDefinition>  $definitions
 * @return list<string>
 */
function unitKeys(array $definitions): array
{
    return array_map(fn (TabDefinition|SectionDefinition $definition): string => $definition->key, $definitions);
}

it('returns itself from both registration methods for chaining', function (): void {
    $screens = new ScreenExtensions;

    expect($screens->tab('test.screen', unitTab('acme.a')))->toBe($screens)
        ->and($screens->section('test.screen', 'before', unitSection('acme.b')))->toBe($screens);
});

it('accepts an exact key, every screen or every screen of a package as the target', function (string $target): void {
    $screens = (new ScreenExtensions)
        ->tab($target, unitTab('acme.a'))
        ->section($target, 'before', unitSection('acme.b'));

    expect(unitKeys($screens->tabs($target)))->toBe(['acme.a'])
        ->and(unitKeys($screens->sections($target, 'before')))->toBe(['acme.b']);
})->with(['test.screen', 'test.a.b', 'acme-billing.invoices', '*', 'test.*', 'acme-billing.*']);

it('rejects any other target', function (string $target): void {
    expect(fn () => (new ScreenExtensions)->tab($target, unitTab('acme.a')))->toThrow(InvalidArgumentException::class)
        ->and(fn () => (new ScreenExtensions)->section($target, 'before', unitSection('acme.b')))->toThrow(InvalidArgumentException::class);
})->with([
    'a wildcard package' => '*.x',
    'a partial package' => 'te*.x',
    'a partial screen' => 'test.a*',
    'a wildcard in the middle' => 'test.*.x',
    'a double star' => '**',
    'a package double star' => 'test.**',
    'empty' => '',
    'no package' => 'screen',
    'uppercase' => 'Test.screen',
]);

it('accepts slot names like header.actions and rejects others', function (): void {
    $screens = (new ScreenExtensions)->section('test.screen', 'header.actions', unitSection('acme.a'));

    expect(unitKeys($screens->sections('test.screen', 'header.actions')))->toBe(['acme.a']);

    foreach (['Header', 'a b', 'a/b', ''] as $slot) {
        expect(fn () => $screens->section('test.screen', $slot, unitSection('acme.b')))->toThrow(InvalidArgumentException::class);
    }
});

it('refuses a definition with neither a view nor a component', function (): void {
    expect(fn () => (new ScreenExtensions)->tab('test.screen', TabDefinition::make('acme.a')->public()))
        ->toThrow(InvalidArgumentException::class, 'acme.a')
        ->and(fn () => (new ScreenExtensions)->section('test.screen', 'before', SectionDefinition::make('acme.b')->public()))
        ->toThrow(InvalidArgumentException::class, 'acme.b');
});

it('stores a copy, so later changes to the caller\'s instance change nothing', function (): void {
    $tab = unitTab('acme.a')->label('Before');
    $section = unitSection('acme.b')->label('Before');

    $screens = (new ScreenExtensions)
        ->tab('test.screen', $tab)
        ->section('test.screen', 'before', $section);

    $tab->label('After');
    $section->label('After');

    expect($screens->tabs('test.screen')[0]->label)->toBe('Before')
        ->and($screens->sections('test.screen', 'before')[0]->label)->toBe('Before');

    // Nor do changes to what it hands out.
    $screens->tabs('test.screen')[0]->label('Changed');

    expect($screens->tabs('test.screen')[0]->label)->toBe('Before');
});

it('reads all-digit keys back as strings, in registration order', function (): void {
    $screens = (new ScreenExtensions)
        ->tab('test.screen', unitTab('123'))
        ->tab('test.screen', unitTab('007'))
        ->section('test.screen', 'before', unitSection('123'))
        ->section('test.screen', 'before', unitSection('007'));

    expect(unitKeys($screens->tabs('test.screen')))->toBe(['123', '007'])
        ->and(unitKeys($screens->sections('test.screen', 'before')))->toBe(['123', '007']);
});

it('keeps a registration for a screen nobody declares without error or effect', function (): void {
    $screens = (new ScreenExtensions)
        ->tab('test.screen', unitTab('acme.kept'))
        ->tab('missing.screen', unitTab('acme.missing'))
        ->section('missing.screen', 'before', unitSection('acme.missing'));

    $resolved = $screens->resolve(Screen::standard('test.screen', 'detail'), Request::create('/'));

    expect(unitKeys($screens->tabs('missing.screen')))->toBe(['acme.missing'])
        ->and(unitKeys($resolved->tabs))->toBe(['overview', 'acme.kept'])
        ->and($resolved->sections('before'))->toBe([]);
});

it('round-trips its registrations through snapshot() and restore()', function (): void {
    $screens = (new ScreenExtensions)
        ->tab('test.screen', unitTab('acme.a'))
        ->section('*', 'before', unitSection('acme.b'));

    $snapshot = $screens->snapshot();

    $screens->tab('test.screen', unitTab('acme.later'))
        ->section('*', 'before', unitSection('acme.later'));

    $screens->restore($snapshot);

    expect(unitKeys($screens->tabs('test.screen')))->toBe(['acme.a'])
        ->and(unitKeys($screens->sections('*', 'before')))->toBe(['acme.b'])
        ->and($screens->snapshot())->toEqual($snapshot);

    // The snapshot is a copy too: restoring twice gives the same state.
    $screens->tab('test.screen', unitTab('acme.again'));
    $screens->restore($snapshot);

    expect(unitKeys($screens->tabs('test.screen')))->toBe(['acme.a']);
});

it('forgets everything on flush()', function (): void {
    $screens = (new ScreenExtensions)
        ->tab('test.screen', unitTab('acme.a'))
        ->section('test.screen', 'before', unitSection('acme.b'));

    $screens->flush();

    expect($screens->tabs('test.screen'))->toBe([])
        ->and($screens->sections('test.screen', 'before'))->toBe([])
        ->and($screens->snapshot())->toEqual((new ScreenExtensions)->snapshot());
});
