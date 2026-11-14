import fs from 'node:fs';
import path from 'node:path';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

const COUNT_KEY = 'system3:decision_starts_count';
const DEDUPE_PREFIX = 'system3:start:';
const DEDUPE_TTL_SECONDS = 86400;

const PostBodySchema = z.object({
  startId: z
    .string()
    .trim()
    .min(8)
    .max(128)
    .regex(/^[a-zA-Z0-9_-]+$/),
});

function getStoreConfig(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim() ||
    '';
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim() ||
    '';

  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

async function runRedisCommand(
  config: { url: string; token: string },
  args: (string | number)[],
): Promise<unknown> {
  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });

  if (!response.ok) {
    throw new Error(`Store request failed with status ${response.status}`);
  }

  const json = (await response.json()) as { result?: unknown; error?: string };
  if (json.error) {
    throw new Error(json.error);
  }
  return json.result;
}

function parseCount(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(0, Math.floor(raw));
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return Math.max(0, parsed);
  }
  return 0;
}

function getVolumeFilePath(): string | null {
  const dir =
    process.env.DECISION_STARTS_DATA_DIR?.trim() ||
    process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim() ||
    '';
  if (!dir) return null;
  return path.join(path.resolve(dir), 'decision-starts.json');
}

interface VolumeStoreData {
  count: number;
  recentStarts: Record<string, number>;
}

let volumeLock: Promise<unknown> = Promise.resolve();

function withVolumeLock<T>(fn: () => T): Promise<T> {
  const next = volumeLock.then(fn, fn);
  volumeLock = next.catch(() => undefined);
  return next;
}

function readVolumeStore(filePath: string): VolumeStoreData {
  if (!fs.existsSync(filePath)) {
    return { count: 0, recentStarts: {} };
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as Partial<VolumeStoreData>;
  const count = parseCount(parsed.count);
  const recentStarts =
    parsed.recentStarts && typeof parsed.recentStarts === 'object'
      ? parsed.recentStarts
      : {};
  return { count, recentStarts };
}

function writeVolumeStore(filePath: string, data: VolumeStoreData): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  const config = getStoreConfig();
  const volumeFilePath = config ? null : getVolumeFilePath();

  if (req.method === 'GET') {
    if (!config && !volumeFilePath) {
      return res.status(200).json({ available: false, count: null });
    }
    try {
      if (volumeFilePath) {
        const count = await withVolumeLock(() => readVolumeStore(volumeFilePath).count);
        return res.status(200).json({ available: true, count });
      }
      const raw = await runRedisCommand(config!, ['GET', COUNT_KEY]);
      return res.status(200).json({ available: true, count: parseCount(raw) });
    } catch (error) {
      console.error('Failed to read decision starts count:', error);
      return res.status(200).json({ available: false, count: null });
    }
  }

  if (req.method === 'POST') {
    const parsed = PostBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid startId' });
    }

    if (!config && !volumeFilePath) {
      return res.status(200).json({ available: false, count: null, incremented: false });
    }

    try {
      if (volumeFilePath) {
        const result = await withVolumeLock(() => {
          const now = Date.now();
          const cutoff = now - DEDUPE_TTL_SECONDS * 1000;
          const data = readVolumeStore(volumeFilePath);
          const prunedStarts: Record<string, number> = {};
          for (const [id, ts] of Object.entries(data.recentStarts)) {
            if (typeof ts === 'number' && ts >= cutoff) {
              prunedStarts[id] = ts;
            }
          }

          if (prunedStarts[parsed.data.startId] !== undefined) {
            return { available: true, count: data.count, incremented: false };
          }

          prunedStarts[parsed.data.startId] = now;
          const nextCount = data.count + 1;
          writeVolumeStore(volumeFilePath, {
            count: nextCount,
            recentStarts: prunedStarts,
          });
          return { available: true, count: nextCount, incremented: true };
        });
        return res.status(200).json(result);
      }

      const dedupeKey = `${DEDUPE_PREFIX}${parsed.data.startId}`;
      const setResult = await runRedisCommand(config!, [
        'SET',
        dedupeKey,
        '1',
        'EX',
        DEDUPE_TTL_SECONDS,
        'NX',
      ]);

      if (setResult === 'OK') {
        const nextCount = await runRedisCommand(config!, ['INCR', COUNT_KEY]);
        return res.status(200).json({
          available: true,
          count: parseCount(nextCount),
          incremented: true,
        });
      }

      const existing = await runRedisCommand(config!, ['GET', COUNT_KEY]);
      return res.status(200).json({
        available: true,
        count: parseCount(existing),
        incremented: false,
      });
    } catch (error) {
      console.error('Failed to record decision start:', error);
      return res.status(200).json({ available: false, count: null, incremented: false });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
