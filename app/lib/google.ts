// Shared helper for the Google Cloud proxy route handlers. Keeps the API
// key server-side and centralizes error handling for the REST calls.

const KEY = () => process.env.GOOGLE_API_KEY?.trim();

export function missingKeyResponse(): Response {
  return Response.json({ error: "GOOGLE_API_KEY is not set" }, { status: 500 });
}

export function getKey(): string | null {
  return KEY() || null;
}

/** POSTs JSON to a Google API endpoint (key appended) and returns parsed JSON,
 * throwing a readable error on non-2xx. */
export async function googlePost<T>(
  endpoint: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${endpoint}?key=${KEY()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `Google API error (${res.status})`);
  }
  return data;
}

export function upstreamError(err: unknown): Response {
  return Response.json(
    { error: err instanceof Error ? err.message : "Upstream request failed" },
    { status: 502 },
  );
}
