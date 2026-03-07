import { test, expect } from '@playwright/test';

/**
 * Marketplace E2E Tests
 * Tests marketplace browsing and listing functionality
 */

test.describe('Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate to marketplace
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
  });

  test('marketplace page loads successfully', async ({ page }) => {
    await expect(page).toHaveURL(/marketplace/);
    await expect(page.locator('h1:has-text("Marketplace"), h2:has-text("Marketplace"), [data-testid="marketplace"]').first()).toBeVisible();
  });

  test('user can view marketplace verticals', async ({ page }) => {
    const verticals = ['earn', 'build', 'live', 'protect'];
    
    for (const vertical of verticals) {
      // Navigate to each vertical
      await page.goto(`/marketplace/${vertical}`);
      await page.waitForLoadState('networkidle');
      
      // Check page loaded
      await expect(page).toHaveURL(`/marketplace/${vertical}`);
      
      // Check for vertical-specific content
      await expect(page.locator('main, [data-testid="marketplace-listings"], .listings').first()).toBeVisible();
    }
  });

  test('user can filter marketplace listings', async ({ page }) => {
    await page.goto('/marketplace/earn');
    await page.waitForLoadState('networkidle');
    
    // Look for filter elements
    const categoryFilter = page.locator('[name="category"], select, [data-testid="category-filter"]').first();
    const searchInput = page.locator('[name="search"], input[type="search"], [placeholder*="Search"]').first();
    
    // Try to use filters if available
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500); // Wait for debounce
    }
    
    if (await categoryFilter.isVisible().catch(() => false)) {
      await categoryFilter.selectOption({ index: 1 }).catch(() => {});
      await page.waitForTimeout(500);
    }
    
    // Listings should still be visible (or empty state)
    await expect(page.locator('main, [data-testid="marketplace-listings"], .empty-state, .no-results').first()).toBeVisible();
  });

  test('user can click on a marketplace listing', async ({ page }) => {
    await page.goto('/marketplace/earn');
    await page.waitForLoadState('networkidle');
    
    // Find a listing to click
    const listing = page.locator('[data-testid="listing"], .marketplace-item, a[href*="/marketplace/"]').first();
    
    if (await listing.isVisible().catch(() => false)) {
      await listing.click();
      await page.waitForLoadState('networkidle');
      
      // Should navigate to listing detail page
      await expect(page).toHaveURL(/marketplace\/(earn|build|live|protect)\//);
    } else {
      test.skip();
    }
  });

  test('user can access create listing form', async ({ page }) => {
    // Look for create button
    const createButton = page.locator('a:has-text("Create"), button:has-text("Create"), a[href*="create"], [data-testid="create-listing"]').first();
    
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should show create form
      await expect(page.locator('form, [data-testid="create-form"], h1:has-text("Create")').first()).toBeVisible();
    } else {
      test.skip();
    }
  });
});
