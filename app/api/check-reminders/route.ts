import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import webpush from "web-push"

async function sendPushToAll(title: string, body: string, taskId?: string) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_SUBJECT}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  const { data: subs } = await supabase.from("push_subscriptions").select("*")
  if (!subs?.length) return

  const payload = JSON.stringify({
    title,
    body,
    icon: "/icon-512.png",
    task_id: taskId ?? null,
  })

  await Promise.allSettled(
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
        })
    )
  )
}

// Son 10 dakika içinde aynı görev + offset için bildirim gitti mi?
async function alreadySent(taskId: string, offsetMin: number): Promise<boolean> {
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const keyword = `[rem:${offsetMin}]`
  const { data } = await supabase
    .from("notifications")
    .select("id")
    .eq("task_id", taskId)
    .ilike("message", `%${keyword}%`)
    .gte("created_at", since)
    .limit(1)
  return (data?.length ?? 0) > 0
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 })
    }
  }

  const now = Date.now()
  const WINDOW_MS = 2.5 * 60 * 1000 // ±2.5 dk — cron 5 dk'da bir çalışır

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, due_time, owner, reminder_offsets")
    .not("due_date", "is", null)
    .not("due_time", "is", null)
    .not("reminder_offsets", "is", null)
    .neq("status", "done")

  if (!tasks?.length) return NextResponse.json({ ok: true, checked: 0, sent: 0 })

  const ownerLabel: Record<string, string> = {
    emin: "Emin", emre: "Emre", tuna: "Tuna", shared: "Ortak",
  }

  let sent = 0

  for (const task of tasks) {
    const offsets: number[] = task.reminder_offsets ?? []
    if (!offsets.length) continue

    const deadline = new Date(`${task.due_date}T${task.due_time}:00`).getTime()

    for (const offsetMin of offsets) {
      const triggerAt = deadline - offsetMin * 60 * 1000

      // Bu cron penceresi içinde mi?
      if (Math.abs(now - triggerAt) > WINDOW_MS) continue

      // Aynı bildirimi tekrar gönderme
      if (await alreadySent(task.id, offsetMin)) continue

      // Mesaj formatla
      const label =
        offsetMin >= 60
          ? `${offsetMin / 60} saat`
          : `${offsetMin} dakika`

      const marker = `[rem:${offsetMin}]` // dedup için gizli işaret
      const ownerName = ownerLabel[task.owner] ?? task.owner
      const msg = `🔔 "${task.title}" görevine ${label} kaldı! ${marker}`
      const pushTitle = `⏰ ${label} kaldı — ${ownerName}`

      const recipient =
        task.owner === "shared" ? "both"
        : task.owner as "emin" | "emre" | "tuna"

      await supabase.from("notifications").insert({
        task_id: task.id,
        message: msg,
        type: "reminder",
        read: false,
        recipient,
      })

      await sendPushToAll(pushTitle, `"${task.title}" görevine ${label} kaldı!`, task.id)
      sent++
    }
  }

  return NextResponse.json({ ok: true, checked: tasks.length, sent })
}
