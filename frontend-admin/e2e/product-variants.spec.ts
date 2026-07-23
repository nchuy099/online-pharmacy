import { expect, test } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const productId = process.env.E2E_PRODUCT_ID;

test.describe('Admin Product Variants', () => {
  test('creates new product variant with custom SKU', async ({ page }) => {
    test.skip(
      !adminEmail || !adminPassword || !productId,
      'Set E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, and E2E_PRODUCT_ID to run this stateful test.',
    );

    // 1. Log in to the Admin Dashboard
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminEmail!);
    await page.getByLabel('Mật khẩu').fill(adminPassword!);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    // Verify login is successful by waiting for home/dashboard page elements
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /Xin chào/ })).toBeVisible();

    // 2. Go directly to a product details page
    await page.goto(`/products/${productId}/details`);

    // Wait for the variants section to render
    await expect(page.getByText('Quản lý biến thể')).toBeVisible();

    // 3. Open the "Thêm phân loại" form
    await page.getByRole('button', { name: '+ Thêm phân loại' }).click();

    // 4. Fill in the variant details including custom SKU
    const uniqueSku = `SKU-E2E-${Date.now()}`;
    await page.getByPlaceholder('Tự sinh nếu bỏ trống').fill(uniqueSku);

    // Select the pack unit type (Hộp, Lọ, etc.)
    await page.locator('select').selectOption('Hộp');

    // Fill in specification and price
    await page.getByPlaceholder('Ví dụ: Hộp 10 vỉ x 10 viên').fill('Hộp 100 viên');
    await page.getByPlaceholder('Ví dụ: 120.000').fill('150000');

    // 5. Submit the variant form
    await page.getByRole('button', { name: 'Tạo phân loại' }).click();

    // 6. Verify that the new variant is successfully listed in the table
    const skuElement = page.getByRole('cell', { name: uniqueSku });
    await expect(skuElement).toBeVisible();

    // Verify details are correct in the row
    const row = page.locator('tr').filter({ hasText: uniqueSku });
    await expect(row.getByText('Hộp', { exact: true })).toBeVisible();
    await expect(row.getByText('Hộp 100 viên')).toBeVisible();
    await expect(row.getByText('150.000 đ')).toBeVisible();
  });
});
