"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Settings, Check, Save, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useCurrentUser } from "@/lib/auth"
import Link from "next/link"

type Owner = "emin" | "emre" | "tuna"

type Prefs = {
  reminder_times: number[]
  notification_hour: number
}

const DEFAULT_PREFS: Prefs = { reminder_times: [24, 1], notification_hour: 8 }

const REMINDER_OPTIONS = [
  { value: 48, label: "48 saat önce", desc: "2 gün kala" },
  { value: 24, label: "24 saat önce", desc: "1 gün kala" },
  { value: 3,  label: "3 saat önce",  desc: "Gün içinde" },
  { value: 1,  label: "1 saat önce",  desc: "Son dakika" },
]

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7–19

export default function SettingsPage() {
  const router = useRouter()
  const [activeUser, setActiveUser] = useState<Owner>("emin")
  const [prefs, setPrefs] = useState<Record<Owner, Prefs>>({
    emin: { ...DEFAULT_PREFS },
    emre: { ...DEFAULT_PREFS },
    tuna: { ...DEFAULT_PREFS },
  })
  const { user: currentUser } = useCurrentUser()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .in("user", ["emin", "emre", "tuna"])

      if (data?.length) {
        const next = { ...prefs }
        for (const row of data) {
          next[row.user as Owner] = {
            reminder_times: row.reminder_times ?? DEFAULT_PREFS.reminder_times,
            notification_hour: row.notification_hour ?? DEFAULT_PREFS.notification_hour,
          }
        }
        setPrefs(next)
      }
      setMounted(true)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleReminderTime(user: Owner, value: number) {
    setPrefs((prev) => {
      const times = prev[user].reminder_times
      const next = times.includes(value) ? times.filter((t) => t !== value) : [...times, value]
      return { ...prev, [user]: { ...prev[user], reminder_times: next } }
    })
  }

  function setHour(user: Owner, hour: number) {
    setPrefs((prev) => ({ ...prev, [user]: { ...prev[user], notification_hour: hour } }))
  }

  async function handleSave() {
    setSaving(true)
    for (const user of ["emin", "emre", "tuna"] as Owner[]) {
      const p = prefs[user]
      await supabase
        .from("user_preferences")
        .upsert(
          { user, reminder_times: p.reminder_times, notification_hour: p.notification_hour },
          { onConflict: "user" }
        )
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!mounted) return null

  const p = prefs[activeUser]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/75 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-slate-500" />
              </button>
              <div>
                <h1 className="font-display font-bold text-[15px] text-slate-900 dark:text-slate-100 leading-none">Ayarlar</h1>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">Bildirim tercihleri</p>
              </div>
            </div>
            <Settings className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-5 pb-28">

        {/* Kullanıcı seçici */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          {(["emin", "emre", "tuna"] as Owner[]).map((u) => {
            const activeColor =
              u === "emin" ? "text-indigo-700 dark:text-indigo-300"
              : u === "emre" ? "text-amber-700 dark:text-amber-300"
              : "text-cyan-700 dark:text-cyan-300"
            const avatarGradient =
              u === "emin" ? "from-indigo-400 to-indigo-600"
              : u === "emre" ? "from-amber-400 to-amber-600"
              : "from-cyan-400 to-cyan-600"
            const initial = u === "tuna" ? "T" : "E"
            const label = u === "emin" ? "Emin" : u === "emre" ? "Emre" : "Tuna"
            return (
              <button
                key={u}
                onClick={() => setActiveUser(u)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  activeUser === u
                    ? cn("bg-white dark:bg-slate-900 shadow-sm", activeColor)
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br",
                  avatarGradient
                )}>{initial}</div>
                {label}
              </button>
            )
          })}
        </div>

        {/* Hatırlatıcı zamanları */}
        <div className="surface-card p-5 space-y-4">
          <div>
            <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">
              Deadline öncesi hatırlatma
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Görev son tarihi yaklaşınca ne zaman bildirim gönderilsin?
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {REMINDER_OPTIONS.map((opt) => {
              const selected = p.reminder_times.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleReminderTime(activeUser, opt.value)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                    selected
                      ? activeUser === "emin"
                        ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    selected
                      ? activeUser === "emin" ? "border-indigo-500 bg-indigo-500" : "border-amber-500 bg-amber-500"
                      : "border-slate-300 dark:border-slate-600"
                  )}>
                    {selected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{opt.label}</p>
                    <p className="text-[10px] text-slate-500">{opt.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
          {p.reminder_times.length === 0 && (
            <p className="text-xs text-red-500 text-center">En az bir seçenek seç</p>
          )}
        </div>

        {/* Günlük bildirim saati */}
        <div className="surface-card p-5 space-y-4">
          <div>
            <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">
              Günlük bildirim saati
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sabah hatırlatıcısı saat kaçta gelsin?
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {HOURS.map((h) => (
              <button
                key={h}
                onClick={() => setHour(activeUser, h)}
                className={cn(
                  "w-12 h-10 rounded-xl text-sm font-medium border-2 transition-all",
                  p.notification_hour === h
                    ? activeUser === "emin"
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : "border-amber-500 bg-amber-500 text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                )}
              >
                {h}:00
              </button>
            ))}
          </div>
        </div>

        {/* Özet */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {activeUser === "emin" ? "Emin" : "Emre"}'in mevcut tercihleri:
          </p>
          <p>• Saat {p.notification_hour}:00'da günlük bildirim</p>
          {p.reminder_times.length > 0
            ? p.reminder_times.sort((a, b) => b - a).map((t) => (
                <p key={t}>• Deadline'dan {t} saat önce hatırlatma</p>
              ))
            : <p className="text-red-500">• Hatırlatıcı seçilmedi</p>
          }
        </div>

        {/* Admin paneli - sadece emin */}
        {currentUser?.isAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-between px-5 py-4 rounded-2xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Admin Paneli</p>
                <p className="text-xs text-indigo-500 dark:text-indigo-400">Kullanıcı yönetimi</p>
              </div>
            </div>
            <ChevronLeft className="h-4 w-4 text-indigo-400 rotate-180" />
          </Link>
        )}

        {/* Kaydet */}
        <button
          onClick={handleSave}
          disabled={saving || prefs.emin.reminder_times.length === 0 || prefs.emre.reminder_times.length === 0 || prefs.tuna.reminder_times.length === 0}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all",
            saved
              ? "bg-emerald-500 text-white"
              : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-40"
          )}
        >
          {saved ? (
            <><Check className="h-4 w-4" /> Kaydedildi!</>
          ) : saving ? (
            "Kaydediliyor..."
          ) : (
            <><Save className="h-4 w-4" /> Tercihleri Kaydet</>
          )}
        </button>
      </main>
    </div>
  )
}
