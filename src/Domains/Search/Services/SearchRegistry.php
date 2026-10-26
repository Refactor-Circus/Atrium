<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Search\Services;

use Closure;
use Illuminate\Console\Application;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Process\ProcessResult;
use Illuminate\Http\Request;
use Illuminate\Process\Exceptions\ProcessTimedOutException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Laravel\Ai\Classification;
use Laravel\Ai\Classification\Choice;
use Laravel\Ai\Responses\Data\ChoiceAnswer;
use Laravel\SerializableClosure\SerializableClosure;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Domains\Search\Console\InvokeSearchSourceCommand;
use RefactorCircus\Atrium\Domains\Search\Data\SearchResult;
use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use RefactorCircus\Atrium\Domains\Search\Exceptions\SearchSourceFailedException;
use RefactorCircus\Atrium\Domains\Search\Exceptions\SearchSourceTimedOutException;
use Throwable;

class SearchRegistry
{
    /** @var array<int, SearchSource> */
    protected array $extra = [];

    public function __construct(protected PluginRegistry $plugins) {}

    public function add(SearchSource $source): static
    {
        $this->extra[] = $source;

        return $this;
    }

    /**
     * Sources the given request may query.
     *
     * @return array<int, SearchSource>
     */
    public function sources(Request $request): array
    {
        $sources = $this->extra;

        foreach ($this->plugins->authorized($request) as $plugin) {
            $found = $plugin->search();

            foreach (is_array($found) ? $found : [$found] as $source) {
                if ($source instanceof SearchSource) {
                    $sources[] = $source;
                }
            }
        }

        return array_values(array_filter(
            $sources,
            fn (SearchSource $source): bool => $source->isAuthorized($request),
        ));
    }

    /**
     * Aggregate results across every authorized source, running the sources
     * concurrently. A source that throws or times out is reported and
     * contributes nothing.
     *
     * @return array<int, SearchResult>
     */
    public function search(Request $request, string $query): array
    {
        $query = trim($query);

        if ($query === '') {
            return [];
        }

        $sources = $this->sources($request);
        $chosen = $this->classify($sources, $query);

        // Classification already keeps the search small. Without it, every
        // source runs, so the configured cap keeps that many running at once.
        $limit = config('atrium.search.concurrency_limit');
        $limit = $chosen === null && is_int($limit) && $limit > 0 ? $limit : null;

        $results = array_merge(...array_values($this->run($chosen ?? $sources, $query, $request->user(), $limit, $request->root())));

        $total = config('atrium.search.results.total');

        return is_int($total) ? array_slice($results, 0, $total) : $results;
    }

    /**
     * Search every source, keyed as the sources are, with at most $limit
     * running at once.
     *
     * @param  array<int, SearchSource>  $sources
     * @param  positive-int|null  $limit
     * @param  string|null  $root  The request's root URL, for links built in child processes.
     * @return array<int, array<int, SearchResult>>
     */
    protected function run(array $sources, string $query, mixed $user, ?int $limit = null, ?string $root = null): array
    {
        $tasks = array_map(
            fn (SearchSource $source): Closure => $this->task($source, $query, $user, $root),
            $sources,
        );

        $driver = config('atrium.search.concurrency') ?? config('concurrency.default');

        $results = [];

        try {
            if ($driver === 'process') {
                return $this->runInProcesses($sources, $tasks, $limit);
            }

            foreach (array_chunk($tasks, $limit ?? max(1, count($tasks)), true) as $chunk) {
                $results += count($chunk) > 1
                    ? Concurrency::driver($driver)->run($chunk)
                    : array_map(fn (Closure $task): array => $task(), $chunk);
            }
        } catch (Throwable $e) {
            // The driver itself failed, e.g. it could not start a
            // process. Searching one source at a time still works.
            report($e);
        }

        foreach ($tasks as $key => $task) {
            $results[$key] ??= $task();
        }

        ksort($results);

        return $results;
    }

