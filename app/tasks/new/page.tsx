"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import TaskWizard from "@/components/TaskWizard"
import type { Owner } from "@/lib/supabase"
import { useCurrentUser } from "@/lib/auth"

function NewTaskContent() {
  const params = useSearchParams()
  const { user } = useCurrentUser()
  // URL'de owner varsa onu kullan, yoksa giriş yapan kullanıcının owner'ı
  const owner = (params.get("owner") || user?.owner || "shared") as Owner

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-slate-800 transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center group-hover:border-indigo-300 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline font-body">Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <h1 className="font-display font-bold text-base text-slate-900 leading-none">
                Yeni Görev
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground">Adım adım oluştur</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <TaskWizard defaultOwner={owner} />
      </main>
    </div>
  )
}

export default function NewTaskPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">Yükleniyor...</p>
        </div>
      </div>
    }>
      <NewTaskContent />
    </Suspense>
  )
}
