import { expect, test } from '@playwright/test';
import { createAdminUser, loginViaApi, updatePharmacistProfile } from '../../utils/session.js';
import { uniqueEmail } from '../../utils/http.js';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@smartpharma.com';
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadmin';

async function bootstrapPharmacist() {
  const adminLogin = await loginViaApi({
    baseUrl: backendUrl,
    identifier: superAdminEmail,
    password: superAdminPassword,
  });

  const pharmacistEmail = uniqueEmail('ui-pharmacist');
  const pharmacistPassword = 'Password123!';
  const pharmacist = await createAdminUser({
    baseUrl: backendUrl,
    token: adminLogin.accessToken,
    user: {
      email: pharmacistEmail,
      fullName: 'UI Pharmacist',
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

  return pharmacistLogin;
}

test.describe('Pharmacist UI', () => {
  test('PHARM-01 Dược sĩ vào dashboard thành công', async ({ page }) => {
    const pharmacistLogin = await bootstrapPharmacist();

    await page.addInitScript(({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    }, {
      accessToken: pharmacistLogin.accessToken,
      refreshToken: pharmacistLogin.refreshToken,
      user: pharmacistLogin.user,
    });

    await page.goto('/chat-dashboard');
    await expect(page.getByText('Chọn một phiên tư vấn')).toBeVisible();
  });

  test('PHARM-02 Trang profile dược sĩ hiển thị', async ({ page }) => {
    const pharmacistLogin = await bootstrapPharmacist();

    await page.addInitScript(({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    }, {
      accessToken: pharmacistLogin.accessToken,
      refreshToken: pharmacistLogin.refreshToken,
      user: pharmacistLogin.user,
    });

    await page.goto('/profile');
    await expect(page.getByText('General Info')).toBeVisible();
  });
});
