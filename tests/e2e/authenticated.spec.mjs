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
        await page.getByRole('button', { name: /create account/i }).click();
        await expect(page).toHaveURL(/\/(app|home)(\?|$)/, { timeout: 30_000 });
        return;
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

test('staging: logged-in journeys remain responsive across core pages', async ({ page }, testInfo) => {
    test.skip(!accountViewports.has(testInfo.project.name), 'Run core app UI on phone, tablet and desktop');
    test.skip(
        !stagingSignupAllowed && (!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD),
        'Requires disposable staging signup or explicit staging-only credentials'
    );

    await signInAsDisposableStagingUser(page, testInfo.project.name);

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
