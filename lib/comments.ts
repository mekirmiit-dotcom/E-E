"use client"

import { supabase } from "./supabase"
import type { Comment } from "./supabase"
import { createNotification } from "./notifications"

export async function getComments(taskId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
  if (error) {
    console.error("[comments] getComments error:", error.message, error.details)
    return []
  }
  return data || []
}

export async function addComment(
  taskId: string,
  taskTitle: string,
  author: "emin" | "emre" | "tuna",
  content: string
): Promise<Comment | null> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ task_id: taskId, author, content })
    .select()
    .single()

  if (error) {
    console.error("[comments] addComment error:", error.message, error.details, error.hint)
    return null
  }

  const authorLabels: Record<"emin" | "emre" | "tuna", string> = { emin: "Emin", emre: "Emre", tuna: "Tuna" }
  const authorLabel = authorLabels[author]
  const preview = content.length > 50 ? content.slice(0, 50) + "…" : content
  const msg = `${authorLabel}, "${taskTitle}" görevine yorum yazdı: "${preview}"`
  // Yorum yazan kişi dışındaki herkese bildirim gönder
  const recipient = author === "emin" ? "emre" : author === "emre" ? "emin" : "both"

  await createNotification(taskId, msg, "assigned", recipient, "💬 Yeni Yorum")

  return data
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", id)
  if (error) console.error("[comments] deleteComment error:", error.message)
}
