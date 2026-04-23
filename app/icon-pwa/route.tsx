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
          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 900,
          fontSize: size * 0.36,
          fontFamily: "sans-serif",
          letterSpacing: "-2px",
        }}
      >
        EE
      </div>
    ),
    { width: size, height: size }
  )
}
