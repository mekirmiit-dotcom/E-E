import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// createBrowserClient cookie tabanlı session kullanır — middleware ile uyumlu
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: Task
        Insert: Omit<Task, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Task, "id" | "created_at">>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, "id" | "created_at">
        Update: Partial<Omit<Notification, "id" | "created_at">>
      }
    }
  }
}

export type Owner = "emin" | "emre" | "shared" | "tuna"
export type Priority = "low" | "medium" | "high" | "critical"
export type Status = "todo" | "in_progress" | "review" | "done"

export type Task = {
  id: string
  title: string
  description: string | null
  owner: Owner
  priority: Priority
  status: Status
  due_date: string | null
  due_time: string | null // "HH:MM"
  tags: string[]
  checklist: ChecklistItem[]
  created_at: string
  updated_at: string
  order_index: number
  notes?: string | null
  color?: string | null
}

export type ChecklistItem = {
  id: string
  text: string
  done: boolean
  due_time?: string // "HH:MM"
}

export type Comment = {
  id: string
  task_id: string
  author: "emin" | "emre" | "tuna"
  content: string
  created_at: string
}

export type Notification = {
  id: string
  task_id: string | null
  message: string
  read: boolean
  created_at: string
  type: "reminder" | "overdue" | "completed" | "assigned" | "summary"
  recipient: "emin" | "emre" | "tuna" | "both"
}
