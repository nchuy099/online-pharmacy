import { expect, test } from '@playwright/test';

test.describe('customer smoke', () => {
  test('home page renders without page errors', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await page.goto('/');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('body')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('login page renders validation flow', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('Chao mung tro lai').or(page.getByText('Chào mừng trở lại'))).toBeVisible();
    await expect(page.getByPlaceholder('email@example.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();

    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    await expect(page.getByText('Email không được để trống')).toBeVisible();
    await expect(page.getByText('Mật khẩu không được để trống')).toBeVisible();
  });

  test('checkout page redirects unauthenticated users to home and opens auth modal', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL('http://127.0.0.1:3000/');
    await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible();
    await expect(page.getByText('Đăng nhập để tiếp tục trải nghiệm')).toBeVisible();
  });
});
