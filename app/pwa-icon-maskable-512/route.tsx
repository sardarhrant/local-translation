import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#18181b",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 180,
            fontWeight: 700,
            fontFamily: "sans-serif",
            color: "#fafafa",
          }}
        >
          T
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
