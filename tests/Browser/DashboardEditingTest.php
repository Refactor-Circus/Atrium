<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\AlphaPlugin;
use RefactorCircus\Atrium\Tests\Fixtures\BrowserPlugin;
use Workbench\App\Models\User;

/**
 * These cover the interactions the endpoint tests cannot reach: the edit
 * toggle, the widget toolbar, drag reordering, and the picker. Everything
 * here runs against real Chromium with Alpine actually executing.
 */
beforeEach(function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    app(PluginRegistry::class)->registerMany([AlphaPlugin::class, BrowserPlugin::class]);
});

function browserUser(string $email = 'browser@example.com'): User
{
    return User::forceCreate([
        'name' => 'Browser Tester',
        'email' => $email,
        'password' => bcrypt('secret'),
    ]);
}

function browserDashboard(User $user, array $widgetKeys = []): DashboardModel
{
    $dashboard = DashboardModel::query()->create([
        'name' => 'Ops',
        'owner_type' => $user->getMorphClass(),
        'owner_id' => $user->getKey(),
        'is_default' => true,
    ]);

    foreach (array_values($widgetKeys) as $index => $key) {
        $dashboard->widgets()->create(['widget_key' => $key, 'sort' => $index, 'grid_width' => 4]);
    }

    return $dashboard;
}

it('offers widgets in the picker without placing any of them', function (): void {
    $user = browserUser();
    browserDashboard($user);

    $this->actingAs($user);

    $page = visit('/atrium');

    // Nothing on the grid, but both widgets are on offer.
    $page->assertCount('.atrium-grid__item', 0)
        ->assertSee('Add widget')
        ->click('@add-widget')
        ->assertSee('Alpha Stats')
        ->assertSee('Browser Widget');
});

it('places a widget only when the user picks one', function (): void {
    $user = browserUser();
    $dashboard = browserDashboard($user);

    $this->actingAs($user);

    $page = visit('/atrium');

    $page->click('@add-widget')
        ->click('@pick-alpha-stats')
        ->assertSee('Alpha stats widget');

    expect($dashboard->widgets()->pluck('widget_key')->all())->toBe(['alpha.stats']);
});

it('shows the widget toolbar only after entering edit mode', function (): void {
    $user = browserUser();
    browserDashboard($user, ['alpha.stats']);

    $this->actingAs($user);

    $page = visit('/atrium');

    // Edit mode swaps which of the two buttons is visible, and reveals the
    // per-widget toolbar. Both are asserted through visible text.
    // Edit mode swaps which button is visible and reveals the drag handle
    // on each widget's toolbar.
    $page->assertSee('Edit layout')
        ->assertDontSee('⠿')
        ->click('@edit-layout')
        ->assertSee('Done')
        ->assertSee('⠿')
        ->click('@done-editing')
        ->assertSee('Edit layout')
        ->assertDontSee('⠿');
});

it('removes a widget from the dashboard and keeps it removed', function (): void {
    $user = browserUser();
    $dashboard = browserDashboard($user, ['alpha.stats', 'browser.widget']);

    $this->actingAs($user);

    $page = visit('/atrium');

    // x-show leaves the removed node in the DOM, so assert on what a person
    // can actually see rather than on element count.
    $page->assertSee('Alpha stats widget')
        ->assertSee('Browser widget body')
        ->click('@edit-layout')
        ->click('@remove-alpha-stats')
        ->assertDontSee('Alpha stats widget')
        ->assertSee('Browser widget body')
        ->assertSee('Layout saved');

    expect($dashboard->widgets()->pluck('widget_key')->all())->toBe(['browser.widget']);

    // And it stays removed on a fresh load.
    $this->actingAs($user);

    visit('/atrium')
        ->assertDontSee('Alpha stats widget')
        ->assertSee('Browser widget body');
});

it('resizes a widget and persists the new width', function (): void {
    $user = browserUser();
    $dashboard = browserDashboard($user, ['alpha.stats']);

    $this->actingAs($user);

    $page = visit('/atrium');

    $page->click('@edit-layout')
        ->click('@wider-alpha-stats')
        ->click('@wider-alpha-stats')
        ->assertSee('Layout saved');

    expect($dashboard->widgets()->firstOrFail()->grid_width)->toBe(6);
});

it('will not resize a widget below one column', function (): void {
    $user = browserUser();
    $dashboard = browserDashboard($user, ['alpha.stats']);

    $this->actingAs($user);

    $page = visit('/atrium');

    $page->click('@edit-layout');

    foreach (range(1, 6) as $ignored) {
        $page->click('@narrower-alpha-stats');
    }

    $page->assertSee('Layout saved');

    expect($dashboard->widgets()->firstOrFail()->grid_width)->toBe(1);
});

it('reorders widgets by dragging one onto another', function (): void {
    $user = browserUser();
    $dashboard = browserDashboard($user, ['alpha.stats', 'browser.widget']);

    expect($dashboard->widgets()->pluck('widget_key')->all())->toBe(['alpha.stats', 'browser.widget']);

    $this->actingAs($user);

    $page = visit('/atrium');

    $page->click('@edit-layout')
        ->drag('@widget-browser-widget', '@widget-alpha-stats')
        ->assertSee('Layout saved');

    expect(
        DashboardWidgetModel::query()->orderBy('sort')->pluck('widget_key')->all(),
    )->toBe(['browser.widget', 'alpha.stats']);
});

it('hides editing controls from a viewer who does not own the dashboard', function (): void {
    $owner = browserUser('owner@example.com');
    $viewer = browserUser('viewer@example.com');

    $shared = DashboardModel::query()->create(['name' => 'Shared', 'is_shared' => true, 'is_default' => true]);
    $shared->widgets()->create(['widget_key' => 'alpha.stats']);

    $this->actingAs($viewer);

    visit('/atrium')
        ->assertSee('Alpha stats widget')
        ->assertMissing('@edit-layout')
        ->assertMissing('@remove-alpha-stats');
});

it('fetches a lazy widget after the page loads', function (): void {
    app(WidgetRegistry::class)->add(WidgetDefinition::make('lazy.stats')->label('Lazy Stats')->view('alpha-stats')->lazy());

    $user = browserUser();
    browserDashboard($user, ['lazy.stats']);

    $this->actingAs($user);

    visit('/atrium')
        ->assertPresent('@lazy-widget')
        ->assertSee('Alpha stats widget');
});
