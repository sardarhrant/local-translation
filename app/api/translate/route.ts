// POST /api/translate — { text, source?, target } -> { translation, detectedSource? }
// Proxies Google Cloud Translation API v2 so the API key stays server-side.

import { getKey, googlePost, missingKeyResponse, upstreamError } from "@/app/lib/google";

interface TranslateBody {
  text?: string;
  source?: string;
  target?: string;
}

interface GoogleTranslateResponse {
  data?: {
    translations?: {
      translatedText?: string;
      detectedSourceLanguage?: string;
    }[];
  };
}

export async function POST(request: Request) {
  if (!getKey()) return missingKeyResponse();

  let body: TranslateBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.text?.trim();
  const target = body.target?.trim();
  if (!text || !target) {
    return Response.json(
      { error: "`text` and `target` are required" },
      { status: 400 },
    );
  }

  try {
    const data = await googlePost<GoogleTranslateResponse>(
      "https://translation.googleapis.com/language/translate/v2",
      {
        q: text,
        target,
        format: "text",
        ...(body.source ? { source: body.source } : {}),
      },
    );
    const first = data.data?.translations?.[0];
    return Response.json({
      translation: first?.translatedText ?? "",
      detectedSource: first?.detectedSourceLanguage ?? null,
    });
  } catch (err) {
    return upstreamError(err);
  }
}
