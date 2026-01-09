import { defineConfig, devices } from '@playwright/test';

/**
 * Henderson Standards E2E Configuration
 * 
 * This configuration ensures all CR AudioViz AI apps meet:
 * - Mobile-first design (375px viewport)
 * - 44px tap targets
 * - No horizontal scroll
 * - Brand color compliance
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60000,
  
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  
  projects: [
    // Desktop - Standard viewport
    {
      name: 'desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    // Mobile - Henderson Standards requirement
    {
      name: 'mobile',
      use: { 
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],
});
