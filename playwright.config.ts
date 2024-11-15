import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 90000, // 60 seconds timeout for all tests and hooks
  use: {
    headless: true,
  },
});
