<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $user = App\Models\User::first();
    if (!$user) {
        echo "No users found\n";
        exit;
    }
    Auth::login($user);
    $request = Illuminate\Http\Request::create('/posts', 'POST', [
        'content' => 'Test Post',
        'visibility' => 'public',
        'flow_velocity' => 'steady'
    ]);
    
    // Bypass CSRF by adding the token explicitly and starting session
    $request->setLaravelSession($app['session']->driver('file'));
    $app['session']->start();
    $token = $app['session']->token();
    $request->headers->set('X-CSRF-TOKEN', $token);
    
    $response = app()->handle($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Location: " . $response->headers->get('Location') . "\n";
    
    $errors = $app['session']->get('errors');
    if ($errors) {
        echo "Errors: " . json_encode($errors->getBag('default')->getMessages()) . "\n";
    } else {
        echo "No session errors.\n";
    }
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
