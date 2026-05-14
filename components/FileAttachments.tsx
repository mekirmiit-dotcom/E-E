"use client"

import { useState, useEffect, useRef } from "react"
import { Upload, FileText, Trash2, Loader2, Paperclip, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

type TaskFile = {
  id: string
  task_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_by: "emin" | "emre" | "tuna"
  created_at: string
}

const ACCEPTED = ["image/png", "image/jpeg", "image/gif", "application/pdf"]
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

function isImage(type: string) {
  return type.startsWith("image/")
}

export default function FileAttachments({ taskId }: { taskId: string }) {
  const [files, setFiles] = useState<TaskFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploader, setUploader] = useState<"emin" | "emre" | "tuna">("emin")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFiles()
  }, [taskId])

  async function loadFiles() {
    const { data } = await supabase
      .from("task_files")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false })
    if (data) setFiles(data)
  }

  async function handleUpload(file: File) {
    setError(null)
    if (!ACCEPTED.includes(file.type)) {
      setError("Desteklenmeyen format. PNG, JPG, GIF veya PDF yükle.")
      return
    }
    if (file.size > MAX_BYTES) {
      setError("Dosya 10MB'dan büyük olamaz.")
      return
    }

    setUploading(true)
    const ext = file.name.split(".").pop()
    const path = `${taskId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: storageErr } = await supabase.storage
      .from("task-files")
      .upload(path, file, { contentType: file.type })

    if (storageErr) {
      setError(`Yükleme hatası: ${storageErr.message}`)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from("task-files").getPublicUrl(path)
    const publicUrl = urlData.publicUrl

    const { data: row, error: dbErr } = await supabase
      .from("task_files")
      .insert({
        task_id: taskId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: uploader,
      })
      .select()
      .single()

    if (dbErr) {
      setError(`Kayıt hatası: ${dbErr.message}`)
    } else if (row) {
      setFiles((prev) => [row, ...prev])
    }

    setUploading(false)
  }

  async function handleDelete(file: TaskFile) {
    // Storage'dan path'i URL'den çıkar
    const url = new URL(file.file_url)
    const pathParts = url.pathname.split("/task-files/")
    const storagePath = pathParts[1]

    if (storagePath) {
      await supabase.storage.from("task-files").remove([storagePath])
    }
    await supabase.from("task_files").delete().eq("id", file.id)
    setFiles((prev) => prev.filter((f) => f.id !== file.id))
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    e.target.value = ""
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  return (
    <div className="space-y-4">
      {/* Uploader kişi seçici */}
      <div className="flex gap-2">
        {(["emin", "emre"] as const).map((u) => (
          <button
            key={u}
            onClick={() => setUploader(u)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
              uploader === u
                ? u === "emin"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-amber-500 text-white border-amber-500"
                : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold",
              uploader === u ? "bg-white/25" : u === "emin" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
            )}>
              {u[0].toUpperCase()}
            </div>
            {u === "emin" ? "Emin" : "Emre"}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-8 px-4",
          dragOver
            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]"
            : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-300 hover:bg-indigo-50/30"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.gif,.pdf"
          className="hidden"
          onChange={onInputChange}
        />
        {uploading ? (
          <Loader2 className="h-7 w-7 text-indigo-500 animate-spin" />
        ) : (
          <Upload className={cn("h-7 w-7 transition-colors", dragOver ? "text-indigo-500" : "text-slate-300 dark:text-slate-600")} />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {uploading ? "Yükleniyor..." : "Dosya sürükle veya tıkla"}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">PNG, JPG, GIF, PDF · maks. 10 MB</p>
        </div>
      </div>

      {/* Hata */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
          <X className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Dosya listesi */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <FileRow key={file.id} file={file} onDelete={() => handleDelete(file)} />
          ))}
        </div>
      )}

      {files.length === 0 && !uploading && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center italic">Henüz dosya eklenmedi</p>
      )}
    </div>
  )
}

function FileRow({ file, onDelete }: { file: TaskFile; onDelete: () => void }) {
  const [confirmDel, setConfirmDel] = useState(false)
  const img = isImage(file.file_type)

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 group hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      {/* Thumbnail / ikon */}
      {img ? (
        <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.file_url}
            alt={file.file_name}
            className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity"
          />
        </a>
      ) : (
        <a
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 flex items-center justify-center hover:opacity-80 transition-opacity"
        >
          <FileText className="h-6 w-6 text-red-500" />
        </a>
      )}

      {/* Dosya bilgisi */}
      <div className="flex-1 min-w-0">
        <a
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 truncate block transition-colors"
        >
          {file.file_name}
        </a>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-400 font-mono">{formatBytes(file.file_size)}</span>
          <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
          <span className={cn(
            "text-[10px] font-medium",
            file.uploaded_by === "emin" ? "text-indigo-500" : "text-amber-500"
          )}>
            {file.uploaded_by === "emin" ? "Emin" : "Emre"}
          </span>
        </div>
      </div>

      {/* Sil */}
      <div className="flex-shrink-0">
        {confirmDel ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onDelete}
              className="text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-colors"
            >
              Sil
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              className="text-[10px] text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg border border-slate-200 transition-colors"
            >
              İptal
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDel(true)}
            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 transition-all"
            title="Dosyayı sil"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
