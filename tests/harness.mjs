import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

export async function startStaticServer(rootDir = REPO_ROOT) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let relPath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const fullPath = path.resolve(rootDir, relPath);

    if (!fullPath.startsWith(rootDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.stat(fullPath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const total = stats.size;
      const range = req.headers.range;

      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (match) {
          const start = match[1] ? parseInt(match[1], 10) : 0;
          const end = match[2] ? parseInt(match[2], 10) : total - 1;
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
            'Content-Type': contentType,
            'Cache-Control': 'no-cache',
          });
          fs.createReadStream(fullPath, { start, end }).pipe(res);
          return;
        }
      }

      res.writeHead(200, {
        'Content-Length': total,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(fullPath).pipe(res);
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    server,
    port,
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

export async function launchBrowser() {
  return chromium.launch({
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
}

const VIRTUAL_GAMEPAD_SCRIPT = () => {
  window.__virtualGamepads = [null, null, null, null];
  window.__setGamepad = (slot, opts = null) => {
    if (!opts) {
      window.__virtualGamepads[slot] = null;
      return;
    }
    const buttons = Array.from({ length: 17 }, (_, i) => {
      const pressed = !!(opts.buttons && opts.buttons[i]);
      return { pressed, touched: pressed, value: pressed ? 1 : 0 };
    });
    const axes = [
      opts.axes?.[0] ?? 0,
      opts.axes?.[1] ?? 0,
      opts.axes?.[2] ?? 0,
      opts.axes?.[3] ?? 0,
    ];
    window.__virtualGamepads[slot] = {
      id: 'Xbox Wireless Controller (Virtual)',
      index: slot,
      connected: true,
      mapping: 'standard',
      axes,
      buttons,
      timestamp: performance.now(),
    };
  };
  Object.defineProperty(navigator, 'getGamepads', {
    configurable: true,
    value: () => window.__virtualGamepads.slice(),
  });
};

export async function openGame(browser, baseUrl, opts = {}) {
  const { waitForAssets = false, clearStorage = true } = opts;
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  await context.addInitScript(VIRTUAL_GAMEPAD_SCRIPT);
  if (clearStorage) {
    await context.addInitScript(() => {
      try { localStorage.clear(); } catch (_) {}
    });
  }

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(String(err && err.stack ? err.stack : err));
  });
  page.on('response', async (resp) => {
    const url = resp.url();
    const status = resp.status();
    let bytes = 0;
    const cl = resp.headers()['content-length'];
    if (cl) {
      bytes = parseInt(cl, 10) || 0;
    } else {
      try {
        const buf = await resp.body();
        bytes = buf.length;
      } catch (_) {}
    }
    requests.push({ url, status, bytes, local: url.startsWith(baseUrl) });
  });

  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.game && window.game.renderer), { timeout: 30000 });

  if (waitForAssets) {
    await page.waitForFunction(
      () => window.game.assets.loadedCount >= window.game.assets.totalExpected,
      { timeout: 60000 }
    );
  }

  return {
    context,
    page,
    consoleErrors,
    pageErrors,
    requests,
    getErrors() {
      return [...consoleErrors, ...pageErrors];
    },
    getLocalBytes() {
      return requests.filter((r) => r.local).reduce((s, r) => s + r.bytes, 0);
    },
    async close() {
      await context.close();
    },
  };
}

export async function stepGame(page, seconds, dt = 1 / 60, doRender = false) {
  await page.evaluate(({ seconds, dt, doRender }) => {
    window.game.step(seconds, dt, doRender);
  }, { seconds, dt, doRender });
}
