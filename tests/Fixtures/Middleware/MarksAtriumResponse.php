<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Fixtures\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A host middleware for `atrium.routes.middleware`: it marks every response
 * it passes, so a test can see the configured stack ran.
 */
final class MarksAtriumResponse
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Atrium-Host', 'marked');

        return $response;
    }
}
