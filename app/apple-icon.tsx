import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{
        width: 180, height: 180, borderRadius: 40,
        background: "linear-gradient(135deg,#6366f1,#4338ca)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <span style={{ position:"absolute", left:16, color:"white", fontWeight:900, fontSize:110, fontFamily:"Arial Black,sans-serif", lineHeight:1 }}>E</span>
        <span style={{ position:"absolute", right:16, color:"rgba(255,255,255,0.5)", fontWeight:900, fontSize:110, fontFamily:"Arial Black,sans-serif", lineHeight:1, transform:"scaleX(-1)" }}>E</span>
      </div>
    ),
    { ...size }
  )
}
