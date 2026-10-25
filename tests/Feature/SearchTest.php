<?php

declare(strict_types=1);

use Carbon\CarbonInterval;
use Illuminate\Auth\GenericUser;
use Illuminate\Concurrency\SyncDriver;
use Illuminate\Console\Application;
use Illuminate\Http\Request;
use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Process;
use Laravel\Ai\AiServiceProvider;
use Laravel\Ai\Classification;
use Laravel\Ai\Responses\Data\ChoiceAnswer;
use Orchestra\Testbench\Attributes\UsesVendor;
use RefactorCircus\Atrium\AtriumServiceProvider;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Domains\Search\Data\SearchResult;
use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use RefactorCircus\Atrium\Domains\Search\Exceptions\SearchSourceFailedException;
use RefactorCircus\Atrium\Domains\Search\Exceptions\SearchSourceTimedOutException;
use RefactorCircus\Atrium\Domains\Search\Services\SearchRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\FullPlugin;
use RefactorCircus\Atrium\Tests\Fixtures\MultiSourcePlugin;

beforeEach(function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    config()->set('atrium.search.concurrency', 'sync');

    app()->register(AiServiceProvider::class);

    // The process driver runs each source through `php artisan` in
    // Testbench's skeleton app, which needs the package's vendor directory
    // linked into it. Testbench removes that link after its own commands on
    // Windows, where the link is a junction is_symlink() does not recognise,
    // so make sure it is there for the children and tidy up afterwards.
    $this->skeletonConfig = is_file(skeletonConfigPath()) ? file_get_contents(skeletonConfigPath()) : null;

    $this->vendor = new UsesVendor;
    $this->vendor->beforeEach($this->app);
});

afterEach(function (): void {
    if (is_string($this->skeletonConfig)) {
        file_put_contents(skeletonConfigPath(), $this->skeletonConfig);
    } elseif (is_file(skeletonConfigPath())) {
        unlink(skeletonConfigPath());
    }

    $this->vendor->afterEach($this->app);
});

/**
 * The configuration Testbench's skeleton app reads when run as `php artisan`.
 */
function skeletonConfigPath(): string
{
    return base_path('bootstrap/cache/testbench.yaml');
}

/**
 * Register sources that each return one result titled with their key.
 */
function searchSources(string ...$keys): void
{
    foreach ($keys as $key) {
        app(SearchRegistry::class)->add(
            SearchSource::make($key)->using(fn (string $q): array => [SearchResult::make($key, '/'.$key)]),
        );
    }
}

/**
 * Register sources that return the id of the process they ran in. Built
 * outside the test case, so no closure is scoped to a class the child
 * process cannot load.
 */
function pidSources(string ...$keys): void
{
    foreach ($keys as $key) {
        app(SearchRegistry::class)->add(
            SearchSource::make($key)->using(fn (string $q): array => [SearchResult::make((string) getmypid(), '/'.$key)]),
        );
    }
}

/**
 * Search with the process driver, which runs each source through `php
 * artisan` in Testbench's skeleton app.
 *
 * This test process and the skeleton register different service providers,
 * so each treats the other's cached services manifest as stale and rewrites
 * it. Concurrent children would all rewrite it at once, and on Windows one of
 * the simultaneous renames fails and takes that child down. One child first
 * leaves a manifest the others agree with. A real application and its
 * children share their providers, so this never arises outside the tests.
 *
 * The skeleton registers only the providers its own configuration names, so
 * it is told to register Atrium's: the children run Atrium's
 * atrium:search-source command, as an application with Atrium installed
 * does. The beforeEach and afterEach hooks put the configuration back.
 */
function useProcessDriver(): void
{
    config()->set('atrium.search.concurrency', 'process');

    file_put_contents(skeletonConfigPath(), "providers:\n  - ".AtriumServiceProvider::class."\n");

    Process::path(base_path())->run(Application::formatCommandString('--version'))->throw();
}

/**
 * The messages of the exceptions reported so far, Exceptions::fake() first.
 *
 * @return array<int, string>
 */
