"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"
import {
  Calendar, CheckSquare, Tag, AlertCircle, Clock, GripVertical, ChevronRight
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  type Task,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
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

  const priorityDot: Record<string, string> = {
    low: "bg-slate-400",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "task-card group",
        isDragging && !overlay && "opacity-40",
        overlay && "drag-overlay rotate-2 scale-105"
      )}
    >
      {/* Drag handle + priority dot */}
      <div className="flex items-start gap-2 mb-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 transition-colors flex-shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", priorityDot[task.priority])} />
            <button
              onClick={() => router.push(`/tasks/${task.id}`)}
              className="text-sm font-medium font-body text-slate-800 leading-snug text-left hover:text-indigo-700 transition-colors line-clamp-2 group-hover:text-indigo-600"
            >
              {task.title}
            </button>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground font-body line-clamp-2 ml-4 mb-2">
              {task.description}
            </p>
          )}
        </div>

        <button
          onClick={() => router.push(`/tasks/${task.id}`)}
          className="flex-shrink-0 text-slate-300 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3 ml-6">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground font-mono">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Checklist progress */}
      {total > 0 && (
        <div className="ml-6 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-body">
              <CheckSquare className="h-3 w-3" />
              {done}/{total}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {/* Footer: priority badge + due date */}
      <div className="flex items-center justify-between ml-6">
        <Badge
          className={cn(
            "text-[10px] px-2 py-0.5 border font-body",
            PRIORITY_COLORS[task.priority]
          )}
          variant="outline"
        >
          {PRIORITY_LABELS[task.priority]}
        </Badge>

        {task.due_date && (
          <div
            className={cn(
              "flex items-center gap-1 text-[10px] font-mono rounded-md px-1.5 py-0.5",
              overdue
                ? "text-red-600 bg-red-50 border border-red-100"
                : soon
                ? "text-amber-600 bg-amber-50 border border-amber-100"
                : "text-slate-500 bg-slate-50"
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
