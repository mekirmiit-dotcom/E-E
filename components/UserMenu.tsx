"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, ChevronDown, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrentUser, signOut } from "@/lib/auth"
import Link from "next/link"

export default function UserMenu() {
  const { user, loading } = useCurrentUser()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  if (loading || !user) return null

  const isEmin = user.owner === "emin"

  async function handleSignOut() {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
      >
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold",
          isEmin ? "bg-gradient-to-br from-indigo-400 to-indigo-600" : "bg-gradient-to-br from-amber-400 to-amber-600"
        )}>
          E
        </div>
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
          {isEmin ? "Emin" : "Emre"}
        </span>
        <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-44 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-slide-in">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {isEmin ? "Emin" : "Emre"}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">{user.email}</p>
            </div>

            {user.isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-indigo-500" />
                Admin Paneli
              </Link>
            )}

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Çıkış Yap
            </button>
          </div>
        </>
      )}
    </div>
  )
}
