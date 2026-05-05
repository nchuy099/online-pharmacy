import { sleep } from 'k6';
import { loadJson, login, sampleTraffic } from './lib.js';
import { runProductDetail, runProductDiscovery } from './customer-helpers.js';

export const options = {
  scenarios: {
    capacity: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 50),
      duration: __ENV.DURATION || '5m',
      exec: 'default',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
  },
};

const fixtures = {
  products: loadJson('./data/products.json'),
};

export function setup() {
  return {
    accessToken: login(__ENV.SUPER_ADMIN_EMAIL, __ENV.SUPER_ADMIN_PASSWORD),
  };
}

export default function (data) {
  const token = data?.accessToken || null;
  const action = sampleTraffic([
    { weight: 60, run: () => runProductDiscovery(fixtures, token) },
    { weight: 40, run: () => runProductDetail(fixtures, token) },
  ]);

  action();

  sleep(1);
}
