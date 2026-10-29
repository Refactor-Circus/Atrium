<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Atrium as AtriumClass;
use RefactorCircus\Atrium\Domains\Screens\Data\ResolvedScreen;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Domains\Screens\ScreensServiceProvider;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenVisibility;
use RefactorCircus\Atrium\Facades\Atrium;
use Symfony\Component\HttpKernel\Exception\HttpException;

function resolveTab(string $key, string $label = ''): TabDefinition
{
    return TabDefinition::make($key)->view('acme::'.$key)->label($label === '' ? $key : $label)->public();
}

function resolveSection(string $key, string $label = ''): SectionDefinition
{
    return SectionDefinition::make($key)->view('acme::'.$key)->label($label === '' ? $key : $label)->public();
}

/**
 * @param  list<TabDefinition|SectionDefinition>  $definitions
 * @return list<string>
 */
function resolveKeys(array $definitions): array
{
    return array_map(fn (TabDefinition|SectionDefinition $definition): string => $definition->key, $definitions);
}

function resolveScreen(Screen $screen, string $uri = '/'): ResolvedScreen
{
    return Atrium::screens()->resolve($screen, Request::create($uri));
}

/**
 * A route that resolves the screen the closure builds and answers with what
 * it opened, as a host controller would.
 *
 * @param  Closure(): Screen  $screen
 */
function resolveRoute(Closure $screen): void
{
    Route::get('screen-test', function (Request $request) use ($screen) {
        $resolved = Atrium::screens()->resolve($screen(), $request);

        return response()->json([
            'open' => $resolved->openTab,
            'registered' => $resolved->openRegisteredTab?->key,
            'tabs' => resolveKeys($resolved->tabs),
        ]);
    });
}

describe('the registry', function (): void {
    it('is a singleton reachable through Atrium::screens()', function (): void {
        $screens = app(ScreenExtensions::class);

        expect(app(ScreenExtensions::class))->toBe($screens)
            ->and(Atrium::screens())->toBe($screens)
            ->and(app(AtriumClass::class)->screens())->toBe($screens);
    });

    it('is registered by the Screens domain provider, with request-scoped answers', function (): void {
        $visibility = app(ScreenVisibility::class);

        expect(app()->getProvider(ScreensServiceProvider::class))->toBeInstanceOf(ScreensServiceProvider::class)
            ->and(app(ScreenVisibility::class))->toBe($visibility);

        app()->forgetScopedInstances();

        expect(app(ScreenVisibility::class))->not->toBe($visibility);
    });
});

