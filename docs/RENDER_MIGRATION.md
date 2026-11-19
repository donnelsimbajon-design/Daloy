# Daloy Railway -> Render migration (safety-first)

## Current state

Daloy is Laravel 12 + Inertia/React + Vite. The tracked Railway deployment settings are not enough to migrate the production data or secrets. The default .env.example uses SQLite and points to a Railway URL, while config/database.php also supports MySQL/TiDB and PostgreSQL. **Find the real running environment before choosing a database.**

This change only prepares Docker and a Render Blueprint. It **does not** copy accounts, passwords, messages, posts, uploads, or domains and does not retire Railway.

## Blockers before production cutover

1. Obtain access to the Railway project that actually hosts Daloy (not an unrelated project) and inventory application environment variables, database vendor/host, and any attached volume. Never commit credentials to Git.
2. Back up the production database and upload files. Verify a restoration in an isolated test environment. Keep the same APP_KEY to preserve existing encrypted data, sessions, and application behavior where applicable.
3. If using an external MySQL/TiDB database, Render can connect to it when its network and SSL settings allow it. Configure the existing DB_CONNECTION/DB_HOST/DB_PORT/DB_DATABASE/DB_USERNAME/DB_PASSWORD. For TiDB, the existing config can use MYSQL_ATTR_SSL_CA=isrgrootx1.pem. If using DB_URL, configure that variable instead and verify compatibility.
4. Avoid changing the database engine during initial host migration. Switching MySQL/TiDB to PostgreSQL needs a separate tested data migration, schema compatibility checks, and validation.
5. **Persistent media is a release blocker.** app/Http/Controllers/PostController.php writes to the public local disk; StoryController.php also saves locally. Render's free web filesystem is wiped on restart/spin-down. Copy existing files to S3-compatible storage or Cloudinary and update all upload, URL-generation, and deletion code paths before production traffic.
6. Background jobs and scheduled announcements require attention. The Blueprint uses QUEUE_CONNECTION=sync as an interim staging mode; production traffic needs a queue worker if jobs must be asynchronous. routes/console.php schedules announcements every minute and log cleanup daily; a separate Render cron process is needed for reliable execution. Free sleeping web services are unsuitable for always-on work.
7. Set APP_URL to the new HTTPS onrender.com address, APP_ENV=production, APP_DEBUG=false, and a nonchanging production APP_KEY. Use the original SMTP and third-party credentials if required (Agora, Cloudinary, etc.) via Render environment variables.
8. Avoid automatic migrations until a tested backup exists. RUN_MIGRATIONS=false by default. Run migrations intentionally once, after schema review, and set RUN_MIGRATIONS back to false.
9. Test /up, registration/login, profile changes, post/story upload/retrieval, private messages, media links, pagination, group calls, queue behavior, and application logs before switching DNS or telling users to use the new URL.
10. Keep Railway running until a tested cutover and rollback plan exists. Do not delete original DB/volumes and do not remove existing domains until data is confirmed.

## Deploy preparation

- Use **Web Service** with Docker (not Static Site) or import the render.yaml Blueprint.
- Region: Singapore. Use Free only for staging; consider a paid always-on service when running scheduled jobs or production traffic.
- Docker image serves Apache -> Laravel public/ and builds Vite in a separate Node stage.
- The startup script deliberately refuses to start without APP_KEY and DB_CONNECTION. This prevents an accidental new empty database or regenerated application key.
- The Laravel health route /up is a shallow HTTP check; it does not verify database reachability. Verify the real data path separately.

## Rollback

Before switch: record the Railway deployment, DB snapshot identifier, and current DNS values. If Render smoke tests or traffic fail, keep or restore routing to Railway, and resolve any writes made during the cutover before retrying.

## Post-cutover improvements

- Convert local post/story/user-profile uploads to durable remote storage.
- Add automated tests for authentication, permissions, visibility, and media.
- Add dedicated queue worker and cron/scheduler when budget permits.
- Remove tracked debugging artifacts and replace boilerplate README after reviewing for sensitive contents.
