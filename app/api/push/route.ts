import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { supabase } from "@/lib/supabase"

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_SUBJECT}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const { title, body, task_id } = await req.json()

  const { data: subs } = await supabase.from("push_subscriptions").select("*")
  if (!subs?.length) return NextResponse.json({ ok: true, sent: 0 })

  const payload = JSON.stringify({
    title: title || "İş Takibi",
    body:  body  || "",
    icon:  "/icon-512.png",
    task_id: task_id || null,
  })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        .catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
          }
          throw err
        })
    )
  )

  const sent = results.filter((r) => r.status === "fulfilled").length
  return NextResponse.json({ ok: true, sent })
}