    /**
     * The work of searching one source, as a closure that can be serialized
     * into another process. A source that throws is reported and gives no
     * results, unless the caller asks for the failure itself.
     *
     * @return Closure(bool=): array<int, SearchResult>
     */
    protected function task(SearchSource $source, string $query, mixed $user, ?string $root = null): Closure
    {
        $limit = config('atrium.search.results.per_source');
        $limit = is_int($limit) ? $limit : null;

        return static function (bool $throw = false) use ($source, $query, $user, $limit, $root): array {
            // Process and fork drivers run outside the request, where
            // nobody is signed in. Sources still need to know who asked.
            if ($user instanceof Authenticatable && ! Auth::check()) {
                Auth::setUser($user);
            }

            // Outside the request, URLs would be built from APP_URL; results
            // link back to the host the user is actually on.
            if ($root !== null && app()->runningInConsole()) {
                URL::forceRootUrl($root);
                URL::forceScheme((string) parse_url($root, PHP_URL_SCHEME));
            }

            try {
                return array_slice($source->results($query), 0, $limit);
            } catch (Throwable $e) {
                if ($throw) {
                    throw $e;
                }

                report($e);

                return [];
            }
        };
    }

    /**
     * A task as a child process runs it: its results go back as plain arrays
     * through the container, where the atrium:search-source command reads
     * them and writes them out as JSON. A source that throws fails the child,
     * so the failure is reported here, under the source's key.
     *
     * @param  Closure(bool=): array<int, SearchResult>  $task
     * @return Closure(): null
     */
    protected function childTask(Closure $task): Closure
    {
        return static function () use ($task): null {
            app()->instance(InvokeSearchSourceCommand::RESULTS, array_values(array_map(
                static fn (SearchResult $result): array => $result->toArray(),
                $task(true),
            )));

            return null;
        };
    }

    /**
     * The command each child process runs.
     */
    protected function childCommand(): string
    {
        return Application::formatCommandString('atrium:search-source');
    }

    /**
     * Run each task in its own process, as Laravel's process concurrency
     * driver does, but give every process its own timeout. The driver
     * abandons the whole batch when one process times out; here only that
     * source is lost. With a limit, the next source starts as soon as a
     * running one finishes, and its timeout starts with it.
     *
     * @param  array<int, SearchSource>  $sources
     * @param  array<int, Closure(bool=): array<int, SearchResult>>  $tasks
     * @param  positive-int|null  $limit
     * @return array<int, array<int, SearchResult>>
     */
    protected function runInProcesses(array $sources, array $tasks, ?int $limit = null): array
    {
        $command = $this->childCommand();

        $queue = $tasks;
        $running = [];
        $results = [];

        while ($queue !== [] || $running !== []) {
            while ($queue !== [] && ($limit === null || count($running) < $limit)) {
                $key = array_key_first($queue);
                $timeout = $sources[$key]->timeout ?? config('atrium.search.timeout');

                $pending = Process::path(base_path())->env([
                    '__LARAVEL_CONTEXT' => json_encode(Context::dehydrate()),
                    'LARAVEL_INVOKABLE_CLOSURE' => base64_encode(serialize(new SerializableClosure($this->childTask($queue[$key])))),
                ]);

                $running[$key] = (is_int($timeout) ? $pending->timeout($timeout) : $pending->forever())->start($command);

                unset($queue[$key]);
            }

            foreach ($running as $key => $process) {
                try {
                    $process->ensureNotTimedOut();
                } catch (ProcessTimedOutException $e) {
                    report(SearchSourceTimedOutException::timedOut($sources[$key], $e));

                    $results[$key] = [];
                    unset($running[$key]);

                    continue;
                }

                if (! $process->running()) {
                    $results[$key] = $this->decode($sources[$key], $process->wait());
                    unset($running[$key]);
                }
            }

            if ($running !== []) {
                usleep(5000);
            }
        }

        ksort($results);

        return $results;
    }

