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

# Staging-only isolated SQLite file. Never use this setting for production data.
if [ "${PREVIEW_SQLITE_BOOTSTRAP:-false}" = "true" ]; then
  if [ "${APP_ENV:-}" != "staging" ] || [ "$DB_CONNECTION" != "sqlite" ] || [ "${DB_DATABASE:-}" != "/tmp/daloy-preview.sqlite" ]; then
    echo "ERROR: Preview database bootstrap requires APP_ENV=staging and the isolated /tmp/daloy-preview.sqlite path." >&2
    exit 1
  fi
  touch /tmp/daloy-preview.sqlite
fi

# Never run migrations automatically during production cutover: first verify a full backup.
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs storage/app/public
php artisan config:cache
php artisan view:cache

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  php artisan migrate --force
fi

# The preview database is created and migrated by root during startup, but
# Apache/PHP handles web requests as www-data. Without this, POST /register
# fails with SQLite "attempt to write a readonly database" (HTTP 500).
# This changes ownership only for the known disposable staging database.
if [ "${PREVIEW_SQLITE_BOOTSTRAP:-false}" = "true" ]; then
  chown www-data:www-data /tmp/daloy-preview.sqlite
  chmod 0660 /tmp/daloy-preview.sqlite
  if ! su -s /bin/sh www-data -c 'test -w /tmp/daloy-preview.sqlite && test -w /tmp'; then
    echo "ERROR: Staging SQLite database is not writable by the web server." >&2
    exit 1
  fi
fi

port="${PORT:-10000}"
case "$port" in
  ''|*[!0-9]*) echo "ERROR: Invalid PORT" >&2; exit 1 ;;
esac
printf 'Listen %s\n' "$port" > /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:10000>/<VirtualHost *:$port>/" /etc/apache2/sites-available/000-default.conf

exec apache2-foreground
