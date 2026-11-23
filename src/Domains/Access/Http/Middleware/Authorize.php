<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Access\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

/**
 * The last middleware of Atrium's API group: a guest gets 401, a signed-in
 * user the `viewAtrium` gate refuses gets 403.
 *
 * Atrium ships no authentication, so the host's guard runs before this. With
 * no guard there is no user, and the 401 is answered here as JSON, never
 * left to an exception handler that might redirect to a login page.
 */
class Authorize
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() === null) {
            return new JsonResponse(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        abort_unless($this->passes($request), Response::HTTP_FORBIDDEN, 'This action is unauthorized.');

        return $next($request);
    }

    protected function passes(Request $request): bool
    {
        $ability = config('atrium.gate');

        if (! is_string($ability) || $ability === '') {
            return $this->fallback();
        }

        if (! Gate::has($ability)) {
            return $this->fallback();
        }

        return Gate::forUser($request->user())->allows($ability, [$request]);
    }

    /**
     * With no gate defined, let any signed-in user through in local
     * development and nobody anywhere else.
     */
    protected function fallback(): bool
    {
        return app()->environment('local');
    }
}
