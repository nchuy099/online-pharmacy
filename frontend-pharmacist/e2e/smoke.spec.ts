import { expect, test } from '@playwright/test';

test.describe('pharmacist smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Pharmacist Portal' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('root redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Pharmacist Portal' })).toBeVisible();
  });
});
