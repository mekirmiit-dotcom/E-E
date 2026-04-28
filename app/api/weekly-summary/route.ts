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

export async function GET() {
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

  let mostActive = ""
  if (eminCount > emreCount) mostActive = `En aktif: Emin 🏆`
  else if (emreCount > eminCount) mostActive = `En aktif: Emre 🏆`
  else if (eminCount > 0) mostActive = `Emin ve Emre eşit 🤝`
  else mostActive = `Bu hafta görev tamamlanmadı`

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

  return NextResponse.json({ ok: true, completedCount, overdueCount, eminCount, emreCount, message })
}
