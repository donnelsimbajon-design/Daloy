#!/bin/bash

# 0. Recreate storage folders that get wiped when mounting an empty Railway Volume!
mkdir -p storage/framework/{sessions,views,cache/data}
mkdir -p storage/logs
mkdir -p storage/app/public

# 1. Prepare Laravel Cache
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# 2. Run Database Migrations
php artisan migrate --force

# 3. Start PHP-FPM strictly in the background
php-fpm -y /assets/php-fpm.conf &

# 4. Start Nginx in the foreground to keep the container alive
nginx -c /assets/nginx.conf -g "daemon off;"
