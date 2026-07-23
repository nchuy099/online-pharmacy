import { expect, test } from '@playwright/test';

test.describe('admin smoke', () => {
  test('login page renders validation flow', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Đăng nhập Quản trị' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mật khẩu')).toBeVisible();

    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    await expect(page.getByText('Vui lòng nhập email')).toBeVisible();
  });

  test('root redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Đăng nhập Quản trị' })).toBeVisible();
  });
});
