"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, ExternalLink, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import TaskCard from "./TaskCard"
import type { Task, Owner } from "@/lib/tasks"

interface ColumnProps {
  owner: Owner
  tasks: Task[]
  label: string
  emoji: string
  color: string
  accentColor: string
  stats: { total: number; done: number; overdue: number }
}

export default function Column({
  owner,
  tasks,
  label,
  emoji,
  color,
  accentColor,
  stats,
}: ColumnProps) {
  const router = useRouter()
  const { setNodeRef, isOver } = useDroppable({ id: owner })

  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  const dotColor = {
    emin: "bg-indigo-500",
    emre: "bg-amber-500",
    shared: "bg-emerald-500",
  }[owner]

  const progressColor = {
    emin: "bg-indigo-400",
    emre: "bg-amber-400",
    shared: "bg-emerald-400",
  }[owner]

  const ringColor = {
    emin: "ring-indigo-300/60",
    emre: "ring-amber-300/60",
    shared: "ring-emerald-300/60",
  }[owner]

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "kanban-column relative",
        `column-${owner}`,
        isOver && `ring-2 ring-offset-2 ring-offset-background ${ringColor}`
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-display font-bold border",
                color
              )}
            >
              {emoji}
            </div>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900",
                dotColor
              )}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 leading-none tracking-tight">
                {label}
              </h3>
              {(owner === "emin" || owner === "emre") && (
                <Link
                  href={`/${owner}`}
                  title={`${label} sayfasına git`}
                  className={cn(
                    "opacity-30 hover:opacity-100 transition-opacity",
                    `column-accent-${owner}`
                  )}
                >
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              <span className="ml-1 text-[11px] font-mono font-medium tabular-nums text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {stats.done}/{stats.total} tamamlandı
              </span>
              {stats.overdue > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-500">
                  <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                  {stats.overdue} gecikmiş
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/tasks/new?owner=${owner}`)}
            className={cn(
              "h-7 w-7 rounded-lg opacity-60 hover:opacity-100 transition-all",
              accentColor
            )}
            title="Görev ekle"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg opacity-40 hover:opacity-100 text-slate-500"
            title="Diğer"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="mb-3">
          <div className="w-full h-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", progressColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Tasks */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2.5 flex-1">
          {tasks.length === 0 ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center py-12 rounded-xl border border-dashed text-center transition-all duration-300",
                isOver
                  ? "border-current bg-white/60 dark:bg-slate-800/60 scale-[1.01]"
                  : "border-slate-200/70 dark:border-slate-700/70 bg-white/20 dark:bg-slate-800/10",
                owner === "emin" && isOver && "border-indigo-400 text-indigo-500",
                owner === "emre" && isOver && "border-amber-400 text-amber-500",
                owner === "shared" && isOver && "border-emerald-400 text-emerald-500"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors",
                  isOver ? "bg-white/80 dark:bg-slate-700/80" : "bg-slate-100/60 dark:bg-slate-800/60"
                )}
              >
                <Plus
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isOver ? "text-current" : "text-slate-400"
                  )}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isOver ? "Buraya bırak" : "Henüz görev yok"}
              </p>
              <button
                onClick={() => router.push(`/tasks/new?owner=${owner}`)}
                className={cn(
                  "mt-2 text-[11px] font-medium transition-colors",
                  owner === "emin" && "text-indigo-500 hover:text-indigo-700",
                  owner === "emre" && "text-amber-500 hover:text-amber-700",
                  owner === "shared" && "text-emerald-500 hover:text-emerald-700"
                )}
              >
                Görev ekle →
              </button>
            </div>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </SortableContext>
    </div>
  )
}
