<?php
$lines = file('storage/logs/laravel.log');
$errors = preg_grep('/local\.ERROR/', $lines);
file_put_contents('error_out.json', json_encode(array_values(array_slice($errors, -2)), JSON_PRETTY_PRINT));
