import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { resolve } from 'path';

const PORT = 5201;
const BASE = `http://localhost:${PORT}`;
const TIMEOUT = 60000;

let server;
let browser;
let page;

function waitForServer(url, retries = 30) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      fetch(url).then(() => resolve()).catch(() => {
        if (n <= 0) reject(new Error('Server did not start'));
        else setTimeout(() => attempt(n - 1), 500);
      });
    };
    attempt(retries);
  });
}

beforeAll(async () => {
  server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    cwd: resolve(import.meta.dirname, '..'),
    stdio: 'pipe',
  });
  server.stderr.on('data', () => {});

  await waitForServer(BASE);

  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
}, 30000);

afterAll(async () => {
  if (page) await page.close();
  if (browser) await browser.close();
  if (server) server.kill();
}, 10000);

describe('E2E: Comparison view', () => {
  it('opens comparison view with selectable bodies on a sidebar', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForSelector('#loadingScreen', { state: 'hidden', timeout: TIMEOUT });

    const compareButton = page.locator('#compareButton');
    await compareButton.waitFor({ state: 'visible', timeout: 5000 });
    await compareButton.click();

    const compareView = page.locator('#compareView');
    await compareView.waitFor({ state: 'visible', timeout: 5000 });
    expect(await compareView.isVisible()).toBe(true);

    const sidebar = page.locator('#compareSidebar');
    expect(await sidebar.isVisible()).toBe(true);

    const compareItems = page.locator('.compare-item');
    const count = await compareItems.count();
    expect(count).toBeGreaterThanOrEqual(29);

    const moonItem = compareItems.filter({ hasText: 'Moon' }).first();
    const offBefore = await moonItem.evaluate((el) => el.classList.contains('off'));
    await moonItem.click();
    const offAfter = await moonItem.evaluate((el) => el.classList.contains('off'));
    expect(offBefore).toBe(true);
    expect(offAfter).toBe(false);

    await compareItems.filter({ hasText: 'Mercury' }).first().click();
    const mercuryOff = await compareItems.filter({ hasText: 'Mercury' }).first().evaluate((el) => el.classList.contains('off'));
    expect(mercuryOff).toBe(true);

    await page.locator('#compareBackButton').click();
    await compareView.waitFor({ state: 'hidden', timeout: 5000 });
    expect(await compareView.isVisible()).toBe(false);
  }, TIMEOUT + 10000);
});