function reportedMessages(): array
{
    return array_map(fn (Throwable $e): string => $e->getMessage(), Exceptions::reported());
}

/**
 * Register sources that return the id of the signed-in user they ran as.
 */
function whoamiSources(string ...$keys): void
{
    foreach ($keys as $key) {
        app(SearchRegistry::class)->add(
            SearchSource::make($key)->using(fn (string $q): array => [SearchResult::make((string) Auth::id(), '/'.$key)]),
        );
    }
}

/**
 * Register a source whose one result links to /somewhere.
 */
function linkSource(): void
{
    app(SearchRegistry::class)->add(
        SearchSource::make('linker')->using(fn (string $q): array => [SearchResult::make('Link', url('/somewhere'))]),
    );
}

/**
 * Register a source that returns the given number of results.
 */
function manyResultsSource(string $key, int $count): void
{
    app(SearchRegistry::class)->add(
        SearchSource::make($key)->using(fn (string $q): array => array_map(
            fn (int $i): SearchResult => SearchResult::make($key.$i, '/'.$key.'/'.$i),
            range(1, $count),
        )),
    );
}

/**
 * Register a source that sleeps for the given number of seconds first.
 */
function sleepySource(string $key, int $seconds, ?int $timeout = null): void
{
    $source = SearchSource::make($key)->using(function (string $q) use ($key, $seconds): array {
        sleep($seconds);

        return [SearchResult::make($key, '/'.$key)];
    });

    app(SearchRegistry::class)->add($timeout === null ? $source : $source->timeout($timeout));
}

/**
 * Register sources that sleep for a second and report when they ran, as
 * "start-end" in microseconds.
 */
function timedSources(string ...$keys): void
{
    foreach ($keys as $key) {
        app(SearchRegistry::class)->add(
            SearchSource::make($key)->using(function (string $q) use ($key): array {
                $start = hrtime(true);

                usleep(500_000);

                return [SearchResult::make($start.'-'.hrtime(true), '/'.$key)];
            }),
        );
    }
}

/**
 * The most of the given "start-end" spans that overlap at any moment.
 *
 * @param  array<int, string>  $spans
 */
function mostAtOnce(array $spans): int
{
    $events = [];

    foreach ($spans as $span) {
        [$start, $end] = array_map(intval(...), explode('-', $span));

        $events[] = [$start, 1];
        $events[] = [$end, -1];
    }

    // Ends sort before starts at the same instant.
    usort($events, fn (array $a, array $b): int => [$a[0], $a[1]] <=> [$b[0], $b[1]]);

    $current = $most = 0;

    foreach ($events as [, $change]) {
        $most = max($most, $current += $change);
    }

    return $most;
}

/**
 * Swap in a concurrency driver that records how many tasks each run gets.
 */
function recordingDriver(): ArrayObject
{
    $runs = new ArrayObject;

    Concurrency::extend('recording', fn () => new class($runs) extends SyncDriver
    {
        public function __construct(private ArrayObject $runs) {}

        public function run(Closure|array $tasks, CarbonInterval|int|null $timeout = null): array
        {
            $this->runs[] = count($tasks);

            return parent::run($tasks, $timeout);
        }
    });

    config()->set('atrium.search.concurrency', 'recording');

    return $runs;
}

/**
 * Register a source whose one result sets every field.
 */
function fullResultSource(string $key): void
{
    app(SearchRegistry::class)->add(
        SearchSource::make($key)->using(fn (string $q): array => [
            SearchResult::make('Ada Lovelace', '/people/1')->subtitle('Analyst')->icon('user')->group('People'),
        ]),
    );
}

/**
 * Register a source whose one result has only a title and a url.
 */
function bareResultSource(string $key): void
{
    app(SearchRegistry::class)->add(
        SearchSource::make($key)->using(fn (string $q): array => [SearchResult::make('Grace Hopper', '/people/2')]),
    );
}

/**
 * Register sources of three results each, the first finishing last, so the
 * order they come back in is not the order they finished in.
 */
