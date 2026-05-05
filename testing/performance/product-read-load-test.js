import { sleep } from 'k6';
import { loadJson, login, sampleTraffic } from './lib.js';
import { runProductCategoryList, runProductDetail } from './customer-helpers.js';

export const options = {
  scenarios: {
    load: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 100),
      duration: __ENV.DURATION || '10m',
      exec: 'default',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
  },
};

const productData = loadJson('./data/products.json');
const fixtures = {
  products: Array.isArray(productData) ? productData : productData.products || [],
  categorySlugs: Array.isArray(productData)
    ? Array.from(new Set(productData.map((item) => item?.categorySlug).filter(Boolean)))
    : productData.categorySlugs || [],
};

export function setup() {
  return {
    accessToken: login(__ENV.SUPER_ADMIN_EMAIL, __ENV.SUPER_ADMIN_PASSWORD),
  };
}

export default function (data) {
  const token = data?.accessToken || null;
  const action = sampleTraffic([
    { weight: 80, run: () => runProductCategoryList(fixtures, token) },
    { weight: 20, run: () => runProductDetail(fixtures, token) },
  ]);

  action();

  sleep(1);
}
