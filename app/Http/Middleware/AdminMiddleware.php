<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Ensure user is authenticated, verified, and has admin role.
     * Returns 404 for non-admin users to hide admin routes.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Return 404 to hide admin panel from non-admin users
        if (!$user || !$user->isAdmin()) {
            abort(404);
        }

        return $next($request);
    }
}