function staggeredSources(string ...$keys): void
{
    foreach (array_values($keys) as $position => $key) {
        $delay = (count($keys) - 1 - $position) * 300_000;

        app(SearchRegistry::class)->add(
            SearchSource::make($key)->using(function (string $q) use ($key, $delay): array {
                usleep($delay);

                return array_map(
                    fn (int $i): SearchResult => SearchResult::make($key.' '.$i, '/'.$key.'/'.$i)->group($key),
                    [1, 2, 3],
                );
            }),
        );
    }
}

/**
 * Register a source that throws.
 */
function brokenSource(string $key): void
{
    app(SearchRegistry::class)->add(
        SearchSource::make($key)->using(fn (string $q): array => throw new RuntimeException('Source down')),
    );
}

/**
 * What a healthy child writes for the given rows.
 *
 * @param  array<int, mixed>  $rows
 */
function childEnvelope(array $rows): string
{
    return (string) json_encode(['successful' => true, 'results' => $rows]);
}

/**
 * @return array<int, string>
 */
function searchTitles(string $query = 'x'): array
{
    return array_map(
        fn (SearchResult $result): string => $result->title,
        app(SearchRegistry::class)->search(Request::create('/atrium/search'), $query),
    );
}

it('aggregates results across plugin sources', function (): void {
    app(PluginRegistry::class)->register(FullPlugin::class);

    app(SearchRegistry::class)->add(
        SearchSource::make('app')->using(fn (string $q): array => [SearchResult::make('App '.$q, '/app')]),
    );

    $results = app(SearchRegistry::class)->search(Request::create('/atrium/search'), 'invoices');

    expect($results)->toHaveCount(2);
});

it('searches every source a plugin returns, each with its own cap', function (): void {
    app(PluginRegistry::class)->register(MultiSourcePlugin::class);

    // Five people fill their source's cap without crowding out the place.
    expect(searchTitles('anyone'))->toBe(['Person 1', 'Person 2', 'Person 3', 'Person 4', 'Person 5', 'Place 1']);
});

it('returns nothing for an empty query without calling sources', function (): void {
    $called = false;

    app(SearchRegistry::class)->add(
        SearchSource::make('app')->using(function (string $q) use (&$called): array {
            $called = true;

            return [];
        }),
    );

    $results = app(SearchRegistry::class)->search(Request::create('/atrium/search'), '   ');

    expect($results)->toBe([])->and($called)->toBeFalse();
});

it('skips sources whose authorize callback denies', function (): void {
    app(SearchRegistry::class)->add(
        SearchSource::make('blocked')
            ->authorize(fn (): bool => false)
            ->using(fn (string $q): array => [SearchResult::make('Nope', '/nope')]),
    );

    expect(app(SearchRegistry::class)->search(Request::create('/atrium/search'), 'x'))->toBe([]);
});

it('serves results as json from the search endpoint', function (): void {
    app(PluginRegistry::class)->register(FullPlugin::class);

    $this->getJson('/atrium/search?q=orders')
        ->assertOk()
        ->assertJsonPath('data.0.title', 'Match for orders')
        ->assertJsonPath('data.0.subtitle', 'From the full plugin');
});

it('returns an empty payload for a blank query', function (): void {
    $this->getJson('/atrium/search?q=')->assertOk()->assertJsonPath('data', []);
});

it('runs no source for a query shorter than the minimum length', function (): void {
    $defaults = require __DIR__.'/../../config/atrium.php';

    config()->set('atrium.search.min_length', $defaults['search']['min_length']);

    $ran = 0;

    app(SearchRegistry::class)->add(SearchSource::make('counted')->using(function (string $q) use (&$ran): array {
        $ran++;

        return [SearchResult::make('Hit', '/hit')];
    }));

    $this->getJson('/atrium/search?q=a')->assertOk()->assertJsonPath('data', []);
    $this->getJson('/atrium/search?q='.urlencode(' a '))->assertOk()->assertJsonPath('data', []);

    expect($ran)->toBe(0);

    $this->getJson('/atrium/search?q=ab')->assertOk()->assertJsonPath('data.0.title', 'Hit');

    config()->set('atrium.search.min_length', 1);

    $this->getJson('/atrium/search?q=a')->assertOk()->assertJsonPath('data.0.title', 'Hit');

    expect($ran)->toBe(2);
});

