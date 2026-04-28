"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

type SummaryResult = {
  ok: boolean
  completedCount?: number
  overdueCount?: number
  eminCount?: number
  emreCount?: number
  message?: string
  error?: string
}

type DbNotification = {
  id: string
  type: string
  message: string
  read: boolean
  created_at: string
}

export default function TestPage() {
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [dbRows, setDbRows] = useState<DbNotification[]>([])
  const [dbLoading, setDbLoading] = useState(false)

  async function runSummary() {
    setLoading(true)
    setSummaryResult(null)
    try {
      const res = await fetch("/api/weekly-summary")
      const data = await res.json()
      setSummaryResult(data)
    } catch (e) {
      setSummaryResult({ ok: false, error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  async function fetchNotifications() {
    setDbLoading(true)
    const { data } = await supabase
      .from("notifications")
      .select("id, type, message, read, created_at")
      .eq("type", "summary")
      .order("created_at", { ascending: false })
      .limit(5)
    setDbRows(data ?? [])
    setDbLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">🧪 Haftalık Özet — Test</h1>
          <p className="text-sm text-slate-500 mt-1">Bu sayfa sadece geliştirme/test amaçlıdır.</p>
        </div>

        {/* Trigger */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
          <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-300">1. API'yi Tetikle</h2>
          <button
            onClick={runSummary}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {loading ? "Çalışıyor..." : "POST /api/weekly-summary"}
          </button>

          {summaryResult && (
            <div className={`rounded-xl p-4 text-sm font-mono space-y-1 ${summaryResult.ok ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300" : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"}`}>
              <p><span className="font-bold">ok:</span> {String(summaryResult.ok)}</p>
              {summaryResult.ok ? (
                <>
                  <p><span className="font-bold">completedCount:</span> {summaryResult.completedCount}</p>
                  <p><span className="font-bold">overdueCount:</span> {summaryResult.overdueCount}</p>
                  <p><span className="font-bold">eminCount:</span> {summaryResult.eminCount}</p>
                  <p><span className="font-bold">emreCount:</span> {summaryResult.emreCount}</p>
                  <p className="pt-1 border-t border-emerald-200 dark:border-emerald-700 mt-1">
                    <span className="font-bold">message:</span><br />
                    {summaryResult.message}
                  </p>
                </>
              ) : (
                <p><span className="font-bold">error:</span> {summaryResult.error}</p>
              )}
            </div>
          )}
        </div>

        {/* DB check */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
          <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-300">2. Veritabanını Kontrol Et</h2>
          <button
            onClick={fetchNotifications}
            disabled={dbLoading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {dbLoading ? "Yükleniyor..." : "Son 5 summary bildirimi göster"}
          </button>

          {dbRows.length > 0 && (
            <div className="space-y-2">
              {dbRows.map((n) => (
                <div key={n.id} className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-violet-600">type: {n.type}</span>
                    <span className="text-slate-400">{new Date(n.created_at).toLocaleString("tr-TR")}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{n.message}</p>
                  <p className="text-slate-400">read: {String(n.read)}</p>
                </div>
              ))}
            </div>
          )}

          {dbRows.length === 0 && !dbLoading && (
            <p className="text-xs text-slate-400">Henüz summary bildirimi yok veya kontrol edilmedi.</p>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center">
          Production'da bu endpoint her Pazartesi 15:00 (TR) otomatik tetiklenir.
        </p>
      </div>
    </div>
  )
}
