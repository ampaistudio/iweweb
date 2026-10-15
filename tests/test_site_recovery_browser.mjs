import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(process.env.IWE_TEST_RUNTIME_PACKAGE || import.meta.url);
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const base = process.env.IWE_TEST_WEB_URL || 'http://127.0.0.1:5173';
let failContent = true;
let forceRenderError = false;
let starts = [];

await page.route('**/api/**', async (route) => {
  const path = new URL(route.request().url()).pathname;
  if (!path.startsWith('/api/')) return route.continue();
  starts.push({ path, at: Date.now() });
  if (path === '/api/content' && failContent) {
    return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'test' }) });
  }
  if (path === '/api/activity-types') await new Promise((resolve) => setTimeout(resolve, 900));
  const data = path === '/api/content' ? { content: {} }
    : path === '/api/menu' && forceRenderError ? [{ id: 1, label: 'Broken', target_value: null, children: [] }]
    : [];
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
});

try {
  await page.goto(base + '/');
  await page.getByRole('alert').getByRole('button', { name: 'Reintentar' }).waitFor();
  const sources = ['/api/activity-types', '/api/activities', '/api/content', '/api/hero-slides', '/api/menu'];
  const first = sources.map((path) => starts.find((item) => item.path === path));
  assert.ok(first.every(Boolean), 'Initial data sources were not all requested');
  assert.ok(Math.max(...first.map((item) => item.at)) - Math.min(...first.map((item) => item.at)) < 700,
    'Data sources were fetched sequentially');

  failContent = false;
  starts = [];
  await page.getByRole('alert').getByRole('button', { name: 'Reintentar' }).click();
  await page.getByRole('alert').waitFor({ state: 'hidden' });
  assert.equal(starts.filter(({ path }) => path === '/api/content').length, 1);
  console.log('PASS parallel data loading, visible failure, successful retry');

  await page.goto(base + '/ruta-inexistente');
  await page.getByRole('heading', { name: 'Página no encontrada' }).waitFor();
  await page.getByRole('link', { name: 'Volver al inicio' }).waitFor();
  console.log('PASS unknown URL shows usable 404');

  forceRenderError = true;
  await page.goto(base + '/');
  await page.getByRole('heading', { name: 'Ocurrió un error al mostrar la página.' }).waitFor();
  await page.getByRole('button', { name: 'Reintentar' }).waitFor();
  console.log('PASS render error shows recovery screen');
} catch (error) {
  console.error('Browser state:', { starts, url: page.url(), text: (await page.locator('body').innerText()).slice(0, 500) });
  throw error;
} finally {
  await browser.close();
}
