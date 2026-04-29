"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, X, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { supabase, type Notification } from "@/lib/supabase"
import { markNotificationRead, markAllNotificationsRead, registerPush } from "@/lib/notifications"
import { useCurrentUser } from "@/lib/auth"

const typeConfig = {
  reminder:  { icon: "⏰", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
  overdue:   { icon: "🚨", color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
  completed: { icon: "✅", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
  assigned:  { icon: "👤", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" },
  summary:   { icon: "📊", color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20" },
}

export default function NotificationBell() {
  const router = useRouter()
  const { user: currentUser } = useCurrentUser()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [pushEnabled, setPushEnabled] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushEnabled(Notification.permission === "granted")
    }
  }, [])

  const unread = notifs.filter((n) => !n.read).length

  // currentUser hazır olunca bildirimleri çek
  useEffect(() => {
    async function fetchNotifs() {
      const owner = currentUser?.owner
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30)

      if (owner) {
        // Sadece kendi bildirimleri ve "both" olarak gönderilenleri göster
        query = query.or(`recipient.eq.both,recipient.eq.${owner}`)
      }

      const { data, error } = await query
      if (error) console.error("[NotificationBell] fetch error:", error)
      else if (data) setNotifs(data)
    }

    fetchNotifs()

    // Realtime: yeni bildirim eklenince filtrele
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const notif = payload.new as Notification
          const owner = currentUser?.owner
          // Sadece kendi bildirimleri ve "both" bildirimleri ekle
          if (!owner || notif.recipient === "both" || notif.recipient === owner) {
            setNotifs((prev) => [notif, ...prev])
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          setNotifs((prev) =>
            prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
          )
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        (payload) => {
          setNotifs((prev) => prev.filter((n) => n.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.owner])

  async function handleMarkRead(id: string) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await markNotificationRead(id)
  }

  async function handleMarkAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    await markAllNotificationsRead(currentUser?.owner)
  }

  function dismiss(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id))
    supabase.from("notifications").delete().eq("id", id)
  }

  // Dışarı tıklanınca kapat
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-notif-panel]")) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative" data-notif-panel>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative rounded-xl hover:bg-white/80"
      >
        <Bell className="h-5 w-5 text-slate-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse-glow">
            {unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <span className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">Bildirimler</span>
              {unread > 0 && (
                <Badge className="h-5 text-[10px] px-1.5 bg-indigo-600">{unread}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!pushEnabled && (
                <button
                  onClick={async () => {
                    const ok = await registerPush()
                    if (ok) setPushEnabled(true)
                  }}
                  className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 font-medium transition-colors"
                  title="Telefona bildirim al"
                >
                  <Bell className="h-3 w-3" />
                  Bildirimleri aç
                </button>
              )}
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  <CheckCheck className="h-3 w-3" />
                  Tümünü oku
                </button>
              )}
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-[340px] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-body">Bildirim yok</p>
              </div>
            ) : (
              notifs.map((notif) => {
                const cfg = typeConfig[notif.type]
                const isSummary = notif.type === "summary"
                return (
                  <div
                    key={notif.id}
                    onClick={() => { if (isSummary) { setOpen(false); router.push("/summary") } }}
                    className={cn(
                      "flex gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/60 group",
                      !notif.read && "bg-indigo-50/30 dark:bg-indigo-900/10",
                      isSummary && "cursor-pointer hover:bg-violet-50/50 dark:hover:bg-violet-900/10"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 mt-0.5", cfg.color)}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs leading-relaxed font-body", !notif.read ? "text-slate-800 dark:text-slate-200 font-medium" : "text-slate-500 dark:text-slate-400")}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: tr })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!notif.read && (
                        <button onClick={() => handleMarkRead(notif.id)} title="Okundu" className="text-indigo-400 hover:text-indigo-600 transition-colors">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => dismiss(notif.id)} title="Kaldır" className="text-slate-300 hover:text-red-400 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
