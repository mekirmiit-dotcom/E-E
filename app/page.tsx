"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { Plus, LayoutGrid, Search, Filter, TrendingUp, Clock, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Column from "@/components/Column"
import TaskCard from "@/components/TaskCard"
import NotificationBell from "@/components/NotificationBell"
import { loadTasks, isOverdue, type Task } from "@/lib/tasks"
import type { Owner, Status } from "@/lib/supabase"

type FilterStatus = "all" | Status

export default function DashboardPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTasks(loadTasks())
    setMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const getOwnerTasks = useCallback(
    (owner: Owner) => {
      return tasks
        .filter((t) => t.owner === owner)
        .filter((t) => {
          if (search) {
            const q = search.toLowerCase()
            return (
              t.title.toLowerCase().includes(q) ||
              t.description?.toLowerCase().includes(q) ||
              t.tags.some((tag) => tag.includes(q))
            )
          }
          return true
        })
        .filter((t) => filterStatus === "all" || t.status === filterStatus)
        .sort((a, b) => a.order_index - b.order_index)
    },
    [tasks, search, filterStatus]
  )

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task || null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    const overId = over.id as string
    const overTask = tasks.find((t) => t.id === overId)
    const overOwner = (["emin", "emre", "shared"].includes(overId) ? overId : overTask?.owner) as Owner | undefined

    if (!overOwner) return

    const updatedTasks = tasks.map((t) => {
      if (t.id === active.id) {
        return { ...t, owner: overOwner, updated_at: new Date().toISOString() }
      }
      return t
    })

    // Reorder within the same column
    if (overTask && overTask.owner === activeTask.owner && active.id !== overId) {
      const colTasks = updatedTasks.filter((t) => t.owner === overOwner)
      const oldIdx = colTasks.findIndex((t) => t.id === active.id)
      const newIdx = colTasks.findIndex((t) => t.id === overId)
      const reordered = arrayMove(colTasks, oldIdx, newIdx).map((t, i) => ({
        ...t,
        order_index: i,
      }))
      const rest = updatedTasks.filter((t) => t.owner !== overOwner)
      const final = [...rest, ...reordered]
      setTasks(final)
      
      return
    }

    setTasks(updatedTasks)
    
  }

  // Stats
  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === "done").length
  const overdueTasks = tasks.filter(isOverdue).length
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length

  const columns: {
    owner: Owner
    label: string
    emoji: string
    color: string
    accentColor: string
  }[] = [
    {
      owner: "emin",
      label: "Emin",
      emoji: "E",
      color: "bg-indigo-100 text-indigo-700",
      accentColor: "hover:bg-indigo-100 text-indigo-600",
    },
    {
      owner: "emre",
      label: "Emre",
      emoji: "E",
      color: "bg-amber-100 text-amber-700",
      accentColor: "hover:bg-amber-100 text-amber-600",
    },
    {
      owner: "shared",
      label: "Ortak",
      emoji: "🤝",
      color: "bg-emerald-100 text-emerald-700",
      accentColor: "hover:bg-emerald-100 text-emerald-600",
    },
  ]

  const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "Tümü" },
    { value: "todo", label: "Yapılacak" },
    { value: "in_progress", label: "Devam" },
    { value: "review", label: "İnceleme" },
    { value: "done", label: "Tamam" },
  ]

  if (!mounted) return null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md">
                <LayoutGrid className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-base text-slate-900 leading-none">
                  İş Takibi
                </h1>
                <p className="text-[10px] font-mono text-muted-foreground">Emin & Emre</p>
              </div>
            </div>

            {/* Search */}
            <div className="hidden md:flex relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Görev ara..."
                className="pl-8 h-8 text-sm bg-slate-50/80 border-slate-200"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button
                onClick={() => router.push("/tasks/new")}
                size="sm"
                className="gap-1.5 rounded-xl shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Yeni Görev</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: TrendingUp, label: "Toplam", value: totalTasks, color: "text-slate-600 bg-slate-100" },
            { icon: Clock, label: "Devam Eden", value: inProgressTasks, color: "text-blue-600 bg-blue-100" },
            { icon: AlertTriangle, label: "Gecikmiş", value: overdueTasks, color: "text-red-600 bg-red-100" },
            { icon: CheckCircle2, label: "Tamamlanan", value: doneTasks, color: "text-emerald-600 bg-emerald-100" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-display font-bold text-xl text-slate-900 leading-none">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground font-body mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium font-body whitespace-nowrap transition-all",
                filterStatus === f.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white/80 text-slate-600 hover:bg-white border border-slate-200"
              )}
            >
              {f.label}
            </button>
          ))}

          {/* Mobile search */}
          <div className="md:hidden flex-1 min-w-32 relative ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ara..."
              className="pl-8 h-8 text-sm bg-white/80 border-slate-200"
            />
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map((col) => {
              const colTasks = getOwnerTasks(col.owner)
              const allColTasks = tasks.filter((t) => t.owner === col.owner)
              return (
                <Column
                  key={col.owner}
                  owner={col.owner}
                  tasks={colTasks}
                  label={col.label}
                  emoji={col.emoji}
                  color={col.color}
                  accentColor={col.accentColor}
                  stats={{
                    total: allColTasks.length,
                    done: allColTasks.filter((t) => t.status === "done").length,
                    overdue: allColTasks.filter(isOverdue).length,
                  }}
                />
              )
            })}
          </div>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} overlay />}
          </DragOverlay>
        </DndContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="font-display font-bold text-xl text-slate-800 mb-2">Henüz görev yok</h3>
            <p className="text-muted-foreground font-body mb-6">İlk görevi ekleyerek başla</p>
            <Button onClick={() => router.push("/tasks/new")} className="gap-2">
              <Plus className="h-4 w-4" />
              İlk Görevi Ekle
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
