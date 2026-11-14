import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import analyzeHandler from '../api/analyze.js';
import decisionStartsHandler from '../api/decision-starts.js';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const port = Number(process.env.API_PORT || 3001);

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  const apiHandler =
    urlPath === '/api/analyze'
      ? analyzeHandler
      : urlPath === '/api/decision-starts'
        ? decisionStartsHandler
        : null;

  if (apiHandler) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    const rawBody = Buffer.concat(chunks).toString('utf8');
    let parsedBody: unknown = undefined;
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        return;
      }
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
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        return vercelRes;
      },
    }) as unknown as VercelResponse;

    await apiHandler(vercelReq, vercelRes);
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, () => {
  console.log(`[System 3 API] listening on http://localhost:${port}`);
});
