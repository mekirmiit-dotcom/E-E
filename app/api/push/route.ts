import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { supabase } from "@/lib/supabase"

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_SUBJECT}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const { title, body, icon } = await req.json()

  const { data: subs } = await supabase.from("push_subscriptions").select("*")
  if (!subs?.length) return NextResponse.json({ ok: true, sent: 0 })

  const payload = JSON.stringify({ title, body, icon: icon || "/icon-pwa?size=192" })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err) => {
        if (err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
        }
        throw err
      })
    )
  )

  const sent = results.filter((r) => r.status === "fulfilled").length
  return NextResponse.json({ ok: true, sent })
}
