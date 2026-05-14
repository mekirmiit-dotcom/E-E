import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import webpush from "web-push"

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon...
  const daysBack = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysBack)
  monday.setHours(0, 0, 0, 0)
  return monday
}

async function sendPush(title: string, body: string) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_SUBJECT}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  const { data: subs } = await supabase.from("push_subscriptions").select("*")
  if (!subs?.length) return

  const payload = JSON.stringify({ title, body, icon: "/icon-512.png" })
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

export async function GET(req: Request) {
  const url = new URL(req.url)
  const force = url.searchParams.get("force") === "1"

  // CRON_SECRET varsa header kontrolü yap — deploy-triggered çağrıları reddet
  const cronSecret = process.env.CRON_SECRET
  if (!force && cronSecret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 })
    }
  }

  // Sadece Pazartesi çalışsın
  const nowTR = new Date(Date.now() + 3 * 60 * 60 * 1000) // UTC+3
  const dayOfWeek = nowTR.getUTCDay() // 0=Pazar, 1=Pazartesi
  if (!force && dayOfWeek !== 1) {
    return NextResponse.json({ ok: true, skipped: true, reason: "not Monday" })
  }

  const weekStart = getWeekStart()
  const today = new Date().toISOString().split("T")[0]

  // Bu hafta tamamlanan görevler (updated_at bu haftadan itibaren ve status=done)
  const { data: completedTasks } = await supabase
    .from("tasks")
    .select("id, owner, title")
    .eq("status", "done")
    .gte("updated_at", weekStart.toISOString())

  // Geciken görevler (due_date geçmiş, done değil)
  const { data: overdueTasks } = await supabase
    .from("tasks")
    .select("id")
    .neq("status", "done")
    .not("due_date", "is", null)
    .lt("due_date", today)

  const completedCount = completedTasks?.length ?? 0
  const overdueCount = overdueTasks?.length ?? 0

  const eminCount = completedTasks?.filter((t) => t.owner === "emin").length ?? 0
  const emreCount = completedTasks?.filter((t) => t.owner === "emre").length ?? 0
  const tunaCount = completedTasks?.filter((t) => t.owner === "tuna").length ?? 0

  const maxCount = Math.max(eminCount, emreCount, tunaCount)
  let mostActive = ""
  if (maxCount === 0) {
    mostActive = `Bu hafta görev tamamlanmadı`
  } else {
    const leaders = [
      eminCount === maxCount ? "Emin" : null,
      emreCount === maxCount ? "Emre" : null,
      tunaCount === maxCount ? "Tuna" : null,
    ].filter(Boolean)
    mostActive = leaders.length === 1 ? `En aktif: ${leaders[0]} 🏆` : `${leaders.join(" & ")} eşit 🤝`
  }

  const overdueText = overdueCount > 0 ? `, ${overdueCount} görev gecikti` : ""
  const message = `📊 Haftalık Özet: Bu hafta ${completedCount} görev tamamlandı${overdueText}. ${mostActive}`
  const title = "📊 Haftalık Özet"

  // notifications tablosuna ekle (summary tipi)
  const { error } = await supabase.from("notifications").insert({
    task_id: null,
    message,
    type: "summary",
    read: false,
  })

  if (error) {
    console.error("[weekly-summary] insert error:", error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  await sendPush(title, message)

  return NextResponse.json({ ok: true, completedCount, overdueCount, eminCount, emreCount, tunaCount, message })
}
