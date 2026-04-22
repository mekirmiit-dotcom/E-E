"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, ChevronLeft, Plus, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createTask, PRIORITY_LABELS, STATUS_LABELS, OWNER_LABELS } from "@/lib/tasks"
import type { Owner, Priority, Status, ChecklistItem } from "@/lib/supabase"
import { createNotification } from "@/lib/notifications"
import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"

const STEPS = [
  { id: 1, title: "Temel Bilgiler", icon: "📝", desc: "Görev adı ve açıklaması" },
  { id: 2, title: "Atama & Öncelik", icon: "🎯", desc: "Kime atanacak, ne kadar önemli" },
  { id: 3, title: "Tarih & Etiketler", icon: "🗓️", desc: "Son tarih ve sınıflandırma" },
  { id: 4, title: "Kontrol Listesi", icon: "✅", desc: "Alt görevler ve adımlar" },
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
      console.error("[TaskWizard] createTask failed, no task returned")
    } else {
      if (task.owner !== "shared") {
        await createNotification(task.id, `"${task.title}" görevi ${OWNER_LABELS[task.owner]}'e atandı`, "assigned")
      }
      if (task.due_date) {
        await createNotification(
          task.id,
          `"${task.title}" görevi ${format(parseISO(task.due_date), "d MMM yyyy", { locale: tr })} tarihinde teslim edilmeli`,
          "reminder"
        )
      }
      if (task.status === "done") {
        await createNotification(task.id, `"${task.title}" tamamlandı 🎉`, "completed")
      }
    }
    setSaving(false)

    router.push("/")
  }

  const ownerOptions: { value: Owner; label: string; emoji: string; color: string }[] = [
    { value: "emin", label: "Emin", emoji: "👤", color: "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
    { value: "emre", label: "Emre", emoji: "👤", color: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" },
    { value: "shared", label: "Ortak", emoji: "🤝", color: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
  ]

  const priorityOptions: { value: Priority; label: string; icon: string; color: string }[] = [
    { value: "low", label: "Düşük", icon: "🔵", color: "border-slate-200 hover:bg-slate-50" },
    { value: "medium", label: "Orta", icon: "🟡", color: "border-blue-200 hover:bg-blue-50" },
    { value: "high", label: "Yüksek", icon: "🟠", color: "border-orange-200 hover:bg-orange-50" },
    { value: "critical", label: "Kritik", icon: "🔴", color: "border-red-200 hover:bg-red-50" },
  ]

  const statusOptions: { value: Status; label: string; icon: string }[] = [
    { value: "todo", label: "Yapılacak", icon: "📋" },
    { value: "in_progress", label: "Devam Ediyor", icon: "⚡" },
    { value: "review", label: "İncelemede", icon: "🔍" },
    { value: "done", label: "Tamamlandı", icon: "✅" },
  ]

  return (
    <div className="max-w-xl mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-between mb-8 px-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-0">
            <button
              onClick={() => s.id < step && setStep(s.id)}
              className={cn(
                "flex flex-col items-center gap-1 group",
                s.id < step && "cursor-pointer"
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-300 border-2",
                  step === s.id
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110"
                    : step > s.id
                    ? "bg-indigo-100 border-indigo-300 text-indigo-600"
                    : "bg-white border-slate-200 text-slate-400"
                )}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : s.icon}
              </div>
              <span
                className={cn(
                  "text-[10px] font-body font-medium hidden sm:block",
                  step === s.id ? "text-indigo-700" : "text-muted-foreground"
                )}
              >
                {s.title}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 sm:w-16 mx-1 rounded-full transition-all duration-500",
                  step > s.id ? "bg-indigo-300" : "bg-slate-200"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-in">
        <div className="mb-5">
          <h2 className="font-display font-bold text-lg text-slate-800">
            {STEPS[step - 1].icon} {STEPS[step - 1].title}
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            {STEPS[step - 1].desc}
          </p>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="mb-1.5 block">Görev Adı *</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Örn: Landing page tasarımı yap"
                className="text-base"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && canNext() && setStep(2)}
              />
              {data.title.length > 0 && data.title.length < 3 && (
                <p className="text-xs text-red-500 mt-1 font-body">En az 3 karakter girin</p>
              )}
            </div>
            <div>
              <Label htmlFor="desc" className="mb-1.5 block">Açıklama <span className="text-muted-foreground font-normal">(isteğe bağlı)</span></Label>
              <Textarea
                id="desc"
                value={data.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Görev hakkında daha fazla bilgi..."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Step 2: Owner & Priority */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Kime Atanacak?</Label>
              <div className="grid grid-cols-3 gap-2">
                {ownerOptions.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => update("owner", o.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all font-body text-sm",
                      data.owner === o.value
                        ? o.color + " border-current scale-105 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <span className="text-xl">{o.emoji}</span>
                    <span className="font-medium text-xs">{o.label}</span>
                    {data.owner === o.value && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Öncelik</Label>
              <div className="grid grid-cols-2 gap-2">
                {priorityOptions.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => update("priority", p.value)}
                    className={cn(
                      "flex items-center gap-2 py-2.5 px-3 rounded-xl border-2 transition-all font-body text-sm",
                      data.priority === p.value
                        ? p.color + " border-current shadow-sm"
                        : "border-slate-200 bg-white text-slate-600"
                    )}
                  >
                    <span>{p.icon}</span>
                    <span className="font-medium">{p.label}</span>
                    {data.priority === p.value && <Check className="h-3.5 w-3.5 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Durum</Label>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => update("status", s.value)}
                    className={cn(
                      "flex items-center gap-2 py-2.5 px-3 rounded-xl border-2 transition-all font-body text-sm",
                      data.status === s.value
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600"
                    )}
                  >
                    <span>{s.icon}</span>
                    <span className="font-medium text-xs">{s.label}</span>
                    {data.status === s.value && <Check className="h-3 w-3 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Date & Tags */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <Label htmlFor="duedate" className="mb-1.5 block">Son Tarih <span className="text-muted-foreground font-normal">(isteğe bağlı)</span></Label>
              <Input
                id="duedate"
                type="date"
                value={data.due_date}
                onChange={(e) => update("due_date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Etiketler <span className="text-muted-foreground font-normal">(isteğe bağlı)</span></Label>
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
                />
                <Button variant="outline" onClick={addTag} size="icon" className="flex-shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-body">Enter veya virgül ile ekle</p>

              {data.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {data.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Checklist */}
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
                autoFocus
              />
              <Button onClick={addChecklist} size="icon" className="flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {data.checklist.length === 0 ? (
              <div className="text-center py-8 rounded-xl border-2 border-dashed border-slate-200">
                <p className="text-2xl mb-2">📋</p>
                <p className="text-sm text-muted-foreground font-body">Henüz alt görev eklenmedi</p>
                <p className="text-xs text-muted-foreground mt-1 font-body">Bu adım isteğe bağlıdır</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.checklist.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 group"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-4">{idx + 1}.</span>
                    <span className="flex-1 text-sm font-body text-slate-700">{item.text}</span>
                    <button
                      onClick={() => removeChecklist(item.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => (step === 1 ? router.push("/") : setStep(step - 1))}
          className="gap-2"
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
                step === s.id ? "w-6 bg-indigo-600" : step > s.id ? "w-3 bg-indigo-300" : "w-3 bg-slate-200"
              )}
            />
          ))}
        </div>

        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="gap-2"
          >
            İleri
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={saving || !data.title.trim()}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Görevi Kaydet
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
