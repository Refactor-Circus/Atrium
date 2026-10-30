<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanelRow;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
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
    // The full plugin's panel is the settings index's one row, so its
    // `row.actions` section renders, and resolves, once.
    'the settings index' => [
        'atrium.settings',
        fn (DashboardModel $dashboard, DashboardWidgetModel $widget): string => route('atrium.settings'),
        'Full Settings',
        ['header.actions', 'before', 'row.actions', 'after'],
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
    // it, its rows' actions in it, `aside` beside it and `after` below it.
    $response->assertSeeInOrder([
        'data-testid="section-acme.header.actions"',
        'data-testid="screen-tabs"',
        'data-testid="section-acme.before"',
        $content,
        ...(in_array('row.actions', $slots, true) ? ['data-testid="section-acme.row.actions"'] : []),
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

it('shows a permission() extension only while the Gate allows it', function (bool $allowed, string $screen, Closure $url, string $content): void {
    Gate::define('acme.see', fn (User $user, mixed ...$arguments): bool => $allowed);

    Atrium::screens()
        ->tab($screen, TabDefinition::make('acme.gated-tab')->label('Gated')->view('screens.marker')->permission('acme.see'))
        ->section($screen, 'header.actions', SectionDefinition::make('acme.gated')->view('screens.marker')->permission('acme.see')
            ->resolve(fn (): array => ['marker' => 'the gated section']));

    $response = $this->actingAs($this->user)->get($url($this->dashboard, $this->widget))
        ->assertOk()
        ->assertSee($content);

    if ($allowed) {
        $response->assertSee('data-testid="section-acme.gated"', false)
            ->assertSee('the gated section on '.$screen)
            ->assertSee('data-testid="tab-acme.gated-tab"', false);
    } else {
        $response->assertDontSee('data-testid="section-acme.gated"', false)
            ->assertDontSee('the gated section')
            ->assertDontSee('data-testid="tab-acme.gated-tab"', false);
    }
})->with([
    'allowed' => [true],
    'denied' => [false],
])->with('atrium screens');

it('asks the Gate about the screen record, or with no arguments when there is none', function (string $screen, Closure $url, string $expected): void {
    $received = [];

    Gate::define('acme.see', function (User $user, mixed ...$arguments) use (&$received): bool {
        $received[] = array_map(fn (mixed $argument): string => get_debug_type($argument), $arguments);

        return true;
    });

    Atrium::screens()->section($screen, 'header.actions', SectionDefinition::make('acme.gated')->view('screens.marker')->permission('acme.see'));

    $this->actingAs($this->user)->get($url($this->dashboard, $this->widget))->assertOk();

    expect($received)->toBe([$expected === '' ? [] : [$expected]]);
})->with([
    'the dashboard' => ['atrium.dashboard', fn (DashboardModel $dashboard, DashboardWidgetModel $widget): string => route('atrium.dashboard'), DashboardModel::class],
    'a named dashboard' => ['atrium.named-dashboard', fn (DashboardModel $dashboard, DashboardWidgetModel $widget): string => route('atrium.dashboard.show', $dashboard->slug), DashboardModel::class],
    'a dashboard widget' => ['atrium.dashboard-widget', fn (DashboardModel $dashboard, DashboardWidgetModel $widget): string => route('atrium.dashboards.widgets.show', [$dashboard->id, $widget->id]), DashboardWidgetModel::class],
    'the settings index' => ['atrium.settings', fn (DashboardModel $dashboard, DashboardWidgetModel $widget): string => route('atrium.settings'), ''],
    'a settings panel' => ['atrium.settings-panel', fn (DashboardModel $dashboard, DashboardWidgetModel $widget): string => route('atrium.settings.show', 'full'), ''],
]);

/**
 * A row section on the settings index admitting only the `beta` panel's row,
 * recording what its closures receive.
 *
 * @param  list<array{string, mixed, ?string, string}>  $asked
 * @param  list<mixed>  $resolved
 */
function atriumScreensSettingsRowSection(array &$asked, array &$resolved): SectionDefinition
{
    return SectionDefinition::make('acme.row-action')
        ->view('screens.marker')
        ->authorize(function (Request $request, ?Model $record, Screen $screen) use (&$asked): bool {
            $asked[] = [get_debug_type($record), $record?->getKey(), $record instanceof SettingsPanelRow ? $record->panel->key : null, $screen->key];

            return $record?->getKey() === 'beta';
        })
        ->resolve(function (?Model $record, Screen $screen) use (&$resolved): array {
            $resolved[] = $record?->getKey();

            return ['marker' => 'row action'];
        });
}

/**
 * The settings index's markup for one panel's card, from its link to the next
 * panel's link (or the end).
 */
function atriumScreensSettingsRow(string $html, string $panel, ?string $next): string
{
    $start = strrpos($html, 'href="'.route('atrium.settings.show', $panel).'"');

    expect($start)->not->toBeFalse();

    $end = $next === null ? false : strrpos($html, 'href="'.route('atrium.settings.show', $next).'"');

    return substr($html, (int) $start, $end === false ? null : $end - (int) $start);
}

it('renders row.actions once per settings panel row, with that row as the record', function (): void {
    app(SettingsRegistry::class)
        ->add(SettingsPanel::make('alpha')->label('Alpha')->sort(1))
        ->add(SettingsPanel::make('beta')->label('Beta')->sort(2));

    $asked = [];
    $resolved = [];

    Atrium::screens()->section('atrium.settings', 'row.actions', atriumScreensSettingsRowSection($asked, $resolved));

    $html = (string) $this->actingAs($this->user)->get(route('atrium.settings'))->assertOk()->getContent();

    // The rows are the panels in order: alpha, beta, then the full plugin's.
    expect(substr_count($html, 'data-testid="section-acme.row-action"'))->toBe(1)
        ->and(atriumScreensSettingsRow($html, 'beta', 'full'))->toContain('data-testid="section-acme.row-action"')
        ->and(atriumScreensSettingsRow($html, 'beta', 'full'))->toContain('row action on atrium.settings')
        ->and(atriumScreensSettingsRow($html, 'alpha', 'beta'))->not->toContain('row action')
        ->and(atriumScreensSettingsRow($html, 'full', null))->not->toContain('row action')
        ->and($asked)->toBe([
            [SettingsPanelRow::class, 'alpha', 'alpha', 'atrium.settings'],
            [SettingsPanelRow::class, 'beta', 'beta', 'atrium.settings'],
            [SettingsPanelRow::class, 'full', 'full', 'atrium.settings'],
        ])
        ->and($resolved)->toBe(['beta']);
});

it('remembers each settings panel row\'s answer and data when the rows render again in the request', function (): void {
    $asked = [];
    $resolved = [];

    Atrium::screens()->section('atrium.settings', 'row.actions', atriumScreensSettingsRowSection($asked, $resolved));

    $screen = Atrium::screens()->resolve(Screen::standard('atrium.settings', Screen::LIST), request());
    $template = '<x-atrium::screen-sections :screen="$screen" slot="row.actions" :row="$row" />';

    // Each pass builds new rows, so only the panel key ties them together.
    foreach ([1, 2] as $pass) {
        foreach (['alpha', 'beta', 'full'] as $key) {
            $html = Blade::render($template, ['screen' => $screen, 'row' => SettingsPanelRow::for(SettingsPanel::make($key))]);

            expect(str_contains($html, 'row action'))->toBe($key === 'beta');
        }
    }

    expect(array_column($asked, 1))->toBe(['alpha', 'beta', 'full'])
        ->and($resolved)->toBe(['beta']);
});

it('keys an unsaved settings panel row by its panel key and carries the panel', function (): void {
    $panel = SettingsPanel::make('billing')->label('Billing');
    $row = SettingsPanelRow::for($panel);

    expect($row->getKey())->toBe('billing')
        ->and($row->panel)->toBe($panel)
        ->and($row->exists)->toBeFalse();
});

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
