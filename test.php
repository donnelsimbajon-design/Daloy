<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
file_put_contents('tinker_out.txt', json_encode(\App\Models\User::first()->conversations()->where('type', 'group')->first(), JSON_PRETTY_PRINT));
echo "Done";
