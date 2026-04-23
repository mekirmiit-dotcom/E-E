import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        width: 32, height: 32, borderRadius: 7,
        background: "linear-gradient(135deg,#6366f1,#4338ca)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <span style={{ position:"absolute", left:2, color:"white", fontWeight:900, fontSize:18, fontFamily:"Arial Black,sans-serif", lineHeight:1 }}>E</span>
        <span style={{ position:"absolute", right:2, color:"rgba(255,255,255,0.5)", fontWeight:900, fontSize:18, fontFamily:"Arial Black,sans-serif", lineHeight:1, transform:"scaleX(-1)" }}>E</span>
      </div>
    ),
    { ...size }
  )
}
