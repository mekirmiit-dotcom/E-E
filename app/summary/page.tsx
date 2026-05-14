"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { loadTasks, isOverdue, PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/tasks"
import type { Task } from "@/lib/tasks"
import { supabase } from "@/lib/supabase"
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  isWithinInterval,
  parseISO,
} from "date-fns"
import { tr } from "date-fns/locale"

type Period = "this_week" | "last_week" | "this_month" | "last_month"

type WeeklySummary = {
  id: string
  week_start: string
  week_end: string
  total_completed: number
  total_overdue: number
  emin_completed: number
  emre_completed: number
  created_at: string
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "this_week",   label: "Bu Hafta" },
  { value: "last_week",   label: "Geçen Hafta" },
  { value: "this_month",  label: "Bu Ay" },
  { value: "last_month",  label: "Geçen Ay" },
]

function getPeriodInterval(period: Period): { start: Date; end: Date } {
  const now = new Date()
  switch (period) {
    case "this_week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    case "last_week":
      return { start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }) }
    case "this_month":
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case "last_month":
      return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }
  }
}

export default function SummaryPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [period, setPeriod] = useState<Period>("this_week")
  const [history, setHistory] = useState<WeeklySummary[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    loadTasks().then((data) => { setTasks(data); setMounted(true) })
    supabase
      .from("weekly_summaries")
      .select("*")
      .order("week_start", { ascending: false })
      .limit(12)
      .then(({ data }) => { if (data) setHistory(data) })
  }, [])

  const interval = useMemo(() => getPeriodInterval(period), [period])

  const completedInPeriod = useMemo(() =>
    tasks.filter(
      (t) =>
        t.status === "done" &&
        t.updated_at &&
        isWithinInterval(new Date(t.updated_at), interval)
    ),
    [tasks, interval]
  )

  const overdueTasks = useMemo(() => tasks.filter(isOverdue), [tasks])

  const eminCompleted = completedInPeriod.filter((t) => t.owner === "emin")
  const emreCompleted = completedInPeriod.filter((t) => t.owner === "emre")
  const tunaCompleted = completedInPeriod.filter((t) => t.owner === "tuna")
  const eminCount = eminCompleted.length
  const emreCount = emreCompleted.length
  const tunaCount = tunaCompleted.length
  const vsTotal = eminCount + emreCount + tunaCount
  const maxCount = Math.max(eminCount, emreCount, tunaCount)
  const winners = [eminCount, emreCount, tunaCount].filter((c) => c === maxCount).length
  const winner = maxCount === 0 || winners > 1 ? "" : eminCount === maxCount ? "emin" : emreCount === maxCount ? "emre" : "tuna"

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? ""
  const periodRange = `${format(interval.start, "d MMM", { locale: tr })} – ${format(interval.end, "d MMM yyyy", { locale: tr })}`

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/75 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-slate-500" />
              </button>
              <div>
                <h1 className="font-display font-bold text-[15px] text-slate-900 dark:text-slate-100 leading-none">
                  Özet Rapor
                </h1>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">{periodRange}</p>
              </div>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-5 pb-24">

        {/* Dönem seçici */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all",
                period === opt.value
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Özet kartları */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            bg="bg-emerald-50 dark:bg-emerald-900/20"
            value={completedInPeriod.length}
            label="Tamamlandı"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            bg="bg-red-50 dark:bg-red-900/20"
            value={overdueTasks.length}
            label="Gecikmiş"
          />
          <StatCard
            icon={<BarChart3 className="h-5 w-5 text-indigo-600" />}
            bg="bg-indigo-50 dark:bg-indigo-900/20"
            value={tasks.filter((t) => t.status !== "done").length}
            label="Devam Eden"
          />
        </div>

        {/* Emin vs Emre */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">
              {periodLabel} En Aktif
            </h2>
          </div>

          <div className="flex items-stretch gap-2">
            <PersonCard name="Emin" color="indigo" initial="E" count={eminCount} isWinner={winner === "emin"} tasks={eminCompleted} />
            <PersonCard name="Emre" color="amber" initial="E" count={emreCount} isWinner={winner === "emre"} tasks={emreCompleted} />
            <PersonCard name="Tuna" color="cyan" initial="T" count={tunaCount} isWinner={winner === "tuna"} tasks={tunaCompleted} />
          </div>

          {vsTotal > 0 && (
            <div className="space-y-1.5">
              <div className="flex h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-700" style={{ width: `${Math.round((eminCount / vsTotal) * 100)}%` }} />
                <div className="bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-700" style={{ width: `${Math.round((emreCount / vsTotal) * 100)}%` }} />
                <div className="bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-700 flex-1" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Emin %{Math.round((eminCount / vsTotal) * 100)}</span>
                <span>Emre %{Math.round((emreCount / vsTotal) * 100)}</span>
                <span>Tuna %{Math.round((tunaCount / vsTotal) * 100)}</span>
              </div>
            </div>
          )}

          {vsTotal === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">Bu dönemde tamamlanan görev yok</p>
          )}
        </div>

        {/* Tamamlanan görevler */}
        <div className="surface-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">
              Tamamlananlar
              <span className="ml-1.5 text-xs font-normal text-slate-400">({completedInPeriod.length})</span>
            </h2>
          </div>
          {completedInPeriod.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">Bu dönemde tamamlanan görev yok</p>
          ) : (
            <div className="space-y-1">
              {completedInPeriod.map((t) => (
                <TaskRow key={t.id} task={t} done />
              ))}
            </div>
          )}
        </div>

        {/* Geciken görevler */}
        <div className="surface-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">
              Geciken Görevler
              <span className="ml-1.5 text-xs font-normal text-slate-400">({overdueTasks.length})</span>
            </h2>
          </div>
          {overdueTasks.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">Geciken görev yok 🎉</p>
          ) : (
            <div className="space-y-1">
              {overdueTasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          )}
        </div>

        {/* Geçmiş özetler */}
        {history.length > 0 && (
          <div className="surface-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-violet-500" />
              <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">Geçmiş Özetler</h2>
            </div>
            <div className="space-y-2">
              {history.map((s) => (
                <HistoryCard
                  key={s.id}
                  summary={s}
                  expanded={expandedId === s.id}
                  onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="pb-4 text-center">
          <Link href="/" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
            ← Ana sayfaya dön
          </Link>
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, bg, value, label }: { icon: React.ReactNode; bg: string; value: number; label: string }) {
  return (
    <div className="surface-card px-3 py-4 flex flex-col items-center gap-2 text-center">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bg)}>{icon}</div>
      <p className="font-display font-bold text-2xl text-slate-900 dark:text-slate-100 leading-none tabular-nums">{value}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{label}</p>
    </div>
  )
}

function PersonCard({
  name, color, initial, count, isWinner, tasks,
}: {
  name: string; color: "indigo" | "amber" | "cyan"; initial: string; count: number; isWinner: boolean; tasks: Task[]
}) {
  const overdue = tasks.filter(isOverdue).length
  const gradientClass =
    color === "indigo" ? "bg-gradient-to-br from-indigo-400 to-indigo-600"
    : color === "amber" ? "bg-gradient-to-br from-amber-400 to-amber-600"
    : "bg-gradient-to-br from-cyan-400 to-cyan-600"
  const winnerBorderClass =
    color === "indigo" ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
    : color === "amber" ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
    : "border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
  const countClass =
    color === "indigo" ? "text-indigo-600" : color === "amber" ? "text-amber-600" : "text-cyan-600"
  return (
    <div className={cn(
      "flex-1 rounded-2xl p-3 text-center border-2 transition-all space-y-1",
      isWinner ? winnerBorderClass : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
    )}>
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base mx-auto", gradientClass)}>
        {initial}
      </div>
      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{name}</p>
      <p className={cn("text-2xl font-display font-bold", countClass)}>{count}</p>
      <p className="text-[10px] text-slate-500">tamamlandı</p>
      {overdue > 0 && <p className="text-[10px] text-red-500">{overdue} gecikmiş</p>}
      {isWinner && <p className="text-[10px] text-amber-500 font-medium">🏆 Lider</p>}
    </div>
  )
}

function TaskRow({ task, done }: { task: Task; done?: boolean }) {
  const ownerClass =
    task.owner === "emin" ? "bg-gradient-to-br from-indigo-400 to-indigo-600"
    : task.owner === "emre" ? "bg-gradient-to-br from-amber-400 to-amber-600"
    : task.owner === "tuna" ? "bg-gradient-to-br from-cyan-400 to-cyan-600"
    : "bg-gradient-to-br from-emerald-400 to-emerald-600"
  const ownerInitial =
    task.owner === "shared" ? "◆" : task.owner === "tuna" ? "T" : "E"

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
    >
      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0", ownerClass)}>
        {ownerInitial}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm truncate", done ? "text-slate-500 dark:text-slate-400 line-through decoration-slate-300" : "text-slate-700 dark:text-slate-300")}>
          {task.title}
        </p>
        {!done && task.due_date && (
          <p className="text-[10px] text-red-500 font-mono">{format(parseISO(task.due_date), "d MMM", { locale: tr })}</p>
        )}
      </div>
      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md border flex-shrink-0", PRIORITY_COLORS[task.priority])}>
        {PRIORITY_LABELS[task.priority]}
      </span>
    </Link>
  )
}

function HistoryCard({ summary, expanded, onToggle }: { summary: WeeklySummary; expanded: boolean; onToggle: () => void }) {
  const weekLabel = `${format(parseISO(summary.week_start), "d MMM", { locale: tr })} – ${format(parseISO(summary.week_end), "d MMM yyyy", { locale: tr })}`
  const winner = summary.emin_completed > summary.emre_completed ? "Emin 🏆" : summary.emre_completed > summary.emin_completed ? "Emre 🏆" : "Eşit 🤝"

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="text-left">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{weekLabel}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {summary.total_completed} tamamlandı · {summary.total_overdue} gecikmiş · {winner}
          </p>
        </div>
        {expanded
          ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
          : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700/60 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-3 text-center">
              <p className="text-lg font-bold text-indigo-600">{summary.emin_completed}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Emin tamamladı</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
              <p className="text-lg font-bold text-amber-600">{summary.emre_completed}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Emre tamamladı</p>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
            <span>✅ Toplam: <strong>{summary.total_completed}</strong></span>
            <span>⚠️ Geciken: <strong className="text-red-500">{summary.total_overdue}</strong></span>
          </div>
        </div>
      )}
    </div>
  )
}
