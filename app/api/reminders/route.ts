import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import webpush from "web-push"

type Owner = "emin" | "emre" | "tuna" | "shared"

async function sendPush(title: string, body: string, taskId?: string) {
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

async function alreadySent(taskId: string, keyword: string): Promise<boolean> {
  const since = new Date()
  since.setHours(since.getHours() - 20)
  const { data } = await supabase
    .from("notifications")
    .select("id")
    .eq("task_id", taskId)
    .ilike("message", `%${keyword}%`)
    .gte("created_at", since.toISOString())
    .limit(1)
  return (data?.length ?? 0) > 0
}

export async function GET(req: Request) {
  // Vercel cron calls include Authorization: Bearer <CRON_SECRET>
  // Deploy-triggered calls do NOT include this header — reject them
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 })
    }
  }

  const now = new Date()

  // Kullanıcı tercihlerini çek
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("user, reminder_times, notification_hour")

  // Varsayılan tercihler (DB'de kayıt yoksa)
  const defaultPrefs: Record<string, { reminder_times: number[]; notification_hour: number }> = {
    emin:  { reminder_times: [24, 1], notification_hour: 8 },
    emre:  { reminder_times: [24, 1], notification_hour: 8 },
    tuna:  { reminder_times: [24, 1], notification_hour: 8 },
  }

  const userPrefs: Record<string, { reminder_times: number[]; notification_hour: number }> = {
    ...defaultPrefs,
  }
  for (const p of prefs ?? []) {
    userPrefs[p.user] = {
      reminder_times: p.reminder_times ?? defaultPrefs[p.user]?.reminder_times ?? [24, 1],
      notification_hour: p.notification_hour ?? 8,
    }
  }

  // Tüm benzersiz hatırlatma sürelerini topla (hangi görevlere bakacağız)
  const allHours = Array.from(
    new Set(
      Object.values(userPrefs).flatMap((p) => p.reminder_times)
    )
  ).sort((a, b) => b - a) // büyükten küçüğe

  // Bu saatlere karşılık gelen due_date aralıklarını hesapla
  const dueDates = allHours.map((h) => {
    const target = new Date(now.getTime() + h * 60 * 60 * 1000)
    return target.toISOString().split("T")[0]
  })

  const uniqueDueDates = Array.from(new Set(dueDates))

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, due_time, status, owner")
    .not("due_date", "is", null)
    .neq("status", "done")
    .in("due_date", uniqueDueDates)

  if (!tasks?.length) return NextResponse.json({ ok: true, checked: 0, sent: 0 })

  let sent = 0
  const ownerLabel: Record<string, string> = { emin: "Emin", emre: "Emre", tuna: "Tuna", shared: "Ortak" }

  for (const task of tasks) {
    const taskOwners: string[] =
      task.owner === "shared" ? ["emin", "emre", "tuna"] : [task.owner as string]

    for (const owner of taskOwners) {
      const pref = userPrefs[owner]
      if (!pref) continue

      // Bu kullanıcının notification_hour'u ile şu anki saati karşılaştır
      // Cron her gün çalışır; kullanıcının seçtiği saatte mi?
      // (Vercel cron UTC ile çalışır; tolerans için ±1 saat)
      const userHour = now.getUTCHours() + 3 // TR saati (UTC+3)
      if (Math.abs(userHour - pref.notification_hour) > 1) continue

      for (const hoursAhead of pref.reminder_times) {
        const target = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)
        const targetDate = target.toISOString().split("T")[0]

        if (task.due_date !== targetDate) continue

        // Aynı bildirimi tekrar gönderme
        const keyword = `${hoursAhead} saat`
        if (await alreadySent(task.id, keyword)) continue

        const ownerName = ownerLabel[owner] ?? owner
        let msg: string
        let pushTitle: string
        let notifType: string

        const timeStr = (task as { due_time?: string | null }).due_time
          ? ` (${(task as { due_time?: string | null }).due_time})`
          : ""
        if (hoursAhead >= 24) {
          const days = Math.round(hoursAhead / 24)
          msg = `⏰ ${ownerName}, "${task.title}" görevi ${days} gün sonra${timeStr} teslim edilmeli!`
          pushTitle = `⏰ ${days} Gün Kaldı`
          notifType = "reminder"
        } else {
          msg = `⏰ ${ownerName}, "${task.title}" görevi ${hoursAhead} saat sonra${timeStr} teslim edilmeli!`
          pushTitle = `⏰ ${hoursAhead} Saat Kaldı!`
          notifType = hoursAhead <= 1 ? "overdue" : "reminder"
        }

        await supabase.from("notifications").insert({
          task_id: task.id,
          message: msg,
          type: notifType,
          read: false,
        })
        await sendPush(pushTitle, msg, task.id)
        sent++
      }
    }
  }

  return NextResponse.json({ ok: true, checked: tasks.length, sent })
}
