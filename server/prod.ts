import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import analyzeHandler from '../api/analyze.js';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

const distDir = path.resolve(process.cwd(), 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const port = Number(process.env.PORT || 3000);
const host = '0.0.0.0';

async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody) return undefined;
  return JSON.parse(rawBody);
}

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  // 1. Health check (does not invoke Gemini)
  if (urlPath === '/health' && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true, service: 'system-3' }));
    return;
  }

  // 2. API routes handled before static/SPA fallback
  if (urlPath === '/api/analyze') {
    let parsedBody: unknown;
    try {
      parsedBody = await readJsonBody(req);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      return;
    }

    const vercelReq = Object.assign(req, {
      body: parsedBody,
      query: {},
      cookies: {},
    }) as unknown as VercelRequest;

    const vercelRes = Object.assign(res, {
      status(code: number) {
        res.statusCode = code;
        return vercelRes;
      },
      json(data: unknown) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
        return vercelRes;
      },
    }) as unknown as VercelResponse;

    await analyzeHandler(vercelReq, vercelRes);
    return;
  }

  // 3. Static files from dist/ + SPA fallback
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const safeRelPath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(distDir, safeRelPath === '/' ? 'index.html' : safeRelPath);

  if (!filePath.startsWith(distDir)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // SPA fallback for client routes (only if not requesting an asset with an extension)
    if (path.extname(safeRelPath)) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    filePath = indexHtmlPath;
  }

  if (!fs.existsSync(filePath)) {
    res.statusCode = 500;
    res.end('Compiled dist/index.html not found. Run npm run build first.');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, host, () => {
  console.log(`[System 3] production server listening on http://${host}:${port}`);
});
