<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Search\Http\Requests;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Search\Http\Resources\SearchResultResource;
use RefactorCircus\Atrium\Domains\Search\Services\SearchRegistry;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * Global search: every source this user may search, for `q`. A query
 * shorter than `atrium.search.min_length` is refused with 422 before any
 * source runs.
 *
 * Search reads registries only, so it has no model to authorize: the route
 * group's `viewAtrium` gate decides, and the sources are filtered for this
 * user.
 */
final class IndexSearchResultRequest extends Request
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'q' => ['required', 'string', 'min:'.app(SearchRegistry::class)->minLength()],
        ];
    }

    public function persist(): JsonResponse
    {
        $query = $this->string('q')->trim()->toString();

        return SearchResultResource::collection(app(SearchRegistry::class)->search($this, $query))->response();
    }
}
