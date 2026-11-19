import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://daloy-render-preview.onrender.com';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 120_000,
    expect: { timeout: 20_000 },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ],
    outputDir: 'test-results',
    use: {
        baseURL,
        browserName: 'chromium',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        actionTimeout: 20_000,
        navigationTimeout: 120_000,
    },
    projects: [
        { name: 'mobile-320', use: { viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true } },
        { name: 'mobile-390', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
        { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true } },
        { name: 'laptop-1024', use: { viewport: { width: 1024, height: 768 } } },
        { name: 'desktop-1440', use: { viewport: { width: 1440, height: 900 } } },
    ],
});
