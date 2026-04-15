<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

// Create critical storage directories if they get wiped by a Railway volume mount
$storageFrameworkDirs = [
    __DIR__.'/../storage/framework/sessions',
    __DIR__.'/../storage/framework/views',
    __DIR__.'/../storage/framework/cache/data',
    __DIR__.'/../storage/logs',
    __DIR__.'/../storage/app/public',
];

foreach ($storageFrameworkDirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
}

// Ensure the storage symlink exists at runtime
$publicStorage = __DIR__.'/../public/storage';
if (!is_link($publicStorage)) {
    @symlink(__DIR__.'/../storage/app/public', $publicStorage);
}

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust all proxies (Railway load balancer) to ensure correct HTTPS URL generation
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\CheckBannedMiddleware::class,
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'moderator' => \App\Http\Middleware\ModeratorMiddleware::class,
        ]);

        // Allow /api routes to use session-based auth (needed for Inertia first-party SPA).
        // The api middleware group doesn't include StartSession by default, so we prepend
        // the core session/cookie middleware so auth()->user() resolves via the web session.
        $middleware->api(prepend: [
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Session\Middleware\StartSession::class,
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\CheckBannedMiddleware::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
