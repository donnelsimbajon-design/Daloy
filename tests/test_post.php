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
    $response = app()->handle($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    if ($response->getStatusCode() == 500 || $response->getStatusCode() == 422) {
        if (method_exists($response, 'exception') && $response->exception) {
            echo $response->exception->getMessage() . "\n";
            echo $response->exception->getTraceAsString() . "\n";
        } else {
            echo $response->getContent() . "\n";
        }
    }
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
