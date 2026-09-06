// Free translation via the MyMemory API — no key, no billing, and it sends
// CORS headers so we can call it straight from the browser (keeps the app
// fully static). Anonymous usage is rate-limited (~5k words/day per IP),
// which is ample for adding vocabulary a word at a time.

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number | string;
  responseDetails?: string;
}

export async function translate(
  text: string,
  source: string,
  target: string,
): Promise<string> {
  const query = text.trim();
  if (!query) return "";

  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", query);
  url.searchParams.set("langpair", `${source}|${target}`);

  const res = await fetch(url);
  const data = (await res.json().catch(() => ({}))) as MyMemoryResponse;

  const status = Number(data.responseStatus);
  if (!res.ok || status !== 200) {
    throw new Error(
      data.responseDetails || `Translation failed (${status || res.status})`,
    );
  }
  return data.responseData?.translatedText ?? "";
}
