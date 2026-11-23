<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Search\Data\SearchResult;
use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use RefactorCircus\Atrium\Domains\Search\Services\SearchRegistry;
use Workbench\App\Models\User;

/*
 * Global search over the API (AC 14): results serialized by
 * SearchResultResource, each with a ClientPath link, and the minimum query
 * length enforced as validation.
 */

beforeEach(function (): void {
    Gate::define('viewAtrium', fn ($user = null): bool => true);

    config()->set('atrium.search.concurrency', 'sync');
    config()->set('atrium.search.min_length', 2);

    $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);
});

/**
 * Register a source returning the given results, counting its calls.
 *
 * @param  list<SearchResult>  $results
 */
function searchApiSource(array $results, int &$calls = 0): void
{
    app(SearchRegistry::class)->add(SearchSource::make('people')->using(function (string $q) use ($results, &$calls): array {
        $calls++;

        return $results;
    }));
}

it('answers with the exact result structure', function (): void {
    searchApiSource([
        SearchResult::make('Ada Lovelace', url('people/1'))->subtitle('Analyst')->icon('i-lucide-user')->group('People'),
        SearchResult::make('Grace Hopper', '/people/2'),
    ]);

    $this->actingAs($this->user)->getJson(route('atrium.search', ['q' => 'ada']))
        ->assertOk()
        ->assertExactJson(['data' => [
            [
                'title' => 'Ada Lovelace',
                'subtitle' => 'Analyst',
                'icon' => 'i-lucide-user',
                'group' => 'People',
                'link' => ['path' => '/people/1', 'external' => false],
            ],
            [
                'title' => 'Grace Hopper',
                'subtitle' => null,
                'icon' => null,
                'group' => null,
                'link' => ['path' => '/people/2', 'external' => false],
            ],
        ]]);
});

it('links results through ClientPath, relative to atrium.client_path', function (): void {
    config()->set('app.url', 'https://app.test');
    config()->set('atrium.client_path', '/admin');

    searchApiSource([
        SearchResult::make('Inside', 'https://app.test/admin/people/1#notes'),
        SearchResult::make('Outside', 'https://app.test/reports'),
        SearchResult::make('Elsewhere', 'https://example.com/people/1'),
    ]);

    $links = $this->actingAs($this->user)->getJson(route('atrium.search', ['q' => 'people']))->assertOk()->json('data.*.link');

    expect($links)->toBe([
        ['path' => '/people/1#notes', 'external' => false],
        ['path' => 'https://app.test/reports', 'external' => true],
        ['path' => 'https://example.com/people/1', 'external' => true],
    ]);
});

it('sends link null for a result url ClientPath rejects', function (string $url): void {
    searchApiSource([SearchResult::make('Bad', $url)]);

    $this->actingAs($this->user)->getJson(route('atrium.search', ['q' => 'bad']))
        ->assertOk()
        ->assertJsonPath('data.0.title', 'Bad')
        ->assertJsonPath('data.0.link', null);
})->with([
    'javascript' => ['javascript:alert(1)'],
    'mixed-case scheme' => ['JavaScript:alert(1)'],
    'data' => ['data:text/html;base64,PHNjcmlwdD4='],
    'protocol-relative' => ['//evil.test'],
    'backslash host' => ['/\\evil.test'],
]);

it('refuses a query shorter than search.min_length with 422, running no source', function (string $query): void {
    $calls = 0;
    searchApiSource([SearchResult::make('Hit', '/hit')], $calls);

    $this->actingAs($this->user)->getJson(route('atrium.search', ['q' => $query]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('q');

    expect($calls)->toBe(0);
})->with([
    'one character' => ['a'],
    'padded with spaces' => [' a '],
    'blank' => [''],
]);

it('refuses a request without a query', function (): void {
    $this->actingAs($this->user)->getJson(route('atrium.search'))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('q');
});

it('searches once the query is long enough', function (): void {
    $calls = 0;
    searchApiSource([SearchResult::make('Hit', '/hit')], $calls);

    $this->actingAs($this->user)->getJson(route('atrium.search', ['q' => 'ab']))->assertOk()->assertJsonPath('data.0.title', 'Hit');

    config()->set('atrium.search.min_length', 1);

    $this->actingAs($this->user)->getJson(route('atrium.search', ['q' => 'a']))->assertOk()->assertJsonPath('data.0.title', 'Hit');

    expect($calls)->toBe(2);
});

it('reads the minimum query length from the search registry, at least 1', function (mixed $configured, int $expected): void {
    config()->set('atrium.search.min_length', $configured);

    expect(app(SearchRegistry::class)->minLength())->toBe($expected);
})->with([
    'configured' => [3, 3],
    'zero' => [0, 1],
    'negative' => [-2, 1],
    'null' => [null, 1],
    'not an integer' => ['4', 1],
]);

it('counts characters, not bytes, toward the minimum', function (): void {
    searchApiSource([SearchResult::make('Hit', '/hit')]);

    config()->set('atrium.search.min_length', 3);

    $this->actingAs($this->user)->getJson(route('atrium.search', ['q' => 'éé']))->assertUnprocessable();
    $this->actingAs($this->user)->getJson(route('atrium.search', ['q' => 'ééé']))->assertOk();
});

it('answers an empty list when no source matches', function (): void {
    $this->actingAs($this->user)->getJson(route('atrium.search', ['q' => 'nothing']))
        ->assertOk()
        ->assertExactJson(['data' => []]);
});
