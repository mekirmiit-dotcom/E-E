"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, User, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const links = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/emin", label: "Emin", icon: null, initial: "E", color: "from-indigo-400 to-indigo-600" },
    { href: "/emre", label: "Emre", icon: null, initial: "E", color: "from-amber-400 to-amber-600" },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-700/60 safe-area-bottom">
      <div className="flex items-center justify-around px-2 h-16">
        {links.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 flex-1 py-2 transition-all",
                isActive ? "opacity-100" : "opacity-50 hover:opacity-80"
              )}
            >
              {Icon ? (
                <div className={cn(
                  "w-7 h-7 rounded-xl flex items-center justify-center transition-all",
                  isActive ? "bg-slate-900 dark:bg-slate-100" : "bg-slate-100 dark:bg-slate-800"
                )}>
                  <Icon className={cn("h-4 w-4", isActive ? "text-white dark:text-slate-900" : "text-slate-500 dark:text-slate-400")} />
                </div>
              ) : (
                <div className={cn(
                  "w-7 h-7 rounded-xl flex items-center justify-center font-bold text-white text-xs bg-gradient-to-br transition-all",
                  link.color,
                  isActive ? "scale-110 shadow-md" : ""
                )}>
                  {link.initial}
                </div>
              )}
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
              )}>
                {link.label}
              </span>
            </Link>
          )
        })}

        {/* Yeni Görev butonu */}
        <button
          onClick={() => router.push("/tasks/new")}
          className="flex flex-col items-center gap-1 flex-1 py-2 opacity-70 hover:opacity-100 transition-all"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
            <Plus className="h-4 w-4 text-white" />
          </div>
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Yeni</span>
        </button>
      </div>
    </nav>
  )
}