it('searches inside the request by default', function (): void {
    $defaults = require __DIR__.'/../../config/atrium.php';

    config()->set('atrium.search.concurrency', $defaults['search']['concurrency']);

    expect(config('atrium.search.concurrency'))->toBe('sync');

    Process::fake();

    pidSources('first', 'second');

    expect(searchTitles())->toBe([(string) getmypid(), (string) getmypid()]);

    Process::assertNothingRan();
});

it('tells the search box the minimum query length', function (): void {
    config()->set('atrium.search.min_length', 3);

    $this->get('/atrium')->assertOk()->assertSee('minLength: 3', false);
});

it('runs sources in separate processes with the process driver', function (): void {
    Exceptions::fake();

    useProcessDriver();

    pidSources('one', 'two');

    $pids = searchTitles();

    // A child that failed is reported with its error output, so show it.
    expect(reportedMessages())->toBe([]);

    expect($pids)->toHaveCount(2)
        ->and($pids)->not->toContain((string) getmypid())
        ->and(array_unique($pids))->toHaveCount(2);
});

it('builds result links for the host the user is on, in every process', function (): void {
    useProcessDriver();
    config()->set('app.url', 'http://configured.test');

    linkSource();

    $urls = array_map(
        fn (SearchResult $result): string => $result->url,
        app(SearchRegistry::class)->search(Request::create('https://admin.example.test/atrium/search'), 'x'),
    );

    expect($urls)->toBe(['https://admin.example.test/somewhere']);
});

it('hands each process the signed-in user', function (): void {
    Exceptions::fake();

    useProcessDriver();

    whoamiSources('one', 'two');

    $request = Request::create('/atrium/search');
    $request->setUserResolver(fn (): GenericUser => new GenericUser(['id' => 42]));

    $titles = array_map(
        fn (SearchResult $result): string => $result->title,
        app(SearchRegistry::class)->search($request, 'x'),
    );

    expect(reportedMessages())->toBe([]);

    expect($titles)->toBe(['42', '42']);
});

it('reports a failing source and still returns the others', function (): void {
    Exceptions::fake();

    searchSources('first');

    app(SearchRegistry::class)->add(
        SearchSource::make('broken')->using(fn (string $q): array => throw new RuntimeException('Source down')),
    );

    searchSources('last');

    expect(searchTitles())->toBe(['first', 'last']);

    Exceptions::assertReported(fn (RuntimeException $e): bool => $e->getMessage() === 'Source down');
});

it('searches one source at a time when the concurrency driver fails', function (): void {
    Exceptions::fake();

    Concurrency::extend('broken', fn () => new class extends SyncDriver
    {
        public function run(Closure|array $tasks, CarbonInterval|int|null $timeout = null): array
        {
            throw new RuntimeException('No processes');
        }
    });

    config()->set('atrium.search.concurrency', 'broken');

    searchSources('first', 'second');

    expect(searchTitles())->toBe(['first', 'second']);

    Exceptions::assertReported(fn (RuntimeException $e): bool => $e->getMessage() === 'No processes');
});

it('does not classify the query unless classification is enabled', function (): void {
    Classification::fake();

    searchSources('users', 'orders', 'invoices', 'products');

    expect(searchTitles())->toHaveCount(4);

    Classification::assertNothingClassified();
});

it('runs only the most likely sources when classification is enabled', function (): void {
    config()->set('atrium.search.classification.enabled', true);

    Classification::fake([
        ['source' => new ChoiceAnswer('invoices', ['users' => 0.05, 'orders' => 0.3, 'invoices' => 0.6, 'products' => 0.05])],
    ]);

    searchSources('users', 'orders', 'invoices', 'products');

    app(SearchRegistry::class)->add(
        SearchSource::make('payments')->label('Payments')->description('Card and bank payments'),
    );

    expect(searchTitles('unpaid invoice 1042'))->toBe(['invoices', 'orders', 'users']);

    Classification::assertClassified(fn ($prompt): bool => $prompt->state === 'unpaid invoice 1042'
        && $prompt->questions['source']->options['payments'] === 'Payments: Card and bank payments');
});

