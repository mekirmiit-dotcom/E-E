"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"
import {
  Calendar,
  CheckSquare,
  Tag,
  AlertCircle,
  Clock,
  GripVertical,
  ArrowUpRight,
  StickyNote,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  type Task,
  type Priority,
  PRIORITY_LABELS,
  TASK_COLORS,
  isOverdue,
  isDueSoon,
} from "@/lib/tasks"

interface TaskCardProps {
  task: Task
  overlay?: boolean
}

export default function TaskCard({ task, overlay = false }: TaskCardProps) {
  const router = useRouter()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const done = task.checklist.filter((c) => c.done).length
  const total = task.checklist.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0
  const overdue = isOverdue(task)
  const soon = isDueSoon(task)

  const priorityChipClass: Record<Priority, string> = {
    low: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    medium: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900",
    high: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-900",
    critical: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900",
  }

  const colorHex = task.color ? TASK_COLORS.find((c) => c.id === task.color)?.hex : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "task-card group animate-stagger-in relative overflow-hidden",
        `priority-${task.priority}`,
        isDragging && !overlay && "opacity-40",
        overlay && "drag-overlay"
      )}
    >
      {/* Color strip */}
      {colorHex && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
          style={{ backgroundColor: colorHex }}
        />
      )}

      {/* Title row */}
      <div className="flex items-start gap-2 mb-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        <div className="flex-1 min-w-0 -ml-6 group-hover:ml-0 transition-all duration-200">
          <button
            onClick={() => router.push(`/tasks/${task.id}`)}
            className="text-[13.5px] font-medium text-slate-800 dark:text-slate-200 leading-snug text-left hover:text-slate-900 dark:hover:text-white transition-colors line-clamp-2 block w-full"
          >
            {task.title}
          </button>

          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        <button
          onClick={() => router.push(`/tasks/${task.id}`)}
          className="flex-shrink-0 text-slate-300 hover:text-indigo-500 transition-all opacity-0 group-hover:opacity-100 -mr-1"
          title="Detay"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] text-slate-400 font-mono px-1 py-0.5">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Checklist progress */}
      {total > 0 && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <CheckSquare className="h-3 w-3" />
              <span className="tabular-nums">{done}/{total}</span>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tabular-nums">%{progress}</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-md border font-medium",
              priorityChipClass[task.priority]
            )}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.notes && (
            <span title="Not mevcut" className="text-slate-400 flex-shrink-0">
              <StickyNote className="h-3 w-3" />
            </span>
          )}
        </div>

        {task.due_date && (
          <div
            className={cn(
              "flex items-center gap-1 text-[10px] font-mono tabular-nums rounded-md px-1.5 py-0.5 flex-shrink-0",
              overdue
                ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900"
                : soon
                ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900"
                : "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
            )}
          >
            {overdue ? (
              <AlertCircle className="h-3 w-3" />
            ) : soon ? (
              <Clock className="h-3 w-3" />
            ) : (
              <Calendar className="h-3 w-3" />
            )}
            {format(parseISO(task.due_date), "d MMM", { locale: tr })}
          </div>
        )}
      </div>
    </div>
  )
}
