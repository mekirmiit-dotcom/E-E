import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_SUBJECT}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  const { title, body, task_id, recipient } = await req.json()

  // recipient: "emin" | "emre" | "both" — sadece ilgili cihazlara gönder
  let query = supabase.from("push_subscriptions").select("*")
  if (recipient && recipient !== "both") {
    query = query.or(`owner.eq.${recipient},owner.is.null`)
  }
  const { data: subs } = await query
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
