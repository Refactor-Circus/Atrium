<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavSection;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;

beforeEach(function (): void {
    app()->detectEnvironment(fn (): string => 'local');
});

/**
 * @return array<int, NavSection>
 */
function sections(string $path = '/atrium'): array
{
    return app(NavigationRegistry::class)->sections(Request::create($path));
}

it('puts pages outside a group on the rail first, then each group', function (): void {
    $nav = app(NavigationRegistry::class);
    $nav->add(NavItem::make('Products')->url('/products')->group('Catalog')->sort(1));
    $nav->add(NavItem::make('Reports')->url('/reports')->sort(50));
    $nav->add(NavItem::make('Users')->url('/users')->group('People')->sort(2));

    $sections = sections();

    expect(array_map(fn (NavSection $s): string => $s->label, $sections))->toBe(['Reports', 'Catalog', 'People'])
        ->and($sections[0]->grouped)->toBeFalse()
        ->and($sections[0]->url())->toBe('/reports')
        ->and($sections[1]->grouped)->toBeTrue();
});

it('orders groups by their own sort before their pages', function (): void {
    $nav = app(NavigationRegistry::class);
    $nav->add(NavItem::make('Products')->url('/products')->group('Catalog')->sort(1));
    $nav->add(NavItem::make('Users')->url('/users')->group('People')->sort(2));
    $nav->group(NavGroup::make('People')->sort(0));

    expect(array_map(fn (NavSection $s): string => $s->label, sections()))->toBe(['People', 'Catalog']);
});

it('takes a section icon from its group, else its first page with one', function (): void {
    $nav = app(NavigationRegistry::class);
    $nav->add(NavItem::make('Products')->url('/products')->group('Catalog'));
    $nav->add(NavItem::make('Assets')->url('/assets')->icon('<svg>asset</svg>')->group('Catalog'));
    $nav->add(NavItem::make('Users')->url('/users')->icon('<svg>user</svg>')->group('People'));
    $nav->group(NavGroup::make('People')->icon('<svg>people</svg>'));

    [$catalog, $people] = sections();

    expect($catalog->icon)->toBe('<svg>asset</svg>')
        ->and($people->icon)->toBe('<svg>people</svg>');
});

it('opens a page with sub-pages in the panel like a group', function (): void {
    app(NavigationRegistry::class)->add(NavItem::make('Reports')->url('/reports')->children([
        NavItem::make('Sales')->url('/reports/sales'),
    ]));

    expect(sections()[0]->grouped)->toBeTrue();
});

it('knows which section the current page belongs to', function (): void {
    $nav = app(NavigationRegistry::class);
    $nav->add(NavItem::make('Products')->url('/products')->group('Catalog'));
    $nav->add(NavItem::make('Users')->url('/users')->group('People'));

    [$catalog, $people] = sections('/users');

    expect($catalog->isActive(Request::create('/users')))->toBeFalse()
        ->and($people->isActive(Request::create('/users')))->toBeTrue();
});

it('docks the current section in the panel and offers the rest from the rail', function (): void {
    $nav = app(NavigationRegistry::class);
    $nav->add(NavItem::make('Home')->url('/atrium')->group('Main'));
    $nav->add(NavItem::make('Users')->url('/users')->group('People'));

    $html = $this->get('/atrium')->assertOk()->getContent();

    expect($html)->toContain('data-testid="nav-rail"')
        ->toContain('aria-label="People"')
        ->toContain("x-data=\"atriumShell('group-main')\"")
        ->toMatch('/data-testid="nav-panel-section" data-section="group-people"/');
});

it('shows the sidebar toggle only while a section can be docked', function (): void {
    $nav = app(NavigationRegistry::class);
    $nav->add(NavItem::make('Home')->url('/atrium')->group('Main'));

    $toggle = '/<div class="hidden shrink-0 py-3 lg:block" x-show="section !== null"\s*(x-cloak)?\s*>\s*<button type="button" data-testid="sidebar-toggle"/';

    preg_match($toggle, $this->get('/atrium')->assertOk()->getContent(), $docked);

    expect($docked)->not->toBeEmpty()
        ->and($docked[1] ?? '')->toBe('');
});

it('cloaks the sidebar toggle when no section is current', function (): void {
    app(NavigationRegistry::class)->add(NavItem::make('Users')->url('/users')->group('People'));

    expect($this->get('/atrium')->assertOk()->getContent())
        ->toMatch('/x-show="section !== null"\s*x-cloak\s*>\s*<button type="button" data-testid="sidebar-toggle"/');
});
