// Test-only HTTP origin: never packaged by Pages. Faults affect real SW fetches.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };

export function staticOrigin(root, port = 4173) {
  root = resolve(root);
  let server, address, cutPath = null;
  const cuts = [];
  return {
    cuts,
    cut(pathname) { cutPath = pathname; cuts.length = 0; },
    clearCut() { cutPath = null; },
    async start() {
      if (server) throw Error('Test origin is already running');
      server = http.createServer(async (request, response) => {
        try {
          const url = new URL(request.url, 'http://127.0.0.1');
          const pathname = decodeURIComponent(url.pathname);
          const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
          if (!file.startsWith(root + sep)) throw Error('Path escapes test root');
          const bytes = await readFile(file);
          response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream',
            'Content-Length': bytes.length, 'Cache-Control': 'no-cache' });
          if (pathname === cutPath && request.method === 'GET') {
            // Send real headers and only half of the declared body, then sever
            // the socket. A 200 status alone must not commit an incomplete pack.
            const sent = Math.floor(bytes.length / 2);
            const record = { pathname, declaredBytes: bytes.length, sentBytes: sent, socketDestroyed: false };
            cuts.push(record);
            response.write(bytes.subarray(0, sent), () => {
              record.socketDestroyed = true;
              response.socket?.destroy();
            });
          } else response.end(request.method === 'HEAD' ? undefined : bytes);
        } catch {
          if (!response.headersSent) response.writeHead(404);
          response.end('Not found');
        }
      });
      await new Promise((accept, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', accept);
      });
      address = `http://127.0.0.1:${server.address().port}`;
      return address;
    },
    async stop() {
      if (!server) return;
      const active = server; server = undefined;
      const closed = new Promise((accept, reject) => active.close(error => error ? reject(error) : accept()));
      active.closeAllConnections();
      await closed;
      await new Promise((accept, reject) => {
        const request = http.get(address, response => {
          response.resume(); reject(Error('Stopped test origin still responds'));
        });
        request.once('error', accept);
      });
    }
  };
}
