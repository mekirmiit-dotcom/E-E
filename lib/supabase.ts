import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

export type Owner = "emin" | "emre" | "shared"
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
  tags: string[]
  checklist: ChecklistItem[]
  created_at: string
  updated_at: string
  order_index: number
  notes: string | null
}

export type ChecklistItem = {
  id: string
  text: string
  done: boolean
}

export type Notification = {
  id: string
  task_id: string
  message: string
  read: boolean
  created_at: string
  type: "reminder" | "overdue" | "completed" | "assigned"
}
