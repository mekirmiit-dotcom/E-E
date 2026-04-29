"use client"

import { supabase, type Notification } from "./supabase"

export type Recipient = "emin" | "emre" | "both"

// recipient: bildirimi görecek kişi — currentUser'a göre filtreler
export async function getNotifications(currentUser?: "emin" | "emre"): Promise<Notification[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30)

  if (currentUser) {
    // Sadece "both" veya kendi adına gelen bildirimleri göster
    query = query.or(`recipient.eq.both,recipient.eq.${currentUser}`)
  }

  const { data, error } = await query
  if (error) { console.error("Error fetching notifications:", error); return [] }
  return data || []
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("id", id)
}

export async function markAllNotificationsRead(currentUser?: "emin" | "emre"): Promise<void> {
  let query = supabase.from("notifications").update({ read: true }).eq("read", false)
  if (currentUser) {
    query = query.or(`recipient.eq.both,recipient.eq.${currentUser}`)
  }
  await query
}

export async function createNotification(
  taskId: string | null,
  message: string,
  type: Notification["type"],
  recipient: Recipient = "both",
  pushTitle?: string
): Promise<void> {
  console.log("[createNotification] →", { type, recipient, taskId, message })

  const { error } = await supabase.from("notifications").insert({
    task_id: taskId,
    message,
    type,
    read: false,
    recipient,
  })
  if (error) {
    console.error("[createNotification] ❌ INSERT hatası:", error.message, error.details, error.hint)
    return
  }
  console.log("[createNotification] ✅ kayıt OK — recipient:", recipient)

  // Push bildirimi sadece alıcı cihazlara gönder
  try {
    const typeEmoji: Record<string, string> = {
      reminder: "⏰", overdue: "🚨", completed: "✅", assigned: "👤", summary: "📊",
    }
    const title = pushTitle ?? `${typeEmoji[type] ?? "🔔"} İş Takibi`
    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body: message, task_id: taskId, recipient }),
    })
  } catch (e) {
    console.error("[push] error:", e)
  }
}

// Register service worker and subscribe to push
export async function registerPush(owner?: "emin" | "emre"): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false

  const permission = await Notification.requestPermission()
  if (permission !== "granted") return false

  const reg = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
  const existing = await reg.pushManager.getSubscription()
  const sub = existing || await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
  })

  await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sub.toJSON(), owner }),
  })

  return true
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from(Array.from(rawData).map((c) => c.charCodeAt(0)))
}
