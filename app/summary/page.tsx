"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  BarChart3,
  Calendar,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { loadTasks, isOverdue, PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/tasks"
import type { Task } from "@/lib/tasks"
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns"
import { tr } from "date-fns/locale"

export default function SummaryPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    loadTasks().then((data) => { setTasks(data); setMounted(true) })
  }, [])

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const completedThisWeek = tasks.filter(
    (t) =>
      t.status === "done" &&
      t.updated_at &&
      isWithinInterval(new Date(t.updated_at), { start: weekStart, end: weekEnd })
  )
  const overdueTasks = tasks.filter(isOverdue)
  const eminCompleted = completedThisWeek.filter((t) => t.owner === "emin")
  const emreCompleted = completedThisWeek.filter((t) => t.owner === "emre")

  const eminCount = eminCompleted.length
  const emreCount = emreCompleted.length
  const total = eminCount + emreCount

  const eminPct = total > 0 ? Math.round((eminCount / total) * 100) : 50
  const emrePct = total > 0 ? 100 - eminPct : 50

  let winner = ""
  if (eminCount > emreCount) winner = "emin"
  else if (emreCount > eminCount) winner = "emre"

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/75 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 h-16">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </button>
            <div>
              <h1 className="font-display font-bold text-[15px] text-slate-900 dark:text-slate-100 leading-none">
                Haftalık Özet
              </h1>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                {format(weekStart, "d MMM", { locale: tr })} – {format(weekEnd, "d MMM yyyy", { locale: tr })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Özet kartları */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            bg="bg-emerald-50 dark:bg-emerald-900/20"
            value={completedThisWeek.length}
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

        {/* Kişi bazlı karşılaştırma */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">Bu Hafta En Aktif</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Emin */}
            <div className={cn(
              "flex-1 rounded-2xl p-4 text-center border-2 transition-all",
              winner === "emin"
                ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
            )}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                E
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Emin</p>
              <p className="text-2xl font-display font-bold text-indigo-600 mt-1">{eminCount}</p>
              <p className="text-xs text-slate-500">görev</p>
              {winner === "emin" && <p className="text-xs text-amber-500 font-medium mt-1">🏆 Bu haftanın lideri</p>}
            </div>

            <div className="text-slate-300 dark:text-slate-600 font-bold text-lg">VS</div>

            {/* Emre */}
            <div className={cn(
              "flex-1 rounded-2xl p-4 text-center border-2 transition-all",
              winner === "emre"
                ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
            )}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                E
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Emre</p>
              <p className="text-2xl font-display font-bold text-amber-600 mt-1">{emreCount}</p>
              <p className="text-xs text-slate-500">görev</p>
              {winner === "emre" && <p className="text-xs text-amber-500 font-medium mt-1">🏆 Bu haftanın lideri</p>}
            </div>
          </div>

          {/* Bar grafik */}
          {total > 0 && (
            <div className="space-y-1.5">
              <div className="flex h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-700"
                  style={{ width: `${eminPct}%` }}
                />
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-700"
                  style={{ width: `${emrePct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Emin %{eminPct}</span>
                <span>Emre %{emrePct}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tamamlanan görevler */}
        <div className="surface-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">
              Bu Hafta Tamamlananlar
              {completedThisWeek.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">({completedThisWeek.length})</span>
              )}
            </h2>
          </div>
          {completedThisWeek.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">Bu hafta tamamlanan görev yok</p>
          ) : (
            <div className="space-y-1.5">
              {completedThisWeek.map((t) => (
                <Link
                  key={t.id}
                  href={`/tasks/${t.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0",
                    t.owner === "emin" ? "bg-gradient-to-br from-indigo-400 to-indigo-600" : t.owner === "emre" ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-gradient-to-br from-emerald-400 to-emerald-600"
                  )}>
                    {t.owner === "shared" ? "◆" : "E"}
                  </div>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 line-through decoration-slate-300 dark:decoration-slate-600 truncate">
                    {t.title}
                  </span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md border flex-shrink-0", PRIORITY_COLORS[t.priority])}>
                    {PRIORITY_LABELS[t.priority]}
                  </span>
                </Link>
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
              {overdueTasks.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">({overdueTasks.length})</span>
              )}
            </h2>
          </div>
          {overdueTasks.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">Geciken görev yok 🎉</p>
          ) : (
            <div className="space-y-1.5">
              {overdueTasks.map((t) => (
                <Link
                  key={t.id}
                  href={`/tasks/${t.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors group"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0",
                    t.owner === "emin" ? "bg-gradient-to-br from-indigo-400 to-indigo-600" : t.owner === "emre" ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-gradient-to-br from-emerald-400 to-emerald-600"
                  )}>
                    {t.owner === "shared" ? "◆" : "E"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{t.title}</p>
                    {t.due_date && (
                      <p className="text-[10px] text-red-500 font-mono">
                        {format(parseISO(t.due_date), "d MMM yyyy", { locale: tr })}
                      </p>
                    )}
                  </div>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md border flex-shrink-0", PRIORITY_COLORS[t.priority])}>
                    {PRIORITY_LABELS[t.priority]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Kişi bazlı detay */}
        <div className="grid grid-cols-2 gap-3">
          <OwnerStats
            name="Emin"
            color="indigo"
            tasks={tasks.filter((t) => t.owner === "emin")}
          />
          <OwnerStats
            name="Emre"
            color="amber"
            tasks={tasks.filter((t) => t.owner === "emre")}
          />
        </div>

        <div className="pb-6 text-center">
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
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bg)}>
        {icon}
      </div>
      <p className="font-display font-bold text-2xl text-slate-900 dark:text-slate-100 leading-none tabular-nums">{value}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{label}</p>
    </div>
  )
}

function OwnerStats({ name, color, tasks }: { name: string; color: "indigo" | "amber"; tasks: Task[] }) {
  const done = tasks.filter((t) => t.status === "done").length
  const total = tasks.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const inProgress = tasks.filter((t) => t.status === "in_progress").length
  const overdue = tasks.filter(isOverdue).length

  const barColor = color === "indigo" ? "bg-gradient-to-r from-indigo-400 to-indigo-600" : "bg-gradient-to-r from-amber-400 to-amber-600"
  const textColor = color === "indigo" ? "text-indigo-600" : "text-amber-600"

  return (
    <div className="surface-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs", color === "indigo" ? "bg-gradient-to-br from-indigo-400 to-indigo-600" : "bg-gradient-to-br from-amber-400 to-amber-600")}>
          E
        </div>
        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{name}</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Tamamlama</span>
          <span className={cn("font-bold", textColor)}>%{pct}</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-700", barColor)} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{total}</p>
          <p className="text-[10px] text-slate-400">Toplam</p>
        </div>
        <div>
          <p className="font-bold text-sm text-emerald-600">{done}</p>
          <p className="text-[10px] text-slate-400">Bitti</p>
        </div>
        <div>
          <p className={cn("font-bold text-sm", overdue > 0 ? "text-red-500" : "text-slate-400")}>{overdue}</p>
          <p className="text-[10px] text-slate-400">Gecikti</p>
        </div>
      </div>
    </div>
  )
}
