import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import {
  createCategory,
  createCustomerAddress,
  createProduct,
  importStock,
  loginViaApi,
  signUpCustomer,
} from '../../utils/session.js';
import { uniqueEmail } from '../../utils/http.js';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@smartpharma.com';
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadmin';

async function loginSuperAdmin() {
  return loginViaApi({
    baseUrl: backendUrl,
    identifier: superAdminEmail,
    password: superAdminPassword,
  });
}

async function createUiCatalogFixture({ stock = 0 } = {}) {
  const adminLogin = await loginSuperAdmin();
  const category = await createCategory({
    baseUrl: backendUrl,
    token: adminLogin.accessToken,
    category: {
      name: `E2E UI Catalog ${randomUUID().slice(0, 8)}`,
      slug: `e2e-ui-${randomUUID()}`,
      parentId: null,
      level: 1,
      isActive: true,
    },
  });

  const product = await createProduct({
    baseUrl: backendUrl,
    token: adminLogin.accessToken,
    product: {
      name: 'UI Purchase Product',
      webName: 'UI Purchase Product',
      slug: `ui-purchase-${randomUUID()}`,
      brand: 'UI Brand',
      brandOrigin: 'Vietnam',
      producer: 'UI Producer',
      description: 'UI test product',
      categoryIds: [category.id],
      variants: [
        {
          unitType: 'TABLET',
          unit: 'hộp',
          specification: '20 tablets',
          salePrice: 99000,
          isDefault: true,
          isActive: true,
        },
      ],
    },
  });

  if (stock > 0) {
    await importStock({
      baseUrl: backendUrl,
      token: adminLogin.accessToken,
      variantId: product.variants[0].id,
      quantity: stock,
      unitCost: 50000,
    });
  }

  return { adminLogin, category, product };
}

test.describe('Customer UI', () => {
  test('AUTH-01 Customer đăng ký tài khoản thành công', async ({ page }) => {
    const signupEmail = uniqueEmail('ui-customer');
    const signupPassword = 'Password123!';

    await page.goto('/login');
    await page.getByText('Đăng ký ngay').click();
    await page.getByPlaceholder('Nguyễn Văn A').fill('UI Customer');
    await page.getByPlaceholder('email@example.com').fill(signupEmail);
    await page.getByPlaceholder('••••••••').fill(signupPassword);
    await page.getByRole('button', { name: 'Đăng ký' }).click();

    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
  });

  test('AUTH-02 Đăng ký email trùng bị reject', async ({ page }) => {
    const signupEmail = uniqueEmail('ui-customer');
    const signupPassword = 'Password123!';

    await signUpCustomer({
      baseUrl: backendUrl,
      email: signupEmail,
      password: signupPassword,
      fullName: 'Seeded Customer',
    });

    await page.goto('/login');
    await page.getByText('Đăng ký ngay').click();
    await page.getByPlaceholder('Nguyễn Văn A').fill('UI Customer Duplicate');
    await page.getByPlaceholder('email@example.com').fill(signupEmail);
    await page.getByPlaceholder('••••••••').fill(signupPassword);
    await page.getByRole('button', { name: 'Đăng ký' }).click();

    await expect(page.locator('.mb-4.p-3.bg-red-50.border.border-red-200.rounded-lg')).toBeVisible();
    await expect(page.locator('.mb-4.p-3.bg-red-50.border.border-red-200.rounded-lg')).toContainText(/email|đã|taken|sử dụng/i);
  });

  test('AUTH-03 Login đúng email/password trả access token', async ({ page }) => {
    const signupEmail = uniqueEmail('ui-customer');
    const signupPassword = 'Password123!';

    await signUpCustomer({
      baseUrl: backendUrl,
      email: signupEmail,
      password: signupPassword,
      fullName: 'UI Login Customer',
    });

    await page.goto('/login');
    await page.getByPlaceholder('email@example.com').fill(signupEmail);
    await page.getByPlaceholder('••••••••').fill(signupPassword);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('PROD-01 đến PROD-06 browse/search/out-of-stock flow', async ({ page }) => {
    const fixture = await createUiCatalogFixture();
    const signupEmail = uniqueEmail('ui-buyer');
    const signupPassword = 'Password123!';

    await signUpCustomer({
      baseUrl: backendUrl,
      email: signupEmail,
      password: signupPassword,
      fullName: 'UI Buyer',
    });

    const customerLogin = await loginViaApi({
      baseUrl: backendUrl,
      identifier: signupEmail,
      password: signupPassword,
    });

    await page.addInitScript(({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    }, {
      accessToken: customerLogin.accessToken,
      refreshToken: customerLogin.refreshToken,
      user: customerLogin.user,
    });

    await page.goto('/products');
    await expect(page.getByText('Danh sách sản phẩm')).toBeVisible();

    await page.goto(`/${fixture.category.slug}`);
    await expect(page.getByText(fixture.category.name)).toBeVisible();
    await expect(page.getByText(fixture.product.name)).toBeVisible();

    await page.goto('/products?q=UI%20Purchase%20Product');
    await expect(page.getByText('Kết quả cho')).toBeVisible();

    await page.goto(`/${fixture.product.slug}`);
    await expect(page.getByText('Hết hàng')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mua ngay' })).toBeVisible();
  });

  test('CART-01 to ORD-03 cart and order flow', async ({ page }) => {
    const fixture = await createUiCatalogFixture({ stock: 8 });
    const signupEmail = uniqueEmail('ui-buyer');
    const signupPassword = 'Password123!';

    await signUpCustomer({
      baseUrl: backendUrl,
      email: signupEmail,
      password: signupPassword,
      fullName: 'UI Buyer',
    });

    const customerLogin = await loginViaApi({
      baseUrl: backendUrl,
      identifier: signupEmail,
      password: signupPassword,
    });

    await createCustomerAddress({
      baseUrl: backendUrl,
      token: customerLogin.accessToken,
      address: {
        fullName: 'UI Customer',
        phoneNumber: '0901234567',
        address: '456 UI Street',
        ghnProvinceId: 1,
        ghnDistrictId: 1,
        ghnWardCode: '00001',
        provinceName: 'HCM',
        districtName: 'District 1',
        wardName: 'Ward 1',
        isDefault: true,
      },
    });

    await page.addInitScript(({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    }, {
      accessToken: customerLogin.accessToken,
      refreshToken: customerLogin.refreshToken,
      user: customerLogin.user,
    });

    await page.goto(`/${fixture.product.slug}`);
    await expect(page.getByRole('button', { name: 'Mua ngay' })).toBeVisible();
    await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();

    await page.goto('/cart');
    await expect(page.getByText('Giỏ hàng')).toBeVisible();
    await expect(page.getByText(fixture.product.name)).toBeVisible();
    await page.getByRole('button', { name: 'Tiến hành đặt hàng' }).click();
    await expect(page.getByText('Thanh toán')).toBeVisible();
    await expect(page.getByText('Địa chỉ nhận hàng')).toBeVisible();
    await page.getByRole('button', { name: 'Đặt hàng ngay' }).click();
    await expect(page.getByText('Đặt hàng thành công!')).toBeVisible();
    await page.getByRole('button', { name: 'Xem đơn hàng' }).click();
    await expect(page.getByText('Chi tiết đơn hàng')).toBeVisible();
  });
});
