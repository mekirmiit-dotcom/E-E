import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import webpush from "web-push"

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0]
}

async function sendPush(title: string, body: string) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_SUBJECT}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  const { data: subs } = await supabase.from("push_subscriptions").select("*")
  if (!subs?.length) return

  const payload = JSON.stringify({ title, body, icon: "/icon-pwa?size=192" })
  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err) => {
        if (err.statusCode === 410) {
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

export async function GET() {
  const today = new Date()
  const in1day = toDateStr(addDays(today, 1))
  const in2days = toDateStr(addDays(today, 2))
  const todayStr = toDateStr(today)

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, status, owner")
    .not("due_date", "is", null)
    .neq("status", "done")
    .in("due_date", [todayStr, in1day, in2days])

  if (!tasks?.length) return NextResponse.json({ ok: true, checked: 0 })

  let sent = 0

  const ownerLabel: Record<string, string> = { emin: "Emin", emre: "Emre", shared: "Ortak" }

  for (const task of tasks) {
    const owner = ownerLabel[task.owner as string] ?? "Ortak"

    if (task.due_date === in2days) {
      if (await alreadySent(task.id, "2 gün")) continue
      const msg = `⏰ "${task.title}" (${owner}) — 2 gün sonra teslim edilmeli!`
      await supabase.from("notifications").insert({ task_id: task.id, message: msg, type: "reminder", read: false })
      await sendPush("⏰ 2 Gün Kaldı", msg)
      sent++
    } else if (task.due_date === in1day) {
      if (await alreadySent(task.id, "1 gün")) continue
      const msg = `⏰ "${task.title}" (${owner}) — yarın son gün!`
      await supabase.from("notifications").insert({ task_id: task.id, message: msg, type: "reminder", read: false })
      await sendPush("⏰ Yarın Son Gün!", msg)
      sent++
    } else if (task.due_date === todayStr) {
      if (await alreadySent(task.id, "bugün son")) continue
      const msg = `🚨 "${task.title}" (${owner}) — bugün son gün!`
      await supabase.from("notifications").insert({ task_id: task.id, message: msg, type: "overdue", read: false })
      await sendPush("🚨 Bugün Son Gün!", msg)
      sent++
    }
  }

  return NextResponse.json({ ok: true, checked: tasks.length, sent })
}
