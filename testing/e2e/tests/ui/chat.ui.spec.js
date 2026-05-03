import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { bootstrapStorageScript, loginViaApi, signUpCustomer, updatePharmacistProfile } from '../../utils/session.js';
import { requestJson, uniqueEmail } from '../../utils/http.js';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
const customerUrl = process.env.CUSTOMER_URL || 'http://localhost:5173';
const pharmacistUrl = process.env.PHARMACIST_URL || 'http://localhost:5175';
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@smartpharma.com';
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadmin';
const pharmacistEmail = process.env.PHARMACIST_EMAIL || 'pharmacist@example.com';
const pharmacistPassword = process.env.PHARMACIST_PASSWORD || 'pharm123';

async function loginSuperAdmin() {
  return loginViaApi({
    baseUrl: backendUrl,
    identifier: superAdminEmail,
    password: superAdminPassword,
  });
}

async function bootstrapCustomer() {
  const email = uniqueEmail('chat-ui-customer');
  const password = 'Password123!';
  const fullName = `CHAT UI Customer ${randomUUID().slice(0, 8)}`;

  await signUpCustomer({
    baseUrl: backendUrl,
    email,
    password,
    fullName,
  });

  return {
    fullName,
    ...(await loginViaApi({
      baseUrl: backendUrl,
      identifier: email,
      password,
    })),
  };
}

async function bootstrapPharmacist() {
  const adminLogin = await loginSuperAdmin();
  const usersRes = await requestJson({
    baseUrl: backendUrl,
    path: '/admin/users/list?page=1&size=1000',
    token: adminLogin.accessToken,
  });

  expect(usersRes.ok, JSON.stringify(usersRes.rawBody, null, 2)).toBeTruthy();
  const pharmacist = (usersRes.body.users || []).find((user) => user.email === pharmacistEmail);
  expect(pharmacist, `Seeded pharmacist not found: ${pharmacistEmail}`).toBeTruthy();

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

  return {
    ...(await loginViaApi({
      baseUrl: backendUrl,
      identifier: pharmacistEmail,
      password: pharmacistPassword,
    })),
  };
}

async function openAuthenticatedPage(page, url, session) {
  await page.addInitScript(bootstrapStorageScript(null), {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user,
  });
  await page.goto(url);
}

test.describe('Chat UI E2E', () => {
  test('CHAT-03 Gửi/nhận message realtime', async ({ browser }) => {
    const customer = await bootstrapCustomer();
    const pharmacist = await bootstrapPharmacist();

    const customerContext = await browser.newContext();
    const pharmacistContext = await browser.newContext();
    const customerPage = await customerContext.newPage();
    const pharmacistPage = await pharmacistContext.newPage();

    try {
      await openAuthenticatedPage(pharmacistPage, `${pharmacistUrl}/chat-dashboard`, pharmacist);
      await expect(pharmacistPage.getByText('Pharmacist Portal')).toBeVisible();

      await openAuthenticatedPage(customerPage, customerUrl, customer);
      await expect(customerPage.getByTitle('Hỏi dược sĩ 24/7')).toBeVisible();

      await customerPage.getByTitle('Hỏi dược sĩ 24/7').click();
      await expect(customerPage.getByRole('button', { name: 'Chat với Dược sĩ' })).toBeVisible();
      await customerPage.getByRole('button', { name: 'Chat với Dược sĩ' }).click();
      await expect(customerPage.getByRole('button', { name: 'Chat ngay' })).toBeVisible();
      await customerPage.getByRole('button', { name: 'Chat ngay' }).click();

      const customerInput = customerPage.getByPlaceholder('Nhập câu hỏi tư vấn...');
      await expect(customerInput).toBeVisible();

      const customerMessage = `CHAT-03 customer message ${randomUUID().slice(0, 8)}`;
      await customerInput.fill(customerMessage);
      await customerInput.press('Enter');
      await expect(customerPage.getByText(customerMessage)).toBeVisible();

      await expect(pharmacistPage.getByText(customer.fullName)).toBeVisible({ timeout: 30000 });
      await pharmacistPage.getByText(customer.fullName).click();

      const acceptButton = pharmacistPage.getByRole('button', { name: 'NHẬN' }).first();
      await expect(acceptButton).toBeVisible();
      await acceptButton.click();

      const pharmacistInput = pharmacistPage.getByPlaceholder('Nhập tin nhắn...');
      await expect(pharmacistInput).toBeVisible();

      const pharmacistReply = `CHAT-03 pharmacist reply ${randomUUID().slice(0, 8)}`;
      await pharmacistInput.fill(pharmacistReply);
      await pharmacistInput.press('Enter');

      await expect(customerPage.getByText(pharmacistReply)).toBeVisible({ timeout: 30000 });
    } finally {
      await customerContext.close();
      await pharmacistContext.close();
    }
  });
});
