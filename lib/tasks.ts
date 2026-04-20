"use client"

import { type Task, type Owner, type Priority, type Status } from "./supabase"

export type { Task, Owner, Priority, Status, ChecklistItem } from "./supabase"
import { format, isAfter, isBefore, addDays } from "date-fns"

// Demo data for when Supabase isn't configured
const DEMO_TASKS: Task[] = [
  {
    id: "1",
    title: "Landing page tasarımı",
    description: "Ana sayfa hero bölümü ve CTA butonları",
    owner: "emin",
    priority: "high",
    status: "in_progress",
    due_date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
    tags: ["design", "frontend"],
    checklist: [
      { id: "c1", text: "Wireframe hazırla", done: true },
      { id: "c2", text: "Renk paleti belirle", done: true },
      { id: "c3", text: "Responsive düzen", done: false },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 0,
  },
  {
    id: "2",
    title: "API endpoint'leri yaz",
    description: "REST API dokümantasyonu ve endpoint implementasyonu",
    owner: "emre",
    priority: "critical",
    status: "todo",
    due_date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    tags: ["backend", "api"],
    checklist: [
      { id: "c4", text: "Auth endpoint", done: false },
      { id: "c5", text: "Tasks CRUD", done: false },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 0,
  },
  {
    id: "3",
    title: "Database şeması",
    description: "Supabase migration dosyaları ve RLS politikaları",
    owner: "shared",
    priority: "high",
    status: "done",
    due_date: format(addDays(new Date(), -1), "yyyy-MM-dd"),
    tags: ["database", "backend"],
    checklist: [
      { id: "c6", text: "Tasks tablosu", done: true },
      { id: "c7", text: "RLS politikaları", done: true },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 1,
  },
  {
    id: "4",
    title: "Kullanıcı testleri",
    description: "5 kullanıcı ile UX testi ve geri bildirim toplama",
    owner: "shared",
    priority: "medium",
    status: "review",
    due_date: format(addDays(new Date(), 5), "yyyy-MM-dd"),
    tags: ["ux", "testing"],
    checklist: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 0,
  },
  {
    id: "5",
    title: "Mobil görünüm düzeltmeleri",
    description: "iOS Safari ve Android Chrome uyumluluk",
    owner: "emin",
    priority: "medium",
    status: "todo",
    due_date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    tags: ["mobile", "css"],
    checklist: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 1,
  },
  {
    id: "6",
    title: "CI/CD pipeline kurulumu",
    description: "GitHub Actions ile otomatik deploy",
    owner: "emre",
    priority: "low",
    status: "in_progress",
    due_date: format(addDays(new Date(), 10), "yyyy-MM-dd"),
    tags: ["devops"],
    checklist: [
      { id: "c8", text: "GitHub Actions workflow", done: true },
      { id: "c9", text: "Staging environment", done: false },
      { id: "c10", text: "Production deploy", done: false },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 1,
  },
]

const STORAGE_KEY = "is-takibi-tasks"

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return DEMO_TASKS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_TASKS))
      return DEMO_TASKS
    }
    return JSON.parse(stored)
  } catch {
    return DEMO_TASKS
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function createTask(data: Omit<Task, "id" | "created_at" | "updated_at">): Task {
  const task: Task = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const tasks = loadTasks()
  tasks.push(task)
  saveTasks(tasks)
  return task
}

export function updateTask(id: string, data: Partial<Task>): Task | null {
  const tasks = loadTasks()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) return null
  tasks[idx] = { ...tasks[idx], ...data, updated_at: new Date().toISOString() }
  saveTasks(tasks)
  return tasks[idx]
}

export function deleteTask(id: string): void {
  const tasks = loadTasks().filter((t) => t.id !== id)
  saveTasks(tasks)
}

export function getTask(id: string): Task | null {
  return loadTasks().find((t) => t.id === id) || null
}

export function getTasksByOwner(owner: Owner): Task[] {
  return loadTasks().filter((t) => t.owner === owner)
}

export function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === "done") return false
  return isBefore(new Date(task.due_date), new Date())
}

export function isDueSoon(task: Task): boolean {
  if (!task.due_date || task.status === "done") return false
  const due = new Date(task.due_date)
  return isAfter(due, new Date()) && isBefore(due, addDays(new Date(), 2))
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-50 text-blue-600 border-blue-200",
  high: "bg-orange-50 text-orange-600 border-orange-200",
  critical: "bg-red-50 text-red-600 border-red-200",
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
}

export const STATUS_LABELS: Record<Status, string> = {
  todo: "Yapılacak",
  in_progress: "Devam Ediyor",
  review: "İncelemede",
  done: "Tamamlandı",
}

export const OWNER_LABELS: Record<Owner, string> = {
  emin: "Emin",
  emre: "Emre",
  shared: "Ortak",
}
