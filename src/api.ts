export async function callAnalyze<T>(
  operation: string,
  payload: unknown,
): Promise<{ data: T; model: string }> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, payload }),
  });

  const json = await res.json();
  if (!res.ok) {
    const detail = json?.details ? ` (${json.details})` : '';
    throw new Error(`${json?.error || 'Request failed'}${detail}`);
  }

  return { data: json.data as T, model: json.model as string };
}

export async function fetchDecisionStartsCount(): Promise<number | null> {
  try {
    const res = await fetch('/api/decision-starts', { method: 'GET' });
    if (!res.ok) return null;
    const json = (await res.json()) as { available?: boolean; count?: unknown };
    if (json?.available && typeof json.count === 'number' && Number.isFinite(json.count)) {
      return json.count;
    }
    return null;
  } catch {
    return null;
  }
}

export async function recordDecisionStart(startId: string): Promise<number | null> {
  try {
    const res = await fetch('/api/decision-starts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startId }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { available?: boolean; count?: unknown };
    if (json?.available && typeof json.count === 'number' && Number.isFinite(json.count)) {
      return json.count;
    }
    return null;
  } catch {
    return null;
  }
}
