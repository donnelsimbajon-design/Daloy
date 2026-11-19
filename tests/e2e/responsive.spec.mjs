import { test, expect } from '@playwright/test';

// Public pages only: this suite never registers an account or mutates application data.
const publicPages = [
    { label: 'landing', path: '/', heading: /Dive into/i },
    { label: 'login', path: '/login', heading: /Welcome back/i },
    { label: 'register', path: '/register', heading: /Create your account/i },
    { label: 'admin-login', path: '/admin/login', heading: /Admin Access/i },
];

async function auditLayout(page, label, testInfo) {
    await page.evaluate(() => document.fonts?.ready);
    await expect(page.locator('body')).toBeVisible();

    // Report page-level overflow, plus important structural containers. Some decorative
    // fixed-position backgrounds intentionally extend off screen and are not measured.
    const overflow = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        const candidates = [...document.querySelectorAll('main, form, article, [role="dialog"]')];
        const offenders = candidates.filter((el) => {
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && (rect.left < -4 || rect.right > viewport + 4);
        });
        return {
            viewport,
            documentWidth: document.documentElement.scrollWidth,
            offenders: offenders.slice(0, 8).map(el => ({
                element: el.tagName,
                className: String(el.className).slice(0, 120),
                left: Math.round(el.getBoundingClientRect().left),
                right: Math.round(el.getBoundingClientRect().right),
            })),
        };
    });

    expect(overflow.offenders, JSON.stringify(overflow)).toEqual([]);
    expect(overflow.documentWidth, JSON.stringify(overflow))
        .toBeLessThanOrEqual(overflow.viewport + 4);

    // Full-page screenshots don't scroll the browser, so IntersectionObserver
    // reveal sections must be visited first or the screenshots appear blank.
    if (label === 'landing') {
        await page.evaluate(async () => {
            const height = document.documentElement.scrollHeight;
            const step = Math.max(360, Math.floor(window.innerHeight * 0.75));
            for (let y = 0; y < height; y += step) {
                window.scrollTo(0, y);
                await new Promise(resolve => setTimeout(resolve, 55));
            }
            window.scrollTo(0, 0);
        });
        await page.waitForTimeout(250);
    }

    await testInfo.attach(`${label}-${testInfo.project.name}`, {
        body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
        contentType: 'image/png',
    });
}

for (const route of publicPages) {
    test(`${route.label}: responsive screenshot, no page overflow`, async ({ page }, testInfo) => {
        const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        expect(response?.status(), `HTTP status for ${route.path}`).toBeLessThan(400);
        await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible();
        await auditLayout(page, route.label, testInfo);
    });
}

test('mobile landing navigation opens and closes', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'mobile-only control');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const menu = page.getByRole('button', { name: 'Open menu' });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#landing-mobile-menu')).toBeVisible();
    await page.getByRole('button', { name: 'Close menu' }).click();
    await expect(page.locator('#landing-mobile-menu')).toHaveCount(0);
});

test('admin login access-code toggle is usable on mobile', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'mobile-only control');
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    const accessCode = page.getByLabel('Access Code');
    const toggle = page.getByRole('button', { name: 'Show access code' });
    await expect(accessCode).toBeVisible();
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(accessCode).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide access code' }).click();
    await expect(accessCode).toHaveAttribute('type', 'password');
    await auditLayout(page, 'admin-access-code', testInfo);
});

test('public auth pages have usable form fields on small phones', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'mobile-only control');
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await auditLayout(page, 'register-fields', testInfo);
});
