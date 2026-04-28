"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Shield, UserPlus, Key, Loader2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/lib/auth"
import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"

type User = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const { user, loading } = useCurrentUser()
  const [users, setUsers] = useState<User[]>([])
  const [fetching, setFetching] = useState(true)

  // Yeni kullanıcı
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Şifre sıfırlama
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState("")
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { setUsers(d.users ?? []); setFetching(false) })
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateMsg(null)
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", email: newEmail, password: newPassword }),
    })
    const data = await res.json()
    if (data.ok) {
      setCreateMsg({ ok: true, text: "Kullanıcı oluşturuldu." })
      setUsers((prev) => [...prev, data.user])
      setNewEmail("")
      setNewPassword("")
    } else {
      setCreateMsg({ ok: false, text: data.error ?? "Hata oluştu." })
    }
    setCreating(false)
  }

  async function handleResetPassword(userId: string) {
    if (!resetPassword.trim()) return
    setResetting(true)
    setResetMsg(null)
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_password", userId, password: resetPassword }),
    })
    const data = await res.json()
    if (data.ok) {
      setResetMsg({ ok: true, text: "Şifre güncellendi." })
      setResetUserId(null)
      setResetPassword("")
    } else {
      setResetMsg({ ok: false, text: data.error ?? "Hata oluştu." })
    }
    setResetting(false)
  }

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/75 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ChevronLeft className="h-5 w-5 text-slate-500" />
              </button>
              <div>
                <h1 className="font-display font-bold text-[15px] text-slate-900 dark:text-slate-100 leading-none flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-indigo-500" /> Admin Paneli
                </h1>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">Sadece Emin erişebilir</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-24">

        {/* Kullanıcı listesi */}
        <div className="surface-card p-5 space-y-4">
          <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            Kullanıcılar
            {fetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
          </h2>

          {users.length === 0 && !fetching && (
            <p className="text-sm text-slate-400">Kullanıcı bulunamadı.</p>
          )}

          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{u.email}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Oluşturuldu: {format(parseISO(u.created_at), "d MMM yyyy", { locale: tr })}
                      {u.last_sign_in_at && ` · Son giriş: ${format(parseISO(u.last_sign_in_at), "d MMM", { locale: tr })}`}
                    </p>
                  </div>
                  <button
                    onClick={() => { setResetUserId(resetUserId === u.id ? null : u.id); setResetMsg(null) }}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 px-2.5 py-1.5 rounded-xl transition-all"
                  >
                    <Key className="h-3 w-3" /> Şifre Sıfırla
                  </button>
                </div>

                {resetUserId === u.id && (
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Yeni şifre..."
                      className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      disabled={resetting || !resetPassword.trim()}
                      className="h-9 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                    >
                      {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Kaydet"}
                    </button>
                    <button onClick={() => setResetUserId(null)} className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors">
                      <X className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </div>
                )}

                {resetMsg && resetUserId === null && (
                  <p className={cn("text-xs", resetMsg.ok ? "text-emerald-600" : "text-red-500")}>{resetMsg.text}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Yeni kullanıcı */}
        <div className="surface-card p-5 space-y-4">
          <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-indigo-500" /> Yeni Kullanıcı Oluştur
          </h2>

          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="E-posta adresi"
              required
              className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Şifre (min. 6 karakter)"
              required
              minLength={6}
              className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {createMsg && (
              <p className={cn("text-xs flex items-center gap-1.5", createMsg.ok ? "text-emerald-600" : "text-red-500")}>
                {createMsg.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                {createMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full h-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors hover:opacity-90"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Kullanıcı Oluştur</>}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
