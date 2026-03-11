import { check, sleep } from 'k6';
import { loadJson, sampleTraffic } from './lib.js';
import {
  runCartFlow,
  getCustomerSession,
  runOrderHistoryFlow,
  runProductDetail,
  runProductDiscovery,
} from './customer-helpers.js';

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
  categories: loadJson('./data/categories.json'),
  customers: loadJson('./data/customers.json'),
  products: loadJson('./data/products.json'),
  variants: loadJson('./data/variants.json'),
};

export default function () {
  const session = getCustomerSession(fixtures);
  const action = sampleTraffic([
    { weight: 60, run: () => runProductDiscovery(fixtures) },
    { weight: 30, run: () => runProductDetail(fixtures) },
    { weight: 5, run: () => runCartFlow(session.token, fixtures) },
    { weight: 5, run: () => runOrderHistoryFlow(session.token, fixtures) },
  ]);

  const res = action();
  if (res) {
    check(res, {
      'status below 500': (r) => r.status < 500,
    });
  }

  sleep(1);
}
