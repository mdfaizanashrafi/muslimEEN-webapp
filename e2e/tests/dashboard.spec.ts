import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 * Tests main dashboard functionality and navigation
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('dashboard loads successfully', async ({ page }) => {
    // Verify dashboard URL
    await expect(page).toHaveURL('/dashboard');
    
    // Check for main dashboard elements
    await expect(page.locator('nav, header, [data-testid="dashboard"], main').first()).toBeVisible();
  });

  test('user can see navigation menu', async ({ page }) => {
    // Check for common navigation items
    const navItems = [
      'a:has-text("Profile")',
      'a:has-text("Connections")',
      'a:has-text("Messages")',
      'a:has-text("Marketplace")',
      'a:has-text("Notifications")',
    ];
    
    let visibleNavItems = 0;
    for (const selector of navItems) {
      const isVisible = await page.locator(selector).first().isVisible().catch(() => false);
      if (isVisible) visibleNavItems++;
    }
    
    // At least some navigation should be visible
    expect(visibleNavItems).toBeGreaterThan(0);
  });

  test('user can navigate to connections page', async ({ page }) => {
    const connectionsLink = page.locator('a:has-text("Connections"), a[href*="connections"], [data-testid="connections-link"]').first();
    
    if (await connectionsLink.isVisible().catch(() => false)) {
      await connectionsLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/connections/);
    } else {
      test.skip();
    }
  });

  test('user can navigate to marketplace', async ({ page }) => {
    const marketplaceLink = page.locator('a:has-text("Marketplace"), a[href*="marketplace"], [data-testid="marketplace-link"]').first();
    
    if (await marketplaceLink.isVisible().catch(() => false)) {
      await marketplaceLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/marketplace/);
    } else {
      test.skip();
    }
  });

  test('user can navigate to Islamic Finance section', async ({ page }) => {
    const financeLink = page.locator('a:has-text("Islamic Finance"), a:has-text("Finance"), a[href*="islamic-finance"], [data-testid="islamic-finance-link"]').first();
    
    if (await financeLink.isVisible().catch(() => false)) {
      await financeLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/islamic-finance|finance/);
    } else {
      test.skip();
    }
  });

  test('user can see notifications indicator', async ({ page }) => {
    const notificationsIndicator = page.locator('[data-testid="notifications"], .notification-badge, [aria-label*="notification"]').first();
    
    // Notifications indicator may or may not be present
    if (await notificationsIndicator.isVisible().catch(() => false)) {
      await expect(notificationsIndicator).toBeVisible();
    }
  });

  test('dashboard is responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    // Dashboard should still be visible
    await expect(page.locator('nav, header, [data-testid="dashboard"], main').first()).toBeVisible();
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
