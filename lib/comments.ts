"use client"

import { supabase } from "./supabase"
import type { Comment } from "./supabase"

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
  author: "emin" | "emre",
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
  return data
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", id)
  if (error) console.error("[comments] deleteComment error:", error.message)
}
