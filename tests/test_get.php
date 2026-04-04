<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $user = App\Models\User::first();
    Auth::login($user);
    $request = Illuminate\Http\Request::create('/', 'GET');
    $request->setLaravelSession($app['session']->driver('file'));
    $app['session']->start();
    $token = $app['session']->token();
    $request->headers->set('X-CSRF-TOKEN', $token);
    
    $response = app()->handle($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    if ($response->getStatusCode() == 500) {
        if (method_exists($response, 'exception') && $response->exception) {
            echo $response->exception->getMessage() . "\n";
        }
    }
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
