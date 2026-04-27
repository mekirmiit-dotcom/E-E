"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import NotificationBell from "@/components/NotificationBell"
import ThemeToggle from "@/components/ThemeToggle"
import { loadTasks, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS, OWNER_LABELS, isOverdue, type Task } from "@/lib/tasks"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns"
import { tr } from "date-fns/locale"

const OWNER_COLORS: Record<string, string> = {
  emin:   "bg-indigo-500",
  emre:   "bg-amber-500",
  shared: "bg-emerald-500",
}

export default function CalendarPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    loadTasks().then((data) => {
      setTasks(data)
      setMounted(true)
    })
  }, [])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const tasksForDay = (day: Date) =>
    tasks.filter((t) => t.due_date && isSameDay(parseISO(t.due_date), day))

  const selectedTasks = selectedDay ? tasksForDay(selectedDay) : []

  const prevMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  const goToday  = () => { setCurrentDate(new Date()); setSelectedDay(new Date()) }

  if (!mounted) return null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/75 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <img src="/icon-512.png" alt="E&E" className="w-9 h-9 rounded-xl object-cover shadow-soft-md" />
              </Link>
              <div>
                <h1 className="font-display font-bold text-[15px] tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                  Takvim
                </h1>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 tracking-wider uppercase">
                  {format(currentDate, "MMMM yyyy", { locale: tr })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <NotificationBell />
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

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar grid */}
          <div className="flex-1 min-w-0">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 capitalize min-w-[180px] text-center">
                  {format(currentDate, "MMMM yyyy", { locale: tr })}
                </h2>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={goToday}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
              >
                Bugün
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
                <div key={d} className="text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-2 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/40">
              {days.map((day) => {
                const dayTasks = tasksForDay(day)
                const isSelected = selectedDay && isSameDay(day, selectedDay)
                const inMonth = isSameMonth(day, currentDate)
                const todayDay = isToday(day)

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day)}
                    className={cn(
                      "relative min-h-[72px] sm:min-h-[88px] p-1.5 text-left transition-colors",
                      "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60",
                      !inMonth && "opacity-35",
                      isSelected && "bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
                    )}
                  >
                    <span className={cn(
                      "inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-medium mb-1",
                      todayDay && "bg-indigo-600 text-white font-bold",
                      !todayDay && "text-slate-700 dark:text-slate-300",
                      isSelected && !todayDay && "bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300",
                    )}>
                      {format(day, "d")}
                    </span>

                    <div className="flex flex-col gap-0.5">
                      {dayTasks.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          className={cn(
                            "text-[10px] leading-tight px-1 py-0.5 rounded-md truncate font-medium",
                            t.status === "done"
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 line-through"
                              : isOverdue(t)
                              ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                              : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                          )}
                          style={t.color ? { backgroundColor: t.color + "22", color: t.color } : undefined}
                        >
                          {t.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 px-1">
                          +{dayTasks.length - 3} daha
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700" />
                Devam ediyor
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700" />
                Gecikmiş
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                Tamamlandı
              </div>
            </div>
          </div>

          {/* Sidebar: selected day or upcoming */}
          <div className="lg:w-72 flex-shrink-0">
            {selectedDay ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {format(selectedDay, "d MMMM, EEEE", { locale: tr })}
                  </h3>
                </div>
                {selectedTasks.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center">
                    <Calendar className="h-8 w-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Bu gün için görev yok</p>
                    <button
                      onClick={() => router.push("/tasks/new")}
                      className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      + Görev ekle
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedTasks.map((t) => (
                      <TaskSidebarCard key={t.id} task={t} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <UpcomingPanel tasks={tasks} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function TaskSidebarCard({ task }: { task: Task }) {
  const router = useRouter()
  const overdue = isOverdue(task)

  return (
    <button
      onClick={() => router.push(`/tasks/${task.id}`)}
      className="w-full text-left rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all group relative overflow-hidden"
    >
      {task.color && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ backgroundColor: task.color }} />
      )}
      <div className="pl-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className={cn(
            "text-sm font-medium leading-tight",
            task.status === "done" ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-200"
          )}>
            {task.title}
          </p>
          {overdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-md border", PRIORITY_COLORS[task.priority])}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {STATUS_LABELS[task.status]}
          </span>
          <div className="flex items-center gap-1">
            <div className={cn("w-2 h-2 rounded-full", OWNER_COLORS[task.owner])} />
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{OWNER_LABELS[task.owner]}</span>
          </div>
        </div>
      </div>
    </button>
  )
}

function UpcomingPanel({ tasks }: { tasks: Task[] }) {
  const upcoming = tasks
    .filter((t) => t.due_date && t.status !== "done")
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 8)

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-indigo-500" />
        <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">Yaklaşan Görevler</h3>
      </div>
      {upcoming.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center">
          <Calendar className="h-8 w-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Yaklaşan görev yok</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {upcoming.map((t) => {
            const overdue = isOverdue(t)
            return (
              <Link
                key={t.id}
                href={`/tasks/${t.id}`}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all group"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-white",
                    OWNER_COLORS[t.owner]
                  )}>
                    {OWNER_LABELS[t.owner][0]}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate leading-tight">{t.title}</p>
                  <p className={cn(
                    "text-[10px] mt-0.5 font-mono",
                    overdue ? "text-red-500" : "text-slate-400 dark:text-slate-500"
                  )}>
                    {overdue ? "⚠ " : ""}
                    {format(parseISO(t.due_date!), "d MMM", { locale: tr })}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
