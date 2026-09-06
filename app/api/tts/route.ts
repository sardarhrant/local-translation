// POST /api/tts — { text, languageCode } -> audio/mpeg
// Proxies Google Cloud Text-to-Speech; returns the decoded MP3 bytes.

import {
  base64ToArrayBuffer,
  getKey,
  googlePost,
  missingKeyResponse,
  upstreamError,
} from "@/app/lib/google";

interface TtsBody {
  text?: string;
  languageCode?: string;
}

interface GoogleTtsResponse {
  audioContent?: string;
}

export async function POST(request: Request) {
  if (!getKey()) return missingKeyResponse();

  let body: TtsBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.text?.trim();
  const languageCode = body.languageCode?.trim();
  if (!text || !languageCode) {
    return Response.json(
      { error: "`text` and `languageCode` are required" },
      { status: 400 },
    );
  }

  try {
    const data = await googlePost<GoogleTtsResponse>(
      "https://texttospeech.googleapis.com/v1/text:synthesize",
      {
        input: { text },
        voice: { languageCode },
        audioConfig: { audioEncoding: "MP3" },
      },
    );
    if (!data.audioContent) throw new Error("No audio returned");

    return new Response(base64ToArrayBuffer(data.audioContent), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return upstreamError(err);
  }
}
