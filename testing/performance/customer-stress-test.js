import { check, sleep } from 'k6';
import { loadJson, sampleTraffic } from './lib.js';
import {
  runCartFlow,
  runCheckoutFlow,
  getCustomerSession,
  runOrderHistoryFlow,
  runProductDetail,
  runProductDiscovery,
} from './customer-helpers.js';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '2m', target: 300 },
        { duration: '2m', target: 600 },
        { duration: '2m', target: 1000 },
        { duration: '2m', target: 1500 },
        { duration: '2m', target: 100 },
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
    { weight: 50, run: () => runProductDiscovery(fixtures) },
    { weight: 25, run: () => runProductDetail(fixtures) },
    { weight: 15, run: () => runCartFlow(session.token, fixtures) },
    { weight: 5, run: () => runCheckoutFlow(session.token, fixtures, session.customer) },
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
