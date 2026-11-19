#!/bin/sh
set -eu

if [ -z "${APP_KEY:-}" ]; then
  echo "ERROR: APP_KEY is missing. Copy the existing production APP_KEY securely from the current host." >&2
  exit 1
fi
if [ -z "${DB_CONNECTION:-}" ]; then
  echo "ERROR: DB_CONNECTION is missing. Configure the existing external database before starting." >&2
  exit 1
fi

# Never run migrations automatically during cutover: first verify a full backup.
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs storage/app/public
php artisan config:cache
php artisan view:cache

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  php artisan migrate --force
fi

port="${PORT:-10000}"
case "$port" in
  ''|*[!0-9]*) echo "ERROR: Invalid PORT" >&2; exit 1 ;;
esac
printf 'Listen %s\n' "$port" > /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:10000>/<VirtualHost *:$port>/" /etc/apache2/sites-available/000-default.conf

exec apache2-foreground
