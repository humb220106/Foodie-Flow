"use client"

import { useState, useRef } from "react"
import { X, Loader2, AlertCircle, Upload, CheckCircle } from "lucide-react"
import { adminService, Category } from "@/lib/api/admin-service"

export type ModalTarget =
  | { mode: "create-category" }
  | { mode: "edit-category"; item: Category }
  | { mode: "create-foodtype" }
  | { mode: "edit-foodtype"; item: Category }

interface Props {
  target: ModalTarget
  onClose: () => void
  onSuccess: (msg: string) => void
  cuisineCategories: Category[]
}

const EMOJIS = [
  // Dietary / Food Attributes (Updated Set)
  "🌿", // Vegetarian
  "🥦", // Vegan
  "🥩", // Non-Vegetarian
  "✅", // Halal
  "🌶️", // Spicy
  "🌾", // Gluten-Free
  "🐟", // Seafood
  "🫙", // Dairy-Free
  "🚫", // Nut-Free
  "🍳", // Egg-Free
  "🔥", // Grilled
  "🫕", // Fried
  "⚡", // Low Calorie
  "💪", // High Protein
  "🏕️", // Smoked
  "🥗", // Raw & Fresh
  "🌱", // Organic
  "👶", // Kids Friendly
  "⭐", // Signature Dish
  "🤝", // Shareable
];

export default function CategoryModal({ target, onClose, onSuccess, cuisineCategories }: Props) {
  const isFoodType = target.mode === "create-foodtype" || target.mode === "edit-foodtype"
  const isEditing  = target.mode === "edit-category"   || target.mode === "edit-foodtype"
  const existing   = ("item" in target ? target.item : null) as Category | null

  // ── Form state ──────────────────────────────────────────────────────────────

  const [name, setName]         = useState(existing?.name ?? "")
  const [description, setDesc]  = useState(existing?.description ?? "")

  // Food type: emoji string
  const [emoji, setEmoji]       = useState(isFoodType ? (existing?.icon ?? "") : "")
  const [showPicker, setPicker] = useState(false)

  // Cuisine category: image file + preview
  const [imageFile, setImageFile]    = useState<File | null>(null)
  const [imgPreview, setImgPreview]  = useState<string | null>(
    !isFoodType && existing?.icon ? existing.icon : null
  )
  const [isDragging, setDragging]    = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Food type parent
  const [parentCategoryId, setParentCategoryId] = useState(
    existing?.parentCategoryId ?? (cuisineCategories[0]?.id ?? "")
  )

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const titles: Record<ModalTarget["mode"], string> = {
    "create-category": "Add New Category",
    "edit-category":   "Edit Category",
    "create-foodtype": "Add New Food Type",
    "edit-foodtype":   "Edit Food Type",
  }

  // ── Image selection (mirrors handleImageSelect in dish form) ────────────────

  function handleImageSelect(file: File) {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG, WEBP, GIF images are allowed.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.")
      return
    }
    setError(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImgPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setImageFile(null)
    setImgPreview(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim())                              { setError("Name is required."); return }
    if (isFoodType && !emoji.trim())               { setError("Please pick or type an emoji icon."); return }
    if (isFoodType && !parentCategoryId)           { setError("Please select a parent category."); return }
    setError(null)
    setSaving(true)

    try {
      if (isEditing && existing) {
        await adminService.updateCategory(existing.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          ...(isFoodType
            ? { iconEmoji: emoji.trim() }
            : imageFile
              ? { iconFile: imageFile }
              : {}   // no new image → don't send icon field; backend keeps existing
          ),
          parentCategoryId: isFoodType ? parentCategoryId : undefined,
        })
      } else {
        await adminService.createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
          ...(isFoodType
            ? { iconEmoji: emoji.trim() }
            : imageFile
              ? { iconFile: imageFile }
              : {}
          ),
          parentCategoryId: isFoodType ? parentCategoryId : undefined,
        })
      }

      onSuccess(`"${name.trim()}" ${isEditing ? "updated" : "created"} successfully.`)
    } catch (e: any) {
      setError(e?.message || "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 className="text-lg font-black text-gray-900">{titles[target.mode]}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              {isFoodType ? "Food Type Name" : "Category Name"}
              <span className="text-red-500"> *</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={isFoodType ? "e.g. Vegetarian, Non-Veg, Halal…" : "e.g. Nigerian Cuisine, Italian…"}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              placeholder={isFoodType ? "Short description of this dietary label…" : "Short description of this cuisine type…"}
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
            />
          </div>

          {/* ── FOOD TYPE: parent + emoji picker ── */}
          {isFoodType && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                  Parent Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={parentCategoryId}
                  onChange={e => setParentCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
                >
                  <option value="">— Select a category —</option>
                  {cuisineCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {cuisineCategories.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">Create a cuisine category first.</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                  Emoji Icon <span className="text-red-500">*</span>
                  <span className="ml-1 text-xs font-normal text-gray-400">shown to restaurants & customers</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-50 text-4xl select-none shadow-sm">
                    {emoji || <span className="text-sm text-gray-300">?</span>}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      value={emoji}
                      onChange={e => setEmoji(e.target.value)}
                      placeholder="Type or paste emoji"
                      maxLength={8}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-center text-2xl outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setPicker(v => !v)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100"
                    >
                      {showPicker ? "▲ Hide picker" : "▼ Pick an emoji"}
                    </button>
                  </div>
                </div>
                {showPicker && (
                  <div className="mt-3 grid grid-cols-10 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    {EMOJIS.map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => { setEmoji(em); setPicker(false) }}
                        className={`rounded-lg py-1 text-xl transition-all hover:bg-white hover:shadow-sm ${emoji === em ? "bg-orange-100 ring-2 ring-[#FF4D00]" : ""}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── CUISINE CATEGORY: image upload (mirrors dish form exactly) ── */}
          {!isFoodType && (
            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                Category Image
                <span className="ml-1 text-xs font-normal text-gray-400">
                  (stored to cloud — same as dish images)
                </span>
              </label>

              {imgPreview ? (
                /* Preview state — matches dish form preview block */
                <div className="relative rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <img
                    src={imgPreview}
                    alt="Preview"
                    className="mx-auto h-32 rounded-lg object-contain"
                  />
                  {/* Red X button — identical to dish form */}
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {imageFile && (
                    <p className="mt-1 text-center text-xs text-gray-400">{imageFile.name}</p>
                  )}
                  {!imageFile && (
                    <p className="mt-1 text-center text-xs text-gray-400">Current image — upload a new one to replace</p>
                  )}
                  {/* Allow re-selecting while previewing */}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    <Upload className="h-3.5 w-3.5" /> Replace image
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(f) }}
                  />
                </div>
              ) : (
                /* Drop-zone state — identical structure to dish form */
                <label
                  className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center hover:border-[#FF4D00] hover:bg-orange-50 transition-colors"
                  onDrop={e => {
                    e.preventDefault()
                    setDragging(false)
                    const f = e.dataTransfer.files[0]
                    if (f) handleImageSelect(f)
                  }}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  style={isDragging ? { borderColor: "#FF4D00", backgroundColor: "#fff7f5" } : {}}
                >
                  <Upload className="h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-xs font-semibold text-gray-500">
                    <span className="text-[#FF4D00]">Click to upload</span> or drag & drop
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">PNG, JPG, WEBP — max 10 MB</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(f) }}
                  />
                </label>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-lg border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF4D00] py-3 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : isEditing ? "Save Changes"
                : isFoodType ? "Create Food Type"
                : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}