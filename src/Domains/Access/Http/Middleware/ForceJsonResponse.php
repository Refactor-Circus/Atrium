<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Access\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The first middleware of Atrium's API group: every request to it is treated
 * as asking for JSON, whatever its `Accept` header, so the exception handler
 * renders errors as JSON. A host guard's 401 is then JSON too, never a
 * redirect to a login route the host may not have.
 *
 * @internal Atrium adds it to its own route group; hosts do not configure it.
 */
final class ForceJsonResponse
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
