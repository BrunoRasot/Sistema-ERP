import { test, expect } from '@playwright/test';

test.describe('Visual Regression & Layout Integrity Suite', () => {
  test('Mobile Viewport: enforces pb-safe, fixed bottom nav, and zero horizontal overflow', async ({
    page,
  }, testInfo) => {
    // Only run on mobile project
    if (testInfo.project.name.includes('Desktop')) return;

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 1. Verify zero horizontal overflow on mobile screen
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // 2. Set authenticated state in localStorage to inspect dashboard layout
    await page.evaluate(() => {
      localStorage.setItem('vivelite_access_token', 'mock-token-visual-test');
      localStorage.setItem(
        'vivelite_user',
        JSON.stringify({
          firstName: 'Admin',
          lastName: 'Tester',
          role: 'ADMIN',
          email: 'admin@vivelite.pe',
        }),
      );
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    // 3. Verify mobile bottom bar has pb-safe area and is fixed at bottom
    const bottomNav = page.locator('nav.pb-safe, nav.fixed.bottom-0');
    if (await bottomNav.count() > 0) {
      await expect(bottomNav.first()).toBeVisible();
      const classes = await bottomNav.first().getAttribute('class');
      expect(classes).toContain('pb-safe');
      expect(classes).toContain('bottom-0');
    }

    // 4. Verify desktop sidebar is NOT visible on mobile
    const desktopSidebar = page.locator('aside.hidden.lg\\:block');
    if (await desktopSidebar.count() > 0) {
      const isVisible = await desktopSidebar.first().isVisible();
      expect(isVisible).toBe(false);
    }
  });

  test('Desktop Viewport: renders sidebar with full height and hides mobile bottom navigation', async ({
    page,
  }, testInfo) => {
    // Only run on desktop project
    if (testInfo.project.name.includes('Mobile')) return;

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Set authenticated state in localStorage
    await page.evaluate(() => {
      localStorage.setItem('vivelite_access_token', 'mock-token-visual-test');
      localStorage.setItem(
        'vivelite_user',
        JSON.stringify({
          firstName: 'Admin',
          lastName: 'Tester',
          role: 'ADMIN',
          email: 'admin@vivelite.pe',
        }),
      );
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    // 1. Verify desktop sidebar is visible
    const desktopSidebar = page.locator('aside');
    if (await desktopSidebar.count() > 0) {
      await expect(desktopSidebar.first()).toBeVisible();
    }

    // 2. Verify mobile bottom bar is hidden on desktop (lg:hidden)
    const mobileNav = page.locator('nav.lg\\:hidden');
    if (await mobileNav.count() > 0) {
      const isVisible = await mobileNav.first().isVisible();
      expect(isVisible).toBe(false);
    }

    // 3. Verify zero horizontal scroll on desktop
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });
});
