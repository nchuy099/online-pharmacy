import { expect, test } from '@playwright/test';
import { requestJson, uniqueEmail } from '../../utils/http.js';
import {
  createAdminUser,
  loginViaApi,
  signUpCustomer,
  updatePharmacistProfile,
} from '../../utils/session.js';

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

test.describe('Auth / RBAC API E2E', () => {
  test('AUTH-01 Customer đăng ký tài khoản thành công', async () => {
    const customerEmail = uniqueEmail('customer');
    const signup = await signUpCustomer({
      baseUrl: backendUrl,
      email: customerEmail,
      password: 'Password123!',
      fullName: 'E2E Customer',
    });
    expect(signup).toHaveProperty('userId');
  });

  test('AUTH-02 Đăng ký email trùng bị reject', async () => {
    const customerEmail = uniqueEmail('customer');
    const customerPassword = 'Password123!';

    await signUpCustomer({
      baseUrl: backendUrl,
      email: customerEmail,
      password: customerPassword,
      fullName: 'E2E Customer',
    });

    const duplicateSignup = await requestJson({
      baseUrl: backendUrl,
      path: '/auth/sign-up',
      method: 'POST',
      body: { email: customerEmail, password: customerPassword, fullName: 'Duplicate Customer' },
    });

    expect(duplicateSignup.ok).toBeFalsy();
    expect(duplicateSignup.status).toBe(409);
  });

  test('AUTH-03 Login đúng email/password trả access token', async () => {
    const customerEmail = uniqueEmail('customer');
    const customerPassword = 'Password123!';

    await signUpCustomer({
      baseUrl: backendUrl,
      email: customerEmail,
      password: customerPassword,
      fullName: 'E2E Customer',
    });

    const login = await loginViaApi({
      baseUrl: backendUrl,
      identifier: customerEmail,
      password: customerPassword,
    });

    expect(login.accessToken).toBeTruthy();
    expect(login.refreshToken).toBeTruthy();
  });

  test('AUTH-04 Login sai password trả lỗi phù hợp', async () => {
    const customerEmail = uniqueEmail('customer');
    const customerPassword = 'Password123!';

    await signUpCustomer({
      baseUrl: backendUrl,
      email: customerEmail,
      password: customerPassword,
      fullName: 'E2E Customer',
    });

    const wrongPassword = await requestJson({
      baseUrl: backendUrl,
      path: '/auth/login',
      method: 'POST',
      body: { identifier: customerEmail, password: 'wrong-password' },
    });

    expect(wrongPassword.ok).toBeFalsy();
    expect(wrongPassword.status).toBe(401);
  });

  test('AUTH-04b Tài khoản đã xóa không thể đăng nhập', async () => {
    const adminLogin = await loginSuperAdmin();
    const deletedEmail = uniqueEmail('deleted-admin');
    const deletedPassword = 'Password123!';

    const created = await createAdminUser({
      baseUrl: backendUrl,
      token: adminLogin.accessToken,
      user: {
        email: deletedEmail,
        fullName: 'Deleted Admin',
        password: deletedPassword,
        roleName: 'STAFF',
      },
    });

    const deletedStatus = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/users/${created.id}/status`,
      method: 'PUT',
      token: adminLogin.accessToken,
      body: { status: 'DELETED' },
    });

    expect(deletedStatus.ok).toBeTruthy();

    const deletedLogin = await requestJson({
      baseUrl: backendUrl,
      path: '/auth/login',
      method: 'POST',
      body: { identifier: deletedEmail, password: deletedPassword },
    });

    expect(deletedLogin.ok).toBeFalsy();
    expect(deletedLogin.status).toBe(403);
    expect(deletedLogin.body?.message || deletedLogin.rawBody?.message).toContain('Tài khoản đã được xóa');
  });

  test('AUTH-05 Không có token gọi API protected bị 401', async () => {
    const protectedWithoutToken = await requestJson({
      baseUrl: backendUrl,
      path: '/users/me/details',
    });

    expect(protectedWithoutToken.status).toBe(401);
  });

  test('AUTH-06 Customer gọi admin API bị 403', async () => {
    const customerEmail = uniqueEmail('customer');
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

    const customerForbidden = await requestJson({
      baseUrl: backendUrl,
      path: '/admin/users/list',
      token: customerLogin.accessToken,
    });

    expect(customerForbidden.status, JSON.stringify(customerForbidden.rawBody, null, 2)).toBe(403);
  });

  test('AUTH-07 Admin/staff gọi đúng API theo permission', async () => {
    const adminLogin = await loginSuperAdmin();

    const adminUsers = await requestJson({
      baseUrl: backendUrl,
      path: '/admin/users/list?page=1&size=5',
      token: adminLogin.accessToken,
    });
    expect(adminUsers.ok).toBeTruthy();
    expect(adminUsers.body).toHaveProperty('users');

    const adminRolesMe = await requestJson({
      baseUrl: backendUrl,
      path: '/admin/roles/me',
      token: adminLogin.accessToken,
    });
    expect(adminRolesMe.ok).toBeTruthy();
    expect(adminRolesMe.body).toHaveProperty('name');
  });

  test('AUTH-08 Protected role không được sửa/xóa qua admin panel', async () => {
    const adminLogin = await loginSuperAdmin();

    const roles = await requestJson({
      baseUrl: backendUrl,
      path: '/admin/roles',
      token: adminLogin.accessToken,
    });
    expect(roles.ok).toBeTruthy();

    const protectedRole = (roles.body || []).find((role) => role.protectedRole);
    expect(protectedRole).toBeTruthy();

    const protectedRoleUpdate = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/roles/${protectedRole.id}/update`,
      method: 'PUT',
      token: adminLogin.accessToken,
      body: {
        name: protectedRole.name,
        description: 'Attempted E2E update',
        level: protectedRole.level,
      },
    });
    expect(protectedRoleUpdate.ok).toBeFalsy();

    const protectedRoleDelete = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/roles/${protectedRole.id}/delete`,
      method: 'DELETE',
      token: adminLogin.accessToken,
    });
    expect(protectedRoleDelete.ok).toBeFalsy();
  });

  test('AUTH-09 Admin tạo pharmacist và duyệt hồ sơ', async () => {
    const adminLogin = await loginSuperAdmin();
    const pharmacistEmail = uniqueEmail('pharmacist');
    const pharmacistPassword = 'Password123!';

    const pharmacist = await createAdminUser({
      baseUrl: backendUrl,
      token: adminLogin.accessToken,
      user: {
        email: pharmacistEmail,
        fullName: 'E2E Pharmacist',
        password: pharmacistPassword,
        roleName: 'PHARMACIST',
      },
    });

    await updatePharmacistProfile({
      baseUrl: backendUrl,
      token: adminLogin.accessToken,
      userId: pharmacist.id,
      profile: {
        qualifications: 'Licensed pharmacist',
        education: 'Pharmacy University',
        experience: '3 years',
        specialtyCode: 'GENERAL_MEDICINE',
        isApproved: true,
      },
    });

    const pharmacistLogin = await loginViaApi({
      baseUrl: backendUrl,
      identifier: pharmacistEmail,
      password: pharmacistPassword,
    });
    expect(pharmacistLogin.accessToken).toBeTruthy();
  });
});
