"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { motion, AnimatePresence, useAnimation } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, ExternalLink, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import TaskCard from "./TaskCard"
import type { Task, Owner } from "@/lib/tasks"
import { useEffect, useRef } from "react"

interface ColumnProps {
  owner: Owner
  tasks: Task[]
  label: string
  emoji: string
  color: string
  accentColor: string
  stats: { total: number; done: number; overdue: number }
  settledId?: string | null
}

export default function Column({
  owner,
  tasks,
  label,
  emoji,
  color,
  accentColor,
  stats,
  settledId,
}: ColumnProps) {
  const router = useRouter()
  const { setNodeRef, isOver } = useDroppable({ id: owner })
  const rippleControls = useAnimation()
  const prevIsOver = useRef(false)

  // Ripple tetikleyici: isOver false→true geçişinde
  useEffect(() => {
    if (isOver && !prevIsOver.current) {
      rippleControls.start({
        scale: [1, 1.06, 1],
        opacity: [0.7, 0, 0],
        transition: { duration: 0.55, ease: "easeOut" },
      })
    }
    prevIsOver.current = isOver
  }, [isOver, rippleControls])

  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  const dotColor = {
    emin: "bg-indigo-500",
    emre: "bg-amber-500",
    tuna: "bg-cyan-500",
    shared: "bg-emerald-500",
  }[owner]

  const progressColor = {
    emin: "bg-indigo-400",
    emre: "bg-amber-400",
    tuna: "bg-cyan-400",
    shared: "bg-emerald-400",
  }[owner]

  const borderGlow = {
    emin: "border-indigo-400/50",
    emre: "border-amber-400/50",
    tuna: "border-cyan-400/50",
    shared: "border-emerald-400/50",
  }[owner]

  const shimmerColor = {
    emin: "bg-indigo-400/20",
    emre: "bg-amber-400/20",
    tuna: "bg-cyan-400/20",
    shared: "bg-emerald-400/20",
  }[owner]

  const glowColor = {
    emin: "from-indigo-400/15 via-indigo-300/8 to-transparent",
    emre: "from-amber-400/15 via-amber-300/8 to-transparent",
    tuna: "from-cyan-400/15 via-cyan-300/8 to-transparent",
    shared: "from-emerald-400/15 via-emerald-300/8 to-transparent",
  }[owner]

  const columnGlowShadow = {
    emin: "0 0 0 2px rgba(99,102,241,0.5), 0 0 32px 4px rgba(99,102,241,0.12)",
    emre: "0 0 0 2px rgba(245,158,11,0.5), 0 0 32px 4px rgba(245,158,11,0.12)",
    tuna: "0 0 0 2px rgba(6,182,212,0.5), 0 0 32px 4px rgba(6,182,212,0.12)",
    shared: "0 0 0 2px rgba(16,185,129,0.5), 0 0 32px 4px rgba(16,185,129,0.12)",
  }[owner]

  const rippleBorder = {
    emin: "2px solid rgba(99,102,241,0.6)",
    emre: "2px solid rgba(245,158,11,0.6)",
    tuna: "2px solid rgba(6,182,212,0.6)",
    shared: "2px solid rgba(16,185,129,0.6)",
  }[owner]

  return (
    <motion.div
      ref={setNodeRef}
      className={cn(
        "kanban-column relative",
        `column-${owner}`,
        isOver && `border ${borderGlow}`,
      )}
      animate={
        isOver
          ? { boxShadow: columnGlowShadow, scale: 1.012 }
          : { boxShadow: "0px 0px 0px rgba(0,0,0,0)", scale: 1 }
      }
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {/* Ripple burst — sütuna ilk girildiğinde */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none z-0"
        style={{ border: rippleBorder, opacity: 0 }}
        animate={rippleControls}
      />

      {/* Glow overlay — sürükleme devam ederken */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            key="glow"
            className={cn(
              "absolute inset-0 rounded-2xl bg-gradient-to-b pointer-events-none z-0",
              glowColor
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className={cn("absolute inset-y-0 w-1/2 skew-x-[-20deg] opacity-60", shimmerColor)}
              style={{ animation: "column-shimmer 1.2s ease-in-out infinite" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
              {(owner === "emin" || owner === "emre" || owner === "tuna") && (
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
        <div className="flex flex-col gap-2.5 flex-1 relative z-10 md:max-h-[calc(100vh-280px)] md:overflow-y-auto md:pr-0.5">
          {tasks.length === 0 ? (
            <motion.div
              className={cn(
                "flex flex-col items-center justify-center py-12 rounded-xl border border-dashed text-center transition-all duration-300",
                isOver
                  ? "border-current bg-white/60 dark:bg-slate-800/60 scale-[1.01]"
                  : "border-slate-200/70 dark:border-slate-700/70 bg-white/20 dark:bg-slate-800/10",
                owner === "emin" && isOver && "border-indigo-400 text-indigo-500",
                owner === "emre" && isOver && "border-amber-400 text-amber-500",
                owner === "tuna" && isOver && "border-cyan-400 text-cyan-500",
                owner === "shared" && isOver && "border-emerald-400 text-emerald-500"
              )}
              animate={isOver ? { scale: 1.02 } : { scale: 1 }}
              transition={{ duration: 0.15 }}
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
                  owner === "tuna" && "text-cyan-500 hover:text-cyan-700",
                  owner === "shared" && "text-emerald-500 hover:text-emerald-700"
                )}
              >
                Görev ekle →
              </button>
            </motion.div>
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: -14, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.93,
                    y: 6,
                    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  layout="position"
                >
                  <TaskCard task={task} settled={task.id === settledId} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </SortableContext>
    </motion.div>
  )
}