describe('tabs', function (): void {
    it('lists built-ins as given, then exact registrations, then wildcards, each in registration order', function (): void {
        Atrium::screens()
            ->tab('*', resolveTab('acme.w1'))
            ->tab('test.screen', resolveTab('acme.e1'))
            ->tab('test.*', resolveTab('acme.w2'))
            ->tab('test.screen', resolveTab('acme.e2'))
            ->tab('*', resolveTab('acme.w3'))
            ->tab('other.screen', resolveTab('acme.elsewhere'))
            ->tab('other.*', resolveTab('acme.elsewhere-package'));

        $screen = Screen::make('test.screen')->tabs([
            ['key' => 'members', 'label' => 'Members'],
            ['key' => 'teams', 'label' => 'Teams'],
        ]);

        expect(resolveKeys(resolveScreen($screen)->tabs))
            ->toBe(['members', 'teams', 'acme.e1', 'acme.e2', 'acme.w1', 'acme.w2', 'acme.w3']);
    });

    it('skips and reports once a registered tab using a built-in key', function (string $target, string $key): void {
        Exceptions::fake();

        Atrium::screens()->tab($target, resolveTab($key, 'Registered'));

        $screen = fn (): Screen => Screen::make('test.screen')->tabs([['key' => 'members', 'label' => 'Members']]);
        $overview = fn (): Screen => Screen::make('test.screen');
        $built = $key === 'overview' ? $overview : $screen;

        $first = resolveScreen($built());
        resolveScreen($built());

        expect(array_map(fn (TabDefinition $tab): string => $tab->label, $first->tabs))->not->toContain('Registered');

        Exceptions::assertReportedCount(1);
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), "[{$key}]")
            && str_contains($exception->getMessage(), '[test.screen]'));
    })->with([
        'exact, overview' => ['test.screen', 'overview'],
        'exact, a host tab' => ['test.screen', 'members'],
        'every screen, overview' => ['*', 'overview'],
        'every screen, a host tab' => ['*', 'members'],
    ]);

    it('never makes a registered tab the default', function (): void {
        Atrium::screens()->tab('test.screen', resolveTab('acme.first'));

        $resolved = resolveScreen(Screen::make('test.screen'));

        expect($resolved->openTab)->toBe('overview')
            ->and($resolved->openRegisteredTab)->toBeNull();
    });

    it('opens the default tab, or the first built-in, for an absent or unknown key', function (): void {
        $screen = fn (): Screen => Screen::make('test.screen')->tabs([['key' => 'members'], ['key' => 'teams']]);

        expect(resolveScreen($screen())->openTab)->toBe('members')
            ->and(resolveScreen($screen()->defaultTab('teams'))->openTab)->toBe('teams')
            ->and(resolveScreen($screen()->defaultTab('unknown'))->openTab)->toBe('members')
            ->and(resolveScreen($screen(), '/?tab=teams')->openTab)->toBe('teams')
            ->and(resolveScreen($screen(), '/?tab=nothing')->openTab)->toBe('members');
    });

    it('answers 200 with the default tab for an unknown key', function (): void {
        resolveRoute(fn (): Screen => Screen::make('test.screen'));

        $this->get('/screen-test?tab=acme.unknown')
            ->assertOk()
            ->assertJsonPath('open', 'overview')
            ->assertJsonPath('registered', null);
    });

    it('reads ?tab= only as a string', function (): void {
        Atrium::screens()->tab('test.screen', resolveTab('acme.x'));
        resolveRoute(fn (): Screen => Screen::make('test.screen'));

        $this->get('/screen-test?tab[]=acme.x')
            ->assertOk()
            ->assertJsonPath('open', 'overview');
    });

    it('opens a visible registered tab', function (): void {
        Atrium::screens()->tab('test.screen', resolveTab('acme.x'));
        resolveRoute(fn (): Screen => Screen::make('test.screen'));

        $this->get('/screen-test?tab=acme.x')
            ->assertOk()
            ->assertJsonPath('open', 'acme.x')
            ->assertJsonPath('registered', 'acme.x')
            ->assertJsonPath('tabs', ['overview', 'acme.x']);
    });

    it('answers 403 for a registered tab the viewer cannot see', function (): void {
        Atrium::screens()->tab('test.screen', TabDefinition::make('acme.hidden')->view('acme::hidden'));
        resolveRoute(fn (): Screen => Screen::make('test.screen'));

        $this->get('/screen-test?tab=acme.hidden')->assertForbidden();
        $this->get('/screen-test')->assertOk()->assertJsonPath('tabs', ['overview']);

        expect(fn () => resolveScreen(Screen::make('test.screen'), '/?tab=acme.hidden'))
            ->toThrow(fn (HttpException $exception) => expect($exception->getStatusCode())->toBe(403));
    });

    it('opens all-digit keys as strings', function (): void {
        Atrium::screens()
            ->tab('test.screen', resolveTab('123'))
            ->tab('test.screen', resolveTab('007'));
        resolveRoute(fn (): Screen => Screen::make('test.screen'));

        $this->get('/screen-test?tab=007')
            ->assertOk()
            ->assertJsonPath('open', '007')
            ->assertJsonPath('registered', '007')
            ->assertJsonPath('tabs', ['overview', '123', '007']);

        $this->get('/screen-test?tab=123')->assertJsonPath('open', '123');

        expect(resolveScreen(Screen::make('test.screen'), '/?tab=007')->openRegisteredTab?->key)->toBe('007');
    });

    it('memoizes data() for the request and refuses a built-in tab', function (): void {
        $calls = 0;

        Atrium::screens()->tab('test.screen', resolveTab('acme.x')->resolve(function () use (&$calls): array {
            $calls++;

            return ['total' => 3];
        }));

        $resolved = resolveScreen(Screen::make('test.screen'), '/?tab=acme.x');
        $again = resolveScreen(Screen::make('test.screen'), '/?tab=acme.x');
        $tab = $resolved->openRegisteredTab;

        expect($tab)->not->toBeNull()
            ->and($resolved->data($tab))->toBe(['total' => 3])
            ->and($resolved->data($tab))->toBe(['total' => 3])
            ->and($again->data($again->openRegisteredTab))->toBe(['total' => 3])
            ->and($calls)->toBe(1)
            // Only this screen's registered extensions have data.
            ->and(fn () => $resolved->data($resolved->tabs[0]))->toThrow(InvalidArgumentException::class)
            ->and(fn () => $resolved->data(resolveTab('acme.x')))->toThrow(InvalidArgumentException::class);
    });
});

