# Daloy responsive UI review and Playwright

## Changes in this branch

- Viewport zoom is enabled again (removed `maximum-scale=1, user-scalable=0`).
- Auth screens have mobile-friendly card padding, smaller logo, and dynamic viewport height.
- Mobile menu and quick-action controls provide readable accessible labels.
- Tablet widths use the compact search rather than colliding with the desktop search bar.
- The desktop right rail scales between 320 and 400 px instead of taking a fixed 400 px at every desktop width.
- Global focus indicators are visible for keyboard users; reduced-motion users don't see lengthy animations.

## Run screenshot tests

Uses `@playwright/test` pinned to 1.56.1 in the GitHub Actions workflow (not installed in the app's runtime image).

```bash
npm ci
npm install --no-save --package-lock=false @playwright/test@1.56.1
npx playwright install chromium
E2E_BASE_URL=https://daloy-render-preview.onrender.com npm run test:e2e
npm run test:e2e:ui
```

**Screenshots:** `playwright-report/index.html` and `test-results/`. In GitHub, visit **Actions > Daloy UI - Playwright responsive screenshots > latest successful run > Artifacts > daloy-playwright-visual-report**.

The public suite takes full-page screenshots for Landing, Login, Register, and Admin Login at widths **320, 390, 768, 1024, and 1440**. It checks page load, headings, horizontal overflow, and mobile menu toggling.

The opt-in authenticated suite can check Feed, Explore, Schools, Conversations, Settings, and Ripples with a disposable **staging-only** user. It is automatically skipped when credentials are absent:

```bash
E2E_USER_EMAIL=staging-tester@example.test E2E_USER_PASSWORD=... npm run test:e2e
```

Use real credentials only in your local shell or a securely configured secret store; never commit them to the repository. **Do not point write-capable tests at production.**

## Limitations and next improvements

Automated screenshots are regression evidence, not proof that every UI is correct. This set doesn't exercise authenticated admin dashboards or video calls without dedicated staging fixtures, and CI reports need human visual review. Review responsive failure images before merging to main, including a manual mobile Safari check.

The Render Free preview uses an ephemeral test database; don't rely on its data, don't upload important files, and don't use it as the production migration destination.