    /**
     * Read a finished process's results, written as JSON by the
     * atrium:search-source command.
     *
     * @return array<int, SearchResult>
     */
    protected function decode(SearchSource $source, ProcessResult $process): array
    {
        $output = $process->output();

        // Strip anything the response compressor appended after the payload.
        if (($position = strpos($output, "\x1f\x8b")) !== false) {
            $output = substr($output, 0, $position);
        }

        $payload = json_decode($output, true);

        if ($process->failed() || ! is_array($payload) || ($payload['successful'] ?? false) !== true || ! is_array($payload['results'] ?? null)) {
            $errors = Str::limit(trim($process->errorOutput()), 1000);

            $reason = is_array($payload) && is_string($payload['message'] ?? null)
                ? $payload['message'].($errors === '' ? '' : "; errors: {$errors}")
                : sprintf('exit code %s; output: %s; errors: %s', $process->exitCode() ?? 'none', Str::limit(trim($output), 500), $errors);

            report(SearchSourceFailedException::forSource($source, $reason));

            return [];
        }

        $results = [];

        foreach ($payload['results'] as $row) {
            if (is_array($row) && ($result = $this->result($row)) !== null) {
                $results[] = $result;
            }
        }

        return $results;
    }

    /**
     * Rebuild one result row, or null when the row is not one: it needs a
     * string title and url, and its other fields must be strings when set.
     *
     * @param  array<array-key, mixed>  $row
     */
    private function result(array $row): ?SearchResult
    {
        $title = $row['title'] ?? null;
        $url = $row['url'] ?? null;

        if (! is_string($title) || ! is_string($url)) {
            return null;
        }

        $subtitle = $row['subtitle'] ?? null;
        $icon = $row['icon'] ?? null;
        $group = $row['group'] ?? null;

        foreach ([$subtitle, $icon, $group] as $field) {
            if ($field !== null && ! is_string($field)) {
                return null;
            }
        }

        $result = SearchResult::make($title, $url);

        if (is_string($subtitle)) {
            $result->subtitle($subtitle);
        }

        if (is_string($icon)) {
            $result->icon($icon);
        }

        if (is_string($group)) {
            $result->group($group);
        }

        return $result;
    }

    /**
     * With classification enabled, classify the query against every source
     * and keep only the most likely ones, most likely first. Null when
     * classification did not choose, so every source should run.
     *
     * @param  array<int, SearchSource>  $sources
     * @return array<int, SearchSource>|null
     */
    protected function classify(array $sources, string $query): ?array
    {
        $limit = max(1, (int) config('atrium.search.classification.sources', 3));

        if (config('atrium.search.classification.enabled') !== true || ! class_exists(Classification::class)) {
            return null;
        }

        $options = [];

        foreach ($sources as $source) {
            $options[$source->key] = $source->description === null
                ? $source->label
                : $source->label.': '.$source->description;
        }

        if (count($options) <= $limit) {
            return null;
        }

        try {
            $answer = Classification::of($query)
                ->question('source', new Choice('Which kind of record is this search query looking for?', $options))
                ->classify(config('atrium.search.classification.provider'), config('atrium.search.classification.model'))
                ->answer('source');
        } catch (Throwable $e) {
            report($e);

            return null;
        }

        if (! $answer instanceof ChoiceAnswer) {
            return null;
        }

        $probabilities = $answer->probabilities ?: [$answer->choice => 1.0];

        arsort($probabilities);

        $ranked = array_map(strval(...), array_slice(array_keys($probabilities), 0, $limit));

        $relevant = array_filter($sources, fn (SearchSource $source): bool => in_array($source->key, $ranked, true));

        usort($relevant, fn (SearchSource $a, SearchSource $b): int => array_search($a->key, $ranked, true) <=> array_search($b->key, $ranked, true));

        return $relevant;
    }
}