describe('sections', function (): void {
    it('lists a slot\'s sections, exact registrations before wildcards, each in registration order', function (): void {
        Atrium::screens()
            ->section('*', 'before', resolveSection('acme.w1'))
            ->section('test.screen', 'before', resolveSection('acme.e1'))
            ->section('test.*', 'before', resolveSection('acme.w2'))
            ->section('test.screen', 'before', resolveSection('acme.e2'))
            ->section('test.screen', 'after', resolveSection('acme.after'));

        $resolved = resolveScreen(Screen::standard('test.screen', 'detail'));

        expect(resolveKeys($resolved->sections('before')))->toBe(['acme.e1', 'acme.e2', 'acme.w1', 'acme.w2'])
            ->and(resolveKeys($resolved->sections('after')))->toBe(['acme.after'])
            ->and($resolved->sections('aside'))->toBe([])
            ->and($resolved->sections('undeclared'))->toBe([]);
    });

    it('keeps normal and row slots apart', function (): void {
        $resolved = resolveScreen(Screen::standard('test.list', 'list'));
        $row = new User;

        expect(fn () => $resolved->sections('row.actions'))->toThrow(InvalidArgumentException::class)
            ->and(fn () => $resolved->rowSections('before', $row))->toThrow(InvalidArgumentException::class)
            ->and($resolved->rowSections('row.actions', $row))->toBe([])
            ->and($resolved->rowSections('row.undeclared', $row))->toBe([]);
    });
});

describe('duplicate registrations on one target', function (): void {
    it('throws in the local and testing environments, naming the key and target', function (string $environment, Closure $register): void {
        if ($environment !== 'testing') {
            $this->withEnvironment($environment);
        }

        $register(Atrium::screens());

        expect(fn () => $register(Atrium::screens()))
            ->toThrow(InvalidArgumentException::class, '[acme.x]')
            ->and(fn () => $register(Atrium::screens()))
            ->toThrow(InvalidArgumentException::class, '[test.*]');
    })->with(['testing', 'local'])->with([
        'a tab' => fn (ScreenExtensions $screens): ScreenExtensions => $screens->tab('test.*', resolveTab('acme.x')),
        'a section' => fn (ScreenExtensions $screens): ScreenExtensions => $screens->section('test.*', 'before', resolveSection('acme.x')),
    ]);

    it('reports once and keeps the first registration in other environments', function (): void {
        $this->withEnvironment('production');
        Exceptions::fake();

        Atrium::screens()
            ->tab('test.screen', resolveTab('acme.x', 'First'))
            ->tab('test.screen', resolveTab('acme.x', 'Second'))
            ->section('test.screen', 'before', resolveSection('acme.y', 'First'))
            ->section('test.screen', 'before', resolveSection('acme.y', 'Second'))
            // The same key in another slot is no duplicate.
            ->section('test.screen', 'after', resolveSection('acme.y', 'Elsewhere'));

        Exceptions::assertReportedCount(2);
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), '[acme.x]')
            && str_contains($exception->getMessage(), '[test.screen]'));
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), '[acme.y]'));

        expect(array_map(fn (TabDefinition $tab): string => $tab->label, Atrium::screens()->tabs('test.screen')))->toBe(['First'])
            ->and(array_map(fn (SectionDefinition $section): string => $section->label, Atrium::screens()->sections('test.screen', 'before')))->toBe(['First'])
            ->and(array_map(fn (SectionDefinition $section): string => $section->label, Atrium::screens()->sections('test.screen', 'after')))->toBe(['Elsewhere']);
    });

    it('lets one key be registered on different targets', function (): void {
        Atrium::screens()
            ->tab('test.screen', resolveTab('acme.x'))
            ->tab('test.*', resolveTab('acme.x'))
            ->tab('*', resolveTab('acme.x'));

        expect(resolveKeys(Atrium::screens()->tabs('*')))->toBe(['acme.x']);
    });
});

