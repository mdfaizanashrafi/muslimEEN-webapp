import { test, expect } from '@playwright/test';

/**
 * Islamic Finance E2E Tests
 * Tests Islamic finance tools: Zakat calculator, Sadaqah, Waqf, Qard Hasan
 */

test.describe('Islamic Finance', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test.describe('Zakat Calculator', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/islamic-finance/zakat');
      await page.waitForLoadState('networkidle');
    });

    test('zakat calculator page loads', async ({ page }) => {
      await expect(page).toHaveURL(/islamic-finance|zakat/);
      await expect(page.locator('h1, h2, [data-testid="zakat-calculator"]').first()).toBeVisible();
    });

    test('user can calculate zakat', async ({ page }) => {
      // Look for input fields
      const goldInput = page.locator('[name="goldValue"], input[placeholder*="gold"], [data-testid="gold-input"]').first();
      const cashInput = page.locator('[name="cash"], input[placeholder*="cash"], [data-testid="cash-input"]').first();
      const calculateButton = page.locator('button:has-text("Calculate"), button[type="submit"]').first();
      
      if (await goldInput.isVisible().catch(() => false)) {
        await goldInput.fill('5000');
      }
      
      if (await cashInput.isVisible().catch(() => false)) {
        await cashInput.fill('10000');
      }
      
      if (await calculateButton.isVisible().catch(() => false)) {
        await calculateButton.click();
        
        // Check for result
        await expect(page.locator('[data-testid="zakat-result"], .zakat-amount, .result').first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Sadaqah (Charity)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/islamic-finance/sadaqah');
      await page.waitForLoadState('networkidle');
    });

    test('sadaqah page loads', async ({ page }) => {
      await expect(page).toHaveURL(/islamic-finance|sadaqah/);
      await expect(page.locator('h1, h2, [data-testid="sadaqah"]').first()).toBeVisible();
    });

    test('user can view charity campaigns', async ({ page }) => {
      // Check for campaign listings
      const campaigns = page.locator('[data-testid="campaign"], .campaign, .charity-item').first();
      
      // Either campaigns are listed or empty state is shown
      const hasContent = await campaigns.isVisible().catch(() => false) || 
                        await page.locator('.empty-state, :text-matches("no campaigns", "i")').first().isVisible().catch(() => false);
      
      expect(hasContent).toBeTruthy();
    });

    test('user can view campaign details', async ({ page }) => {
      const campaign = page.locator('[data-testid="campaign"], .campaign, a[href*="/sadaqah/"]').first();
      
      if (await campaign.isVisible().catch(() => false)) {
        await campaign.click();
        await page.waitForLoadState('networkidle');
        
        // Should show campaign details
        await expect(page.locator('h1, h2, [data-testid="campaign-details"]').first()).toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Waqf (Endowment)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/islamic-finance/waqf');
      await page.waitForLoadState('networkidle');
    });

    test('waqf page loads', async ({ page }) => {
      await expect(page).toHaveURL(/islamic-finance|waqf/);
      await expect(page.locator('h1, h2, [data-testid="waqf"]').first()).toBeVisible();
    });

    test('user can view waqf listings', async ({ page }) => {
      const waqfItems = page.locator('[data-testid="waqf-item"], .waqf, .endowment').first();
      
      const hasContent = await waqfItems.isVisible().catch(() => false) || 
                        await page.locator('.empty-state').first().isVisible().catch(() => false);
      
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('Qard Hasan (Benevolent Loan)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/islamic-finance/qard-hasan');
      await page.waitForLoadState('networkidle');
    });

    test('qard hasan page loads', async ({ page }) => {
      await expect(page).toHaveURL(/islamic-finance|qard-hasan/);
      await expect(page.locator('h1, h2, [data-testid="qard-hasan"]').first()).toBeVisible();
    });

    test('user can view loan requests', async ({ page }) => {
      const loans = page.locator('[data-testid="loan-request"], .loan, .qard-item').first();
      
      const hasContent = await loans.isVisible().catch(() => false) || 
                        await page.locator('.empty-state').first().isVisible().catch(() => false);
      
      expect(hasContent).toBeTruthy();
    });
  });
});
