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

// Base64 helpers that work on both the Node and Workers runtimes (no Buffer).

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buffer;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
