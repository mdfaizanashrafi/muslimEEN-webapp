import { test, expect } from '@playwright/test';

/**
 * Authentication Flow E2E Tests
 * Tests user login, logout, and authentication-related flows
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('user can see login page elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/MuslimEEN|Login/i);
    
    // Check login form elements exist
    await expect(page.locator('[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('[name="password"], input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('user can login successfully with valid credentials', async ({ page }) => {
    // Fill in login form
    await page.fill('[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('[name="password"], input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Check for dashboard elements
    await expect(page.locator('text=Welcome, text=Dashboard, nav, [data-testid="dashboard"]').first()).toBeVisible();
  });

  test('user sees error on invalid credentials', async ({ page }) => {
    // Fill in login form with wrong credentials
    await page.fill('[name="email"], input[type="email"]', 'wrong@example.com');
    await page.fill('[name="password"], input[type="password"]', 'wrongpass');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('.error-message, [role="alert"], .text-red, .text-error').first()).toBeVisible({ timeout: 5000 });
    
    // Verify still on login page
    await expect(page).toHaveURL(/login/);
  });

  test('user sees validation error for empty fields', async ({ page }) => {
    // Submit form without filling fields
    await page.click('button[type="submit"]');
    
    // Check for validation error
    await expect(page.locator('.error-message, [role="alert"], input:invalid').first()).toBeVisible({ timeout: 5000 });
    
    // Verify still on login page
    await expect(page).toHaveURL(/login/);
  });

  test('user can logout successfully', async ({ page }) => {
    // First login
    await page.fill('[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Click logout button/link
    const logoutButton = page.locator('[data-testid="logout"], button:has-text("Logout"), a:has-text("Logout"), [aria-label="logout"]').first();
    
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      
      // Wait for redirect to login
      await page.waitForURL('/login', { timeout: 10000 });
      
      // Verify redirected to login
      await expect(page).toHaveURL(/login/);
    } else {
      test.skip();
    }
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/profile');
    
    // Should be redirected to login
    await page.waitForURL(/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Registration Flow', () => {
  test('user can see registration page elements', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Check registration form elements
    await expect(page.locator('[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('[name="password"], input[type="password"]')).toBeVisible();
    await expect(page.locator('[name="firstName"], input[name="first_name"]')).toBeVisible();
    await expect(page.locator('[name="lastName"], input[name="last_name"]')).toBeVisible();
  });

  test('user can register with valid invitation code', async ({ page }) => {
    await page.goto('/register?invitation=VALID123');
    await page.waitForLoadState('networkidle');
    
    const uniqueEmail = `test${Date.now()}@example.com`;
    
    // Fill registration form
    await page.fill('[name="email"], input[type="email"]', uniqueEmail);
    await page.fill('[name="password"], input[type="password"]', 'SecurePass123!');
    await page.fill('[name="firstName"], input[name="first_name"]', 'Test');
    await page.fill('[name="lastName"], input[name="last_name"]', 'User');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or show success
    await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
    
    // Check for success indicator
    const successIndicator = page.locator('.success-message, [role="alert"][data-status="success"], .text-green');
    const isDashboard = page.url().includes('/dashboard');
    
    expect(await successIndicator.isVisible().catch(() => false) || isDashboard).toBeTruthy();
  });
});
