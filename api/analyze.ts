import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  ContextPayloadSchema,
  RecordPayloadSchema,
  StructureDecisionInputSchema,
} from '../shared/schemas.js';
import {
  GeminiOperationError,
  runAnalyzeChallenge,
  runComposeDecisionRecord,
  runGenerateLenses,
  runGenerateRehearsal,
  runStructureDecision,
} from './_lib/gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const operation = body?.operation;

    if (operation === 'structureDecision') {
      const parsed = StructureDecisionInputSchema.safeParse(body?.payload);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request payload', details: parsed.error.flatten() });
        return;
      }
      const result = await runStructureDecision(parsed.data);
      res.status(200).json({
        operation,
        model: result.model,
        meta: result.meta,
        data: result.data,
      });
      return;
    }

    if (operation === 'analyzeChallenge') {
      const parsed = ContextPayloadSchema.safeParse(body?.payload);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request payload', details: parsed.error.flatten() });
        return;
      }
      const result = await runAnalyzeChallenge(parsed.data.rawDescription, parsed.data.context);
      res.status(200).json({
        operation,
        model: result.model,
        meta: result.meta,
        data: result.data,
      });
      return;
    }

    if (operation === 'generateLenses') {
      const parsed = ContextPayloadSchema.safeParse(body?.payload);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request payload', details: parsed.error.flatten() });
        return;
      }
      const result = await runGenerateLenses(parsed.data.rawDescription, parsed.data.context);
      res.status(200).json({
        operation,
        model: result.model,
        meta: result.meta,
        data: result.data,
      });
      return;
    }

    if (operation === 'generateRehearsal') {
      const parsed = ContextPayloadSchema.safeParse(body?.payload);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request payload', details: parsed.error.flatten() });
        return;
      }
      const result = await runGenerateRehearsal(parsed.data.rawDescription, parsed.data.context);
      res.status(200).json({
        operation,
        model: result.model,
        meta: result.meta,
        data: result.data,
      });
      return;
    }

    if (operation === 'composeDecisionRecord') {
      const parsed = RecordPayloadSchema.safeParse(body?.payload);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request payload', details: parsed.error.flatten() });
        return;
      }
      const result = await runComposeDecisionRecord(parsed.data);
      res.status(200).json({
        operation,
        model: result.model,
        meta: result.meta,
        data: result.data,
      });
      return;
    }

    res.status(400).json({ error: `Unsupported operation: ${String(operation)}` });
  } catch (err) {
    if (err instanceof GeminiOperationError) {
      const userMessage =
        err.category === 'QUOTA_EXHAUSTED_DAILY'
          ? `Daily Gemini API quota exhausted for this key/model (${err.quotaId || 'FreeTier'}).`
          : err.category === 'RATE_LIMITED_TRANSIENT'
            ? 'Gemini API rate limit reached. Please wait briefly and retry.'
            : 'Analysis is temporarily unavailable. Please try again.';
      res.status(err.statusCode).json({
        error: userMessage,
        code: err.category,
        details: err.message,
        retryDelaySeconds: err.retryDelaySeconds,
        quotaId: err.quotaId,
        quotaMetric: err.quotaMetric,
        meta: err.diagnostics,
      });
      return;
    }

    const rawMessage = err instanceof Error ? err.message : 'Unexpected server error';
    const isMissingKey = rawMessage.includes('GEMINI_API_KEY');
    res.status(isMissingKey ? 503 : 500).json({
      error: isMissingKey
        ? 'Server is missing GEMINI_API_KEY configuration.'
        : 'Analysis is temporarily unavailable. Please try again.',
      details: isMissingKey ? undefined : rawMessage,
      code: isMissingKey ? 'MISSING_API_KEY' : 'GENERATION_FAILED',
    });
  }
}
