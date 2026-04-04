<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $user = App\Models\User::first();
    Auth::login($user);
    $request = Illuminate\Http\Request::create('/posts', 'POST', [
        'content' => 'Test Post with poll options',
        'visibility' => 'public',
        'flow_velocity' => 'steady',
        'poll_options' => ['', '']
    ]);
    
    $request->setLaravelSession($app['session']->driver('file'));
    $app['session']->start();
    $request->headers->set('X-CSRF-TOKEN', $app['session']->token());
    
    $response = app()->handle($request);
    
    $errors = $app['session']->get('errors');
    if ($errors) {
        echo "Errors: " . json_encode($errors->getBag('default')->getMessages()) . "\n";
    } else {
        echo "Success! Status: " . $response->getStatusCode() . "\n";
        echo "Location: " . $response->headers->get('Location') . "\n";
    }
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
