// Opens the game in headless Chromium against the local test server.
const { chromium } = require('playwright');
const { startServer } = require('./server');

const LAUNCH_ARGS = [
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  '--enable-webgl', '--autoplay-policy=no-user-gesture-required', '--mute-audio',
];

// A virtual Xbox controller. The game reads navigator.getGamepads() exactly as
// it would for a real pad; tests set buttons and sticks through window.__pads.
function installVirtualGamepads() {
  const make = (index) => ({
    id: 'Xbox Wireless Controller (virtual test pad)', index, connected: false,
    mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
  });
  const pads = [make(0), make(1)];
  window.__pads = {
    pads,
    connect(i) { pads[i].connected = true; },
    disconnect(i) { pads[i].connected = false; },
    stick(i, x, y) { pads[i].connected = true; pads[i].axes[0] = x; pads[i].axes[1] = y; pads[i].timestamp++; },
    button(i, b, down) {
      pads[i].connected = true;
      pads[i].buttons[b] = { pressed: !!down, touched: !!down, value: down ? 1 : 0 };
      pads[i].timestamp++;
    },
    release(i) {
      pads[i].axes = [0, 0, 0, 0];
      pads[i].buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    },
  };
  Object.defineProperty(navigator, 'getGamepads', {
    configurable: true,
    value: () => pads.map((p) => (p.connected ? p : null)),
  });
}

async function openGame({ query = '', viewport = { width: 1280, height: 720 }, server = null, storage = null } = {}) {
  const ownServer = !server;
  if (!server) server = await startServer();
  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => {
    const f = req.failure();
    // A cancelled media stream is normal when a music track is swapped.
    if (f && /ERR_ABORTED/.test(f.errorText)) return;
    errors.push(`requestfailed: ${req.url()} ${f ? f.errorText : ''}`);
  });
  await page.addInitScript(installVirtualGamepads);
  if (storage) {
    await page.addInitScript((entries) => {
      for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v);
    }, storage);
  }
  await page.goto(`${server.url}/${query ? '?' + query : ''}`);
  return {
    page, server, errors, browser, context,
    async close() { await browser.close(); if (ownServer) await server.close(); },
  };
}

module.exports = { openGame, installVirtualGamepads, LAUNCH_ARGS };
