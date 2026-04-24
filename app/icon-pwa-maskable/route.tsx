import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const size = parseInt(searchParams.get("size") || "512")
  const pad = size * 0.15

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute",
          left: pad,
          color: "white",
          fontWeight: 900,
          fontSize: size * 0.42,
          fontFamily: "Arial Black, sans-serif",
          lineHeight: 1,
        }}>E</div>
        <div style={{
          position: "absolute",
          right: pad,
          color: "rgba(255,255,255,0.55)",
          fontWeight: 900,
          fontSize: size * 0.42,
          fontFamily: "Arial Black, sans-serif",
          transform: "scaleX(-1)",
          lineHeight: 1,
        }}>E</div>
      </div>
    ),
    { width: size, height: size }
  )
}
