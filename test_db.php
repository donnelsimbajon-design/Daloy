<?php
$logFile = 'storage/logs/laravel.log';
$lines = file($logFile);
$errors = [];
for ($i = count($lines) - 1; $i >= 0 && count($errors) < 3; $i--) {
    if (strpos($lines[$i], 'local.ERROR') !== false) {
        $errors[] = substr($lines[$i], 0, 500);
    }
}
file_put_contents('storage/logs/errors_summary.txt', implode("\n\n", array_reverse($errors)));
echo "Done - wrote " . count($errors) . " errors to storage/logs/errors_summary.txt\n";
