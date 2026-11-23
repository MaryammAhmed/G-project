import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('CyberGuard – Full Website E2E Tests', () => {

  // ---------------------------------------------------------------
  // 1. Home / Landing Page
  // ---------------------------------------------------------------
  test('Home page loads with correct title and branding', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/CyberGuard/);
    // Check main heading contains CYBERGUARD (case-insensitive)
    await expect(page.locator('h1')).toContainText(/CYBERGUARD/i);
    // Nav links present
    await expect(page.locator('a[href="/login"]')).toContainText('Sign In');
    await expect(page.locator('a[href="/register"]')).toContainText('Play Now');
  });

  // ---------------------------------------------------------------
  // 2. Login Page
  // ---------------------------------------------------------------
  test('Login page renders form and key elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveTitle(/CyberGuard/);
    // Heading "Four doors." and the form heading "Welcome Back, Agent"
    await expect(page.getByRole('heading', { name: /Four doors/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Welcome Back, Agent/i })).toBeVisible();
    // Username input
    await expect(page.locator('#lg-user')).toBeVisible();
    // Password input
    await expect(page.locator('#lg-pass')).toBeVisible();
    // Sign In button
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    // Link to register
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  // ---------------------------------------------------------------
  // 3. Register Page
  // ---------------------------------------------------------------
  test('Register page renders form and password rules', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await expect(page).toHaveTitle(/CyberGuard/);
    // Heading "Create Account"
    await expect(page.locator('h2')).toContainText(/Create Account/i);
    // Username, Email, Password inputs
    await expect(page.locator('#rg-user')).toBeVisible();
    await expect(page.locator('#rg-mail')).toBeVisible();
    await expect(page.locator('#rg-pass')).toBeVisible();
    // Password rules list (scoped to the aria-live list inside the form)
    const rules = page.locator('ul[aria-live="polite"]');
    await expect(rules).toContainText(/At least 8 characters/);
    await expect(rules).toContainText(/An uppercase letter/);
    await expect(rules).toContainText(/A lowercase letter/);
    await expect(rules).toContainText(/A number/);
    // Create Account button
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();
  });

  // ---------------------------------------------------------------
  // 4. Map Page (Mission Map)
  // ---------------------------------------------------------------
  test('Map page loads and shows mission islands', async ({ page }) => {
    await page.goto(`${BASE_URL}/map`);
    await expect(page).toHaveTitle(/CyberGuard/);
    // Terminal header title
    await expect(page.locator('text=cyberguard/mission-map')).toBeVisible();
    // At least one mission button (Locked Out)
    await expect(page.locator('button[aria-label*="Locked Out"]')).toBeVisible();
    // ASK CIPHER link in header
    await expect(page.locator('a[href="/chat"]')).toContainText('ASK CIPHER');
  });

  // ---------------------------------------------------------------
  // 5. Chat Page (Ask Cipher)
  // ---------------------------------------------------------------
  test('Chat page renders module tabs and chat input', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat`);
    await expect(page).toHaveTitle(/CyberGuard/);
    // Main heading for the chat page
    await expect(page.getByRole('heading', { name: /Ask Cipher/i })).toBeVisible();
    // Module tabs
    await expect(page.locator('button[role="tab"]').first()).toContainText('LOCKEDOUT');
    // Chat input placeholder
    await expect(page.locator('input[placeholder*="Ask about"]')).toBeVisible();
    // Ask button
    await expect(page.getByRole('button', { name: /Ask/i })).toBeVisible();
  });

  // ---------------------------------------------------------------
  // 6. Privacy Page
  // ---------------------------------------------------------------
  test('Privacy page loads and contains key policy text', async ({ page }) => {
    await page.goto(`${BASE_URL}/privacy`);
    await expect(page).toHaveTitle(/CyberGuard/);
    // Check for some expected privacy text (e.g., "What we collect" or similar)
    await expect(page.locator('body')).toContainText(/What we collect|privacy/i);
  });

  // ---------------------------------------------------------------
// ---------------------------------------------------------------
  // 7. Admin Page (unauthenticated users are redirected to login)
  // ---------------------------------------------------------------
  test('Admin page redirects unauthenticated user to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await expect(page).toHaveTitle(/CyberGuard/);
    // Should redirect to /login when no token exists
    await expect(page).toHaveURL(/\/login/);
  });

});