describe('the same key across targets', function (): void {
    it('keeps the more specific tab and reports the other once per request', function (string $winner, string $loser): void {
        Exceptions::fake();

        Atrium::screens()
            ->tab($loser, resolveTab('acme.x', 'Loser'))
            ->tab($winner, resolveTab('acme.x', 'Winner'));

        $first = resolveScreen(Screen::make('test.screen'));
        resolveScreen(Screen::make('test.screen'));

        expect(array_map(fn (TabDefinition $tab): string => $tab->label, $first->tabs))->toBe(['Overview', 'Winner']);

        Exceptions::assertReportedCount(1);
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), '[acme.x]')
            && str_contains($exception->getMessage(), "[{$loser}]"));
    })->with([
        'exact over the package' => ['test.screen', 'test.*'],
        'exact over every screen' => ['test.screen', '*'],
        'the package over every screen' => ['test.*', '*'],
    ]);

    it('keeps the more specific section and reports the other once per request', function (string $winner, string $loser): void {
        Exceptions::fake();

        Atrium::screens()
            ->section($loser, 'before', resolveSection('acme.x', 'Loser'))
            ->section($winner, 'before', resolveSection('acme.x', 'Winner'));

        $resolved = resolveScreen(Screen::standard('test.screen', 'detail'));

        // A page rendering the slot twice.
        $labels = array_map(fn (SectionDefinition $section): string => $section->label, $resolved->sections('before'));
        $resolved->sections('before');
        resolveScreen(Screen::standard('test.screen', 'detail'))->sections('before');

        expect($labels)->toBe(['Winner']);

        Exceptions::assertReportedCount(1);
        Exceptions::assertReported(fn (InvalidArgumentException $exception): bool => str_contains($exception->getMessage(), '[acme.x]')
            && str_contains($exception->getMessage(), "[{$loser}]"));
    })->with([
        'exact over the package' => ['test.screen', 'test.*'],
        'exact over every screen' => ['test.screen', '*'],
        'the package over every screen' => ['test.*', '*'],
    ]);
});

describe('wildcards', function (): void {
    it('adds a * tab to every screen and a package tab to that package\'s screens only', function (): void {
        Atrium::screens()
            ->tab('*', resolveTab('acme.everywhere'))
            ->tab('test.*', resolveTab('acme.test-only'));

        // Wildcard registrations keep their registration order across targets.
        expect(resolveKeys(resolveScreen(Screen::make('test.a'))->tabs))->toBe(['overview', 'acme.everywhere', 'acme.test-only'])
            ->and(resolveKeys(resolveScreen(Screen::make('other.screen'))->tabs))->toBe(['overview', 'acme.everywhere']);
    });

    it('opens a * tab through ?tab=', function (): void {
        Atrium::screens()->tab('*', resolveTab('acme.everywhere'));
        resolveRoute(fn (): Screen => Screen::make('other.screen'));

        $this->get('/screen-test?tab=acme.everywhere')
            ->assertOk()
            ->assertJsonPath('registered', 'acme.everywhere');
    });

    it('adds a * section to every screen declaring the slot, with that screen', function (): void {
        $screens = [];

        Atrium::screens()->section('*', 'before', SectionDefinition::make('acme.everywhere')->view('acme::x')
            ->authorize(function (Request $request, ?Model $record, Screen $screen) use (&$screens): bool {
                $screens[] = $screen->key;

                return true;
            }));

        expect(resolveKeys(resolveScreen(Screen::standard('test.a', 'detail'))->sections('before')))->toBe(['acme.everywhere'])
            ->and(resolveKeys(resolveScreen(Screen::standard('other.screen', 'list'))->sections('before')))->toBe(['acme.everywhere'])
            ->and($screens)->toBe(['test.a', 'other.screen']);
    });

    it('adds a package section only to that package\'s screens', function (): void {
        Atrium::screens()->section('test.*', 'before', resolveSection('acme.test-only'));

        expect(resolveKeys(resolveScreen(Screen::standard('test.a', 'detail'))->sections('before')))->toBe(['acme.test-only'])
            ->and(resolveScreen(Screen::standard('other.screen', 'detail'))->sections('before'))->toBe([]);
    });

    it('never runs the closures of a wildcard section on a slot the screen lacks', function (): void {
        $calls = 0;

        Atrium::screens()->section('*', 'sidebar', SectionDefinition::make('acme.x')->view('acme::x')
            ->authorize(function () use (&$calls): bool {
                $calls++;

                return true;
            }));

        $resolved = resolveScreen(Screen::standard('test.a', 'detail'));

        expect($resolved->sections('sidebar'))->toBe([])
            ->and($calls)->toBe(0);
    });

    it('keeps wildcard extensions hidden unless they say who may see them', function (): void {
        Atrium::screens()
            ->tab('*', TabDefinition::make('acme.tab')->view('acme::x'))
            ->section('*', 'before', SectionDefinition::make('acme.section')->view('acme::x'));

        $resolved = resolveScreen(Screen::standard('test.a', 'detail'));

        expect(resolveKeys($resolved->tabs))->toBe(['overview'])
            ->and($resolved->sections('before'))->toBe([]);
    });
});
