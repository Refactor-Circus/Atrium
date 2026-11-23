<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Search\Http\Controllers;

use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Domains\Search\Http\Requests\IndexSearchResultRequest;

final class SearchController
{
    public function index(IndexSearchResultRequest $request): JsonResponse
    {
        return $request->persist();
    }
}
