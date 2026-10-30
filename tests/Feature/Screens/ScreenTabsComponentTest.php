<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Atrium\ScreenHost\ScreenHostController;

beforeEach(function (): void {
    ScreenHostController::register();

    config(['screen-host.tabs' => [
        ['key' => 'details', 'label' => 'Details', 'icon' => 'document-text'],
        ['key' => 'activity', 'label' => 'Activity'],
    ]]);
});

/**
 * The opening tag of a tab's link.
 */
function screenTabsLink(string $html, string $key): string
{
    expect(preg_match('/<a\b[^>]*data-testid="tab-'.preg_quote($key, '/').'"[^>]*>/', $html, $match))->toBe(1);

    return $match[0];
}

/**
 * The markup inside a tab's link: its icon.
 */
function screenTabsIcon(string $html, string $key): string
{
    expect(preg_match('/<a\b[^>]*data-testid="tab-'.preg_quote($key, '/').'"[^>]*>(.*?)<\/a>/s', $html, $match))->toBe(1);

    return trim($match[1]);
}

/**
 * @return list<string>
 */
function screenTabsClasses(string $link): array
{
    preg_match('/\sclass="([^"]*)"/', $link, $match);

    return preg_split('/\s+/', $match[1] ?? '', flags: PREG_SPLIT_NO_EMPTY) ?: [];
}

it('links each tab to ?tab= keeping the query string except page and tab', function (): void {
    Atrium::screens()->tab('test.host', TabDefinition::make('acme.billing')->label('Billing')->view('screens.marker')->public());

    $html = $this->get(route('test.host', ['page' => 2, 'q' => 'x', 'tab' => 'activity']))->assertOk()->getContent();

    expect(screenTabsLink($html, 'details'))->toContain('href="'.e(route('test.host').'?q=x&tab=details').'"')
        ->and(screenTabsLink($html, 'acme.billing'))->toContain('href="'.e(route('test.host').'?q=x&tab=acme.billing').'"');
});

it('escapes the query string it keeps', function (): void {
    $html = $this->get(route('test.host').'?q[]=a&b')->assertOk()->getContent();

    // The empty `b` reaches the URL helper as null (ConvertEmptyStringsToNull), which leaves it out.
    expect(screenTabsLink($html, 'details'))->toContain('?q%5B0%5D=a&amp;tab=details"');

    $html = $this->get(route('test.host').'?q='.rawurlencode('<x>"'))->assertOk()->getContent();

    expect(screenTabsLink($html, 'details'))->toContain('?q=%3Cx%3E%22&amp;tab=details"')
        ->and($html)->not->toContain('<x>"');
});

it('marks the open tab alone as current and primary', function (): void {
    Atrium::screens()->tab('test.host', TabDefinition::make('acme.billing')->label('Billing')->view('screens.marker')->public());

    $html = $this->get(route('test.host', ['tab' => 'acme.billing']))->assertOk()->getContent();

    $open = screenTabsLink($html, 'acme.billing');

    expect($open)->toContain('aria-current="page"')
        ->and(screenTabsClasses($open))->toContain('bg-primary');

    foreach (['details', 'activity'] as $idle) {
        $link = screenTabsLink($html, $idle);

        expect($link)->not->toContain('aria-current')
            ->and(screenTabsClasses($link))->not->toContain('bg-primary');
    }

    $html = $this->get(route('test.host'))->assertOk()->getContent();

    expect(screenTabsLink($html, 'details'))->toContain('aria-current="page"')
        ->and(screenTabsLink($html, 'acme.billing'))->not->toContain('aria-current');
});

it('renders a scrolling, non-wrapping nav of icon buttons with escaped labels', function (): void {
    Atrium::screens()->tab('test.host', TabDefinition::make('acme.marked-up')->label('<b>Bold</b> & co')->view('screens.marker')->public());

    $html = $this->get(route('test.host'))->assertOk()->getContent();

    expect(preg_match('/<nav\b[^>]*data-testid="screen-tabs"[^>]*>/', $html, $nav))->toBe(1)
        // A flex row never wraps unless told to.
        ->and(screenTabsClasses($nav[0]))->toContain('flex', 'overflow-x-auto')
        ->and(screenTabsClasses($nav[0]))->not->toContain('flex-wrap')
        ->and(screenTabsLink($html, 'acme.marked-up'))->toContain('aria-label="&lt;b&gt;Bold&lt;/b&gt; &amp; co"')
        ->and($html)->toContain('&lt;b&gt;Bold&lt;/b&gt; &amp; co')
        ->and($html)->not->toContain('<b>Bold</b>');
});

it('falls back to squares-2x2 for an icon Atrium does not know', function (): void {
    Atrium::screens()
        ->tab('test.host', TabDefinition::make('acme.unknown-icon')->icon('not-a-real-icon')->view('screens.marker')->public())
        ->tab('test.host', TabDefinition::make('acme.squares')->icon('squares-2x2')->view('screens.marker')->public());

    $html = $this->get(route('test.host'))->assertOk()->getContent();

    expect(screenTabsIcon($html, 'acme.unknown-icon'))->toBe(screenTabsIcon($html, 'acme.squares'))
        ->and(screenTabsIcon($html, 'acme.squares'))->toContain('<svg')
        ->and(screenTabsIcon($html, 'details'))->not->toBe(screenTabsIcon($html, 'acme.squares'));
});

it('renders nothing with fewer than two visible tabs', function (): void {
    config(['screen-host.tabs' => []]);

    $this->get(route('test.host'))
        ->assertOk()
        ->assertDontSee('data-testid="screen-tabs"', false)
        ->assertDontSee('data-testid="tab-overview"', false);

    config(['screen-host.tabs' => [['key' => 'details', 'label' => 'Details']]]);
    Atrium::screens()->tab('test.host', TabDefinition::make('acme.hidden')->view('screens.marker'));

    $this->get(route('test.host'))
        ->assertOk()
        ->assertDontSee('data-testid="screen-tabs"', false)
        ->assertDontSee('data-testid="tab-details"', false);
});

it('does not render reserved keys, or a registered tab using one', function (): void {
    config(['screen-host.reserved' => ['secrets', 'acme.billing']]);
    Atrium::screens()->tab('test.host', TabDefinition::make('acme.billing')->label('Billing')->view('screens.marker')->public());

    $this->get(route('test.host', ['tab' => 'secrets']))
        ->assertOk()
        ->assertSee('data-testid="tab-details"', false)
        ->assertDontSee('data-testid="tab-secrets"', false)
        ->assertDontSee('data-testid="tab-acme.billing"', false);
});
