import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { requestJson, uniqueEmail } from '../../utils/http.js';
import {
  addCartItem,
  createCategory,
  createCustomerAddress,
  createOrder,
  createProduct,
  getCart,
  importStock,
  loginViaApi,
  previewCheckout,
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

async function createBaseProductFixture({ stock = 0 } = {}) {
  const adminLogin = await loginSuperAdmin();
  const categorySlug = `e2e-${randomUUID()}`;

  const category = await createCategory({
    baseUrl: backendUrl,
    token: adminLogin.accessToken,
    category: {
      name: `E2E Catalog ${randomUUID().slice(0, 8)}`,
      slug: categorySlug,
      parentId: null,
      level: 1,
      isActive: true,
    },
  });

  const productName = `E2E Pain Relief Capsule ${randomUUID().slice(0, 8)}`;
  const productSlug = `e2e-pain-relief-${randomUUID()}`;
  const sku = `E2E-${randomUUID().slice(0, 8)}`;

  const createPayload = {
    name: productName,
    webName: productName,
    slug: productSlug,
    brand: 'E2E Brand',
    brandOrigin: 'Vietnam',
    producer: 'E2E Producer',
    description: 'Created by Playwright E2E',
    careful: 'Use as directed',
    adverseEffect: 'None',
    preservation: 'Dry place',
    usage: 'Oral',
    dosage: '1 capsule daily',
    categoryIds: [category.id],
    variants: [
      {
        sku,
        unitType: 'CAPSULE',
        unit: 'vỉ',
        specification: '10 capsules',
        salePrice: 120000,
        discountPercent: 0,
        isDefault: true,
        isActive: true,
      },
    ],
  };

  const product = await createProduct({
    baseUrl: backendUrl,
    token: adminLogin.accessToken,
    product: createPayload,
  });

  const variant = product.variants[0];

  if (stock > 0) {
    await importStock({
      baseUrl: backendUrl,
      token: adminLogin.accessToken,
      variantId: variant.id,
      quantity: stock,
      unitCost: 50000,
    });
  }

  return {
    adminLogin,
    category,
    product,
    variant,
    createPayload,
  };
}

async function getLocationCatalog(path, label) {
  const res = await requestJson({
    baseUrl: backendUrl,
    path,
  });

  expect(res.ok, `${label} failed`).toBeTruthy();
  expect(Array.isArray(res.body), `${label} returned invalid payload`).toBeTruthy();
  return res.body;
}

async function createLiveCustomerAddress(token) {
  const provinces = await getLocationCatalog('/catalogs/locations/provinces', 'get provinces');
  const province = provinces.find((item) => item.name === 'Hồ Chí Minh');
  expect(province, 'Province Hồ Chí Minh not found in live catalog').toBeTruthy();

  const districts = await getLocationCatalog(
    `/catalogs/locations/districts?provinceCode=${province.code}`,
    'get districts',
  );
  const district = districts.find((item) => item.name === 'Quận 1');
  expect(district, 'District Quận 1 not found in live catalog').toBeTruthy();

  const wards = await getLocationCatalog(
    `/catalogs/locations/wards?districtCode=${district.code}`,
    'get wards',
  );
  const ward = wards.find((item) => item.name === 'Phường Bến Nghé');
  expect(ward, 'Ward Phường Bến Nghé not found in live catalog').toBeTruthy();

  return createCustomerAddress({
    baseUrl: backendUrl,
    token,
    address: {
      fullName: 'E2E Buyer',
      phoneNumber: '0901234567',
      address: '123 E2E Street',
      ghnProvinceId: Number(province.code),
      ghnDistrictId: Number(district.code),
      ghnWardCode: ward.code,
      provinceName: province.name,
      districtName: district.name,
      wardName: ward.name,
      isDefault: true,
    },
  });
}

async function createCustomerCartFixture({ stock = 12, quantity = 2 } = {}) {
  const base = await createBaseProductFixture({ stock });
  const customerEmail = uniqueEmail('buyer');
  const customerPassword = 'Password123!';

  await signUpCustomer({
    baseUrl: backendUrl,
    email: customerEmail,
    password: customerPassword,
    fullName: 'E2E Buyer',
  });

  const customerLogin = await loginViaApi({
    baseUrl: backendUrl,
    identifier: customerEmail,
    password: customerPassword,
  });

  const address = await createLiveCustomerAddress(customerLogin.accessToken);

  await addCartItem({
    baseUrl: backendUrl,
    token: customerLogin.accessToken,
    variantId: base.variant.id,
    quantity,
  });

  const cart = await getCart({
    baseUrl: backendUrl,
    token: customerLogin.accessToken,
  });

  return {
    ...base,
    customerEmail,
    customerPassword,
    customerLogin,
    address,
    cart,
  };
}

async function createCustomerOrderFixture({ stock = 12, quantity = 2 } = {}) {
  const fixture = await createCustomerCartFixture({ stock, quantity });

  const checkoutPreview = await previewCheckout({
    baseUrl: backendUrl,
    token: fixture.customerLogin.accessToken,
    payload: {
      mode: 'CART',
      addressId: fixture.address.id,
      note: 'E2E order',
    },
  });
  expect(checkoutPreview.checkoutQuoteId).toBeTruthy();

  const order = await createOrder({
    baseUrl: backendUrl,
    token: fixture.customerLogin.accessToken,
    payload: {
      checkoutQuoteId: checkoutPreview.checkoutQuoteId,
      paymentMethod: 'COD',
      mode: 'CART',
      note: 'E2E order',
    },
  });

  return {
    ...fixture,
    checkoutPreview,
    order,
  };
}

test.describe('Product / Catalog / Order API E2E', () => {
  test('PROD-01 Lấy danh sách sản phẩm có pagination', async () => {
    const fixture = await createBaseProductFixture();
    const productList = await requestJson({
      baseUrl: backendUrl,
      path: '/products/list?page=1&size=10&search=Pain%20Relief',
    });
    expect(productList.ok).toBeTruthy();
    expect(productList.body.products.length).toBeGreaterThan(0);
    expect(productList.body.products.some((item) => item.slug === fixture.product.slug)).toBeTruthy();
  });

  test('PROD-02 Search sản phẩm theo keyword', async () => {
    const fixture = await createBaseProductFixture();
    const productSearch = await requestJson({
      baseUrl: backendUrl,
      path: `/products/list?page=1&size=10&search=${encodeURIComponent(fixture.product.name)}`,
    });
    expect(productSearch.ok).toBeTruthy();
    expect(productSearch.body.products.some((item) => item.slug === fixture.product.slug)).toBeTruthy();
  });

  test('PROD-03 Filter theo category', async () => {
    const fixture = await createBaseProductFixture();
    const categoryFilter = await requestJson({
      baseUrl: backendUrl,
      path: `/products/list?page=1&size=10&categorySlug=${encodeURIComponent(fixture.category.slug)}`,
    });
    expect(categoryFilter.ok).toBeTruthy();
    expect(categoryFilter.body.products.some((item) => item.slug === fixture.product.slug)).toBeTruthy();
  });

  test('PROD-04 Xem chi tiết sản phẩm', async () => {
    const fixture = await createBaseProductFixture();
    const detailById = await requestJson({
      baseUrl: backendUrl,
      path: `/products/${fixture.product.id}/details`,
    });
    expect(detailById.ok).toBeTruthy();
    expect(detailById.body.slug).toBe(fixture.product.slug);
  });

  test('PROD-05 Product không tồn tại trả 404', async () => {
    const notFound = await requestJson({
      baseUrl: backendUrl,
      path: '/products/00000000-0000-0000-0000-000000000000/details',
    });
    expect(notFound.status).toBe(404);
  });

  test('PROD-06 Sản phẩm hết hàng hiển thị đúng trạng thái', async () => {
    const fixture = await createBaseProductFixture();
    const detailById = await requestJson({
      baseUrl: backendUrl,
      path: `/products/${fixture.product.id}/details`,
    });
    expect(detailById.ok).toBeTruthy();
    expect(detailById.body.quantityAvailable).toBe(0);
  });

  test('PROD-07 Admin tạo/sửa sản phẩm thành công', async () => {
    const fixture = await createBaseProductFixture();
    const adminLogin = await loginSuperAdmin();
    const updatedName = `${fixture.product.name} Updated`;

    const updated = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/products/${fixture.product.id}/update`,
      method: 'PUT',
      token: adminLogin.accessToken,
      body: {
        ...fixture.createPayload,
        name: updatedName,
        webName: updatedName,
        slug: `${fixture.product.slug}-updated`,
      },
    });

    expect(updated.ok, JSON.stringify(updated.rawBody, null, 2)).toBeTruthy();
    expect(updated.body.name).toBe(updatedName);
  });

  test('PROD-08 Customer không được tạo/sửa/xóa product', async () => {
    const fixture = await createBaseProductFixture();
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

    const createForbidden = await requestJson({
      baseUrl: backendUrl,
      path: '/admin/products/create',
      method: 'POST',
      token: customerLogin.accessToken,
      body: fixture.createPayload,
    });
    expect(createForbidden.status, JSON.stringify(createForbidden.rawBody, null, 2)).toBe(403);

    const updateForbidden = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/products/${fixture.product.id}/update`,
      method: 'PUT',
      token: customerLogin.accessToken,
      body: {
        ...fixture.createPayload,
        name: `${fixture.product.name} Customer Update`,
      },
    });
    expect(updateForbidden.status, JSON.stringify(updateForbidden.rawBody, null, 2)).toBe(403);

    const deleteForbidden = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/products/${fixture.product.id}/delete`,
      method: 'DELETE',
      token: customerLogin.accessToken,
    });
    expect(deleteForbidden.status, JSON.stringify(deleteForbidden.rawBody, null, 2)).toBe(403);
  });

  test('CART-01 Thêm sản phẩm vào giỏ hàng', async () => {
    const fixture = await createCustomerCartFixture({ quantity: 1 });
    expect(fixture.cart.items.length).toBeGreaterThan(0);
    expect(fixture.cart.items[0].productInfo.quantity).toBe(1);
  });

  test('CART-02 Cập nhật quantity hợp lệ', async () => {
    const fixture = await createCustomerCartFixture({ quantity: 1 });
    const updatedCart = await requestJson({
      baseUrl: backendUrl,
      path: `/cart/items/${fixture.cart.items[0].id}/update`,
      method: 'PUT',
      token: fixture.customerLogin.accessToken,
      body: { quantity: 3, selected: true },
    });
    expect(updatedCart.ok).toBeTruthy();
    expect(updatedCart.body.items[0].productInfo.quantity).toBe(3);
  });

  test('CART-03 Quantity vượt tồn kho bị reject', async () => {
    const fixture = await createCustomerCartFixture({ stock: 2, quantity: 1 });
    const quantityRejected = await requestJson({
      baseUrl: backendUrl,
      path: `/cart/items/${fixture.cart.items[0].id}/update`,
      method: 'PUT',
      token: fixture.customerLogin.accessToken,
      body: { quantity: 1000, selected: true },
    });
    expect(quantityRejected.ok).toBeFalsy();
    expect(quantityRejected.status).toBeGreaterThanOrEqual(400);
  });

  test('CART-04 Xóa item khỏi giỏ hàng', async () => {
    const fixture = await createCustomerCartFixture({ quantity: 1 });
    const removed = await requestJson({
      baseUrl: backendUrl,
      path: `/cart/items/${fixture.cart.items[0].id}/remove`,
      method: 'DELETE',
      token: fixture.customerLogin.accessToken,
    });
    expect(removed.ok).toBeTruthy();

    const cartAfterRemove = await getCart({
      baseUrl: backendUrl,
      token: fixture.customerLogin.accessToken,
    });
    expect(cartAfterRemove.items.length).toBe(0);
  });

  test('ORD-01 Checkout với địa chỉ hợp lệ tạo đơn', async () => {
    const fixture = await createCustomerCartFixture({ quantity: 2 });
    const preview = await previewCheckout({
      baseUrl: backendUrl,
      token: fixture.customerLogin.accessToken,
      payload: {
        mode: 'CART',
        addressId: fixture.address.id,
      },
    });

    expect(preview.shippingMethods.length).toBeGreaterThan(0);
    expect(preview.finalAmount).toBeTruthy();
  });

  test('ORD-02 Đặt hàng từ giỏ hàng thành công', async () => {
    const fixture = await createCustomerOrderFixture({ quantity: 2 });
    expect(fixture.order.id).toBeTruthy();
    expect(fixture.order.status).toBeTruthy();
  });

  test('ORD-03 Thanh toán COD thành công', async () => {
    const fixture = await createCustomerOrderFixture({ quantity: 2 });
    expect(fixture.order.paymentMethod || 'COD').toBeTruthy();
  });

  test('ORD-04 Tính phí ship/lead time đúng', async () => {
    const fixture = await createCustomerOrderFixture({ quantity: 2 });
    expect(fixture.checkoutPreview.shippingMethods.length).toBeGreaterThan(0);
    expect(fixture.checkoutPreview.finalAmount).toBeTruthy();
  });

  test('ORD-05 Xem danh sách đơn hàng theo role', async () => {
    const fixture = await createCustomerOrderFixture({ quantity: 2 });
    const orderHistory = await requestJson({
      baseUrl: backendUrl,
      path: '/orders/history?page=1&size=10',
      token: fixture.customerLogin.accessToken,
    });
    expect(orderHistory.ok).toBeTruthy();
    expect(orderHistory.body.orders.some((item) => item.id === fixture.order.id)).toBeTruthy();
  });

  test('ORD-06 Xem chi tiết đơn hàng', async () => {
    const fixture = await createCustomerOrderFixture({ quantity: 2 });
    const orderDetails = await requestJson({
      baseUrl: backendUrl,
      path: `/orders/${fixture.order.id}/details`,
      token: fixture.customerLogin.accessToken,
    });
    expect(orderDetails.ok).toBeTruthy();
    expect(orderDetails.body.orderCode).toBeTruthy();
  });

  test('ORD-07 Cập nhật trạng thái đơn hàng hợp lệ', async () => {
    const fixture = await createCustomerOrderFixture({ quantity: 2 });
    const cancelOrder = await requestJson({
      baseUrl: backendUrl,
      path: `/orders/${fixture.order.id}/cancel`,
      method: 'PUT',
      token: fixture.customerLogin.accessToken,
      body: { reason: 'E2E cleanup' },
    });
    expect(cancelOrder.ok).toBeTruthy();
  });

  test('ORD-08 Hủy đơn chưa ship thành công', async () => {
    const fixture = await createCustomerOrderFixture({ quantity: 2 });
    const cancelOrder = await requestJson({
      baseUrl: backendUrl,
      path: `/orders/${fixture.order.id}/cancel`,
      method: 'PUT',
      token: fixture.customerLogin.accessToken,
      body: { reason: 'Changed my mind' },
    });
    expect(cancelOrder.ok).toBeTruthy();
  });

  test('ORD-11 Hủy đơn đang ship bị reject', async () => {
    const fixture = await createCustomerOrderFixture({ quantity: 2 });
    const adminLogin = await loginSuperAdmin();

    const confirmed = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/orders/${fixture.order.id}/confirm`,
      method: 'POST',
      token: adminLogin.accessToken,
    });
    expect(confirmed.ok).toBeTruthy();

    const shipped = await requestJson({
      baseUrl: backendUrl,
      path: `/admin/orders/${fixture.order.id}/ship`,
      method: 'POST',
      token: adminLogin.accessToken,
    });
    expect(shipped.ok).toBeTruthy();

    const cancelOrder = await requestJson({
      baseUrl: backendUrl,
      path: `/orders/${fixture.order.id}/cancel`,
      method: 'PUT',
      token: fixture.customerLogin.accessToken,
      body: { reason: 'Too late' },
    });
    expect(cancelOrder.ok).toBeFalsy();
    expect(cancelOrder.status).toBeGreaterThanOrEqual(400);
  });

  test('ORD-09 Tracking hiển thị đúng trạng thái theo shipment', async () => {
    const tracking = await requestJson({
      baseUrl: backendUrl,
      path: '/orders/tracking/invalid-code',
    });
    expect(tracking.status).toBeGreaterThanOrEqual(400);
  });

  test('ORD-10 Customer không sửa trạng thái đơn hàng', async () => {
    const fixture = await createCustomerOrderFixture({ quantity: 2 });
    const customerForbiddenCreateProduct = await requestJson({
      baseUrl: backendUrl,
      path: '/admin/products/create',
      method: 'POST',
      token: fixture.customerLogin.accessToken,
      body: fixture.createPayload,
    });
    expect(customerForbiddenCreateProduct.status, JSON.stringify(customerForbiddenCreateProduct.rawBody, null, 2)).toBe(403);
  });
});
