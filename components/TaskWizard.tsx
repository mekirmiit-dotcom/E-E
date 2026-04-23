"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Loader2,
  FileText,
  Target,
  Calendar,
  ListChecks,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createTask, OWNER_LABELS } from "@/lib/tasks"
import type { Owner, Priority, Status, ChecklistItem } from "@/lib/supabase"
import { createNotification } from "@/lib/notifications"
import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"

const STEPS = [
  { id: 1, title: "Temel Bilgiler", Icon: FileText, desc: "Görev adı ve açıklaması" },
  { id: 2, title: "Atama & Öncelik", Icon: Target, desc: "Kime atanacak, ne kadar önemli" },
  { id: 3, title: "Tarih & Etiketler", Icon: Calendar, desc: "Son tarih ve sınıflandırma" },
  { id: 4, title: "Kontrol Listesi", Icon: ListChecks, desc: "Alt görevler ve adımlar" },
]

interface WizardData {
  title: string
  description: string
  owner: Owner
  priority: Priority
  status: Status
  due_date: string
  tags: string[]
  checklist: ChecklistItem[]
}

const DEFAULT_DATA: WizardData = {
  title: "",
  description: "",
  owner: "shared",
  priority: "medium",
  status: "todo",
  due_date: "",
  tags: [],
  checklist: [],
}

interface TaskWizardProps {
  defaultOwner?: Owner
}

