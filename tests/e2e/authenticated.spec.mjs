import { test, expect } from '@playwright/test';

// Opt-in only. Use a disposable STAGING account; never production credentials.
// Example: E2E_USER_EMAIL=... E2E_USER_PASSWORD=... npm run test:e2e
test('authenticated app routes: dashboard, messages, profile and settings', async ({ page }, testInfo) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, 'Disposable staging credentials not provided');

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(app|home|dashboard)(\?|$)/, { timeout: 30000 });

    for (const [name, path] of [
        ['feed', '/app'],
        ['explore', '/explore'],
        ['schools', '/schools'],
        ['conversations', '/conversations'],
        ['settings', '/settings'],
        ['ripples', '/ripples'],
    ]) {
        const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
        expect(res?.status(), `Failed route: ${path}`).toBeLessThan(400);
        await testInfo.attach(`${name}-${testInfo.project.name}`, {
            body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
            contentType: 'image/png',
        });
    }
});
