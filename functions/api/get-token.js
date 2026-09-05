// functions/api/get-token.js
//
// Cloudflare Pages Function. Runs server-side, so your Azure key stays hidden.
// Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in:
// Cloudflare Dashboard → Pages project → Settings → Environment variables

// Azure issues tokens valid for 10 minutes; refresh a bit early so we never
// hand out one that's about to lapse mid-request.
const TOKEN_LIFETIME_MS = 10 * 60 * 1000;
const EXPIRY_SKEW_MS = 60 * 1000;

// Reused across warm invocations of the same Worker isolate. Purely an
// optimization — if the isolate is recycled this just goes back to null and
// we fetch a fresh token, so correctness never depends on it. Keeping it
// keyed by region also handles the (unlikely) case of it changing.
let cachedToken = null;

export async function onRequestGet(context) {
    const { env } = context;

    const key = env.AZURE_SPEECH_KEY?.trim();
    const region = env.AZURE_SPEECH_REGION?.trim();

    if (!key || !region) {
        return new Response(
            JSON.stringify({ error: "Missing Azure credentials in environment" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    if (
        cachedToken &&
        cachedToken.region === region &&
        cachedToken.expiresAt > Date.now()
    ) {
        return new Response(
            JSON.stringify({ token: cachedToken.token, region }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    // The token itself is the credential; never let a shared
                    // cache (browser, CDN) hold onto it.
                    "Cache-Control": "no-store",
                },
            }
        );
    }

    try {
        const tokenResponse = await fetch(
            `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
            {
                method: "POST",
                headers: {
                    "Ocp-Apim-Subscription-Key": key,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        if (!tokenResponse.ok) {
            throw new Error(`Azure token request failed: ${tokenResponse.status}`);
        }

        const token = await tokenResponse.text();
        cachedToken = {
            token,
            region,
            expiresAt: Date.now() + TOKEN_LIFETIME_MS - EXPIRY_SKEW_MS,
        };

        return new Response(JSON.stringify({ token, region }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                // The token itself is the credential; never let a shared
                // cache (browser, CDN) hold onto it.
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        return new Response(
            JSON.stringify({ error: "Failed to fetch token", details: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
