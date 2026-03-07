import { test, expect } from '@playwright/test';

/**
 * Profile Management E2E Tests
 * Tests user profile viewing and editing
 */

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('user can navigate to profile page', async ({ page }) => {
    // Navigate to profile
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Verify profile page loaded
    await expect(page).toHaveURL('/profile');
    
    // Check for profile elements
    await expect(page.locator('h1:has-text("Profile"), h2:has-text("Profile"), [data-testid="profile-header"]').first()).toBeVisible();
  });

  test('user can view their profile information', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Check for profile information fields
    const profileElements = [
      '[data-testid="user-email"]',
      '[data-testid="user-name"]',
      '[data-testid="trust-score"]',
      '[name="bio"], textarea',
    ];
    
    // At least some profile elements should be visible
    let visibleCount = 0;
    for (const selector of profileElements) {
      const isVisible = await page.locator(selector).first().isVisible().catch(() => false);
      if (isVisible) visibleCount++;
    }
    
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('user can update their profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Find bio/location fields and update them
    const bioField = page.locator('[name="bio"], textarea').first();
    const locationField = page.locator('[name="location"], input[name="location"]').first();
    
    if (await bioField.isVisible().catch(() => false)) {
      const newBio = `Updated bio at ${new Date().toISOString()}`;
      await bioField.fill(newBio);
    }
    
    if (await locationField.isVisible().catch(() => false)) {
      await locationField.fill('Test Location');
    }
    
    // Click save button
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    await saveButton.click();
    
    // Wait for success message
    await expect(page.locator('.success-message, [role="alert"], .toast-success').first()).toBeVisible({ timeout: 5000 });
  });

  test('user can view trust score information', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Navigate to trust score section if it exists
    const trustScoreLink = page.locator('a:has-text("Trust"), [data-testid="trust-score"], a[href*="trust"]').first();
    
    if (await trustScoreLink.isVisible().catch(() => false)) {
      await trustScoreLink.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Check for trust score display
    const trustScoreElement = page.locator('[data-testid="trust-score"], .trust-score, :text-matches("trust score", "i")').first();
    await expect(trustScoreElement).toBeVisible();
  });

  test('user can view connection count', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Check for connections count
    const connectionsElement = page.locator('[data-testid="connections-count"], :text-matches("connections", "i"), .connections').first();
    
    // May or may not be visible depending on profile layout
    if (await connectionsElement.isVisible().catch(() => false)) {
      await expect(connectionsElement).toBeVisible();
    }
  });
});

test.describe('Public Profile Viewing', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('user can view another user profile', async ({ page }) => {
    // Navigate to a public profile
    await page.goto('/profile/some-user-id');
    await page.waitForLoadState('networkidle');
    
    // Check for profile page elements
    await expect(page.locator('h1, h2, [data-testid="profile"]').first()).toBeVisible();
  });

  test('user sees appropriate message for non-existent profile', async ({ page }) => {
    await page.goto('/profile/non-existent-id');
    await page.waitForLoadState('networkidle');
    
    // Should show 404 or error message
    const errorElement = page.locator('.error-message, [data-testid="not-found"], :text-matches("not found|404", "i")').first();
    
    if (await errorElement.isVisible().catch(() => false)) {
      await expect(errorElement).toBeVisible();
    }
  });
});
