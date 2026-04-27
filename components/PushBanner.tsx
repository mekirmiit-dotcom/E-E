"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"
import { registerPush } from "@/lib/notifications"

export default function PushBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return
    if (Notification.permission !== "default") return
    if (sessionStorage.getItem("push-banner-dismissed")) return
    setShow(true)
  }, [])

  if (!show) return null

  async function handleAllow() {
    setShow(false)
    await registerPush()
  }

  function handleDismiss() {
    setShow(false)
    sessionStorage.setItem("push-banner-dismissed", "1")
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 shadow-2xl px-4 py-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
          <Bell className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Bildirimleri etkinleştir</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Yeni görev ve yorumlardan anında haberdar ol.</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAllow}
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              Bildirimlere İzin Ver
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              Şimdi Değil
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
