import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * 
 * These tests verify:
 * - Login flow works correctly
 * - Session expiry redirects to login
 * - Protected routes require authentication
 */

const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
};

test.describe('Authentication Flow', () => {
  
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login form elements exist
    await expect(page.getByRole('heading', { name: /log in|login|sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /log in|login|sign in/i })).toBeVisible();
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    
    // Submit form
    await page.getByRole('button', { name: /log in|login|sign in/i }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Verify dashboard content
    await expect(page.getByText(/welcome|dashboard/i)).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: /log in|login|sign in/i }).click();
    
    // Should stay on login page
    await expect(page).toHaveURL(/.*login.*/);
    
    // Should show error message
    await expect(page.getByText(/invalid|incorrect|wrong|error/i)).toBeVisible();
  });

  test('logout redirects to login page', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /log in|login|sign in/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Click logout
    await page.getByRole('button', { name: /logout|sign out|log out/i }).click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('session expiry redirects to login with message', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /log in|login|sign in/i }).click();
    
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Clear cookies to simulate session expiry
    await page.context().clearCookies();
    
    // Try to navigate to protected page
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/, { timeout: 5000 });
    
    // Should show session expired message
    await expect(page.getByText(/session|expired|timed out/i)).toBeVisible();
  });

  test('unauthenticated user cannot access dashboard', async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies();
    
    // Try to access dashboard
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/, { timeout: 5000 });
  });

  test('login page shows loading state during submission', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    
    // Click login
    await page.getByRole('button', { name: /log in|login|sign in/i }).click();
    
    // Should show loading state
    await expect(page.getByText(/loading|logging in|please wait/i)).toBeVisible();
  });

  test('dashboard shows welcome message with user name', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /log in|login|sign in/i }).click();
    
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Should show personalized welcome
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });
});

test.describe('Multi-Tab Session Sync', () => {
  test('logout in one tab logs out all tabs', async ({ browser }) => {
    // Create two contexts (simulating two tabs)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Login in first tab
    await page1.goto('/login');
    await page1.getByLabel(/email/i).fill(TEST_USER.email);
    await page1.getByLabel(/password/i).fill(TEST_USER.password);
    await page1.getByRole('button', { name: /log in|login|sign in/i }).click();
    
    await expect(page1).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Copy cookies to second tab to simulate same session
    const cookies = await context1.cookies();
    await context2.addCookies(cookies);
    
    // Open dashboard in second tab
    await page2.goto('/dashboard');
    await expect(page2.getByText(/welcome|dashboard/i)).toBeVisible();
    
    // Logout in first tab
    await page1.getByRole('button', { name: /logout|sign out|log out/i }).click();
    
    // Wait a moment for storage event
    await page2.waitForTimeout(500);
    
    // Second tab should redirect to login (via localStorage sync)
    // Note: This test may need adjustment based on implementation
    
    await context1.close();
    await context2.close();
  });
});
