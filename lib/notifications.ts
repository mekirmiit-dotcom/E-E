"use client"

import { supabase, type Notification } from "./supabase"

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)
  if (error) { console.error("Error fetching notifications:", error); return [] }
  return data || []
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("id", id)
}

export async function markAllNotificationsRead(): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("read", false)
}

export async function createNotification(
  taskId: string,
  message: string,
  type: Notification["type"]
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    task_id: taskId,
    message,
    type,
    read: false,
  })
  if (error) { console.error("[createNotification] error:", error); return }

  // Send push to all subscribed devices
  try {
    const typeEmoji = { reminder: "⏰", overdue: "🚨", completed: "✅", assigned: "👤" }
    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `${typeEmoji[type]} İş Takibi`, body: message }),
    })
  } catch (e) {
    console.error("[push] error:", e)
  }
}

// Register service worker and subscribe to push
export async function registerPush(): Promise<boolean> {
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
    body: JSON.stringify(sub.toJSON()),
  })

  return true
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from(Array.from(rawData).map((c) => c.charCodeAt(0)))
}
