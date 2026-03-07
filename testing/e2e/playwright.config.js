import { defineConfig, devices } from '@playwright/test';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
const customerUrl = process.env.CUSTOMER_URL || 'http://localhost:5173';
const adminUrl = process.env.ADMIN_URL || 'http://localhost:5174';
const pharmacistUrl = process.env.PHARMACIST_URL || 'http://localhost:5175';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: customerUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.js/,
    },
    {
      name: 'customer-ui',
      testMatch: /customer\.ui\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: customerUrl,
        channel: 'chrome',
      },
    },
    {
      name: 'admin-ui',
      testMatch: /admin\.ui\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: adminUrl,
        channel: 'chrome',
      },
    },
    {
      name: 'pharmacist-ui',
      testMatch: /pharmacist\.ui\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: pharmacistUrl,
        channel: 'chrome',
      },
    },
    {
      name: 'chat-ui',
      testMatch: /chat\.ui\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: customerUrl,
        channel: 'chrome',
      },
    },
  ],
  metadata: {
    backendUrl,
    customerUrl,
    adminUrl,
    pharmacistUrl,
  },
});
