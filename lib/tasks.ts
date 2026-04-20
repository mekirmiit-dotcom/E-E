"use client"

import { supabase } from "./supabase"
export type { Task, Owner, Priority, Status, ChecklistItem } from "./supabase"
import type { Task, Owner, Priority, Status } from "./supabase"
import { isBefore, addDays } from "date-fns"

export async function loadTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from("tasks").select("*").order("order_index", { ascending: true })
  if (error) { console.error(error); return [] }
  return data || []
}

export async function createTask(data: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task | null> {
  const { data: task, error } = await supabase.from("tasks").insert(data).select().single()
  if (error) { console.error(error); return null }
  return task
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
  const { data: task, error } = await supabase.from("tasks").update(data).eq("id", id).select().single()
  if (error) { console.error(error); return null }
  return task
}

export async function deleteTask(id: string): Promise<void> {
  await supabase.from("tasks").delete().eq("id", id)
}

export async function getTask(id: string): Promise<Task | null> {
  const { data, error } = await supabase.from("tasks").select("*").eq("id", id).single()
  if (error) { console.error(error); return null }
  return data
}

export function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === "done") return false
  return isBefore(new Date(task.due_date), new Date())
}

export function isDueSoon(task: Task): boolean {
  if (!task.due_date || task.status === "done") return false
  const due = new Date(task.due_date)
  return !isBefore(due, new Date()) && isBefore(due, addDays(new Date(), 2))
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-50 text-blue-600 border-blue-200",
  high: "bg-orange-50 text-orange-600 border-orange-200",
  critical: "bg-red-50 text-red-600 border-red-200",
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Düşük", medium: "Orta", high: "Yüksek", critical: "Kritik",
}

export const STATUS_LABELS: Record<string, string> = {
  todo: "Yapılacak", in_progress: "Devam Ediyor", review: "İncelemede", done: "Tamamlandı",
}

export const OWNER_LABELS: Record<Owner, string> = {
  emin: "Emin", emre: "Emre", shared: "Ortak",
}