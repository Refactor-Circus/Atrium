<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Access\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use RefactorCircus\Atrium\Domains\Access\Contracts\AtriumUser;
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
     * Whether this process has logged why the fallback refused someone.
     */
    private static bool $warned = false;

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
            return $this->fallback($request);
        }

        if (! Gate::has($ability)) {
            return $this->fallback($request);
        }

        return Gate::forUser($request->user())->allows($ability, [$request]);
    }

    /**
     * With no gate defined (D-086): a user model implementing AtriumUser
     * decides for itself; any other signed-in user gets in only in local
     * development, and is refused anywhere else, with one log line per
     * process saying how to let them in.
     */
    protected function fallback(Request $request): bool
    {
        $user = $request->user();

        if ($user instanceof AtriumUser) {
            return $user->canAccessAtrium();
        }

        if (app()->environment('local')) {
            return true;
        }

        if (! self::$warned) {
            self::$warned = true;

            Log::notice('Atrium refused a signed-in user: the viewAtrium gate is not defined, and the user model does not implement RefactorCircus\\Atrium\\Domains\\Access\\Contracts\\AtriumUser. Define the gate (Gate::define(\'viewAtrium\', fn ($user) => ...)) or implement canAccessAtrium() on the user model.');
        }

        return false;
    }
}