it('runs the configured number of most likely sources', function (): void {
    config()->set('atrium.search.classification.enabled', true);
    config()->set('atrium.search.classification.sources', 1);

    Classification::fake([
        ['source' => new ChoiceAnswer('orders', ['users' => 0.2, 'orders' => 0.8])],
    ]);

    searchSources('users', 'orders');

    expect(searchTitles())->toBe(['orders']);
});

it('skips classification when there are no more sources than the limit', function (): void {
    config()->set('atrium.search.classification.enabled', true);

    Classification::fake();

    searchSources('users', 'orders', 'invoices');

    expect(searchTitles())->toHaveCount(3);

    Classification::assertNothingClassified();
});

it('runs every source when classification fails', function (): void {
    Exceptions::fake();

    config()->set('atrium.search.classification.enabled', true);

    Classification::fake(fn () => throw new RuntimeException('Classifier down'));

    searchSources('users', 'orders', 'invoices', 'products');

    expect(searchTitles())->toHaveCount(4);

    Exceptions::assertReported(fn (RuntimeException $e): bool => $e->getMessage() === 'Classifier down');
});

it('caps the results each source contributes', function (): void {
    config()->set('atrium.search.results.per_source', 2);

    manyResultsSource('a', 5);
    manyResultsSource('b', 1);

    expect(searchTitles())->toBe(['a1', 'a2', 'b1']);
});

it('caps the total number of results', function (): void {
    config()->set('atrium.search.results.per_source', null);
    config()->set('atrium.search.results.total', 4);

    manyResultsSource('a', 3);
    manyResultsSource('b', 3);

    expect(searchTitles())->toBe(['a1', 'a2', 'a3', 'b1']);
});

it('leaves results uncapped when the limits are null', function (): void {
    config()->set('atrium.search.results.per_source', null);
    config()->set('atrium.search.results.total', null);

    manyResultsSource('a', 30);

    expect(searchTitles())->toHaveCount(30);
});

it('stops a source that runs past the timeout and keeps the others', function (): void {
    Exceptions::fake();

    useProcessDriver();
    config()->set('atrium.search.timeout', 1);

    sleepySource('slow', 10);
    sleepySource('quick', 0);

    $started = microtime(true);

    expect(searchTitles())->toBe(['quick'])
        ->and(microtime(true) - $started)->toBeLessThan(5);

    Exceptions::assertReported(fn (SearchSourceTimedOutException $e): bool => $e->getMessage() === 'Search source [slow] timed out.');
});

it('lets a source override the default timeout', function (): void {
    Exceptions::fake();

    useProcessDriver();
    config()->set('atrium.search.timeout', 1);

    sleepySource('patient', 2, timeout: 10);
    sleepySource('hasty', 2);

    expect(searchTitles())->toBe(['patient']);

    Exceptions::assertReported(fn (SearchSourceTimedOutException $e): bool => $e->getMessage() === 'Search source [hasty] timed out.');
});

it('runs at most the configured number of processes at once', function (): void {
    useProcessDriver();
    config()->set('atrium.search.concurrency_limit', 2);

    timedSources('a', 'b', 'c', 'd', 'e');

    $spans = searchTitles();

    expect($spans)->toHaveCount(5)
        ->and(mostAtOnce($spans))->toBe(2);
});

it('runs every process at once without a concurrency limit', function (): void {
    useProcessDriver();

    timedSources('a', 'b', 'c');

    expect(mostAtOnce(searchTitles()))->toBe(3);
});

it('hands other drivers the sources in batches of the concurrency limit', function (): void {
    $runs = recordingDriver();

    config()->set('atrium.search.concurrency_limit', 2);

    searchSources('a', 'b', 'c', 'd', 'e');

    // The last source runs on its own, without the driver.
    expect(searchTitles())->toBe(['a', 'b', 'c', 'd', 'e'])
        ->and($runs->getArrayCopy())->toBe([2, 2]);
});

