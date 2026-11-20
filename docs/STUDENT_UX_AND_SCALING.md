# Daloy — student experience and scale readiness

This checklist distinguishes **tested staging functionality** from production
readiness. Keep Daloy's original black/white/gray palette and landing videos.

## What students should see
- Familiar navigation: **Your Feed**, **Explore posts**, **Find communities**, **Stories**, and **Messages**.
- A small, optional getting-started guide on the feed: **Share → Connect → Join**.
- Responsive layouts on 320, 390, 768, 1024 and 1440px screens.
- Accessible text for failed photos: **Photo unavailable**, not a browser's
  broken-image icon. Expired files cannot be recovered by a frontend fix.
- Prefer lazy-loaded media and reduce unnecessary polling in hidden browser tabs.
- Keep private post/story authorization enforced server-side.

## Root cause of 403 on older .webp uploads
The Render Free web service has an **ephemeral filesystem**. The public storage
symlink allows files on the *current* instance to be served, but files from a
previous container, the previous Railway host, or deleted Stories do not exist
there. Apache may return HTTP 403 for paths whose symlink target was deleted.
This is not a browser compatibility or Agora SDK problem.

The Staging Stories API avoids returning missing local Story URLs, and the
client displays an accessible unavailable-photo fallback. These changes
prevent broken UI but **cannot reconstruct lost files**.

## Required for genuine production and many concurrent student accounts
1. Locate the original Daloy Railway production database and uploaded files.
   The Railway accounts currently connected do not expose that Daloy service.
   Back up everything first; never delete the old volume before a verified
   restore and rollback test.
2. Provision **persistent object storage** (e.g. S3/R2/Cloudinary), configure
   its credentials securely in Render, and migrate *every* stored media path.
   Verify surviving an app restart and deployment before directing real users
   to the new site. Local Render Free uploads will not survive.
3. Move from disposable SQLite to **managed PostgreSQL or another supported
   persistent database**. Test backups/restores, indexes, migrations, connection
   management and monitoring.
4. Provide a separate **queue worker and scheduler** for notifications,
   cleanup, media processing and announcements.
5. Protect **private media URLs**, not only JSON API endpoints. Publicly hosted
   file paths remain public to anyone with the URL. Use protected file delivery
   or short-lived signed URLs for private Story media.
6. Add abuse throttles, upload limits, observability/alerts for 5xx and media
   failure rates, rate-limited polling, and appropriate caching.
7. Test Agora credentials, token generation, browser permissions, quotas and
   group call concurrency with real devices. SDK INFO/DEBUG logs alone do not
   mean a call is working.
8. Run representative load tests for concurrent registration, feed queries,
   post creation, Stories, chat, media delivery, and peak student activity.

## Verified testing boundaries
GitHub Actions / Playwright uses *disposable* users strictly on the isolated
Render staging preview. It covers registration, login, post lifecycle, media,
private post authorization, polls, comments, bookmarks, reporting, messaging,
Schools, Stories, profile photos and responsive layouts.

These tests **do not** validate that old Railway posts were migrated, media
will persist after deployment, or calls can scale to all students. Do not
merge the draft PR to production until those checks are complete.
