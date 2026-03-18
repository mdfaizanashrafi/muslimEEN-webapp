/**
 * Critical Auth Flow E2E Tests
 * Tests the complete user authentication journey
 */

import { test, expect } from '@playwright/test';

test.describe('CRITICAL: Auth Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.goto('/');
    await page.evaluate(() => {
      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      localStorage.clear();
    });
  });

  test('user can view public landing page', async ({ page }) => {
    await page.goto('/');
    
    // Should see the landing page
    await expect(page).toHaveTitle(/MuslimEEN/);
    await expect(page.locator('text=Join Now').first()).toBeVisible();
  });

  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Should see login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'WrongPass123!');
    
    // Submit form
    await page.click('button:has-text("Sign In")');
    
    // Should show error
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('protected routes redirect to login', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('logout clears session', async ({ page }) => {
    // This test requires a valid login
    // In a real scenario, you would:
    // 1. Login with valid credentials
    // 2. Navigate to dashboard
    // 3. Click logout
    // 4. Verify redirected to login
    // 5. Verify cannot access dashboard

    test.skip(true, 'Requires valid test credentials');
  });
});

test.describe('CRITICAL: Security Headers', () => {
  test('security headers are present', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check security headers
    const headers = response?.headers() || {};
    
    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-content-type-options']).toBeDefined();
    expect(headers['referrer-policy']).toBeDefined();
  });
});