it('ignores the concurrency limit when classification chooses the sources', function (): void {
    $runs = recordingDriver();

    config()->set('atrium.search.concurrency_limit', 1);
    config()->set('atrium.search.classification.enabled', true);

    Classification::fake([
        ['source' => new ChoiceAnswer('c', ['a' => 0.1, 'b' => 0.2, 'c' => 0.4, 'd' => 0.3])],
    ]);

    searchSources('a', 'b', 'c', 'd');

    expect(searchTitles())->toBe(['c', 'd', 'b'])
        ->and($runs->getArrayCopy())->toBe([3]);
});

it('applies the concurrency limit when classification fails', function (): void {
    Exceptions::fake();

    $runs = recordingDriver();

    config()->set('atrium.search.concurrency_limit', 2);
    config()->set('atrium.search.classification.enabled', true);

    Classification::fake(fn () => throw new RuntimeException('Classifier down'));

    searchSources('a', 'b', 'c', 'd');

    expect(searchTitles())->toHaveCount(4)
        ->and($runs->getArrayCopy())->toBe([2, 2]);
});

it('brings every field of a result back from a child process', function (): void {
    Exceptions::fake();

    useProcessDriver();

    fullResultSource('people');

    $results = app(SearchRegistry::class)->search(Request::create('/atrium/search'), 'x');

    expect(reportedMessages())->toBe([]);

    expect($results)->toHaveCount(1)
        ->and($results[0])->toBeInstanceOf(SearchResult::class)
        ->and($results[0]->title)->toBe('Ada Lovelace')
        ->and($results[0]->url)->toBe('/people/1')
        ->and($results[0]->subtitle)->toBe('Analyst')
        ->and($results[0]->icon)->toBe('user')
        ->and($results[0]->group)->toBe('People');
});

it('leaves the optional fields empty for a bare result from a child process', function (): void {
    Exceptions::fake();

    useProcessDriver();

    bareResultSource('people');

    $results = app(SearchRegistry::class)->search(Request::create('/atrium/search'), 'x');

    expect(reportedMessages())->toBe([]);

    expect($results)->toHaveCount(1)
        ->and($results[0]->toArray())->toBe([
            'title' => 'Grace Hopper',
            'url' => '/people/2',
            'subtitle' => null,
            'icon' => null,
            'group' => null,
        ]);
});

it('keeps results in order within and across child processes', function (): void {
    Exceptions::fake();

    useProcessDriver();
    config()->set('atrium.search.results.per_source', null);

    staggeredSources('first', 'second');

    $titles = searchTitles();

    expect(reportedMessages())->toBe([]);

    expect($titles)->toBe(['first 1', 'first 2', 'first 3', 'second 1', 'second 2', 'second 3']);
});

it('starts each child with atrium\'s own command', function (): void {
    Process::fake(['*' => Process::result(childEnvelope([]))]);

    config()->set('atrium.search.concurrency', 'process');

    searchSources('one', 'two');

    $registry = new class(app(PluginRegistry::class)) extends SearchRegistry
    {
        public function startedCommand(): string
        {
            return $this->childCommand();
        }
    };

    expect($registry->startedCommand())->toBe(Application::formatCommandString('atrium:search-source'))
        ->not->toContain('invoke-serialized-closure');

    searchTitles();

    Process::assertRanTimes(fn (PendingProcess $process): bool => $process->command === $registry->startedCommand(), 2);
});

