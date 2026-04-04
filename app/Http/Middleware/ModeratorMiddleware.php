<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ModeratorMiddleware
{
    /**
     * Ensure user is authenticated and has moderator role.
     * Returns 404 for non-moderators to hide routes.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            \Illuminate\Support\Facades\Log::info('ModeratorMiddleware: User is null');
            abort(404);
        }
        
        if (!$user->isAdmin()) {
            \Illuminate\Support\Facades\Log::info('ModeratorMiddleware: User is not admin: ' . $user->id);
            abort(404);
        }

        // Only allow moderators and super_admins
        if (!in_array($user->admin->role, ['moderator', 'super_admin'])) {
            \Illuminate\Support\Facades\Log::info('ModeratorMiddleware: Invalid role: ' . $user->admin->role);
            abort(404);
        }

        return $next($request);
    }
}
