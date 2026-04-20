"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useRouter } from "next/navigation"
import { Plus, MoreHorizontal } from "lucide-react"
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

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "kanban-column transition-all duration-200",
        `column-${owner}`,
        isOver && "ring-2 ring-offset-2 scale-[1.01]",
        isOver && owner === "emin" && "ring-indigo-400",
        isOver && owner === "emre" && "ring-amber-400",
        isOver && owner === "shared" && "ring-emerald-400"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center text-base font-display font-bold shadow-sm",
              color
            )}
          >
            {emoji}
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-800 leading-none">
              {label}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-muted-foreground">
                {stats.done}/{stats.total} tamamlandı
              </span>
              {stats.overdue > 0 && (
                <span className="text-[10px] font-mono text-red-500">
                  {stats.overdue} gecikmiş
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/tasks/new?owner=${owner}`)}
            className={cn("h-7 w-7 rounded-lg opacity-60 hover:opacity-100 transition-opacity", accentColor)}
            title="Görev ekle"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="w-full h-1 bg-white/60 rounded-full overflow-hidden mb-1">
          <div
            className={cn("h-full rounded-full transition-all duration-700", {
              "bg-indigo-400": owner === "emin",
              "bg-amber-400": owner === "emre",
              "bg-emerald-400": owner === "shared",
            })}
            style={{ width: `${Math.round((stats.done / stats.total) * 100)}%` }}
          />
        </div>
      )}

      {/* Task count badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={cn(
            "text-[11px] font-mono font-medium px-2 py-0.5 rounded-full",
            owner === "emin" && "bg-indigo-100 text-indigo-700",
            owner === "emre" && "bg-amber-100 text-amber-700",
            owner === "shared" && "bg-emerald-100 text-emerald-700"
          )}
        >
          {tasks.length} görev
        </span>
      </div>

      {/* Tasks */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3 flex-1">
          {tasks.length === 0 ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed text-center transition-colors",
                isOver
                  ? "border-current bg-white/40"
                  : "border-slate-200 bg-white/20",
                owner === "emin" && isOver && "border-indigo-300",
                owner === "emre" && isOver && "border-amber-300",
                owner === "shared" && isOver && "border-emerald-300"
              )}
            >
              <p className="text-2xl mb-2">📋</p>
              <p className="text-xs text-muted-foreground font-body">
                {isOver ? "Buraya bırak" : "Henüz görev yok"}
              </p>
              <button
                onClick={() => router.push(`/tasks/new?owner=${owner}`)}
                className={cn(
                  "mt-3 text-xs font-medium transition-colors",
                  owner === "emin" && "text-indigo-500 hover:text-indigo-700",
                  owner === "emre" && "text-amber-500 hover:text-amber-700",
                  owner === "shared" && "text-emerald-500 hover:text-emerald-700"
                )}
              >
                + Görev ekle
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
