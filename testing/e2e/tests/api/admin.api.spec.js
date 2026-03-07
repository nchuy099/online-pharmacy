import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { requestJson, uniqueEmail } from '../../utils/http.js';
import {
  createAdminUser,
  createCategory,
  createProduct,
  importStock,
  loginViaApi,
  signUpCustomer,
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

async function createAdminCatalogFixture() {
  const adminLogin = await loginSuperAdmin();
  const suffix = randomUUID().slice(0, 8);
  const category = await createCategory({
    baseUrl: backendUrl,
    token: adminLogin.accessToken,
    category: {
      name: `E2E Admin Catalog ${suffix}`,
      slug: `e2e-admin-${suffix}`,
      parentId: null,
      level: 1,
      isActive: true,
    },
  });

  const product = await createProduct({
    baseUrl: backendUrl,
    token: adminLogin.accessToken,
    product: {
      name: `Admin Inventory Product ${suffix}`,
      webName: `Admin Inventory Product ${suffix}`,
      slug: `admin-inventory-${suffix}`,
      brand: 'Admin Brand',
      brandOrigin: 'Vietnam',
      producer: 'Admin Producer',
      description: 'Admin inventory fixture',
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

  return { adminLogin, category, product };
}

test.describe('Admin API E2E', () => {
  test('ADM-03 Tạo/sửa user thành công', async () => {
    const adminLogin = await loginSuperAdmin();
    const userEmail = uniqueEmail('admin-user');
    const initialFullName = 'E2E Admin User';

    const created = await createAdminUser({
      baseUrl: backendUrl,
      token: adminLogin.accessToken,
      user: {
        email: userEmail,
        fullName: initialFullName,
        password: 'Password123!',
        roleName: 'STAFF',
      },
    });

    expect(created.email).toBe(userEmail);
    expect(created.fullName).toBe(initialFullName);
    expect(created.role).toBe('STAFF');

    const updatedFullName = 'E2E Admin User Updated';
    const updatedPhone = '0901234567';

    const updated = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/users/${created.id}`,
      method: 'PUT',
      token: adminLogin.accessToken,
      body: {
        fullName: updatedFullName,
        biography: 'Updated via admin e2e',
        phoneNumber: updatedPhone,
        gender: 'MALE',
      },
    });

    expect(updated.ok).toBeTruthy();
    expect(updated.body).toMatchObject({
      id: created.id,
      email: userEmail,
      fullName: updatedFullName,
      phoneNumber: updatedPhone,
    });
  });

  test('ADM-04 Gán role/permission thành công', async () => {
    const adminLogin = await loginSuperAdmin();
    const roleName = `E2E_ROLE_${randomUUID().slice(0, 8).toUpperCase()}`;

    const createdRoleRes = await requestJson({
      baseUrl: backendUrl,
      path: '/admin/roles/create',
      method: 'POST',
      token: adminLogin.accessToken,
      body: {
        name: roleName,
        description: 'E2E generated admin role',
        roleType: 'ADMIN',
        level: 40,
      },
    });

    expect(createdRoleRes.ok).toBeTruthy();
    const createdRole = createdRoleRes.body;
    expect(createdRole.name).toBe(roleName);

    const permissionsRes = await requestJson({
      baseUrl: backendUrl,
      path: '/admin/permissions',
      token: adminLogin.accessToken,
    });

    expect(permissionsRes.ok).toBeTruthy();
    const assignableAdminPermissions = (permissionsRes.body || [])
      .filter((permission) => permission.roleType === 'ADMIN' && permission.assignable);
    expect(assignableAdminPermissions.length).toBeGreaterThan(0);

    const permissionNames = assignableAdminPermissions.slice(0, 2).map((permission) => permission.name);

    const assignedPermissionsRes = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/roles/${createdRole.id}/permissions`,
      method: 'PUT',
      token: adminLogin.accessToken,
      body: {
        permissionNames,
      },
    });

    expect(assignedPermissionsRes.ok).toBeTruthy();
    expect(assignedPermissionsRes.body.permissions.map((permission) => permission.name)).toEqual(
      expect.arrayContaining(permissionNames)
    );

    const updatedRoleRes = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/roles/${createdRole.id}/update`,
      method: 'PUT',
      token: adminLogin.accessToken,
      body: {
        name: `${roleName}_OPS`,
        description: 'Updated admin e2e role',
        level: 39,
      },
    });

    expect(updatedRoleRes.ok).toBeTruthy();
    expect(updatedRoleRes.body.name).toBe(`${roleName}_OPS`);
    expect(updatedRoleRes.body.permissions.map((permission) => permission.name)).toEqual(
      expect.arrayContaining(permissionNames)
    );
  });

  test('ADM-05 Protected role không thể xóa/sửa mapping nhạy cảm', async () => {
    const adminLogin = await loginSuperAdmin();

    const rolesRes = await requestJson({
      baseUrl: backendUrl,
      path: '/admin/roles',
      token: adminLogin.accessToken,
    });

    expect(rolesRes.ok).toBeTruthy();
    const protectedRole = (rolesRes.body || []).find((role) => role.protectedRole);
    expect(protectedRole).toBeTruthy();

    const updateRoleRes = await requestJson({
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

    expect(updateRoleRes.ok).toBeFalsy();
    expect(updateRoleRes.status).toBeGreaterThanOrEqual(400);

    const updatePermissionsRes = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/roles/${protectedRole.id}/permissions`,
      method: 'PUT',
      token: adminLogin.accessToken,
      body: {
        permissionNames: [],
      },
    });

    expect(updatePermissionsRes.ok).toBeFalsy();
    expect(updatePermissionsRes.status).toBeGreaterThanOrEqual(400);

    const deleteRoleRes = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/roles/${protectedRole.id}/delete`,
      method: 'DELETE',
      token: adminLogin.accessToken,
    });

    expect(deleteRoleRes.ok).toBeFalsy();
    expect(deleteRoleRes.status).toBeGreaterThanOrEqual(400);
  });

  test('ADM-06 Inventory update hợp lệ', async () => {
    const { adminLogin, product } = await createAdminCatalogFixture();
    const importedQuantity = 7;

    await importStock({
      baseUrl: backendUrl,
      token: adminLogin.accessToken,
      variantId: product.variants[0].id,
      quantity: importedQuantity,
      unitCost: 50000,
      note: 'E2E inventory import',
    });

    const inventorySummaryRes = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/inventories/${product.id}/transactions/list?page=1&size=10`,
      token: adminLogin.accessToken,
    });

    expect(inventorySummaryRes.ok).toBeTruthy();
    expect(inventorySummaryRes.body.productId).toBe(product.id);
    expect(inventorySummaryRes.body.quantityOnHand).toBe(importedQuantity);
    expect(inventorySummaryRes.body.quantityAvailable).toBe(importedQuantity);
    expect(inventorySummaryRes.body.quantityReserved).toBe(0);
    expect(inventorySummaryRes.body.inventories).toHaveLength(1);
    expect(inventorySummaryRes.body.inventories[0].variantId).toBe(product.variants[0].id);
    expect(inventorySummaryRes.body.inventories[0].quantityAvailable).toBe(importedQuantity);
  });

  test('ADM-07 User không đủ quyền bị chặn ở API', async () => {
    const customerEmail = uniqueEmail('admin-denied');
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

    const deniedRes = await requestJson({
      baseUrl: backendUrl,
      path: '/admin/users/list?page=1&size=5',
      token: customerLogin.accessToken,
    });

    expect(deniedRes.ok).toBeFalsy();
    expect(deniedRes.status).toBe(403);
  });

  test('ADM-08 Admin list endpoint chỉ trả nhóm quản trị', async () => {
    const adminLogin = await loginSuperAdmin();

    const adminUsersRes = await requestJson({
      baseUrl: backendUrl,
      path: '/admin/users/admins/list?page=1&size=20',
      token: adminLogin.accessToken,
    });

    expect(adminUsersRes.ok).toBeTruthy();
    expect(Array.isArray(adminUsersRes.body.users)).toBeTruthy();
    for (const adminUser of adminUsersRes.body.users) {
      expect(adminUser.roleType).toBe('ADMIN');
    }
  });
});
