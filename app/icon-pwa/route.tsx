import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const size = parseInt(searchParams.get("size") || "512")

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* E facing right */}
        <div style={{
          position: "absolute",
          left: size * 0.14,
          color: "white",
          fontWeight: 900,
          fontSize: size * 0.52,
          fontFamily: "Arial Black, sans-serif",
          opacity: 1,
          lineHeight: 1,
        }}>E</div>
        {/* E facing left (mirrored) */}
        <div style={{
          position: "absolute",
          right: size * 0.14,
          color: "rgba(255,255,255,0.55)",
          fontWeight: 900,
          fontSize: size * 0.52,
          fontFamily: "Arial Black, sans-serif",
          transform: "scaleX(-1)",
          lineHeight: 1,
        }}>E</div>
      </div>
    ),
    { width: size, height: size }
  )
}
