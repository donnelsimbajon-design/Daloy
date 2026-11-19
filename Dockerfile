# Production-style Render image: Vite assets + PHP/Apache Laravel app.
FROM node:22-bookworm-slim AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM php:8.3-apache-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev libicu-dev libzip-dev libonig-dev \
        libpng-dev libjpeg62-turbo-dev libfreetype6-dev libsqlite3-dev unzip git \
    && docker-php-ext-configure gd --with-jpeg --with-freetype \
    && docker-php-ext-install -j"$(nproc)" bcmath exif gd intl mbstring pdo_mysql pdo_pgsql pdo_sqlite zip opcache \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY . .
COPY --from=assets /app/public/build /var/www/html/public/build
COPY docker/apache-render.conf /etc/apache2/sites-available/000-default.conf
COPY docker/render-start.sh /usr/local/bin/render-start

RUN composer install --no-dev --no-interaction --no-progress --prefer-dist --optimize-autoloader \
    && chmod +x /usr/local/bin/render-start \
    && mkdir -p storage/framework/cache/data storage/framework/views storage/framework/sessions storage/logs storage/app/public bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && printf '%s\n' 'memory_limit=512M' 'upload_max_filesize=100M' 'post_max_size=100M' 'max_execution_time=120' 'opcache.enable=1' 'opcache.validate_timestamps=0' > /usr/local/etc/php/conf.d/daloy.ini

ENV PORT=10000
EXPOSE 10000
CMD ["/usr/local/bin/render-start"]