it('drops malformed rows from a child and keeps the rest in order', function (): void {
    Exceptions::fake();

    Process::fake(['*' => Process::result(childEnvelope([
        ['title' => 'Kept 1', 'url' => '/1', 'subtitle' => 'Sub', 'icon' => 'star', 'group' => 'Group'],
        ['url' => '/no-title'],
        ['title' => 'No url'],
        ['title' => 42, 'url' => '/numeric-title'],
        ['title' => 'List url', 'url' => ['/x']],
        ['title' => 'Kept 2', 'url' => '/2'],
        ['title' => 'Numeric subtitle', 'url' => '/s', 'subtitle' => 7],
        ['title' => 'False icon', 'url' => '/i', 'icon' => false],
        ['title' => 'List group', 'url' => '/g', 'group' => ['x']],
        'not a row',
        null,
        ['title' => 'Kept 3', 'url' => '/3', 'subtitle' => null, 'icon' => null, 'group' => null],
    ]))]);

    config()->set('atrium.search.concurrency', 'process');

    searchSources('crafted');

    $results = app(SearchRegistry::class)->search(Request::create('/atrium/search'), 'x');

    expect(array_map(fn (SearchResult $result): array => $result->toArray(), $results))->toBe([
        ['title' => 'Kept 1', 'url' => '/1', 'subtitle' => 'Sub', 'icon' => 'star', 'group' => 'Group'],
        ['title' => 'Kept 2', 'url' => '/2', 'subtitle' => null, 'icon' => null, 'group' => null],
        ['title' => 'Kept 3', 'url' => '/3', 'subtitle' => null, 'icon' => null, 'group' => null],
    ]);

    Exceptions::assertNothingReported();
});

it('reports a source that throws in its child as a failed source', function (): void {
    Exceptions::fake();

    useProcessDriver();

    searchSources('first');
    brokenSource('broken');
    searchSources('last');

    expect(searchTitles())->toBe(['first', 'last']);

    Exceptions::assertReported(fn (SearchSourceFailedException $e): bool => $e->sourceKey === 'broken'
        && str_starts_with($e->getMessage(), 'Search source [broken] failed: Source down'));
    Exceptions::assertNotReported(SearchSourceTimedOutException::class);
});

it('reports a child that fails as a failed source and keeps the others', function (string $output, string $errors, int $exitCode, array $reason): void {
    Exceptions::fake();

    Process::fake(['*' => Process::sequence([
        Process::result($output, $errors, $exitCode),
        Process::result(childEnvelope([['title' => 'healthy', 'url' => '/healthy']])),
    ])]);

    config()->set('atrium.search.concurrency', 'process');

    searchSources('broken', 'healthy');

    expect(searchTitles())->toBe(['healthy']);

    Exceptions::assertReported(function (SearchSourceFailedException $e) use ($reason): bool {
        foreach ($reason as $part) {
            if (! str_contains($e->getMessage(), $part)) {
                return false;
            }
        }

        return $e->sourceKey === 'broken' && str_starts_with($e->getMessage(), 'Search source [broken] failed: ');
    });
    Exceptions::assertNotReported(SearchSourceTimedOutException::class);
    expect(Exceptions::reported())->toHaveCount(1);
})->with([
    'a non-zero exit' => ['', 'Command "atrium:search-source" is not defined.', 1, ['exit code 1', 'Command "atrium:search-source" is not defined.']],
    'unparseable output' => ['Fatal error', 'PHP Fatal error: Allowed memory size exhausted', 0, ['output: Fatal error', 'PHP Fatal error: Allowed memory size exhausted']],
    'an unsuccessful envelope' => ['{"successful":false,"message":"The index is offline."}', 'Stack trace', 0, ['The index is offline.', 'Stack trace']],
    'a truthy successful flag' => ['{"successful":1,"results":[]}', '', 0, ['exit code 0']],
    'the framework\'s serialized result' => ['{"successful":true,"result":"a:0:{}"}', '', 0, ['exit code 0']],
    'results that are not a list' => ['{"successful":true,"results":"none"}', '', 0, ['exit code 0']],
]);

it('reports a source that runs past its own timeout as timed out and keeps the others', function (): void {
    Exceptions::fake();

    useProcessDriver();
    config()->set('atrium.search.timeout', 30);

    sleepySource('slow', 10, timeout: 1);
    sleepySource('quick', 0);

    $started = microtime(true);

    expect(searchTitles())->toBe(['quick'])
        ->and(microtime(true) - $started)->toBeLessThan(5);

    Exceptions::assertReported(fn (SearchSourceTimedOutException $e): bool => $e->sourceKey === 'slow'
        && preg_match('/timed out/', $e->getMessage()) === 1);
});
