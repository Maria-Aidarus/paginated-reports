import { test, expect, chromium } from '@playwright/test';

const SERVER_URL = 'http://localhost:3000';

test.describe('Paginated Reports', () => {
  test.beforeAll(async ({}, testInfo) => {
    testInfo.setTimeout(60000); // Set timeout to 60 seconds for the beforeAll hook

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Retry to connect to the server, waiting 5 seconds between attempts, up to 6 times
    for (let i = 0; i < 6; i++) {
      try {
        await page.goto(SERVER_URL, { waitUntil: 'networkidle' });
        console.log("Server is accessible.");
        await browser.close();
        return; // Exit once server is confirmed accessible
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.warn(`Server not accessible, retrying (${i + 1}/6)...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
      }
    }

    await browser.close();
    throw new Error('Server was not accessible after multiple attempts');
  });

  test('Date filtering works (UI and URL parameters)', async ({ page }) => {
    await page.goto(SERVER_URL, { waitUntil: 'networkidle' });

    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`Console error: ${msg.text()}`);
    });

    await page.waitForSelector('body', { timeout: 30000 });
    await page.screenshot({ path: 'debug_before_date_filter_1.png' });
    console.log(await page.content()); // Log the HTML content for debugging

    const dateFilter = page.locator('select#date-filter');
    await dateFilter.waitFor({ state: 'attached', timeout: 20000 });
    expect(await dateFilter.isVisible()).toBe(true);
    await dateFilter.selectOption('2023-01-01');
    await page.waitForURL(/date=2023-01-01/);
    expect(page.url()).toContain('date=2023-01-01');
  });

  test('Device filtering functionality works', async ({ page }) => {
    await page.goto(SERVER_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('#main-container', { state: 'visible', timeout: 30000 });
    await page.screenshot({ path: 'debug_before_device_filter.png' });

    const deviceFilter = page.locator('select#device-filter');
    await deviceFilter.waitFor({ state: 'visible', timeout: 20000 });
    expect(await deviceFilter.isVisible()).toBe(true);

    await deviceFilter.selectOption('mobile');
    const filteredData = page.locator('.device-row.mobile');
    const dataCount = await filteredData.count();
    console.log(`Device rows found: ${dataCount}`);
    expect(dataCount).toBeGreaterThan(0);
  });

  test('Chart and table data rendering', async ({ page }) => {
    await page.goto(SERVER_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('#main-container', { state: 'visible', timeout: 30000 });
    await page.screenshot({ path: 'debug_before_chart_render.png' });

    const chart = page.locator('#chart');
    await chart.waitFor({ state: 'visible', timeout: 20000 });
    expect(await chart.isVisible()).toBe(true);

    const tableRows = page.locator('.table-row');
    const rowCount = await tableRows.count();
    console.log(`Table rows found: ${rowCount}`);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('PDF download feature', async ({ page }) => {
    await page.goto(SERVER_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('#main-container', { state: 'visible', timeout: 30000 });
    await page.screenshot({ path: 'debug_before_pdf_download.png' });

    const downloadButton = page.locator('button#download-pdf');
    await downloadButton.waitFor({ state: 'visible', timeout: 20000 });
    expect(await downloadButton.isVisible()).toBe(true);

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      downloadButton.click()
    ]);

    const path = await download.path();
    console.log(`Downloaded PDF path: ${path}`);
    expect(path).not.toBeNull();
  });
});
