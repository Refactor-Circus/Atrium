<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Frontend\Http\Controllers;

use Illuminate\Http\Response;
use RefactorCircus\Atrium\Domains\Frontend\Http\Requests\ShowAppRequest;
use RefactorCircus\Atrium\Domains\Frontend\Http\Requests\ShowAssetRequest;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class FrontendController
{
    public function show(ShowAppRequest $request): Response
    {
        return $request->persist();
    }

    public function asset(ShowAssetRequest $request): BinaryFileResponse
    {
        return $request->persist();
    }
}
