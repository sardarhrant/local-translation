// POST /api/stt?lang=<bcp47> — body: raw 16 kHz mono PCM16 (LINEAR16)
//   -> { text, confidence }
// Proxies Google Cloud Speech-to-Text.

import { getKey, googlePost, missingKeyResponse, upstreamError } from "@/app/lib/google";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // ~5 min of 16kHz mono PCM16

interface GoogleSttResponse {
  results?: {
    alternatives?: { transcript?: string; confidence?: number }[];
  }[];
}

export async function POST(request: Request) {
  if (!getKey()) return missingKeyResponse();

  const languageCode =
    new URL(request.url).searchParams.get("lang")?.trim() || "en-US";

  const audio = await request.arrayBuffer();
  if (audio.byteLength === 0) {
    return Response.json({ error: "Empty audio" }, { status: 400 });
  }
  if (audio.byteLength > MAX_AUDIO_BYTES) {
    return Response.json({ error: "Audio too long" }, { status: 413 });
  }

  try {
    const data = await googlePost<GoogleSttResponse>(
      "https://speech.googleapis.com/v1/speech:recognize",
      {
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: 16000,
          languageCode,
          enableAutomaticPunctuation: false,
        },
        audio: { content: Buffer.from(audio).toString("base64") },
      },
    );
    const alt = data.results?.[0]?.alternatives?.[0];
    return Response.json({
      text: alt?.transcript?.trim() ?? "",
      confidence: typeof alt?.confidence === "number" ? alt.confidence : null,
    });
  } catch (err) {
    return upstreamError(err);
  }
}
