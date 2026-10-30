<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Blade;
use RefactorCircus\Atrium\Domains\Screens\Data\ResolvedScreen;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;

function screenSectionsResolve(string $uri = '/'): ResolvedScreen
{
    return Atrium::screens()->resolve(Screen::standard('test.host', Screen::DETAIL), Request::create($uri));
}

function screenSection(string $key, string $marker): SectionDefinition
{
    return SectionDefinition::make($key)->view('screens.marker')->public()->resolve(fn (): array => ['marker' => $marker]);
}

/**
 * Each wrapper's test id, class and markup, in order.
 *
 * @return list<array{string, string, string}>
 */
function screenSectionsWrappers(string $html): array
{
    preg_match_all('/<div\b(?=[^>]*\bdata-testid="([^"]*)")(?:(?=[^>]*\bclass="([^"]*)"))?[^>]*>(.*?)<\/div>/s', $html, $matches, PREG_SET_ORDER);

    return array_map(fn (array $match): array => [$match[1], $match[2], trim($match[3])], $matches);
}

it('wraps each visible section of the slot in order, passing class through', function (): void {
    Atrium::screens()
        ->section('*', 'before', screenSection('acme.third', 'third'))
        ->section('test.host', 'before', screenSection('acme.first', 'first'))
        ->section('test.host', 'before', SectionDefinition::make('acme.hidden')->view('screens.marker'))
        ->section('test.host', 'before', screenSection('acme.second', 'second'))
        ->section('test.host', 'after', screenSection('acme.elsewhere', 'elsewhere'));

    $html = Blade::render('<x-atrium::screen-sections :screen="$screen" slot="before" class="mb-6 flex" />', ['screen' => screenSectionsResolve()]);

    expect(screenSectionsWrappers($html))->toBe([
        ['section-acme.first', 'mb-6 flex', '<p>first on test.host for no record with overview open</p>'],
        ['section-acme.second', 'mb-6 flex', '<p>second on test.host for no record with overview open</p>'],
        ['section-acme.third', 'mb-6 flex', '<p>third on test.host for no record with overview open</p>'],
    ])
        ->and($html)->not->toContain('slot=');
});

it('renders an empty string for an empty slot', function (): void {
    Atrium::screens()->section('test.host', 'before', SectionDefinition::make('acme.hidden')->view('screens.marker'));

    $screen = screenSectionsResolve();

    expect(trim(Blade::render('<x-atrium::screen-sections :screen="$screen" slot="before" />', ['screen' => $screen])))->toBe('')
        ->and(trim(Blade::render('<x-atrium::screen-sections :screen="$screen" slot="after" class="mt-6" />', ['screen' => $screen])))->toBe('')
        ->and(trim(Blade::render('<x-atrium::screen-sections :screen="$screen" slot="undeclared" />', ['screen' => $screen])))->toBe('');
});

it('renders the open registered tab\'s panel and nothing on a built-in tab', function (): void {
    Atrium::screens()->tab('test.host', TabDefinition::make('acme.tab')->view('screens.marker')->public()
        ->resolve(fn (): array => ['marker' => 'the panel']));

    $template = '<x-atrium::screen-tab-panel :screen="$screen" class="pt-4" />';

    expect(trim(Blade::render($template, ['screen' => screenSectionsResolve()])))->toBe('')
        ->and(screenSectionsWrappers(Blade::render($template, ['screen' => screenSectionsResolve('/?tab=acme.tab')])))->toBe([
            ['tab-panel-acme.tab', 'pt-4', '<p>the panel on test.host for no record with acme.tab open</p>'],
        ]);
});
