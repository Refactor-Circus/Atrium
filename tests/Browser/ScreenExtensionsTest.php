<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Domains\Themes\Services\ThemeRegistry;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Atrium\ScreenHost\ScreenHostController;
use Workbench\App\Atrium\ScreenHost\ScreenHostPlugin;

/**
 * Criteria 17 and 18: a screen's tab bar and sections look and behave the
 * same in every theme, layout and mode. Each combination is its own test.
 *
 * The list test host (`test.list`) has two built-in tabs, twelve registered
 * ones (the last with a long label), a section in `before` and one in the
 * `row.actions` row slot. ScreenHostPlugin puts the host in a navigation
 * group, so the top layout draws its `top-tabs` row.
 */
beforeEach(function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    ScreenHostController::register();
    Atrium::plugin(ScreenHostPlugin::class);

    config(['screen-host.tabs' => [
        ['key' => 'details', 'label' => 'Details', 'icon' => 'document-text'],
        ['key' => 'activity', 'label' => 'Activity', 'icon' => 'clock'],
    ]]);

    $icons = ['chart-bar', 'users', 'credit-card', 'cog-6-tooth', 'bell', 'truck'];

    foreach (range(1, 12) as $number) {
        Atrium::screens()->tab('test.list', TabDefinition::make('acme.tab-'.$number)
            ->label($number === 12 ? 'A registered tab whose label runs on far longer than any tab bar is wide' : 'Registered tab '.$number)
            ->icon($icons[$number % count($icons)])
            ->view('screens.marker')
            ->resolve(fn (): array => ['marker' => 'Panel '.$number])
            ->public());
    }

    Atrium::screens()
        ->section('test.list', 'before', SectionDefinition::make('acme.summary')
            ->view('screens.marker')
            ->resolve(fn (): array => ['marker' => 'Normal section'])
            ->public())
        ->section('test.list', 'row.actions', SectionDefinition::make('acme.row-action')
            ->view('screens.marker')
            ->resolve(fn (): array => ['marker' => 'Row section'])
            ->public());

    // Pest saves a screenshot only into a directory that exists.
    if (! is_dir(__DIR__.'/Screenshots/screen-extensions')) {
        mkdir(__DIR__.'/Screenshots/screen-extensions', 0755, true);
    }
});

dataset('screen extension looks', function (): array {
    $cases = [];

    foreach (['atrium', 'harbor', 'sunset', 'forest', 'midnight', 'ledger'] as $theme) {
        foreach (['sidebar', 'top'] as $layout) {
            foreach (['light', 'dark'] as $mode) {
                $cases["{$theme} {$layout} {$mode}"] = [$theme, $layout, $mode];
            }
        }
    }

    return $cases;
});

/**
 * The tab bar's computed layout: criterion 17's no-wrap, scrolling row.
 */
function screenExtensionsTabBar(): string
{
    return <<<'JS'
        () => {
            const nav = document.querySelector('[data-testid="screen-tabs"]');
            const links = [...nav.querySelectorAll('a[data-testid^="tab-"]')];
            const style = getComputedStyle(nav);

            return {
                keys: links.map((link) => link.dataset.testid),
                overflowX: style.overflowX,
                flexWrap: style.flexWrap,
                whiteSpace: [...new Set(links.map((link) => getComputedStyle(link).whiteSpace))],
                tops: [...new Set(links.map((link) => Math.round(link.getBoundingClientRect().top)))].length,
            };
        }
        JS;
}

/**
 * How many tabs overlap a `top-tabs` row that is on screen, and how many
 * such rows there are.
 */
function screenExtensionsTopTabsOverlap(): string
{
    return <<<'JS'
        () => {
            const rows = [...document.querySelectorAll('[data-testid="top-tabs"]')]
                .map((row) => row.getBoundingClientRect())
                .filter((box) => box.width > 0 && box.height > 0);

            const overlapping = [...document.querySelectorAll('[data-testid="screen-tabs"] a[data-testid^="tab-"]')]
                .map((link) => link.getBoundingClientRect())
                .filter((tab) => rows.some((row) => tab.left < row.right && tab.right > row.left && tab.top < row.bottom && tab.bottom > row.top));

            return { rows: rows.length, overlapping: overlapping.length };
        }
        JS;
}

/**
 * Whether the tab lies inside the tab bar's visible box and the viewport.
 */
