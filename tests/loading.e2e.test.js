import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { resolve } from 'path';

const PORT = 5199;
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

describe('E2E: Solar System loads and is operable', () => {
  it('loads completely under 60 seconds', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: TIMEOUT });

    const loadingScreen = page.locator('#loadingScreen');
    await loadingScreen.waitFor({ state: 'visible', timeout: 5000 });
    expect(await loadingScreen.isVisible()).toBe(true);

    const progressBar = page.locator('#progressBar');
    await progressBar.waitFor({ state: 'visible', timeout: 5000 });
    expect(await progressBar.isVisible()).toBe(true);

    const launchBtn = page.locator('#launchBtn');
    await launchBtn.waitFor({ state: 'visible', timeout: TIMEOUT });
    expect(await launchBtn.isVisible()).toBe(true);

    const width = await progressBar.evaluate(el => el.style.width);
    expect(width).toBe('100%');

    expect(await launchBtn.isEnabled()).toBe(true);
    await launchBtn.click();

    await loadingScreen.waitFor({ state: 'hidden', timeout: 5000 });
    expect(await loadingScreen.isVisible()).toBe(false);

    await page.waitForSelector('canvas', { timeout: 5000 });
    const canvas = page.locator('canvas');
    expect(await canvas.isVisible()).toBe(true);

    const pauseBtn = page.locator('#pauseButton');
    await pauseBtn.waitFor({ state: 'visible', timeout: 5000 });
    expect(await pauseBtn.isVisible()).toBe(true);

    await pauseBtn.click();
    const pauseText = await pauseBtn.textContent();
    expect(pauseText.trim()).toBe('▶');
  }, TIMEOUT + 10000);
});
