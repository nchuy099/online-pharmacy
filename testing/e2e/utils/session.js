import { expect } from '@playwright/test';
import { requestJson } from './http.js';

function formatResponse(res) {
  const rawBody =
    typeof res.rawBody === 'string' ? res.rawBody : JSON.stringify(res.rawBody, null, 2);
  return `status=${res.status} ok=${res.ok}\nresponse=${rawBody}`;
}

function assertOk(res, context) {
  expect(res.ok, `${context}\n${formatResponse(res)}`).toBeTruthy();
}

export function bootstrapStorageScript(session) {
  return ({ accessToken, refreshToken, user }) => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  };
}

export async function loginViaApi({ baseUrl, identifier, password }) {
  const res = await requestJson({
    baseUrl,
    path: '/auth/login',
    method: 'POST',
    body: { identifier, password },
  });

  assertOk(res, 'loginViaApi failed');
  return res.body;
}

export async function signUpCustomer({ baseUrl, email, password, fullName }) {
  const res = await requestJson({
    baseUrl,
    path: '/auth/sign-up',
    method: 'POST',
    body: { email, password, fullName },
  });

  assertOk(res, 'signUpCustomer failed');
  return res.body;
}

export async function createCustomerAddress({ baseUrl, token, address }) {
  const res = await requestJson({
    baseUrl,
    path: '/users/me/addresses/create',
    method: 'POST',
    token,
    body: address,
  });

  assertOk(res, 'createCustomerAddress failed');
  return res.body;
}

export async function createAdminUser({ baseUrl, token, user }) {
  const res = await requestJson({
    baseUrl,
    path: '/admin/users',
    method: 'POST',
    token,
    body: user,
  });

  assertOk(res, 'createAdminUser failed');
  return res.body;
}

export async function updatePharmacistProfile({ baseUrl, token, userId, profile }) {
  const res = await requestJson({
    baseUrl,
    path: `/admin/users/${userId}/pharmacist-profile`,
    method: 'PUT',
    token,
    body: profile,
  });

  assertOk(res, 'updatePharmacistProfile failed');
  return res.body;
}

export async function createCategory({ baseUrl, token, category }) {
  const res = await requestJson({
    baseUrl,
    path: '/admin/categories/create-with-slug',
    method: 'POST',
    token,
    body: category,
  });

  assertOk(res, 'createCategory failed');
  return res.body;
}

export async function createProduct({ baseUrl, token, product }) {
  const res = await requestJson({
    baseUrl,
    path: '/admin/products/create',
    method: 'POST',
    token,
    body: product,
  });

  assertOk(res, 'createProduct failed');
  return res.body;
}

export async function importStock({ baseUrl, token, variantId, quantity, unitCost = 1000, note = 'E2E stock import' }) {
  const res = await requestJson({
    baseUrl,
    path: `/admin/inventory/${variantId}/import`,
    method: 'POST',
    token,
    body: { quantity, unitCost, note },
  });

  assertOk(res, 'importStock failed');
  return res.body;
}

export async function addCartItem({ baseUrl, token, variantId, quantity = 1 }) {
  const res = await requestJson({
    baseUrl,
    path: '/cart/items/add',
    method: 'POST',
    token,
    body: { variantId, quantity },
  });

  assertOk(res, 'addCartItem failed');
  return res.body;
}

export async function getCart({ baseUrl, token }) {
  const res = await requestJson({
    baseUrl,
    path: '/cart/details',
    token,
  });

  assertOk(res, 'getCart failed');
  return res.body;
}

export async function previewCheckout({ baseUrl, token, payload }) {
  const res = await requestJson({
    baseUrl,
    path: '/checkouts/create',
    method: 'POST',
    token,
    body: payload,
  });

  assertOk(res, 'previewCheckout failed');
  return res.body;
}

export async function createOrder({ baseUrl, token, payload }) {
  const res = await requestJson({
    baseUrl,
    path: '/orders/create',
    method: 'POST',
    token,
    body: payload,
  });

  assertOk(res, 'createOrder failed');
  return res.body;
}
