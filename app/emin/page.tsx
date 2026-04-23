"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"
import {
  ArrowLeft, Plus, TrendingUp, Clock, AlertTriangle, CheckCircle2,
  StickyNote, ChevronRight, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import ThemeToggle from "@/components/ThemeToggle"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  loadTasks, isOverdue, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS,
  type Task,
} from "@/lib/tasks"
import { supabase, type Status } from "@/lib/supabase"

type FilterStatus = "all" | Status

const statusColors: Record<Status, string> = {
  todo: "bg-slate-100 text-slate-600 border-slate-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  review: "bg-purple-100 text-purple-700 border-purple-200",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
}

export default function EminPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    loadTasks().then((all) => {
      setTasks(all.filter((t) => t.owner === "emin"))
      setMounted(true)
    })

    const channel = supabase
      .channel("emin-tasks-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tasks" },
        (payload) => { if ((payload.new as Task).owner === "emin") setTasks((prev) => [...prev, payload.new as Task]) })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tasks" },
        (payload) => setTasks((prev) => {
          const updated = payload.new as Task
          if (updated.owner !== "emin") return prev.filter((t) => t.id !== updated.id)
          return prev.map((t) => t.id === updated.id ? updated : t)
        }))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "tasks" },
        (payload) => setTasks((prev) => prev.filter((t) => t.id !== (payload.old as { id: string }).id)))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (!mounted) return null

  const filteredTasks = tasks
    .filter((t) => filterStatus === "all" || t.status === filterStatus)
    .sort((a, b) => a.order_index - b.order_index)

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === "done").length
  const overdueTasks = tasks.filter(isOverdue).length
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length
  const donePercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "Tümü" },
    { value: "todo", label: "Yapılacak" },
    { value: "in_progress", label: "Devam" },
    { value: "review", label: "İnceleme" },
    { value: "done", label: "Tamam" },
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-slate-800 transition-colors group"
              >
                <div className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center group-hover:border-indigo-300 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </div>
              </Link>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md text-white font-bold text-sm">
                E
              </div>
              <div>
                <h1 className="font-display font-bold text-base text-slate-900 leading-none">Emin</h1>
                <p className="text-[10px] font-mono text-muted-foreground">Kişisel Görev Panosu</p>
              </div>
            </div>
            <ThemeToggle />
            <Button
              onClick={() => router.push("/tasks/new?owner=emin")}
              size="sm"
              className="gap-1.5 rounded-xl shadow-sm bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Yeni Görev</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Profile Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 p-6 mb-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -right-4 w-20 h-20 bg-white/10 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-display font-black border border-white/30">
              E
            </div>
            <div className="flex-1">
              <h2 className="font-display font-black text-2xl leading-none mb-1">Emin</h2>
              <p className="text-indigo-200 text-sm font-body">
                {doneTasks}/{totalTasks} görev tamamlandı
                {overdueTasks > 0 && (
                  <span className="ml-2 text-red-300">• {overdueTasks} gecikmiş</span>
                )}
              </p>
              {totalTasks > 0 && (
                <div className="mt-3 w-full max-w-xs">
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-700"
                      style={{ width: `${donePercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-indigo-200 font-mono mt-1">{donePercent}% tamamlandı</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
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
              {f.value !== "all" && (
                <span className="ml-1.5 opacity-60">
                  {tasks.filter((t) => t.status === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tasks */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="font-display font-bold text-xl text-slate-800 mb-2">Görev yok</h3>
            <p className="text-muted-foreground font-body mb-6">
              {filterStatus === "all" ? "Yeni bir görev ekleyerek başla" : "Bu durumda görev bulunmuyor"}
            </p>
            {filterStatus === "all" && (
              <Button
                onClick={() => router.push("/tasks/new?owner=emin")}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Görev Ekle
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const overdue = isOverdue(task)
              const checkDone = task.checklist.filter((c) => c.done).length
              const checkTotal = task.checklist.length
              const checkProgress = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0

              return (
                <button
                  key={task.id}
                  onClick={() => router.push(`/tasks/${task.id}`)}
                  className="w-full text-left glass-card rounded-2xl p-4 hover:shadow-md transition-all hover:scale-[1.005] group border border-transparent hover:border-indigo-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px] border font-body", PRIORITY_COLORS[task.priority])}>
                          {PRIORITY_LABELS[task.priority]}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] border font-body", statusColors[task.status])}>
                          {STATUS_LABELS[task.status]}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm text-slate-800 group-hover:text-indigo-700 transition-colors leading-snug">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 font-body">{task.description}</p>
                      )}
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {task.due_date && (
                        <span className={cn("flex items-center gap-1 text-[10px] font-mono rounded-md px-1.5 py-0.5", overdue ? "text-red-600 bg-red-50 border border-red-100" : "text-slate-500 bg-slate-50")}>
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(task.due_date), "d MMM", { locale: tr })}
                          {overdue && " ⚠️"}
                        </span>
                      )}
                      {task.notes && <span title="Not mevcut" className="text-indigo-400"><StickyNote className="h-3.5 w-3.5" /></span>}
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                  {checkTotal > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground font-body">{checkDone}/{checkTotal} alt görev</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{checkProgress}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full transition-all duration-500" style={{ width: `${checkProgress}%` }} />
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
