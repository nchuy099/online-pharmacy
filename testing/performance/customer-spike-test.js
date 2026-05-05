import { sleep } from 'k6';
import { loadJson, login, sampleTraffic } from './lib.js';
import { runProductDetail, runProductDiscovery } from './customer-helpers.js';

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '30s', target: 500 },
        { duration: '2m', target: 500 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      exec: 'default',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
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
