import { expect, test } from '@playwright/test';
import { createAdminUser, loginViaApi, signUpCustomer } from '../../utils/session.js';
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

async function bootstrapSession(page, login) {
  await page.addInitScript(({ accessToken, refreshToken, user }) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }, {
    accessToken: login.accessToken,
    refreshToken: login.refreshToken,
    user: login.user,
  });
}

test.describe('Admin UI', () => {
  test('ADM-01 Admin đăng nhập vào portal thành công', async ({ page }) => {
    const adminLogin = await loginSuperAdmin();
    await bootstrapSession(page, adminLogin);

    await page.goto('/');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Xin chào')).toBeVisible();
    await expect(page.getByText('SUPER_ADMIN')).toBeVisible();
  });

  test('ADM-02 Staff/admin chỉ thấy menu theo permission', async ({ page }) => {
    const staffEmail = uniqueEmail('admin-staff');
    const staffPassword = 'Password123!';

    const adminLogin = await loginSuperAdmin();
    await createAdminUser({
      baseUrl: backendUrl,
      token: adminLogin.accessToken,
      user: {
        email: staffEmail,
        fullName: 'E2E Staff',
        password: staffPassword,
        roleName: 'STAFF',
      },
    });

    const staffLogin = await loginViaApi({
      baseUrl: backendUrl,
      identifier: staffEmail,
      password: staffPassword,
    });
    await bootstrapSession(page, staffLogin);

    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Phân loại' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sản phẩm' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Kho' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Đơn hàng' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Thống kê' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Người dùng' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Phân quyền' })).toHaveCount(0);
  });

  test('ADM-07 User không đủ quyền bị chặn ở route', async ({ page }) => {
    const customerEmail = uniqueEmail('admin-route-block');
    const customerPassword = 'Password123!';

    await signUpCustomer({
      baseUrl: backendUrl,
      email: customerEmail,
      password: customerPassword,
      fullName: 'E2E Customer',
    });

    const customerLogin = await loginViaApi({
      baseUrl: backendUrl,
      identifier: customerEmail,
      password: customerPassword,
    });
    await bootstrapSession(page, customerLogin);

    await page.goto('/users');

    await expect(page).toHaveURL(/\/forbidden$/);
    await expect(page.getByRole('heading', { name: '403 Forbidden' })).toBeVisible();
    await expect(page.getByText('Bạn không có quyền truy cập vào trang quản trị.')).toBeVisible();
  });

  test('ADM-08 Dashboard/list page xử lý empty/error state đúng', async ({ page }) => {
    const adminLogin = await loginSuperAdmin();
    await bootstrapSession(page, adminLogin);

    let responseMode = 'empty';
    await page.route('**/admin/users/list**', async (route) => {
      if (responseMode === 'empty') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            code: 'SUCCESS',
            status: 200,
            data: {
              users: [],
              pagination: {
                page: 1,
                size: 10,
                totalPages: 0,
                totalElements: 0,
              },
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'INTERNAL_SERVER_ERROR',
          status: 500,
          message: 'Không thể tải danh sách người dùng',
        }),
      });
    });

    await page.goto('/users');
    await expect(page.getByText('Chưa có dữ liệu nào.')).toBeVisible();

    responseMode = 'error';
    await page.reload();
    await expect(page.getByText('Không thể tải danh sách người dùng')).toBeVisible();
  });
});
