<?php

declare(strict_types=1);

namespace Workbench\App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Orchestra\Workbench\Workbench;
use Symfony\Component\HttpFoundation\Response;
use Workbench\App\Models\User;

/**
 * WORKBENCH ONLY. Never copy this into an application, and never ship it:
 * it signs anyone who sends a fixed, public token in as a real user.
 *
 * The workbench's stand-in for a real API guard, so the Nuxt playground can
 * call Atrium's JSON API across origins: `Authorization: Bearer workbench`
 * signs the request in as testbench.yaml's `workbench.user`, and only in the
 * `local` environment. Atrium ships no authentication; a real application
 * puts its own guard (`auth:sanctum`, Passport's `auth:api`, ...) in
 * `atrium.routes.middleware`, before `Authorize`.
 *
 * Like Laravel's own auth middleware it implements AuthenticatesRequests,
 * which puts it in the middleware priority list ahead of Atrium's
 * `Authorize`, so it signs the user in before the gate runs.
 */
final class AuthenticateWorkbenchToken implements AuthenticatesRequests
{
    public const string TOKEN = 'workbench';

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('local') && $request->bearerToken() === self::TOKEN) {
            $email = Workbench::config('user');

            $user = is_string($email) && $email !== ''
                ? User::query()->where('email', $email)->first()
                : null;

            if ($user !== null) {
                Auth::setUser($user);
            }
        }

        return $next($request);
    }
}
