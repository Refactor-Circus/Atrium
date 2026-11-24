<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Frontend\Http\Requests;

use RefactorCircus\Atrium\Domains\Frontend\Services\FrontendAssets;
use RefactorCircus\Atrium\Http\Requests\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * One file of a prebuilt front end (D-081), Atrium's or a module's. Served
 * without a session or authentication: the files are the open-source
 * builds, and the page that loads them is what Atrium guards. A URL whose
 * version is the build's current one is cached for a year; an older one
 * (a page loaded before a deploy) still gets the file, uncached.
 */
final class ShowAssetRequest extends Request
{
    public function persist(): BinaryFileResponse
    {
        $assets = app(FrontendAssets::class);
        $owner = (string) $this->route('owner');
        $path = (string) $this->route('path');
        $file = $assets->locate($owner, $path);

        abort_if($file === null, 404);

        $type = FrontendAssets::TYPES[strtolower(pathinfo($file, PATHINFO_EXTENSION))];

        return response()->file($file, [
            'Content-Type' => $type,
            'Cache-Control' => $assets->versionOf($owner) === $this->route('version')
                ? 'public, max-age=31536000, immutable'
                : 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
            'Access-Control-Allow-Origin' => '*',
        ]);
    }
}
