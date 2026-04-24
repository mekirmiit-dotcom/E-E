"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"
import {
  ArrowLeft, Edit2, Save, Trash2, Check, X, Plus, Calendar,
  Tag, User, AlertCircle, Clock, CheckSquare, Loader2, MessageCircle, Send, Trash
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
  TASK_COLORS, isOverdue, isDueSoon,
} from "@/lib/tasks"
import type { Task, Owner, Priority, Status, ChecklistItem, Comment } from "@/lib/supabase"
import { createNotification } from "@/lib/notifications"
import { getComments, addComment, deleteComment } from "@/lib/comments"
import { supabase } from "@/lib/supabase"

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [checkInput, setCheckInput] = useState("")
  const [tagInput, setTagInput] = useState("")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [owner, setOwner] = useState<Owner>("shared")
  const [priority, setPriority] = useState<Priority>("medium")
  const [status, setStatus] = useState<Status>("todo")
  const [dueDate, setDueDate] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [color, setColor] = useState<string | null>(null)

  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [commentAuthor, setCommentAuthor] = useState<"emin" | "emre">("emin")
  const [commentText, setCommentText] = useState("")
  const [sendingComment, setSendingComment] = useState(false)

  useEffect(() => {
    getTask(params.id).then((t) => {
      if (!t) {
        router.push("/")
        return
      }
      setTask(t)
      resetForm(t)
    })
    getComments(params.id).then(setComments)

    // Realtime: yeni yorum gelince anında göster
    const channel = supabase
      .channel(`comments-${params.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "comments",
        filter: `task_id=eq.${params.id}`,
      }, (payload) => {
        setComments((prev) => [payload.new as Comment, ...prev])
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "comments",
        filter: `task_id=eq.${params.id}`,
      }, (payload) => {
        setComments((prev) => prev.filter((c) => c.id !== (payload.old as Comment).id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
    setColor(t.color || null)
  }

  function cancelEdit() {
    if (task) resetForm(task)
    setEditing(false)
  }

  async function handleAddComment() {
    const content = commentText.trim()
    if (!content || !task) return
    setSendingComment(true)
    const newComment = await addComment(task.id, commentAuthor, content)
    if (newComment) {
      // Doğrudan state'e ekle — realtime yoksa da çalışsın
      setComments((prev) =>
        prev.find((c) => c.id === newComment.id) ? prev : [newComment, ...prev]
      )
    }
    setCommentText("")
    setSendingComment(false)
  }

  async function handleSave() {
    if (!task) return
    setSaving(true)
    const updated = await updateTask(task.id, {
      title, description: description || null,
      owner, priority, status,
      due_date: dueDate || null,
      tags, checklist, color,
    })
    setSaving(false)
    if (!updated) return

    // Status değişiklikleri
    if (status !== task.status) {
      if (status === "done") {
        await createNotification(task.id, `"${title}" tamamlandı 🎉`, "completed")
      } else if (status === "in_progress") {
        await createNotification(task.id, `"${title}" başladı 🚀`, "assigned")
      } else if (status === "review") {
        await createNotification(task.id, `"${title}" incelemeye alındı 🔍`, "assigned")
      } else if (status === "todo") {
        await createNotification(task.id, `"${title}" beklemeye alındı`, "assigned")
      }
    }

    // Sahip değişikliği
    if (owner !== task.owner) {
      const ownerMsg = owner === "shared"
        ? `"${title}" ortak göreve dönüştürüldü`
        : `"${title}" ${OWNER_LABELS[owner]}'e atandı`
      await createNotification(task.id, ownerMsg, "assigned")
    }

    // Öncelik değişikliği
    if (priority !== task.priority) {
      const pLabel: Record<string, string> = { low: "Düşük", medium: "Orta", high: "Yüksek", critical: "Kritik" }
      await createNotification(task.id, `"${title}" önceliği ${pLabel[priority]} olarak güncellendi`, "reminder")
    }

    // Son tarih değişikliği
    if (dueDate !== (task.due_date || "")) {
      const msg = dueDate
        ? `"${title}" son tarihi ${dueDate} olarak ayarlandı ⏰`
        : `"${title}" son tarihi kaldırıldı`
      await createNotification(task.id, msg, "reminder")
    }

    // Başlık değişikliği
    if (title !== task.title) {
      await createNotification(task.id, `Görev adı "${task.title}" → "${title}" olarak güncellendi`, "assigned")
    }

    setTask(updated)
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteTask(params.id)
    router.push("/")
  }

  async function toggleCheckItem(id: string) {
    const item = checklist.find((c) => c.id === id)
    const updated = checklist.map((c) => c.id === id ? { ...c, done: !c.done } : c)
    setChecklist(updated)
    if (!editing) {
      const result = await updateTask(params.id, { checklist: updated })
      if (result) {
        setTask(result)
        // Sadece işaretlendiğinde bildirim gönder, işaret kaldırılınca gönderme
        if (item && !item.done) {
          const doneCount = updated.filter((c) => c.done).length
          const total = updated.length
          await createNotification(
            params.id,
            `"${task?.title}" — ${item.text} tamamlandı (${doneCount}/${total})`,
            "completed"
          )
        }
      }
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
      <header className="sticky top-0 z-40 border-b border-white/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-slate-800 transition-colors group">
                <div className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center group-hover:border-indigo-300 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </div>
              </Link>
              <div>
                <h1 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 leading-none line-clamp-1">{task.title}</h1>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  {format(parseISO(task.created_at), "d MMMM yyyy", { locale: tr })} tarihinde oluşturuldu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-1.5">
                    <X className="h-3.5 w-3.5" /> İptal
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Kaydet
                  </Button>
                </>
              ) : (
                <>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 font-body">Emin misiniz?</span>
                      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1.5">
                        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Sil
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Hayır</Button>
                    </div>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} className="gap-1.5 text-red-500 hover:text-red-600 hover:border-red-200">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                        <Edit2 className="h-3.5 w-3.5" /> Düzenle
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
              <h2 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100 mb-2">{task.title}</h2>
              {task.description ? (
                <p className="text-sm text-slate-600 font-body leading-relaxed">{task.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground font-body italic">Açıklama yok</p>
              )}
            </>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200 mb-4">Görev Detayları</h3>
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-xs">Sorumlu</Label>
                <div className="flex flex-col gap-1.5">
                  {(["emin", "emre", "shared"] as Owner[]).map((o) => (
                    <button key={o} onClick={() => setOwner(o)}
                      className={cn("flex items-center gap-2 py-2 px-3 rounded-xl border text-xs font-body transition-all",
                        owner === o ? ownerColors[o] + " border-current" : "border-slate-200 bg-white text-slate-600")}>
                      <User className="h-3.5 w-3.5" />{OWNER_LABELS[o]}
                      {owner === o && <Check className="h-3 w-3 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block text-xs">Öncelik</Label>
                <div className="flex flex-col gap-1.5">
                  {(["low", "medium", "high", "critical"] as Priority[]).map((p) => (
                    <button key={p} onClick={() => setPriority(p)}
                      className={cn("flex items-center gap-2 py-2 px-3 rounded-xl border text-xs font-body transition-all",
                        priority === p ? PRIORITY_COLORS[p] + " border-current" : "border-slate-200 bg-white text-slate-600")}>
                      {PRIORITY_LABELS[p]}
                      {priority === p && <Check className="h-3 w-3 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block text-xs">Durum</Label>
                <div className="flex flex-col gap-1.5">
                  {(["todo", "in_progress", "review", "done"] as Status[]).map((s) => (
                    <button key={s} onClick={() => setStatus(s)}
                      className={cn("flex items-center gap-2 py-2 px-3 rounded-xl border text-xs font-body transition-all",
                        status === s ? statusColors[s] + " border-current" : "border-slate-200 bg-white text-slate-600")}>
                      {STATUS_LABELS[s]}
                      {status === s && <Check className="h-3 w-3 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block text-xs">Son Tarih</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="text-sm" />
              </div>
              <div className="col-span-2">
                <Label className="mb-2 block text-xs">Kart Rengi <span className="text-slate-400 font-normal normal-case">· isteğe bağlı</span></Label>
                <div className="flex flex-wrap gap-2 items-center">
                  {TASK_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(color === c.id ? null : c.id)}
                      title={c.label}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all duration-150",
                        color === c.id
                          ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-200 scale-110 shadow-md"
                          : "hover:scale-110 opacity-70 hover:opacity-100"
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  {color && (
                    <button
                      type="button"
                      onClick={() => setColor(null)}
                      className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:border-red-400 hover:text-red-400 transition-colors"
                      title="Rengi kaldır"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-body">Sorumlu</span>
                <Badge variant="outline" className={cn("ml-auto text-xs border", ownerColors[task.owner])}>{OWNER_LABELS[task.owner]}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-body">Öncelik</span>
                <Badge variant="outline" className={cn("ml-auto text-xs border", PRIORITY_COLORS[task.priority])}>{PRIORITY_LABELS[task.priority]}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-body">Durum</span>
                <Badge variant="outline" className={cn("ml-auto text-xs border", statusColors[task.status])}>{STATUS_LABELS[task.status]}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-body">Son Tarih</span>
                {task.due_date ? (
                  <span className={cn("ml-auto text-xs font-mono", overdue ? "text-red-600" : soon ? "text-amber-600" : "text-slate-600")}>
                    {format(parseISO(task.due_date), "d MMM yyyy", { locale: tr })}{overdue && " ⚠️"}
                  </span>
                ) : (
                  <span className="ml-auto text-xs text-muted-foreground font-mono">—</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Tag className="h-4 w-4" /> Etiketler
            </h3>
          </div>
          {editing && (
            <div className="flex gap-2 mb-3">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Etiket ekle..." className="text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }} />
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
                <span key={tag} className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
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

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CheckSquare className="h-4 w-4" /> Kontrol Listesi
            </h3>
            {total > 0 && (
              <div className="flex items-center gap-2">
                <Progress value={progress} className="w-20 h-1.5" />
                <span className="text-xs font-mono text-muted-foreground">{done}/{total}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 mb-4">
            <Input value={checkInput} onChange={(e) => setCheckInput(e.target.value)} placeholder="Alt görev ekle..." className="text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCheckItem() } }} />
            <Button variant="outline" size="icon" onClick={addCheckItem} className="flex-shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {checklist.length === 0 ? (
            <p className="text-xs text-muted-foreground font-body italic text-center py-4">Alt görev yok</p>
          ) : (
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.id} className={cn("flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-all group",
                  item.done ? "bg-slate-50/80 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700")}>
                  <button onClick={() => toggleCheckItem(item.id)}
                    className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      item.done ? "bg-indigo-600 border-indigo-600" : "border-slate-300 hover:border-indigo-400")}>
                    {item.done && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <span className={cn("flex-1 text-sm font-body transition-all",
                    item.done ? "line-through text-muted-foreground" : "text-slate-700 dark:text-slate-300")}>
                    {item.text}
                  </span>
                  {editing && (
                    <button onClick={() => removeCheckItem(item.id)} className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-5">
            <MessageCircle className="h-4 w-4" />
            Yorumlar
            {comments.length > 0 && (
              <span className="ml-auto text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {comments.length}
              </span>
            )}
          </h3>

          {/* Comment input */}
          <div className="mb-6 space-y-3">
            {/* Author selector */}
            <div className="flex gap-2">
              {(["emin", "emre"] as const).map((a) => {
                const active = commentAuthor === a
                const styles = {
                  emin: active
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300",
                  emre: active
                    ? "bg-amber-500 text-white border-amber-500"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-amber-300",
                }
                return (
                  <button
                    key={a}
                    onClick={() => setCommentAuthor(a)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                      styles[a]
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold",
                      active ? "bg-white/25" : a === "emin" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {a[0].toUpperCase()}
                    </div>
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                )
              })}
            </div>

            {/* Textarea + send */}
            <div className="flex gap-2 items-end">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment()
                }}
                placeholder="Yorum yaz... (Ctrl+Enter ile gönder)"
                rows={2}
                className="resize-none text-sm flex-1"
              />
              <Button
                onClick={handleAddComment}
                disabled={sendingComment || !commentText.trim()}
                size="icon"
                className="flex-shrink-0 h-[72px] w-10 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900"
              >
                {sendingComment
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />
                }
              </Button>
            </div>
          </div>

          {/* Comment list */}
          {comments.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <MessageCircle className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 dark:text-slate-500">Henüz yorum yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const isEmin = comment.author === "emin"
                return (
                  <div
                    key={comment.id}
                    className="flex gap-3 group animate-fade-in"
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5",
                      isEmin ? "bg-gradient-to-br from-indigo-400 to-indigo-600" : "bg-gradient-to-br from-amber-400 to-amber-600"
                    )}>
                      {comment.author[0].toUpperCase()}
                    </div>

                    {/* Bubble */}
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "rounded-2xl rounded-tl-sm px-4 py-3",
                        isEmin
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40"
                          : "bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40"
                      )}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={cn(
                            "text-[11px] font-semibold",
                            isEmin ? "text-indigo-700 dark:text-indigo-300" : "text-amber-700 dark:text-amber-300"
                          )}>
                            {comment.author.charAt(0).toUpperCase() + comment.author.slice(1)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                              {format(parseISO(comment.created_at), "d MMM, HH:mm", { locale: tr })}
                            </span>
                            <button
                              onClick={async () => {
                                setComments((prev) => prev.filter((c) => c.id !== comment.id))
                                await deleteComment(comment.id)
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 transition-all"
                              title="Yorumu sil"
                            >
                              <Trash className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="text-center pb-4">
          <p className="text-[11px] font-mono text-muted-foreground">
            Son güncelleme: {format(parseISO(task.updated_at), "d MMMM yyyy, HH:mm", { locale: tr })}
          </p>
        </div>
      </main>
    </div>
  )
}
