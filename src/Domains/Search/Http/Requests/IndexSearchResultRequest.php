<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Search\Http\Requests;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Search\Http\Resources\SearchResultResource;
use RefactorCircus\Atrium\Domains\Search\Services\SearchRegistry;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * Global search: every source this user may search, for `q`. A query
 * shorter than `atrium.search.min_length` or longer than `MAX_LENGTH`,
 * counted after trimming, is refused with 422 before any source runs.
 *
 * Search reads registries only, so it has no model to authorize: the route
 * group's `viewAtrium` gate decides, and the sources are filtered for this
 * user.
 */
final class IndexSearchResultRequest extends Request
{
    /**
     * The most characters a query may have, so no source is handed an
     * unbounded string.
     */
    public const int MAX_LENGTH = 255;

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'q' => ['required', 'string', 'min:'.app(SearchRegistry::class)->minLength(), 'max:'.self::MAX_LENGTH],
        ];
    }

    /**
     * Trim `q` before the length rules run, so padding never counts toward
     * the minimum, whether or not the host keeps the TrimStrings middleware.
     */
    protected function prepareForValidation(): void
    {
        $query = $this->input('q');

        if (is_string($query)) {
            $this->merge(['q' => trim($query)]);
        }
    }

    public function persist(): JsonResponse
    {
        return SearchResultResource::collection(app(SearchRegistry::class)->search($this, $this->string('q')->toString()))->response();
    }
}
