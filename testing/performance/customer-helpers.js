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

function requestOptions(token = null) {
  return token ? { headers: jsonHeaders(token) } : undefined;
}

export function runProductList(fixtures, token = null) {
  return http.get(`${baseUrl()}/products/list?page=1&size=20`, requestOptions(token));
}

export function runProductSearch(fixtures, token = null) {
  const products = fixtures.products || [];
  const product = pickRandom(products, null);
  const keyword = product?.name ? product.name.split(/\s+/).slice(0, 2).join(' ') : 'vitamin';
  return http.get(
    `${baseUrl()}/products/list?page=1&size=20&search=${encodeURIComponent(keyword)}`,
    requestOptions(token)
  );
}

export function getProductCategorySlugs(fixtures) {
  const categories = fixtures.categorySlugs || [];
  if (categories.length > 0) {
    return categories;
  }

  const products = fixtures.products || [];
  return Array.from(
    new Set(
      products
        .map((product) => product?.categorySlug)
        .filter((value) => typeof value === 'string' && value.length > 0)
    )
  );
}

export function runProductCategoryList(fixtures, token = null) {
  const categorySlugs = getProductCategorySlugs(fixtures);
  const categorySlug = pickRandom(categorySlugs, null);
  if (!categorySlug) {
    return runProductList(fixtures, token);
  }

  return http.get(
    `${baseUrl()}/products/list?page=1&size=20&categorySlug=${encodeURIComponent(categorySlug)}`,
    requestOptions(token)
  );
}

export function runProductPriceFilter(token = null) {
  return http.get(
    `${baseUrl()}/products/list?page=1&size=20&minPrice=50000&maxPrice=200000`,
    requestOptions(token)
  );
}

export function runProductSort(fixtures, token = null) {
  const sortBy = Math.random() < 0.5 ? 'price-low' : 'price-high';
  return http.get(`${baseUrl()}/products/list?page=1&size=20&sortBy=${sortBy}`, requestOptions(token));
}

export function runProductDiscovery(fixtures, token = null) {
  return sampleTraffic([
    { weight: 8, run: () => runProductCategoryList(fixtures, token) },
    { weight: 2, run: () => runProductList(fixtures, token) },
  ])();
}

export function runProductDetail(fixtures, token = null) {
  const product = pickRandom(fixtures.products, null);
  if (!product) {
    return null;
  }
  return http.get(`${baseUrl()}/products/${product.id}/details`, requestOptions(token));
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
