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
