const assert = require('node:assert/strict');

const APP = process.env.LENS_APP_URL || 'http://127.0.0.1:57123';
const SESSION = process.env.LENS_SESSION_ID || '';
const WIDTHS = [320, 480, 880];

const skip = (message) => {
  console.log(`visual-smoke: skipped — ${message}`);
  process.exit(0);
};

let chromium;
try {
  ({ chromium } = require('@playwright/test'));
} catch {
  skip('@playwright/test is not installed (run bun add -d @playwright/test)');
}

const sessionId = async () => {
  if (SESSION) return SESSION;
  try {
    const response = await fetch(`${APP}/api/session?limit=1`);
    if (!response.ok) return '';
    const body = await response.json();
    return body?.data?.[0]?.id ?? '';
  } catch {
    return '';
  }
};

const findPanel = (page) => page.frames().find((frame) => frame.url().includes('/api/guests/lens/panel/'));
const findStatus = (page) => page.frames().find((frame) => frame.url().includes('/api/guests/lens/status/'));

const openLens = async (page, id) => {
  await page.goto(`${APP}/?session=${encodeURIComponent(id)}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.waitForTimeout(3_500);
  if (!findPanel(page)) {
    await page.click('button[aria-label="Lens"]');
    await page.waitForTimeout(2_500);
  }
  const panel = findPanel(page);
  assert.ok(panel, 'Lens panel frame did not open');
  await panel.locator('.lens-tab').first().click().catch(() => undefined);
  await panel.locator('.stat-card').first().waitFor({ timeout: 12_000 }).catch(() => undefined);
  return panel;
};

const checkPanel = async (panel, width) => {
  const frame = await panel.frameElement();
  await frame.evaluate((element, size) => {
    element.style.width = `${size}px`;
    element.style.minWidth = `${size}px`;
    element.style.maxWidth = `${size}px`;
  }, width);
  await new Promise((resolve) => setTimeout(resolve, 400));

  const metrics = await panel.evaluate(() => {
    const root = document.querySelector('#root');
    const grid = document.querySelector('.lens-grid');
    return {
      tabs: document.querySelectorAll('.lens-tab').length,
      cards: document.querySelectorAll('.stat-card').length,
      contextBar: document.querySelectorAll('.context-fill').length,
      columns: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0,
      overflow: (root?.scrollWidth ?? 0) > (root?.clientWidth ?? 0),
      docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });

  assert.equal(metrics.tabs, 4, `expected 4 tabs at ${width}px`);
  assert.ok(metrics.cards >= 6, `expected at least 6 stat cards at ${width}px`);
  assert.equal(metrics.contextBar, 1, `expected a context bar at ${width}px`);
  assert.equal(metrics.overflow, false, `root overflows at ${width}px`);
  assert.equal(metrics.docOverflow, false, `document overflows at ${width}px`);
  assert.ok(metrics.columns >= 1 && metrics.columns <= 3, `unexpected grid columns at ${width}px`);
  return metrics;
};

(async () => {
  const id = await sessionId();
  if (!id) skip(`no OpenChamber session found at ${APP}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const light = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
    const panel = await openLens(light, id);
    await panel.locator('.lens-tab').first().click();
    await light.waitForTimeout(600);

    for (const width of WIDTHS) {
      const metrics = await checkPanel(panel, width);
      console.log(`light ${width}px: ${metrics.columns} columns, ${metrics.cards} cards`);
      await panel.locator('body').screenshot({ path: `/tmp/opencode/lens-smoke-${width}.png` });
    }

    const dark = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    const darkPanel = await openLens(dark, id);
    const darkMetrics = await checkPanel(darkPanel, 480);
    console.log(`dark 480px: ${darkMetrics.columns} columns, ${darkMetrics.cards} cards`);
    await darkPanel.locator('body').screenshot({ path: '/tmp/opencode/lens-smoke-dark.png' });

    const status = await (async () => {
      let frame = findStatus(dark);
      if (!frame) {
        const toggle = dark.locator('button[aria-label="Toggle work-status panel"]');
        if (await toggle.count()) {
          await toggle.first().click();
          await dark.waitForTimeout(3_000);
          frame = findStatus(dark);
        }
      }
      return frame;
    })();
    if (status) {
      const text = await status.locator('body').innerText();
      assert.ok(/CONTEXTO/i.test(text), 'status strip has no context');
      assert.ok(/CUSTO/i.test(text), 'status strip has no cost');
      const fits = await status.evaluate(() => {
        const root = document.querySelector('#root');
        return (root?.scrollHeight ?? 0) <= (root?.clientHeight ?? 0);
      });
      assert.equal(fits, true, 'status strip does not fit 76px');
      console.log('status strip: ok');
    } else {
      console.log('status strip: not open (skipped)');
    }

    console.log('visual-smoke: ok');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error('visual-smoke: failed');
  console.error(error);
  process.exit(1);
});
