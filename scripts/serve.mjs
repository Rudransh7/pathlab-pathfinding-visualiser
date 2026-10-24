/** Local preview server. Only explicitly listed public assets can be served. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const files = {
  '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'],
  '/styles.css': ['styles.css', 'text/css'], '/ui.js': ['ui.js', 'text/javascript'],
  '/algorithms.js': ['algorithms.js', 'text/javascript'], '/maps.js': ['maps.js', 'text/javascript'],
  '/playback.js': ['playback.js', 'text/javascript'],
};
const port = Number(process.env.PORT || 8001);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new RangeError('PORT must be an integer from 1024 to 65535');
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://127.0.0.1').pathname;
  const asset = Object.hasOwn(files, path) ? files[path] : null;
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
  if (!asset) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const bytes = await readFile(new URL(asset[0], root));
    response.writeHead(200, { 'Content-Type': `${asset[1]}; charset=utf-8`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch { response.writeHead(500); response.end('Could not load asset'); }
});
server.listen(port, '127.0.0.1', () => console.log(`PathLab: http://127.0.0.1:${port}`));
