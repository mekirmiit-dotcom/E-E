"use client"

import React, { useState, useEffect } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { motion } from "framer-motion"
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
  settled?: boolean
}

const DRAG_SHADOW = "0 32px 64px rgba(15,23,42,0.32), 0 16px 32px rgba(15,23,42,0.18), 0 0 0 1.5px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.95)"
const IDLE_SHADOW = "0 1px 2px rgba(15,23,42,0.03)"

function calcTimePct(createdAt: string, dueDate: string, dueTime: string): number {
  const created = new Date(createdAt).getTime()
  const deadline = new Date(`${dueDate}T${dueTime}:00`).getTime()
  if (deadline <= created) return 0
  const elapsed = Date.now() - created
  const total = deadline - created
  return Math.max(0, (elapsed / total) * 100)
}

function HourglassBar({ task }: { task: Task }) {
  const [pct, setPct] = useState(() =>
    calcTimePct(task.created_at, task.due_date!, task.due_time!)
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setPct(calcTimePct(task.created_at, task.due_date!, task.due_time!))
    }, 60_000)
    return () => clearInterval(timer)
  }, [task.created_at, task.due_date, task.due_time])

  const clampedPct = Math.min(pct, 100)
  const overdue = pct >= 100
  const critical = pct >= 85 && !overdue
  const warning = pct >= 60 && !critical && !overdue

  const fillColor = overdue || critical ? "bg-red-500" : warning ? "bg-amber-400" : "bg-emerald-500"
  const trackColor = overdue || critical
    ? "bg-red-100 dark:bg-red-900/30"
    : warning
    ? "bg-amber-100 dark:bg-amber-900/30"
    : "bg-emerald-100 dark:bg-emerald-900/30"
  const labelColor = overdue
    ? "text-red-600 dark:text-red-400"
    : critical
    ? "text-red-500 dark:text-red-400"
    : warning
    ? "text-amber-600 dark:text-amber-400"
    : "text-emerald-600 dark:text-emerald-500"

  return (
    <div className="mt-2.5 pt-2.5 border-t border-slate-100/80 dark:border-slate-700/60">
      <div className="flex items-center gap-1.5">
        <span className={cn("text-xs leading-none flex-shrink-0 animate-hourglass", overdue && "animate-pulse-danger")}>
          ⏳
        </span>
        <div
          className={cn(
            "flex-1 h-2 rounded-full overflow-hidden relative hourglass-bar-3d",
            trackColor
          )}
        >
          <div
            className={cn(
              "h-full rounded-full",
              fillColor,
              overdue && "animate-pulse-danger",
              critical && "animate-shake-bar"
            )}
            style={{ width: `${clampedPct}%`, transition: "width 1.5s ease-out" }}
          />
        </div>
        <span className={cn("text-[9px] font-mono tabular-nums flex-shrink-0 w-10 text-right", labelColor)}>
          {overdue ? "GECİKTİ" : `%${Math.round(clampedPct)}`}
        </span>
      </div>
    </div>
  )
}

export default function TaskCard({ task, overlay = false, settled = false }: TaskCardProps) {
  const router = useRouter()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    transition: {
      duration: 200,
      easing: "ease",
    },
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition ?? undefined,
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

  const motionAnimate = overlay
    ? {
        scale: 1.05,
        rotate: 3.5,
        opacity: 1,
        boxShadow: DRAG_SHADOW,
        filter: "brightness(1.04) saturate(1.08)",
      }
    : isDragging
    ? { scale: 0.96, rotate: 0, opacity: 0.25, boxShadow: "none", filter: "brightness(1)" }
    : settled
    ? {
        scale: [1, 0.94, 1.04, 0.99, 1] as number[],
        opacity: 1,
        rotate: 0,
        filter: "brightness(1)",
        boxShadow: IDLE_SHADOW,
      }
    : { scale: 1, rotate: 0, opacity: 1, boxShadow: IDLE_SHADOW, filter: "brightness(1)" }

  const motionTransition = settled
    ? { duration: 0.5, times: [0, 0.25, 0.6, 0.8, 1], ease: "easeOut" as const }
    : { type: "spring" as const, stiffness: 300, damping: 25 }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, touchAction: "manipulation" }}
      {...attributes}
      {...listeners}
      className="select-none"
    >
      <motion.div
        className={cn(
          "task-card group animate-stagger-in relative overflow-hidden",
          `priority-${task.priority}`,
          (isDragging && !overlay) && "!border-dashed !border-slate-300/50 dark:!border-slate-600/40 !bg-slate-50/40 dark:!bg-slate-800/20",
          overlay && "!border-indigo-300/60 dark:!border-indigo-700/50 cursor-grabbing task-card-overlay",
        )}
        style={overlay ? {
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          background: "rgba(255, 255, 255, 0.88)",
        } : undefined}
        initial={false}
        animate={motionAnimate}
        transition={motionTransition}
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
          <div className="mt-0.5 text-slate-300 dark:text-slate-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-3.5 w-3.5" />
          </div>

          <div className="flex-1 min-w-0 -ml-6 group-hover:ml-0 transition-all duration-200">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/tasks/${task.id}`)
              }}
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
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/tasks/${task.id}`)
            }}
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
              {task.due_time && (
                <span className="ml-0.5 opacity-75">{task.due_time}</span>
              )}
            </div>
          )}
        </div>

        {/* Hourglass time progress — only when both due_date and due_time exist */}
        {task.due_date && task.due_time && !isDragging && (
          <HourglassBar task={task} />
        )}
      </motion.div>
    </div>
  )
}
