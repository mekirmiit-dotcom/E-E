"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"
import {
  ArrowLeft, Edit2, Save, Trash2, Check, X, Plus, Calendar,
  Tag, User, AlertCircle, Clock, CheckSquare, Loader2
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  getTask, updateTask, deleteTask,
  PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS, OWNER_LABELS,
  isOverdue, isDueSoon,
} from "@/lib/tasks"
import type { Task, Owner, Priority, Status, ChecklistItem } from "@/lib/supabase"

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [checkInput, setCheckInput] = useState("")
  const [tagInput, setTagInput] = useState("")

  // Editable fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [owner, setOwner] = useState<Owner>("shared")
  const [priority, setPriority] = useState<Priority>("medium")
  const [status, setStatus] = useState<Status>("todo")
  const [dueDate, setDueDate] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])

  useEffect(() => {
    getTask(params.id).then((t) => {
      if (!t) {
        router.push("/")
        return
      }
      setTask(t)
      resetForm(t)
    })
  }, [params.id])

  function resetForm(t: Task) {
    setTitle(t.title)
    setDescription(t.description || "")
    setOwner(t.owner)
    setPriority(t.priority)
    setStatus(t.status)
    setDueDate(t.due_date || "")
    setTags(t.tags)
    setChecklist(t.checklist)
  }

  function cancelEdit() {
    if (task) resetForm(task)
    setEditing(false)
  }

  async function handleSave() {
    if (!task) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    const updated = updateTask(task.id, {
      title, description: description || null,
      owner, priority, status,
      due_date: dueDate || null,
      tags, checklist,
    })
    setSaving(false)
    if (updated) {

      setEditing(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    await new Promise((r) => setTimeout(r, 300))
    deleteTask(params.id)
    router.push("/")
  }

  function toggleCheckItem(id: string) {
    const updated = checklist.map((c) => c.id === id ? { ...c, done: !c.done } : c)
    setChecklist(updated)
    if (!editing) {
      // Save immediately when not in edit mode
      updateTask(params.id, { checklist: updated })
      setTask((prev) => prev ? { ...prev, checklist: updated } : prev)
    }
  }

  function addCheckItem() {
    const t = checkInput.trim()
    if (!t) return
    setChecklist([...checklist, { id: crypto.randomUUID(), text: t, done: false }])
    setCheckInput("")
  }

  function removeCheckItem(id: string) {
    setChecklist(checklist.filter((c) => c.id !== id))
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-")
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput("")
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    )
  }

  const done = checklist.filter((c) => c.done).length
  const total = checklist.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0
  const overdue = isOverdue(task)
  const soon = isDueSoon(task)

  const ownerColors: Record<Owner, string> = {
    emin: "bg-indigo-100 text-indigo-700 border-indigo-200",
    emre: "bg-amber-100 text-amber-700 border-amber-200",
    shared: "bg-emerald-100 text-emerald-700 border-emerald-200",
  }

  const statusColors: Record<Status, string> = {
    todo: "bg-slate-100 text-slate-600",
    in_progress: "bg-blue-100 text-blue-700",
    review: "bg-purple-100 text-purple-700",
    done: "bg-emerald-100 text-emerald-700",
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-slate-800 transition-colors group"
              >
                <div className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center group-hover:border-indigo-300 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </div>
              </Link>
              <div>
                <h1 className="font-display font-bold text-sm text-slate-900 leading-none line-clamp-1">
                  {task.title}
                </h1>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  {format(parseISO(task.created_at), "d MMMM yyyy", { locale: tr })} tarihinde oluşturuldu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-1.5">
                    <X className="h-3.5 w-3.5" />
                    İptal
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Kaydet
                  </Button>
                </>
              ) : (
                <>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 font-body">Emin misiniz?</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="gap-1.5"
                      >
                        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Sil
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                        Hayır
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDelete(true)}
                        className="gap-1.5 text-red-500 hover:text-red-600 hover:border-red-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                        <Edit2 className="h-3.5 w-3.5" />
                        Düzenle
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Title & Description */}
        <div className="glass-card rounded-2xl p-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block">Görev Adı</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-base font-medium" />
              </div>
              <div>
                <Label className="mb-1.5 block">Açıklama</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Açıklama ekle..." />
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-display font-bold text-xl text-slate-900 mb-2">{task.title}</h2>
              {task.description ? (
                <p className="text-sm text-slate-600 font-body leading-relaxed">{task.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground font-body italic">Açıklama yok</p>
              )}
            </>
          )}
        </div>

        {/* Meta: owner, priority, status, due date */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-sm text-slate-800 mb-4">Görev Detayları</h3>

          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Owner */}
              <div>
                <Label className="mb-2 block text-xs">Sorumlu</Label>
                <div className="flex flex-col gap-1.5">
                  {(["emin", "emre", "shared"] as Owner[]).map((o) => (
                    <button
                      key={o}
                      onClick={() => setOwner(o)}
                      className={cn(
                        "flex items-center gap-2 py-2 px-3 rounded-xl border text-xs font-body transition-all",
                        owner === o ? ownerColors[o] + " border-current" : "border-slate-200 bg-white text-slate-600"
                      )}
                    >
                      <User className="h-3.5 w-3.5" />
                      {OWNER_LABELS[o]}
                      {owner === o && <Check className="h-3 w-3 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <Label className="mb-2 block text-xs">Öncelik</Label>
                <div className="flex flex-col gap-1.5">
                  {(["low", "medium", "high", "critical"] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex items-center gap-2 py-2 px-3 rounded-xl border text-xs font-body transition-all",
                        priority === p ? PRIORITY_COLORS[p] + " border-current" : "border-slate-200 bg-white text-slate-600"
                      )}
                    >
                      {PRIORITY_LABELS[p]}
                      {priority === p && <Check className="h-3 w-3 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <Label className="mb-2 block text-xs">Durum</Label>
                <div className="flex flex-col gap-1.5">
                  {(["todo", "in_progress", "review", "done"] as Status[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "flex items-center gap-2 py-2 px-3 rounded-xl border text-xs font-body transition-all",
                        status === s ? statusColors[s] + " border-current" : "border-slate-200 bg-white text-slate-600"
                      )}
                    >
                      {STATUS_LABELS[s]}
                      {status === s && <Check className="h-3 w-3 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due date */}
              <div>
                <Label className="mb-2 block text-xs">Son Tarih</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="text-sm" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-body">Sorumlu</span>
                <Badge variant="outline" className={cn("ml-auto text-xs border", ownerColors[task.owner])}>
                  {OWNER_LABELS[task.owner]}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-body">Öncelik</span>
                <Badge variant="outline" className={cn("ml-auto text-xs border", PRIORITY_COLORS[task.priority])}>
                  {PRIORITY_LABELS[task.priority]}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-body">Durum</span>
                <Badge variant="outline" className={cn("ml-auto text-xs border", statusColors[task.status])}>
                  {STATUS_LABELS[task.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-body">Son Tarih</span>
                {task.due_date ? (
                  <span className={cn(
                    "ml-auto text-xs font-mono",
                    overdue ? "text-red-600" : soon ? "text-amber-600" : "text-slate-600"
                  )}>
                    {format(parseISO(task.due_date), "d MMM yyyy", { locale: tr })}
                    {overdue && " ⚠️"}
                  </span>
                ) : (
                  <span className="ml-auto text-xs text-muted-foreground font-mono">—</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-slate-800 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Etiketler
            </h3>
          </div>

          {editing && (
            <div className="flex gap-2 mb-3">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Etiket ekle..."
                className="text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
              />
              <Button variant="outline" size="icon" onClick={addTag} className="flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          {tags.length === 0 ? (
            <p className="text-xs text-muted-foreground font-body italic">Etiket yok</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  #{tag}
                  {editing && (
                    <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-red-500 transition-colors ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-slate-800 flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Kontrol Listesi
            </h3>
            {total > 0 && (
              <div className="flex items-center gap-2">
                <Progress value={progress} className="w-20 h-1.5" />
                <span className="text-xs font-mono text-muted-foreground">{done}/{total}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              value={checkInput}
              onChange={(e) => setCheckInput(e.target.value)}
              placeholder="Alt görev ekle..."
              className="text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCheckItem() } }}
            />
            <Button variant="outline" size="icon" onClick={addCheckItem} className="flex-shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {checklist.length === 0 ? (
            <p className="text-xs text-muted-foreground font-body italic text-center py-4">Alt görev yok</p>
          ) : (
            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-all group",
                    item.done ? "bg-slate-50/80 border-slate-100" : "bg-white border-slate-200"
                  )}
                >
                  <button
                    onClick={() => toggleCheckItem(item.id)}
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      item.done
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-slate-300 hover:border-indigo-400"
                    )}
                  >
                    {item.done && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <span className={cn(
                    "flex-1 text-sm font-body transition-all",
                    item.done ? "line-through text-muted-foreground" : "text-slate-700"
                  )}>
                    {item.text}
                  </span>
                  {editing && (
                    <button
                      onClick={() => removeCheckItem(item.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="text-center pb-4">
          <p className="text-[11px] font-mono text-muted-foreground">
            Son güncelleme: {format(parseISO(task.updated_at), "d MMMM yyyy, HH:mm", { locale: tr })}
          </p>
        </div>
      </main>
    </div>
  )
}