export default function TaskWizard({ defaultOwner }: TaskWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>({
    ...DEFAULT_DATA,
    owner: defaultOwner || "shared",
  })
  const [tagInput, setTagInput] = useState("")
  const [checkInput, setCheckInput] = useState("")
  const [saving, setSaving] = useState(false)

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-")
    if (t && !data.tags.includes(t)) {
      update("tags", [...data.tags, t])
    }
    setTagInput("")
  }

  function removeTag(tag: string) {
    update("tags", data.tags.filter((t) => t !== tag))
  }

  function addChecklist() {
    const t = checkInput.trim()
    if (!t) return
    update("checklist", [
      ...data.checklist,
      { id: crypto.randomUUID(), text: t, done: false },
    ])
    setCheckInput("")
  }

  function removeChecklist(id: string) {
    update("checklist", data.checklist.filter((c) => c.id !== id))
  }

  function canNext(): boolean {
    if (step === 1) return data.title.trim().length >= 3
    return true
  }

  async function handleSave() {
    setSaving(true)
    const task = await createTask({
      title: data.title.trim(),
      description: data.description.trim() || null,
      owner: data.owner,
      priority: data.priority,
      status: data.status,
      due_date: data.due_date || null,
      tags: data.tags,
      checklist: data.checklist,
      order_index: 999,
    })
    if (!task) {
      console.error("[TaskWizard] createTask failed")
    } else {
      if (task.status === "done") {
        await createNotification(task.id, `"${task.title}" tamamlandı 🎉`, "completed")
      } else if (task.due_date) {
        await createNotification(
          task.id,
          `"${task.title}" görevi ${format(parseISO(task.due_date), "d MMM yyyy", { locale: tr })} tarihinde teslim edilmeli`,
          "reminder"
        )
      } else if (task.owner !== "shared") {
        await createNotification(task.id, `"${task.title}" görevi ${OWNER_LABELS[task.owner]}'e atandı`, "assigned")
      } else {
        await createNotification(task.id, `"${task.title}" görevi oluşturuldu`, "assigned")
      }
    }
    setSaving(false)
    router.push("/")
  }

  const ownerOptions: {
    value: Owner
    label: string
    initial: string
    color: string
    gradient: string
  }[] = [
    {
      value: "emin",
      label: "Emin",
      initial: "E",
      color: "border-indigo-300 bg-indigo-50 text-indigo-700",
      gradient: "from-indigo-400 to-indigo-600",
    },
    {
      value: "emre",
      label: "Emre",
      initial: "E",
      color: "border-amber-300 bg-amber-50 text-amber-700",
      gradient: "from-amber-400 to-amber-600",
    },
    {
      value: "shared",
      label: "Ortak",
      initial: "◆",
      color: "border-emerald-300 bg-emerald-50 text-emerald-700",
      gradient: "from-emerald-400 to-emerald-600",
    },
  ]

  const priorityOptions: {
    value: Priority
    label: string
    desc: string
    dot: string
    color: string
  }[] = [
    { value: "low", label: "Düşük", desc: "Aceleye gerek yok", dot: "bg-slate-400", color: "border-slate-200 hover:border-slate-300 hover:bg-slate-50" },
    { value: "medium", label: "Orta", desc: "Normal öncelik", dot: "bg-blue-500", color: "border-blue-200 hover:border-blue-300 hover:bg-blue-50" },
    { value: "high", label: "Yüksek", desc: "Önemli", dot: "bg-orange-500", color: "border-orange-200 hover:border-orange-300 hover:bg-orange-50" },
    { value: "critical", label: "Kritik", desc: "Hemen yapılmalı", dot: "bg-red-500", color: "border-red-200 hover:border-red-300 hover:bg-red-50" },
  ]

  const statusOptions: { value: Status; label: string; dot: string }[] = [
    { value: "todo", label: "Yapılacak", dot: "bg-slate-400" },
    { value: "in_progress", label: "Devam Ediyor", dot: "bg-blue-500" },
    { value: "review", label: "İncelemede", dot: "bg-violet-500" },
    { value: "done", label: "Tamamlandı", dot: "bg-emerald-500" },
  ]

  const progressPercent = Math.round(((step - 1) / (STEPS.length - 1)) * 100)

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 text-[11px] font-mono text-slate-600 tracking-wider uppercase mb-3">
          <span className="w-1 h-1 rounded-full bg-indigo-500" />
          Yeni Görev · Adım {step}/{STEPS.length}
        </div>
        <h1 className="font-display font-bold text-3xl tracking-tight text-slate-900">
          Görev oluştur
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">Birkaç adımda eksiksiz bir görev hazırla</p>
      </div>

      {/* Steps indicator */}
      <div className="relative mb-10 px-2">
        <div className="absolute top-5 left-7 right-7 h-px bg-slate-200" />
        <div
          className="absolute top-5 left-7 h-px bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
          style={{ width: `calc((100% - 3.5rem) * ${progressPercent / 100})` }}
        />
        <div className="relative flex items-start justify-between">
          {STEPS.map((s) => {
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <button
                key={s.id}
                onClick={() => s.id < step && setStep(s.id)}
                className={cn(
                  "flex flex-col items-center gap-2 group z-10",
                  s.id < step && "cursor-pointer",
                  s.id > step && "cursor-not-allowed"
                )}
                disabled={s.id > step}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white",
                    isActive && "border-2 border-indigo-500 text-indigo-600 scale-110 shadow-soft-md ring-4 ring-indigo-100",
                    isDone && "border-2 border-indigo-500 bg-indigo-500 text-white",
                    !isActive && !isDone && "border border-slate-200 text-slate-400"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : <s.Icon className="h-4 w-4" />}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium hidden sm:block text-center max-w-[100px] leading-tight transition-colors",
                    isActive ? "text-slate-900" : isDone ? "text-slate-600" : "text-slate-400"
                  )}
                >
                  {s.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="surface-card p-7 mb-6 shadow-soft-md">
        <div className="mb-6">
          <h2 className="font-display font-bold text-xl tracking-tight text-slate-900">
            {STEPS[step - 1].title}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{STEPS[step - 1].desc}</p>
        </div>

        <div key={step} className="animate-slide-in">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="title" className="mb-2 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Görev Adı <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Örn: Landing page tasarımı yap"
                  className="text-base h-12 rounded-xl"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && canNext() && setStep(2)}
                />
                <div className="flex items-center justify-between mt-1.5">
                  {data.title.length > 0 && data.title.length < 3 ? (
                    <p className="text-xs text-red-500">En az 3 karakter girin</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">{data.title.length}/100</span>
                </div>
              </div>
              <div>
                <Label htmlFor="desc" className="mb-2 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Açıklama <span className="text-slate-400 normal-case font-normal">· isteğe bağlı</span>
                </Label>
                <Textarea
                  id="desc"
                  value={data.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Görev hakkında daha fazla bilgi, context, bağlantılar..."
                  rows={5}
                  className="resize-none rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Kime Atanacak?
                </Label>
                <div className="grid grid-cols-3 gap-2.5">
                  {ownerOptions.map((o) => {
                    const active = data.owner === o.value
                    return (
                      <button
                        key={o.value}
                        onClick={() => update("owner", o.value)}
                        className={cn(
                          "relative flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 transition-all text-sm",
                          active ? o.color + " shadow-soft-md" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base bg-gradient-to-br transition-transform", o.gradient, active && "scale-110")}>
                          {o.initial}
                        </div>
                        <span className="font-semibold text-xs">{o.label}</span>
                        {active && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-current text-white flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="mb-3 block text-xs font-semibold text-slate-700 uppercase tracking-wider">Öncelik</Label>
                <div className="grid grid-cols-2 gap-2">
                  {priorityOptions.map((p) => {
                    const active = data.priority === p.value
                    return (
                      <button
                        key={p.value}
                        onClick={() => update("priority", p.value)}
                        className={cn(
                          "flex items-center gap-3 py-3 px-3.5 rounded-xl border-2 transition-all text-sm text-left",
                          active ? "border-slate-900 bg-slate-50 shadow-soft" : p.color + " bg-white"
                        )}
                      >
                        <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", p.dot)} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-[13px] leading-tight">{p.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{p.desc}</div>
                        </div>
                        {active && <Check className="h-3.5 w-3.5 text-slate-900 flex-shrink-0" strokeWidth={3} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="mb-3 block text-xs font-semibold text-slate-700 uppercase tracking-wider">Başlangıç Durumu</Label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => {
                    const active = data.status === s.value
                    return (
                      <button
                        key={s.value}
                        onClick={() => update("status", s.value)}
                        className={cn(
                          "inline-flex items-center gap-2 py-2 px-3.5 rounded-full border text-xs font-medium transition-all",
                          active ? "border-slate-900 bg-slate-900 text-white shadow-soft-md" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="duedate" className="mb-2 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Son Tarih <span className="text-slate-400 normal-case font-normal">· isteğe bağlı</span>
                </Label>
                <Input
                  id="duedate"
                  type="date"
                  value={data.due_date}
                  onChange={(e) => update("due_date", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="h-12 rounded-xl text-sm"
                />
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  {[
                    { label: "Bugün", days: 0 },
                    { label: "Yarın", days: 1 },
                    { label: "3 gün", days: 3 },
                    { label: "1 hafta", days: 7 },
                    { label: "2 hafta", days: 14 },
                  ].map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => {
                        const d = new Date()
                        d.setDate(d.getDate() + q.days)
                        update("due_date", d.toISOString().split("T")[0])
                      }}
                      className="chip"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Etiketler <span className="text-slate-400 normal-case font-normal">· isteğe bağlı</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Örn: frontend, bug, design"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    className="h-11 rounded-xl"
                  />
                  <Button variant="outline" onClick={addTag} size="icon" className="flex-shrink-0 h-11 w-11 rounded-xl">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">Enter veya virgül ile ekle</p>
                {data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {data.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 animate-scale-in">
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={checkInput}
                  onChange={(e) => setCheckInput(e.target.value)}
                  placeholder="Alt görev ekle..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addChecklist()
                    }
                  }}
                  className="h-11 rounded-xl"
                  autoFocus
                />
                <Button onClick={addChecklist} size="icon" className="flex-shrink-0 h-11 w-11 rounded-xl bg-slate-900 hover:bg-slate-800">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {data.checklist.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-slate-200 bg-slate-50/40">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-slate-200 mb-3">
                    <ListChecks className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600 font-medium">Henüz alt görev eklenmedi</p>
                  <p className="text-[11px] text-slate-400 mt-1">Bu adım isteğe bağlıdır — istersen atlayabilirsin</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {data.checklist.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3 py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-slate-200 transition-colors animate-scale-in">
                      <span className="text-[11px] font-mono text-slate-400 w-5 tabular-nums">{String(idx + 1).padStart(2, "0")}</span>
                      <span className="flex-1 text-sm text-slate-700">{item.text}</span>
                      <button onClick={() => removeChecklist(item.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => (step === 1 ? router.push("/") : setStep(step - 1))}
          className="gap-2 rounded-xl h-11"
        >
          <ChevronLeft className="h-4 w-4" />
          {step === 1 ? "İptal" : "Geri"}
        </Button>

        <div className="flex items-center gap-1">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                step === s.id ? "w-8 bg-slate-900" : step > s.id ? "w-3 bg-slate-400" : "w-3 bg-slate-200"
              )}
            />
          ))}
        </div>

        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="gap-2 rounded-xl h-11 bg-slate-900 hover:bg-slate-800 text-white shadow-soft-md"
          >
            İleri
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={saving || !data.title.trim()}
            className="gap-2 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft-md"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" strokeWidth={3} />
                Görevi Kaydet
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
