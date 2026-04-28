"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (authError) {
      if (authError.message.includes("Invalid login")) {
        setError("E-posta veya şifre hatalı. Lütfen tekrar dene.")
      } else if (authError.message.includes("Email not confirmed")) {
        setError("E-posta adresi doğrulanmamış.")
      } else {
        setError("Giriş yapılamadı. Lütfen tekrar dene.")
      }
      return
    }

    router.refresh()
    router.push("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Arkaplan blob'ları */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-[120px] -translate-y-1/3" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-200/25 dark:bg-violet-900/15 rounded-full blur-[120px] translate-y-1/3" />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/icon-512.png" alt="E&E" className="w-16 h-16 rounded-2xl object-cover shadow-lg mb-4" />
          <h1 className="font-display font-bold text-2xl tracking-tight text-slate-900 dark:text-slate-100">İş Takibi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-body">Emin & Emre · Görev Yönetimi</p>
        </div>

        {/* Form kartı */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl p-7 space-y-5">
          <div>
            <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200">Giriş Yap</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hesabına giriş yap ve devam et</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* E-posta */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="emin@istakibi.app"
                required
                autoComplete="email"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Şifre */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Şifre</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Hata mesajı */}
            {error && (
              <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Giriş butonu */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className={cn(
                "w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><LogIn className="h-4 w-4" /> Giriş Yap</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6 font-mono">
          İş Takibi · Emin & Emre
        </p>
      </div>
    </div>
  )
}
