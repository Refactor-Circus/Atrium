<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Search\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Search\Data\SearchResult;
use RefactorCircus\Atrium\Domains\Search\Services\SearchRegistry;

class SearchController
{
    public function __construct(protected SearchRegistry $search) {}

    public function __invoke(Request $request): JsonResponse
    {
        $query = $request->string('q')->trim()->toString();

        // Too short to be worth asking every source; the search box holds
        // back too, so this only guards the endpoint itself.
        if (mb_strlen($query) < self::minLength()) {
            return response()->json(['data' => []]);
        }

        $results = array_map(
            fn (SearchResult $result): array => $result->toArray(),
            $this->search->search($request, $query),
        );

        return response()->json(['data' => $results]);
    }

    /**
     * The fewest characters a query needs, from `atrium.search.min_length`.
     */
    public static function minLength(): int
    {
        $length = config('atrium.search.min_length');

        return is_int($length) ? max(1, $length) : 1;
    }
}
