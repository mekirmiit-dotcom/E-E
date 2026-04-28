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
import Link from "next/link"
import {
  Plus,
  LayoutGrid,
  Search,
  Filter,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  CalendarDays,
  BarChart3,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Column from "@/components/Column"
import TaskCard from "@/components/TaskCard"
import NotificationBell from "@/components/NotificationBell"
import ThemeToggle from "@/components/ThemeToggle"
import UserMenu from "@/components/UserMenu"
import { loadTasks, isOverdue, type Task } from "@/lib/tasks"
import { supabase, type Owner, type Status } from "@/lib/supabase"

type FilterStatus = "all" | Status

export default function DashboardPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [mounted, setMounted] = useState(false)
  const [settledId, setSettledId] = useState<string | null>(null)

  useEffect(() => {
    loadTasks().then((data) => {
      setTasks(data)
      setMounted(true)
    })

    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tasks" },
        (payload) => setTasks((prev) => [...prev, payload.new as Task]))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tasks" },
        (payload) => setTasks((prev) => prev.map((t) => t.id === (payload.new as Task).id ? payload.new as Task : t)))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "tasks" },
        (payload) => setTasks((prev) => prev.filter((t) => t.id !== (payload.old as { id: string }).id)))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
    const droppedId = active.id as string

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

    if (overTask && overTask.owner === activeTask.owner && active.id !== overId) {
      const colTasks = updatedTasks.filter((t) => t.owner === overOwner)
      const oldIdx = colTasks.findIndex((t) => t.id === active.id)
      const newIdx = colTasks.findIndex((t) => t.id === overId)
      const reordered = arrayMove(colTasks, oldIdx, newIdx).map((t, i) => ({
        ...t,
        order_index: i,
      }))
      const rest = updatedTasks.filter((t) => t.owner !== overOwner)
      setTasks([...rest, ...reordered])
      triggerSettled(droppedId)
      return
    }

    setTasks(updatedTasks)
    triggerSettled(droppedId)
  }

  function triggerSettled(id: string) {
    // Wait for DragOverlay drop animation (420ms) then play settle pop
    setTimeout(() => {
      setSettledId(id)
      setTimeout(() => setSettledId(null), 550)
    }, 430)
  }

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === "done").length
  const overdueTasks = tasks.filter(isOverdue).length
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

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
      color: "bg-indigo-50 text-indigo-700 border-indigo-100",
      accentColor: "hover:bg-indigo-50 text-indigo-600",
    },
    {
      owner: "emre",
      label: "Emre",
      emoji: "E",
      color: "bg-amber-50 text-amber-700 border-amber-100",
      accentColor: "hover:bg-amber-50 text-amber-600",
    },
    {
      owner: "shared",
      label: "Ortak",
      emoji: "◆",
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
      accentColor: "hover:bg-emerald-50 text-emerald-600",
    },
  ]

  const statusFilters: { value: FilterStatus; label: string; count?: number }[] = [
    { value: "all", label: "Tümü", count: tasks.length },
    { value: "todo", label: "Yapılacak", count: tasks.filter((t) => t.status === "todo").length },
    { value: "in_progress", label: "Devam", count: inProgressTasks },
    { value: "review", label: "İnceleme", count: tasks.filter((t) => t.status === "review").length },
    { value: "done", label: "Tamam", count: doneTasks },
  ]

  if (!mounted) return null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/75 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src="/icon-512.png" alt="E&E" className="w-9 h-9 rounded-xl object-cover shadow-soft-md" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 animate-pulse" />
              </div>
              <div>
                <h1 className="font-display font-bold text-[15px] tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                  İş Takibi
                </h1>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 tracking-wider uppercase">Emin × Emre</p>
              </div>
            </div>

            {/* Search */}
            <div className="hidden md:flex relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Görev ara..."
                className="pl-9 h-9 text-sm bg-slate-50/70 border-slate-200/70 rounded-xl focus-visible:bg-white transition-colors"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <div className="hidden sm:flex items-center gap-1">
                <Link
                  href="/emin"
                  className="group flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 hover:bg-indigo-50/80 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all border border-slate-200/70 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700"
                >
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center font-bold text-white text-[10px] shadow-sm">E</span>
                  Emin
                </Link>
                <Link
                  href="/emre"
                  className="group flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 hover:bg-amber-50/80 dark:hover:bg-amber-900/30 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 transition-all border border-slate-200/70 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-700"
                >
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-white text-[10px] shadow-sm">E</span>
                  Emre
                </Link>
                <Link
                  href="/calendar"
                  className="group flex items-center gap-2 pl-2 pr-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 hover:bg-violet-50/80 dark:hover:bg-violet-900/30 text-slate-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-300 transition-all border border-slate-200/70 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-700"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Takvim
                </Link>
                <Link
                  href="/summary"
                  className="group flex items-center gap-2 pl-2 pr-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all border border-slate-200/70 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Özet
                </Link>
                <Link
                  href="/settings"
                  className="group flex items-center gap-2 pl-2 pr-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-all border border-slate-200/70 dark:border-slate-700 hover:border-slate-300"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Ayarlar
                </Link>
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
              <ThemeToggle />
              <NotificationBell />
              <UserMenu />
              <Button
                onClick={() => router.push("/tasks/new")}
                size="sm"
                className="gap-1.5 rounded-xl shadow-soft-md bg-slate-900 hover:bg-slate-800 text-white h-9"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Yeni Görev</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        {/* Hero strip */}
        <div className="mb-7">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono uppercase tracking-[0.14em] mb-2">
            <Sparkles className="h-3 w-3" />
            Genel Bakış
          </div>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-slate-100">
              {greetingByTime()},{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 bg-clip-text text-transparent">
                bugün {inProgressTasks > 0 ? `${inProgressTasks} görev` : "işe koyulmanın zamanı"}
              </span>
            </h2>
            {totalTasks > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="relative w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-slate-600 tabular-nums">%{completionRate}</span>
                </div>
                <span className="text-slate-400 text-xs">tamamlandı</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7 stagger">
          {[
            { icon: TrendingUp, label: "Toplam Görev", value: totalTasks, color: "text-slate-700", iconBg: "bg-slate-100", trend: null },
            { icon: Clock, label: "Devam Eden", value: inProgressTasks, color: "text-blue-700", iconBg: "bg-blue-50", trend: null },
            { icon: AlertTriangle, label: "Gecikmiş", value: overdueTasks, color: "text-red-700", iconBg: "bg-red-50", trend: overdueTasks > 0 ? "alert" : null },
            { icon: CheckCircle2, label: "Tamamlanan", value: doneTasks, color: "text-emerald-700", iconBg: "bg-emerald-50", trend: null },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "group relative surface-card px-4 py-3.5 flex items-center gap-3 hover:shadow-soft-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden",
                stat.trend === "alert" && "ring-1 ring-red-100"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", stat.iconBg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-2xl text-slate-900 dark:text-slate-100 leading-none tabular-nums">{stat.value}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">{stat.label}</p>
              </div>
              {stat.trend === "alert" && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pr-2 flex-shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filtrele</span>
          </div>
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={cn(
                "group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                filterStatus === f.value
                  ? "bg-slate-900 text-white border-slate-900 shadow-soft-md"
                  : "bg-white text-slate-600 border-slate-200/70 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              {f.label}
              {typeof f.count === "number" && (
                <span
                  className={cn(
                    "text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-full",
                    filterStatus === f.value
                      ? "bg-white/15 text-white/90"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  )}
                >
                  {f.count}
                </span>
              )}
            </button>
          ))}

          {/* Mobile search */}
          <div className="md:hidden flex-1 min-w-32 relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ara..."
              className="pl-8 h-8 text-sm bg-white border-slate-200 rounded-lg"
            />
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
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
                  settledId={settledId}
                />
              )
            })}
          </div>

          <DragOverlay
            dropAnimation={{
              duration: 420,
              easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {activeTask && <TaskCard task={activeTask} overlay />}
          </DragOverlay>
        </DndContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="text-center py-24 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 mb-5 shadow-soft-md">
              <LayoutGrid className="h-7 w-7 text-indigo-600" />
            </div>
            <h3 className="font-display font-bold text-2xl tracking-tight text-slate-900 mb-2">Henüz görev yok</h3>
            <p className="text-slate-500 mb-7 max-w-sm mx-auto">
              İlk görevini ekleyerek başla. Emin, Emre veya Ortak sütununa ekleyebilirsin.
            </p>
            <Button
              onClick={() => router.push("/tasks/new")}
              size="lg"
              className="gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-soft-md"
            >
              <Plus className="h-4 w-4" />
              İlk Görevi Ekle
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

function greetingByTime(): string {
  const h = new Date().getHours()
  if (h < 6) return "İyi geceler"
  if (h < 12) return "Günaydın"
  if (h < 18) return "İyi günler"
  return "İyi akşamlar"
}
