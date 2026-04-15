<?php
$request = Illuminate\Http\Request::create('/app', 'GET');
$middleware = new App\Http\Middleware\CheckBannedMiddleware();
$user = App\Models\User::where('username', 'exter')->first();
Auth::login($user);
$response = $middleware->handle($request, function() { return new \Illuminate\Http\Response('ok'); });
echo json_encode([
    'status' => $response->getStatusCode(),
    'isRedirect' => $response->isRedirect(),
    'targetUrl' => $response->isRedirect() ? $response->getTargetUrl() : null
]);
