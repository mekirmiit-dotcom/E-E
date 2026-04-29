import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const sub = await req.json()
  const { endpoint, keys, owner } = sub

  await supabase.from("push_subscriptions").upsert({
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    ...(owner ? { owner } : {}),
  }, { onConflict: "endpoint" })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json()
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint)
  return NextResponse.json({ ok: true })
}
