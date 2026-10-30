<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Facades\Atrium;
use RefactorCircus\Atrium\Tests\Fixtures\FullPlugin;
use Workbench\App\Models\User;

/*
 * Atrium's own screens (criterion 19): each declares itself with
 * Screen::standard(), renders a tab bar, the open registered tab's panel and
 * the sections of every slot it declares, laid out per criterion 15, and
 * renders nothing extra while nothing is registered.
 */

beforeEach(function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    app(WidgetRegistry::class)->add(WidgetDefinition::make('quick')->view('alpha-stats'));
    app(PluginRegistry::class)->register(FullPlugin::class);

    $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);

    $this->dashboard = DashboardModel::query()->create([
        'name' => 'Mine',
        'owner_type' => $this->user->getMorphClass(),
        'owner_id' => $this->user->getKey(),
    ]);

    $this->widget = $this->dashboard->widgets()->create(['widget_key' => 'quick']);
});

/**
 * Register a public tab on the screen, and a public section in each of the
 * given slots, counting each section's resolver calls by slot.
 *
 * @param  list<string>  $slots
 * @param  array<string, int>  $calls
 */
function atriumScreensRegister(string $screen, array $slots, array &$calls): void
{
    Atrium::screens()->tab($screen, TabDefinition::make('acme.tab')->label('Acme')->view('screens.marker')->public()
        ->resolve(fn (): array => ['marker' => 'the acme panel']));

    foreach ($slots as $slot) {
        $calls[$slot] = 0;

        Atrium::screens()->section($screen, $slot, SectionDefinition::make('acme.'.$slot)->view('screens.marker')->public()
            ->resolve(function () use (&$calls, $slot): array {
                $calls[$slot]++;

                return ['marker' => 'in '.$slot];
            }));
    }
}

dataset('atrium screens', [
    'the dashboard' => [
        'atrium.dashboard',
        fn (DashboardModel $dashboard, DashboardWidgetModel $widget): string => route('atrium.dashboard'),
        'Alpha stats widget',
        ['header.actions', 'before', 'aside', 'after'],
        ['row.actions'],
    ],
    'a named dashboard' => [
        'atrium.named-dashboard',
        fn (DashboardModel $dashboard, DashboardWidgetModel $widget): string => route('atrium.dashboard.show', $dashboard->slug),
        'Alpha stats widget',
        ['header.actions', 'before', 'aside', 'after'],
        ['row.actions'],
    ],
    'a dashboard widget' => [
        'atrium.dashboard-widget',
        fn (DashboardModel $dashboard, DashboardWidgetModel $widget): string => route('atrium.dashboards.widgets.show', [$dashboard->id, $widget->id]),
        'Alpha stats widget',
        ['header.actions', 'before', 'aside', 'after'],
        ['row.actions'],
    ],
    // `row.actions` is declared on the settings index but not yet rendered:
    // a settings panel is not a model, and a row slot's row must be one.
    'the settings index' => [
        'atrium.settings',
        fn (DashboardModel $dashboard, DashboardWidgetModel $widget): string => route('atrium.settings'),
        'Full Settings',
        ['header.actions', 'before', 'after'],
        ['aside'],
    ],
    'a settings panel' => [
        'atrium.settings-panel',
        fn (DashboardModel $dashboard, DashboardWidgetModel $widget): string => route('atrium.settings.show', 'full'),
        'Full plugin settings body',
        ['header.actions', 'before', 'aside', 'after'],
        ['row.actions'],
    ],
]);

it('renders each registered section in its own slot and none in an undeclared one', function (string $screen, Closure $url, string $content, array $slots, array $undeclared): void {
    $calls = [];
    atriumScreensRegister($screen, [...$slots, ...$undeclared], $calls);

    $response = $this->actingAs($this->user)->get($url($this->dashboard, $this->widget))->assertOk();

    foreach ($slots as $slot) {
        $response->assertSee('data-testid="section-acme.'.$slot.'"', false)->assertSee('in '.$slot.' on '.$screen);
    }

    // Header actions, then the tab bar, then the page with `before` above
    // it, `aside` beside it and `after` below it.
    $response->assertSeeInOrder([
        'data-testid="section-acme.header.actions"',
        'data-testid="screen-tabs"',
        'data-testid="section-acme.before"',
        $content,
        ...(in_array('aside', $slots, true) ? ['data-testid="section-acme.aside"'] : []),
        'data-testid="section-acme.after"',
    ], false);

    foreach ($undeclared as $slot) {
        $response->assertDontSee('data-testid="section-acme.'.$slot.'"', false)->assertDontSee('in '.$slot.' on');
    }

    expect($calls)->toBe([
        ...array_fill_keys($slots, 1),
        ...array_fill_keys($undeclared, 0),
    ]);
})->with('atrium screens');

it('shows the registered tab and opens it through ?tab= in place of the page', function (string $screen, Closure $url, string $content, array $slots, array $undeclared): void {
    $calls = [];
    atriumScreensRegister($screen, $slots, $calls);

    $page = $url($this->dashboard, $this->widget);

    $this->actingAs($this->user)->get($page)
        ->assertOk()
        ->assertSee('data-testid="tab-overview"', false)
        ->assertSee('data-testid="tab-acme.tab"', false)
        ->assertDontSee('data-testid="tab-panel-acme.tab"', false);

    // A fresh request, so nothing is remembered from the one above.
    app()->forgetScopedInstances();
    $calls = array_map(fn (): int => 0, $calls);

    $open = $this->actingAs($this->user)->get($page.'?tab=acme.tab')
        ->assertOk()
        ->assertSee('data-testid="tab-panel-acme.tab"', false)
        ->assertSee('the acme panel on '.$screen)
        ->assertSee('data-testid="section-acme.header.actions"', false)
        ->assertDontSee($content);

    foreach (array_diff($slots, ['header.actions']) as $slot) {
        $open->assertDontSee('data-testid="section-acme.'.$slot.'"', false)->assertDontSee('in '.$slot.' on');
    }

    expect($calls)->toBe([...array_fill_keys($slots, 0), 'header.actions' => 1]);
})->with('atrium screens');

it('renders no tab bar or extra markup while nothing is registered', function (string $screen, Closure $url, string $content): void {
    $html = (string) $this->actingAs($this->user)->get($url($this->dashboard, $this->widget))
        ->assertOk()
        ->assertSee($content)
        ->getContent();

    expect($html)
        ->not->toContain('data-testid="screen-tabs"')
        ->not->toContain('data-testid="tab-')
        ->not->toContain('data-testid="section-')
        ->not->toContain('data-testid="screen-aside"');
})->with('atrium screens');

it('serves a widget body unchanged while nothing is registered', function (): void {
    $html = (string) $this->actingAs($this->user)
        ->get(route('atrium.dashboards.widgets.show', [$this->dashboard->id, $this->widget->id]))
        ->assertOk()
        ->getContent();

    expect(trim($html))->toBe(trim(view('alpha-stats')->render()));
});

it('keeps the dashboard screen out of an inline widget body', function (): void {
    $calls = [];
    atriumScreensRegister('atrium.dashboard-widget', ['header.actions', 'before', 'aside', 'after'], $calls);

    // The widget is placed on the dashboard, which includes its body inline;
    // only the widget's own route is the widget screen.
    $this->actingAs($this->user)->get(route('atrium.dashboard'))
        ->assertOk()
        ->assertSee('Alpha stats widget')
        ->assertDontSee('data-testid="section-acme.', false);

    expect(array_sum($calls))->toBe(0);
});
