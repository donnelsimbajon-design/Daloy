<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = App\Models\User::has('admin')->get();
foreach ($users as $u) {
    echo "ID: {$u->id} | User: {$u->username} | Email: {$u->email} | isAdmin: " . ($u->isAdmin() ? 'T' : 'F') . " | isVerified: " . ($u->hasVerifiedEmail() ? 'T' : 'F') . PHP_EOL;
}
