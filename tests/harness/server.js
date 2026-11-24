// Tiny static file server for the game. Counts every byte it sends so tests
// can measure download sizes. Supports Range requests so audio can stream.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function startServer({ port = 0, quiet = true, host = '127.0.0.1' } = {}) {
  const log = []; // { url, bytes, status }
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let rel = urlPath === '/' ? '/index.html' : urlPath;
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        log.push({ url: rel, bytes: 0, status: 404 });
        res.writeHead(404); res.end('not found'); return;
      }
      const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
      const headers = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (range) {
        const start = range[1] ? parseInt(range[1], 10) : 0;
        const end = range[2] ? Math.min(parseInt(range[2], 10), st.size - 1) : st.size - 1;
        headers['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
        headers['Content-Length'] = end - start + 1;
        res.writeHead(206, headers);
        const entry = { url: rel, bytes: 0, status: 206 };
        log.push(entry);
        fs.createReadStream(file, { start, end }).on('data', (c) => { entry.bytes += c.length; }).pipe(res);
      } else {
        headers['Content-Length'] = st.size;
        res.writeHead(200, headers);
        const entry = { url: rel, bytes: 0, status: 200 };
        log.push(entry);
        fs.createReadStream(file).on('data', (c) => { entry.bytes += c.length; }).pipe(res);
      }
      if (!quiet) console.log(req.method, rel);
    });
  });
  return new Promise((resolve) => {
    server.listen(port, host, () => {
      const actual = server.address().port;
      resolve({
        server, log, root: ROOT, port: actual, url: `http://127.0.0.1:${actual}`,
        totalBytes: () => log.reduce((s, e) => s + e.bytes, 0),
        mark: () => log.length,
        bytesSince: (mark) => log.slice(mark).reduce((s, e) => s + e.bytes, 0),
        urlsSince: (mark) => log.slice(mark).map((e) => e.url),
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

module.exports = { startServer, ROOT };
