import http from 'k6/http';
import { baseUrl, jsonHeaders, login, pickRandom, sampleTraffic } from './lib.js';

let cachedSession = null;

export function getCustomerSession(fixtures) {
  if (cachedSession) {
    return cachedSession;
  }

  const customers = fixtures.customers || [];
  const customer = customers.length > 0 ? customers[(__VU - 1) % customers.length] : null;
  if (!customer) {
    throw new Error('No customer fixtures configured');
  }

  cachedSession = {
    customer,
    token: login(customer.identifier, customer.password),
  };

  return cachedSession;
}

export function runProductDiscovery(fixtures) {
  const categories = fixtures.categories || [];
  const category = pickRandom(categories, null);
  const keywords = ['vitamin', 'pain relief', 'supplement', 'antibiotic'];
  const keyword = pickRandom(keywords, 'vitamin');
  const endpoints = [
    () => http.get(`${baseUrl()}/products/list?page=1&size=20&search=${encodeURIComponent(keyword)}`),
    () => http.get(`${baseUrl()}/products/list?page=1&size=20&sortBy=createdAt_desc`),
    () => (category
      ? http.get(`${baseUrl()}/products/list?page=1&size=20&categorySlug=${encodeURIComponent(category.slug)}`)
      : http.get(`${baseUrl()}/categories/list`)),
  ];
  return sampleTraffic([
    { weight: 6, run: endpoints[0] },
    { weight: 3, run: endpoints[1] },
    { weight: 1, run: endpoints[2] },
  ])();
}

export function runProductDetail(fixtures) {
  const product = pickRandom(fixtures.products, null);
  if (!product) {
    return null;
  }

  const requests = [
    () => http.get(`${baseUrl()}/products/${product.id}/details`),
    () => http.get(`${baseUrl()}/products/slug/${encodeURIComponent(product.slug)}`),
    () => http.get(`${baseUrl()}/reviews/products/${product.id}/list?page=0&size=5`),
  ];

  return sampleTraffic([
    { weight: 5, run: requests[0] },
    { weight: 3, run: requests[1] },
    { weight: 2, run: requests[2] },
  ])();
}

export function runCartFlow(token, fixtures) {
  const variant = pickRandom(fixtures.variants, null);
  if (!variant) {
    return null;
  }

  const headers = jsonHeaders(token);
  http.post(`${baseUrl()}/cart/items/add`, JSON.stringify({ variantId: variant.id, quantity: 1 }), { headers });

  const cartResponse = http.get(`${baseUrl()}/cart/details?size=10`, { headers });
  const cart = cartResponse.json()?.data;
  const firstItemId = cart?.items?.[0]?.id;
  if (!firstItemId) {
    return cartResponse;
  }

  const updateBody = JSON.stringify({ quantity: 2, selected: true });
  http.put(`${baseUrl()}/cart/items/${firstItemId}/update`, updateBody, { headers });
  return http.del(`${baseUrl()}/cart/items/${firstItemId}/remove`, null, { headers });
}

export function runCheckoutFlow(token, fixtures, customerOverride = null) {
  const customer = customerOverride || pickRandom(fixtures.customers, null);
  const variant = pickRandom(fixtures.variants, null);
  if (!customer || !variant || !customer.addressId) {
    return null;
  }

  const headers = jsonHeaders(token);
  const previewBody = {
    mode: 'BUY_NOW',
    buyNowItem: {
      variantId: variant.id,
      quantity: 1,
    },
    addressId: customer.addressId,
    serviceId: 2,
    note: 'performance-test',
  };

  const previewResponse = http.post(
    `${baseUrl()}/orders/preview`,
    JSON.stringify(previewBody),
    { headers }
  );

  const preview = previewResponse.json()?.data;
  const checkoutQuoteId = preview?.checkoutQuoteId;
  if (!checkoutQuoteId) {
    return previewResponse;
  }

  const createBody = {
    checkoutQuoteId,
    paymentMethod: 'COD',
    mode: 'BUY_NOW',
    buyNowItem: {
      variantId: variant.id,
      quantity: 1,
    },
    note: 'performance-test',
  };

  return http.post(`${baseUrl()}/orders/create`, JSON.stringify(createBody), { headers });
}

export function runOrderHistoryFlow(token, fixtures) {
  const headers = jsonHeaders(token);
  const historyResponse = http.get(`${baseUrl()}/orders/history?page=1&size=10`, { headers });

  const history = historyResponse.json()?.data;
  const firstOrder = history?.orders?.[0];
  if (firstOrder?.id) {
    http.get(`${baseUrl()}/orders/${firstOrder.id}/details`, { headers });
  }

  return historyResponse;
}

export function runShippingPreviewOnly(token, fixtures) {
  const customer = pickRandom(fixtures.customers, null);
  const variant = pickRandom(fixtures.variants, null);
  if (!customer || !variant || !customer.addressId) {
    return null;
  }

  const headers = jsonHeaders(token);
  return http.post(
    `${baseUrl()}/orders/preview`,
    JSON.stringify({
      mode: 'BUY_NOW',
      buyNowItem: { variantId: variant.id, quantity: 1 },
      addressId: customer.addressId,
      serviceId: 2,
      note: 'performance-test',
    }),
    { headers }
  );
}
