import { test, expect } from '@playwright/test';

// Create disposable accounts only on the EXACT isolated staging preview URL.
// This guard prevents CI test accounts from accidentally being created on production.
const previewURL = 'https://daloy-render-preview.onrender.com';
const stagingSignupAllowed =
    process.env.E2E_ENABLE_DISPOSABLE_STAGING_SIGNUP === 'true' &&
    (process.env.E2E_BASE_URL || '').replace(/\/$/, '') === previewURL;
const accountViewports = new Set(['mobile-320', 'tablet-768', 'desktop-1440']);

async function signInAsDisposableStagingUser(page, projectName) {
    if (stagingSignupAllowed) {
        const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        const username = `e2e_${unique}`;
        const password = 'DaloyPlaywright!2026';

        await page.goto('/register', { waitUntil: 'domcontentloaded' });
        await page.locator('#name').fill('Daloy Preview Tester');
        await page.locator('#username').fill(username);
        await page.locator('#email').fill(`${username}@example.test`);
        await page.locator('#password').fill(password);
        await page.locator('#password_confirmation').fill(password);
        const [registrationResponse] = await Promise.all([
            page.waitForResponse(response =>
                new URL(response.url()).pathname === '/register' &&
                response.request().method() === 'POST', { timeout: 30_000 }),
            page.getByRole('button', { name: /create account/i }).click(),
        ]);
        expect(registrationResponse.status(), 'Registration must not return a 500 error')
            .toBeLessThan(400);
        await expect(page).toHaveURL(/\/(app|home)(\?|$)/, { timeout: 30_000 });
        return { email: `${username}@example.test`, password };
    }

    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, 'Staging credentials not provided and signup not enabled');
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(app|home)(\?|$)/, { timeout: 30_000 });
}

test('staging: logged-in journeys remain responsive across core pages', async ({ page, browser }, testInfo) => {
    test.skip(!accountViewports.has(testInfo.project.name), 'Run core app UI on phone, tablet and desktop');
    test.skip(
        !stagingSignupAllowed && (!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD),
        'Requires disposable staging signup or explicit staging-only credentials'
    );

    const disposableCredentials = await signInAsDisposableStagingUser(page, testInfo.project.name);

    // Verify email/password login from a new, cookie-free browser session.
    if (disposableCredentials) {
        const freshContext = await browser.newContext({ baseURL: previewURL });
        try {
            const loginPage = await freshContext.newPage();
            await loginPage.goto('/login', { waitUntil: 'domcontentloaded' });
            await loginPage.locator('input[name="email"]').fill(disposableCredentials.email);
            await loginPage.locator('input[name="password"]').fill(disposableCredentials.password);
            const [loginResponse] = await Promise.all([
                loginPage.waitForResponse(response =>
                    new URL(response.url()).pathname === '/login' &&
                    response.request().method() === 'POST', { timeout: 30_000 }),
                loginPage.getByRole('button', { name: /sign in/i }).click(),
            ]);
            expect(loginResponse.status(), 'Login must not return a server error').toBeLessThan(400);
            await expect(loginPage).toHaveURL(/\/(app|home)(\?|$)/, { timeout: 30_000 });
        } finally {
            await freshContext.close();
        }
    }

    // The logged-in shell polls this API. A MySQL-only DATE_SUB statement
    // previously returned HTTP 500 when running on the SQLite staging DB.
    const liveAnnouncementResponse = await page.request.get('/api/announcements/live');
    expect(liveAnnouncementResponse.status(), 'Announcements API must not error')
        .toBe(200);

    for (const [name, path] of [
        ['feed', '/app'],
        ['explore', '/explore'],
        ['schools', '/schools'],
        ['conversations', '/conversations'],
        ['settings', '/settings'],
        ['ripples', '/ripples'],
        ['voyagers', '/voyagers'],
        ['events', '/events'],
    ]) {
        const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
        expect(response?.status(), `HTTP failure for ${path}`).toBeLessThan(400);
        await expect(page.locator('body')).toBeVisible();
        if (name === 'feed' && ['mobile-320', 'tablet-768'].includes(testInfo.project.name)) {
            const launcher = page.getByRole('button', { name: 'Open quick actions' });
            await expect(launcher).toBeVisible();
            const metrics = await launcher.evaluate(element => {
                const rect = element.getBoundingClientRect();
                return {
                    top: rect.top,
                    bottomGap: window.innerHeight - rect.bottom,
                    rightGap: window.innerWidth - rect.right,
                    height: rect.height,
                };
            });
            expect(metrics.bottomGap, 'Quick actions should be anchored near the screen bottom').toBeGreaterThanOrEqual(8);
            expect(metrics.bottomGap, 'Quick actions should be aligned above the safe-area inset').toBeLessThan(72);
            expect(metrics.rightGap, 'Quick actions should align near the right screen edge').toBeGreaterThanOrEqual(8);
            expect(metrics.rightGap).toBeLessThan(48);
            await launcher.click();
            await expect(page.getByRole('button', { name: 'Close quick actions' })).toHaveAttribute('aria-expanded', 'true');
            await expect(page.locator('.daloy-floating-menu button[title="Messages"]')).toBeVisible();
            await page.getByRole('button', { name: 'Close quick actions' }).click();
        }
        if (name === 'conversations') {
            // Wait for the conversation list to replace its initial spinner.
            await expect(page.getByText('No conversations yet.')).toBeVisible({ timeout: 20000 });
        }

        const horizontalOverflow = await page.evaluate(() => ({
            width: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(horizontalOverflow.scrollWidth, `Page ${path}: ${JSON.stringify(horizontalOverflow)}`)
            .toBeLessThanOrEqual(horizontalOverflow.width + 4);

        await testInfo.attach(`${name}-${testInfo.project.name}`, {
            body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
            contentType: 'image/png',
        });
    }
});
