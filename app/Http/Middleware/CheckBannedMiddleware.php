<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckBannedMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();

            if ($user->banned_until) {
                // Determine if permanent (year > 9000) or just future date
                $isPermanent = $user->banned_until->year > 9000;
                $isStillBanned = $isPermanent || $user->banned_until->isFuture();

                if ($isStillBanned) {
                    // Allowed routes for banned users to avoid infinite loop
                    $allowedRoutes = ['banned', 'logout', 'landing', 'banned.appeal', 'banned.appeal.submit'];
                    $allowedPaths = ['logout', 'banned', 'banned/appeal'];
                    
                    $routeName = $request->route()?->getName();
                    if (!in_array($routeName, $allowedRoutes) && !$request->is($allowedPaths)) {
                        if ($request->header('X-Inertia')) {
                            // Inertia natively handles server-side redirects
                            return redirect()->route('banned');
                        }

                        if ($request->expectsJson() || $request->is('api/*')) {
                            return response()->json(['message' => 'Your account has been banned.'], 403);
                        }

                        return redirect()->route('banned');
                    }
                }
            }
        }

        return $next($request);
    }
}