function screenExtensionsTabInView(string $key): string
{
    return <<<JS
        () => {
            const tab = document.querySelector('[data-testid="tab-{$key}"]').getBoundingClientRect();
            const nav = document.querySelector('[data-testid="screen-tabs"]').getBoundingClientRect();

            return tab.width > 0 && tab.left >= nav.left - 1 && tab.right <= nav.right + 1 && tab.right <= window.innerWidth;
        }
        JS;
}

function screenExtensionsBackground(string $key): string
{
    return "getComputedStyle(document.querySelector('[data-testid=\"tab-{$key}\"]')).backgroundColor";
}

it('renders tabs and sections in every theme, layout and mode', function (string $theme, string $layout, string $mode): void {
    // The theme is the default, so a fresh browser shows it; its layout is
    // set here so every theme is seen in both.
    config(['atrium.themes.default' => $theme]);
    app(ThemeRegistry::class)->find($theme)?->layout($layout);

    $visit = visit('/test/list');
    $page = $mode === 'dark' ? $visit->inDarkMode() : $visit->inLightMode();

    $page->assertScript('document.documentElement.dataset.atriumTheme', $theme)
        ->assertScript('document.documentElement.dataset.atriumLayout', $layout)
        ->assertScript('document.documentElement.classList.contains("dark")', $mode === 'dark');

    if ($layout === 'top') {
        $page->assertMissing('@sidebar')
            ->assertVisible('[data-testid="top-tabs"][data-section="group-screen-host"]');
    } else {
        $page->assertVisible('@sidebar')
            ->assertMissing('@top-nav');
    }

    // Both sections render on the built-in tab: the normal slot once, the
    // row slot in each of the three rows.
    $page->assertSeeIn('[data-testid="section-acme.summary"]', 'Normal section')
        ->assertCount('[data-testid="section-acme.row-action"]', 3)
        ->assertSeeIn('[data-testid="row-2"] [data-testid="section-acme.row-action"]', 'Row section')
        ->assertAttribute('[data-testid="tab-details"]', 'aria-current', 'page')
        ->screenshot(true, 'screen-extensions/'.$theme.'-'.$layout.'-'.$mode);

    $assertTabBar = function () use ($page, $layout): void {
        $bar = $page->script(screenExtensionsTabBar());

        expect($bar['keys'])->toBe([
            'tab-details',
            'tab-activity',
            ...array_map(fn (int $number): string => 'tab-acme.tab-'.$number, range(1, 12)),
        ])
            ->and($bar['overflowX'])->toBeIn(['auto', 'scroll'])
            ->and($bar['flexWrap'])->toBe('nowrap')
            ->and($bar['whiteSpace'])->toBe(['nowrap'])
            ->and($bar['tops'])->toBe(1);

        $overlap = $page->script(screenExtensionsTopTabsOverlap());

        expect($overlap['rows'])->toBe($layout === 'top' ? 1 : 0)
            ->and($overlap['overlapping'])->toBe(0);
    };

    $assertTabBar();

    // The last tab scrolls into view, opens on a click, and is the current one.
    $page->script("() => document.querySelector('[data-testid=\"tab-acme.tab-12\"]').scrollIntoView({ block: 'nearest', inline: 'end' })");

    expect($page->script(screenExtensionsTabInView('acme.tab-12')))->toBeTrue();

    $page->click('[data-testid="tab-acme.tab-12"]')
        ->assertAttribute('[data-testid="tab-acme.tab-12"]', 'aria-current', 'page')
        ->assertAttributeMissing('[data-testid="tab-details"]', 'aria-current')
        ->assertSeeIn('[data-testid="tab-panel-acme.tab-12"]', 'Panel 12')
        // With the pointer elsewhere, the open tab is filled and an idle one is not.
        ->hover('[data-testid="tab-panel-acme.tab-12"]')
        ->assertScript(screenExtensionsBackground('acme.tab-12').' !== "rgba(0, 0, 0, 0)"', true)
        ->assertScript(screenExtensionsBackground('acme.tab-12').' !== '.screenExtensionsBackground('details'), true)
        ->assertScript(screenExtensionsBackground('acme.tab-12').' !== '.screenExtensionsBackground('acme.tab-1'), true);

    expect($page->script(screenExtensionsTabInView('acme.tab-12')))->toBeTrue();

    $assertTabBar();
})->with('screen extension looks');
