"use client"

import { useEffect, useRef, useState } from "react"
import RestaurantSidebar from "@/components/layout/RestaurantSidebar"
import { restaurantService, DishResponse } from "@/lib/api/restaurant-service"
import { uploadVideoToCloudinary } from "@/lib/utils/cloudinary-utils"
import {
  Video, Plus, Pencil, Trash2, X, Play, Upload,
  Loader2, CheckCircle, AlertCircle, FileVideo,
  Film, UtensilsCrossed, Link as LinkIcon, RefreshCw,
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────────

type VideoMode = "upload" | "url"

interface EditState {
  dish: DishResponse
  mode: VideoMode
  videoFile: File | null
  videoUrl: string   // manual URL input
}

type Toast = { id: number; type: "success" | "error"; message: string }

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isYouTube(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be")
}

function youtubeEmbedUrl(url: string) {
  const match =
    url.match(/[?&]v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/embed\/([^?]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#FF4D00] to-orange-400 transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

// ─── Video Preview ──────────────────────────────────────────────────────────────

function VideoPreview({ url, title }: { url: string; title: string }) {
  const embedUrl = isYouTube(url) ? youtubeEmbedUrl(url) : null

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }

  return (
    <video src={url} controls autoPlay className="h-full w-full" />
  )
}

// ─── Dish Video Card ───────────────────────────────────────────────────────────

function DishVideoCard({
  dish,
  onEdit,
  onRemove,
  onPreview,
}: {
  dish: DishResponse
  onEdit: () => void
  onRemove: () => void
  onPreview: () => void
}) {
  const isYT = dish.videoUrl ? isYouTube(dish.videoUrl) : false

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200">
      {/* Thumbnail */}
      <div
        className="relative aspect-video w-full cursor-pointer bg-gray-900 overflow-hidden"
        onClick={onPreview}
      >
        {dish.primaryImage ? (
          <img
            src={dish.primaryImage}
            alt={dish.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-70"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="h-12 w-12 text-gray-600" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <Play className="h-6 w-6 text-[#FF4D00] ml-1" fill="#FF4D00" />
          </div>
        </div>

        {/* Badge */}
        <div className={`absolute bottom-2 right-2 flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold text-white ${isYT ? "bg-red-600" : "bg-black/70"}`}>
          <Video className="h-3 w-3" />
          {isYT ? "YouTube" : "Video"}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-black text-gray-900 truncate text-sm">{dish.title}</h3>
        <p className="mt-0.5 text-xs text-gray-400 truncate">{dish.videoUrl}</p>

        <div className="mt-3 flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            title="Edit video"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Remove video"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function VideosPage() {
  const [dishes, setDishes]           = useState<DishResponse[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadError, setLoadError]     = useState<string | null>(null)
  const [editState, setEditState]     = useState<EditState | null>(null)
  const [saving, setSaving]           = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStep, setUploadStep]   = useState("")
  const [previewDish, setPreviewDish] = useState<DishResponse | null>(null)
  const [removeDish, setRemoveDish]   = useState<DishResponse | null>(null)
  const [toasts, setToasts]           = useState<Toast[]>([])
  const toastId = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { void loadDishes() }, [])

  async function loadDishes() {
    try {
      setLoading(true)
      setLoadError(null)
      const res = await restaurantService.getMyDishes(1, 100)
      const all: DishResponse[] = (res as any).data ?? (res as any).items ?? (Array.isArray(res) ? res : [])
      setDishes(all)
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load dishes")
    } finally {
      setLoading(false)
    }
  }

  const dishesWithVideo    = dishes.filter(d => d.videoUrl)
  const dishesWithoutVideo = dishes.filter(d => !d.videoUrl)

  // ── Toasts ──────────────────────────────────────────────────────────────────

  function addToast(type: Toast["type"], message: string) {
    const id = ++toastId.current
    setToasts(t => [...t, { id, type, message }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }

  // ── Open edit modal ─────────────────────────────────────────────────────────

  function openEdit(dish: DishResponse) {
    setEditState({
      dish,
      mode: dish.videoUrl && !isYouTube(dish.videoUrl) ? "upload" : "url",
      videoFile: null,
      videoUrl: dish.videoUrl || "",
    })
    setUploadProgress(0)
    setUploadStep("")
  }

  function openAdd(dish: DishResponse) {
    setEditState({ dish, mode: "url", videoFile: null, videoUrl: "" })
    setUploadProgress(0)
    setUploadStep("")
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!editState) return

    const { dish, mode, videoFile, videoUrl } = editState

    if (mode === "url" && !videoUrl.trim()) {
      addToast("error", "Please enter a video URL."); return
    }
    if (mode === "upload" && !videoFile && !dish.videoUrl) {
      addToast("error", "Please select a video file."); return
    }

    setSaving(true)
    setUploadProgress(5)

    try {
      let finalVideoUrl = dish.videoUrl || ""

      if (mode === "url") {
        finalVideoUrl = videoUrl.trim()
        setUploadProgress(50)
      } else if (mode === "upload" && videoFile) {
        setUploadStep("Uploading video to Cloudinary…")
        setUploadProgress(15)
        const res = await uploadVideoToCloudinary(videoFile, {
          folder: "foodieflow/videos",
          maxSizeInMB: 100,
        })
        finalVideoUrl = res.secure_url
        setUploadProgress(80)
      }

      setUploadStep("Saving to dish…")
      setUploadProgress(90)

      // Build FormData and update dish
      const formData = new FormData()
      formData.append("title", dish.title)
      formData.append("description", dish.description || "")
      formData.append("price", String(dish.price))
      formData.append("categoryId", dish.categoryId)
      formData.append("isAvailable", String(dish.isAvailable))
      formData.append("videoUrl", finalVideoUrl)

      await restaurantService.updateDish(dish.id, formData)
      setUploadProgress(100)

      // Update local state
      setDishes(prev => prev.map(d =>
        d.id === dish.id ? { ...d, videoUrl: finalVideoUrl } : d
      ))

      addToast("success", "Video saved successfully!")
      setTimeout(() => setEditState(null), 300)
    } catch (e: any) {
      addToast("error", e?.message || "Failed to save video.")
    } finally {
      setSaving(false)
      setUploadStep("")
    }
  }

  // ── Remove video ────────────────────────────────────────────────────────────

  async function handleRemove() {
    if (!removeDish) return
    try {
      const formData = new FormData()
      formData.append("title", removeDish.title)
      formData.append("description", removeDish.description || "")
      formData.append("price", String(removeDish.price))
      formData.append("categoryId", removeDish.categoryId)
      formData.append("isAvailable", String(removeDish.isAvailable))
      formData.append("videoUrl", "")

      await restaurantService.updateDish(removeDish.id, formData)
      setDishes(prev => prev.map(d =>
        d.id === removeDish.id ? { ...d, videoUrl: null } : d
      ))
      setRemoveDish(null)
      addToast("success", "Video removed.")
    } catch (e: any) {
      addToast("error", e?.message || "Failed to remove video.")
    }
  }

  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RestaurantSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-gray-900">Videos</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {dishesWithVideo.length} dish{dishesWithVideo.length !== 1 ? "es" : ""} with video · Add videos to your dishes to showcase them
              </p>
            </div>
            <button
              onClick={loadDishes}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        <main className="p-8 space-y-10">

          {/* Error */}
          {loadError && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" /> {loadError}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading dishes…
            </div>
          )}

          {/* Dishes WITH video */}
          {!loading && dishesWithVideo.length > 0 && (
            <section>
              <h2 className="mb-4 text-base font-black text-gray-900 flex items-center gap-2">
                <Video className="h-5 w-5 text-[#FF4D00]" />
                Videos ({dishesWithVideo.length})
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {dishesWithVideo.map(dish => (
                  <DishVideoCard
                    key={dish.id}
                    dish={dish}
                    onEdit={() => openEdit(dish)}
                    onRemove={() => setRemoveDish(dish)}
                    onPreview={() => setPreviewDish(dish)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Dishes WITHOUT video — add video */}
          {!loading && dishesWithoutVideo.length > 0 && (
            <section>
              <h2 className="mb-4 text-base font-black text-gray-900 flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-gray-400" />
                Dishes Without Video ({dishesWithoutVideo.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dishesWithoutVideo.map(dish => (
                  <div
                    key={dish.id}
                    className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white p-4 hover:border-[#FF4D00]/50 transition-colors"
                  >
                    {dish.primaryImage ? (
                      <img src={dish.primaryImage} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                        <UtensilsCrossed className="h-5 w-5 text-orange-200" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate text-sm">{dish.title}</p>
                      <p className="text-xs text-gray-400">₦{dish.price?.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => openAdd(dish)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#FF4D00] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Video
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!loading && dishes.length === 0 && !loadError && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-50">
                <Video className="h-10 w-10 text-[#FF4D00]" />
              </div>
              <h2 className="mt-5 text-lg font-black text-gray-900">No dishes yet</h2>
              <p className="mt-2 text-sm text-gray-500 max-w-xs">
                Add dishes first from the Dishes page, then come back to attach videos.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────────── */}
      {editState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF4D00]">
                  <Video className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900">
                    {editState.dish.videoUrl ? "Edit Video" : "Add Video"}
                  </h2>
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{editState.dish.title}</p>
                </div>
              </div>
              <button
                onClick={() => !saving && setEditState(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
                disabled={saving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Mode toggle */}
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                {(["url", "upload"] as VideoMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setEditState(s => s ? { ...s, mode: m } : s)}
                    disabled={saving}
                    className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors ${
                      editState.mode === m
                        ? "bg-[#FF4D00] text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {m === "url" ? <><LinkIcon className="h-4 w-4" /> Paste URL</> : <><Upload className="h-4 w-4" /> Upload File</>}
                  </button>
                ))}
              </div>

              {/* URL input */}
              {editState.mode === "url" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Video URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={editState.videoUrl}
                    onChange={e => setEditState(s => s ? { ...s, videoUrl: e.target.value } : s)}
                    placeholder="https://youtube.com/watch?v=... or https://..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF4D00] focus:bg-white focus:outline-none"
                    disabled={saving}
                  />
                  <p className="mt-1.5 text-xs text-gray-400">Supports YouTube links or direct video URLs (MP4, WebM)</p>
                </div>
              )}

              {/* File upload */}
              {editState.mode === "upload" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Video File {!editState.dish.videoUrl && <span className="text-red-500">*</span>}
                    {editState.dish.videoUrl && <span className="ml-2 normal-case font-normal text-green-600">· existing video saved</span>}
                  </label>
                  <div
                    onClick={() => !saving && fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                      editState.videoFile
                        ? "border-green-400 bg-green-50"
                        : "border-gray-300 bg-gray-50 hover:border-[#FF4D00] hover:bg-orange-50/40"
                    } ${saving ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/mov,video/quicktime,video/avi"
                      className="sr-only"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) setEditState(s => s ? { ...s, videoFile: f } : s)
                      }}
                    />
                    {editState.videoFile ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-6 w-6" />
                        <span className="text-xs font-bold truncate max-w-[220px]">{editState.videoFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <FileVideo className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="text-sm font-bold text-gray-700">Drop video or click to browse</p>
                          <p className="text-xs text-gray-400">MP4, WebM, MOV — max 100 MB</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Upload progress */}
              {saving && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF4D00]" />
                      {uploadStep || "Saving…"}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <ProgressBar value={uploadProgress} />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setEditState(null)}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#FF4D00] py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : <><Upload className="h-4 w-4" /> Save Video</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Video Preview Modal ───────────────────────────────────────────────── */}
      {previewDish && previewDish.videoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewDish(null)}
        >
          <div className="relative w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewDish(null)}
              className="absolute -top-10 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="overflow-hidden rounded-2xl bg-black shadow-2xl">
              <div className="aspect-video w-full">
                <VideoPreview url={previewDish.videoUrl} title={previewDish.title} />
              </div>
              <div className="bg-gray-900 px-5 py-3">
                <h3 className="font-black text-white">{previewDish.title}</h3>
                {previewDish.description && (
                  <p className="mt-1 text-sm text-gray-400 line-clamp-2">{previewDish.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove Confirm ────────────────────────────────────────────────────── */}
      {removeDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="mt-4 text-center text-base font-black text-gray-900">Remove Video?</h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              The video will be removed from <strong>"{removeDish.title}"</strong>. The dish itself won't be affected.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setRemoveDish(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toasts ───────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg pointer-events-auto ${
              t.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {t.type === "success"
              ? <CheckCircle className="h-4 w-4 shrink-0" />
              : <AlertCircle className="h-4 w-4 shrink-0" />
            }
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}