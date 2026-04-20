"use client"

import { supabase, type Notification } from "./supabase"

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
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
  await supabase.from("notifications").insert({
    task_id: taskId,
    message,
    type,
    read: false,
  })
}

export function requestPushPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!("Notification" in window)) {
      resolve(false)
      return
    }
    if (Notification.permission === "granted") {
      resolve(true)
      return
    }
    Notification.requestPermission().then((permission) => {
      resolve(permission === "granted")
    })
  })
}

export function sendPushNotification(title: string, body: string, icon?: string): void {
  if (typeof window === "undefined") return
  if (!("Notification" in window)) return
  if (Notification.permission !== "granted") return

  new Notification(title, {
    body,
    icon: icon || "/favicon.ico",
    badge: "/favicon.ico",
  })
}

export function scheduleReminder(taskId: string, taskTitle: string, dueDate: Date): void {
  const now = new Date()
  const msUntilDue = dueDate.getTime() - now.getTime()
  const msUntilReminder = msUntilDue - 24 * 60 * 60 * 1000 // 1 day before

  if (msUntilReminder > 0) {
    setTimeout(() => {
      sendPushNotification(
        "⏰ Görev Hatırlatıcı",
        `"${taskTitle}" görevi yarın teslim edilmeli!`
      )
    }, msUntilReminder)
  }

  if (msUntilDue > 0) {
    setTimeout(() => {
      sendPushNotification(
        "🚨 Son Gün!",
        `"${taskTitle}" görevi bugün teslim edilmeli!`
      )
    }, msUntilDue)
  }
}
