

"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import RestaurantSidebar from "@/components/layout/RestaurantSidebar"
import {
  CategoryResponse,
  DishResponse,
  restaurantService,
} from "@/lib/api/restaurant-service"
import {
  Plus, Search, Edit, Trash2, X, Loader2,
  AlertCircle, CheckCircle, ImageIcon, Star, Eye,
  Upload, Tag,
} from "lucide-react"

// ── types ─────────────────────────────────────────────────────────────────────

type DishForm = {
  id?: string
  title: string
  description: string
  shortDescription: string
  price: string
  categoryId: string
  foodTypeId: string      // food type category id (with emoji icon)
  tags: string
  isAvailable: boolean
  isFeatured: boolean
  primaryImage: File | null
  imgPreviewUrl: string   // existing image URL (kept if no new file selected)
}

const emptyForm: DishForm = {
  title: "", description: "", shortDescription: "",
  price: "", categoryId: "", foodTypeId: "", tags: "",
  isAvailable: true, isFeatured: false,
  primaryImage: null, imgPreviewUrl: "",
}

// ── helpers ───────────────────────────────────────────────────────────────────

function isCuisineCategory(c: CategoryResponse) {
  return c.parentCategoryId === null
}

// ── component ─────────────────────────────────────────────────────────────────

export default function RestaurantDishesPage() {
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [allCategories, setAllCategories] = useState<CategoryResponse[]>([])
  const [dishes, setDishes]               = useState<DishResponse[]>([])
  const [search, setSearch]               = useState("")
  const [filterCat, setFilterCat]         = useState("all")
  const [error, setError]                 = useState<string | null>(null)
  const [success, setSuccess]             = useState<string | null>(null)

  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState<DishForm>(emptyForm)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const fileRef                     = useRef<HTMLInputElement>(null)

  // ── derived category lists ─────────────────────────────────────────────

  /** Cuisine categories: e.g. Nigerian, Italian — icon is a URL */
  const cuisineCategories = useMemo(
    () => allCategories.filter(isCuisineCategory),
    [allCategories]
  )

  /** Food types: e.g. 🌿 Vegetarian, 🥩 Non-Veg — icon is an emoji */
  const foodTypes = useMemo(
    () => allCategories.filter(c => !isCuisineCategory(c)),
    [allCategories]
  )

  // ── load ──────────────────────────────────────────────────────────────────

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [cats, myDishes] = await Promise.all([
        restaurantService.getCategories(),
        restaurantService.getMyDishes(1, 100),
      ])
      setAllCategories(cats)
      setDishes(myDishes.data || [])
    } catch (e: any) {
      setError(e?.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  // ── filtered dish list ────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = dishes
    if (filterCat !== "all") list = list.filter(d => d.categoryId === filterCat)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(d =>
      [d.title, d.categoryName, d.tags || ""].join(" ").toLowerCase().includes(q)
    )
    return list
  }, [dishes, search, filterCat])

  // ── modal helpers ─────────────────────────────────────────────────────────

  function openCreate() {
    setForm({ ...emptyForm, categoryId: cuisineCategories[0]?.id || "" })
    setImgPreview(null)
    setShowModal(true)
    setError(null)
  }

  function openEdit(dish: DishResponse) {
    setForm({
      id: dish.id,
      title: dish.title,
      description: dish.description || "",
      shortDescription: dish.shortDescription || "",
      price: String(dish.price ?? ""),
      categoryId: dish.categoryId,
      foodTypeId: "",
      tags: dish.tags || "",
      isAvailable: dish.isAvailable,
      isFeatured: dish.isFeatured,
      primaryImage: null,
      imgPreviewUrl: dish.primaryImage || "",
    })
    setImgPreview(dish.primaryImage || null)
    setShowModal(true)
    setError(null)
  }

  function closeModal() {
    setShowModal(false)
    setForm(emptyForm)
    setImgPreview(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  function handleImageSelect(file: File) {
    const valid = ["image/jpeg","image/jpg","image/png","image/webp","image/gif"]
    if (!valid.includes(file.type)) {
      setError("Only JPG, PNG, WEBP, GIF images are allowed.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.")
      return
    }
    setError(null)
    setForm(f => ({ ...f, primaryImage: file }))
    const reader = new FileReader()
    reader.onloadend = () => setImgPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  // ── save ──────────────────────────────────────────────────────────────────

  async function onSave() {
    if (!form.title.trim() || !form.price || !form.categoryId) {
      setError("Title, price, and category are required.")
      return
    }
    setError(null)
    setSuccess(null)

    try {
      setSaving(true)

      // Build FormData — the API is multipart/form-data
      const fd = new FormData()
      fd.append("title",            form.title.trim())
      fd.append("description",      form.description)
      fd.append("shortDescription", form.shortDescription)
      fd.append("price",            form.price)
      fd.append("categoryId",       form.categoryId)
      fd.append("isAvailable",      String(form.isAvailable))
      fd.append("isFeatured",       String(form.isFeatured))

      // Combine food type into tags so it's searchable and filterable
      const tagsArr = form.tags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)

      if (form.foodTypeId) {
        const ft = foodTypes.find(f => f.id === form.foodTypeId)
        if (ft && !tagsArr.includes(ft.name)) {
          tagsArr.unshift(ft.name)
        }
      }
      fd.append("tags", tagsArr.join(", "))

      // Image — if new file picked, send it; backend handles upload to cloud storage
      if (form.primaryImage) {
        fd.append("primaryImage", form.primaryImage)
      }

      if (form.id) {
        await restaurantService.updateDish(form.id, fd)
        setSuccess("Dish updated successfully!")
      } else {
        await restaurantService.createDish(fd)
        setSuccess("Dish created successfully!")
      }

      closeModal()
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed to save dish.")
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      setDeleting(id)
      await restaurantService.deleteDish(id)
      await load()
      setSuccess("Dish deleted.")
    } catch (e: any) {
      setError(e?.message || "Failed to delete dish.")
    } finally {
      setDeleting(null)
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RestaurantSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>

        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Dishes</h1>
              <p className="mt-1 text-sm text-gray-500">
                {dishes.length} dish{dishes.length !== 1 ? "es" : ""}
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF4D00] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add Dish
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-8 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-48 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
              placeholder="Search dishes…"
            />
          </div>
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none"
          >
            <option value="all">All Categories</option>
            {cuisineCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Alerts */}
        <div className="px-8 pt-4 space-y-3">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" /> {success}
            </div>
          )}
        </div>

        {/* Dish grid */}
        <div className="p-8 pt-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading dishes…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
              <ImageIcon className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-semibold text-gray-500">No dishes yet</p>
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#FF4D00] px-4 py-2 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add Your First Dish
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(dish => (
                <div key={dish.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-36 bg-gray-100">
                    {dish.primaryImage ? (
                      <img src={dish.primaryImage} alt={dish.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-gray-300" />
                      </div>
                    )}
                    {dish.isFeatured && (
                      <span className="absolute left-2 top-2 rounded-full bg-[#FF4D00] px-2 py-0.5 text-[10px] font-bold text-white">
                        Featured
                      </span>
                    )}
                    <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      dish.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {dish.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-black text-gray-900">{dish.title}</h3>
                    <p className="mt-0.5 truncate text-xs text-gray-400">{dish.categoryName || "No category"}</p>
                    {dish.shortDescription && (
                      <p className="mt-2 line-clamp-2 text-xs text-gray-500">{dish.shortDescription}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-lg font-black text-[#FF4D00]">₦{Number(dish.price).toLocaleString()}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {dish.averageRating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            {dish.averageRating.toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> {dish.viewCount}
                        </span>
                      </div>
                    </div>
                    {dish.tags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {dish.tags.split(",").map(t => (
                          <span key={t.trim()} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => openEdit(dish)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => onDelete(dish.id, dish.title)}
                        disabled={deleting === dish.id}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleting === dish.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Dish Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-2xl max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-black text-gray-900">
                {form.id ? "Edit Dish" : "Add New Dish"}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">Dish Name *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                  placeholder="e.g. Jollof Rice with Chicken"
                />
              </div>

              {/* Short description */}
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">Short Description</label>
                <input
                  value={form.shortDescription}
                  onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                  placeholder="Brief tagline shown on card"
                />
              </div>

              {/* Full description */}
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">Full Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                  placeholder="Ingredients, preparation, serving size…"
                />
              </div>

              {/* Price + Category — side by side */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-600">Price (₦) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-600">
                    Category *
                    <span className="ml-1 font-normal text-gray-400">(set by Admin)</span>
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                  >
                    <option value="">— Select Category —</option>
                    {cuisineCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {cuisineCategories.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No categories available — Admin must create them first.
                    </p>
                  )}
                </div>
              </div>

              {/* Food Type (separate from category — e.g. Veg, Non-Veg, Halal) */}
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-gray-600">
                  <Tag className="h-3.5 w-3.5 text-[#FF4D00]" />
                  Food Type
                  <span className="font-normal text-gray-400">(dietary label — set by Admin)</span>
                </label>
                {foodTypes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-400">
                    No food types set up yet — Admin needs to create food types (e.g. Veg, Non-Veg, Halal) in the admin panel.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {/* "None" option */}
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, foodTypeId: "" }))}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        form.foodTypeId === ""
                          ? "border-[#FF4D00] bg-orange-50 text-[#FF4D00]"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      None
                    </button>
                    {foodTypes.map(ft => (
                      <button
                        type="button"
                        key={ft.id}
                        onClick={() => setForm(f => ({ ...f, foodTypeId: ft.id }))}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          form.foodTypeId === ft.id
                            ? "border-[#FF4D00] bg-orange-50 text-[#FF4D00]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span>{ft.icon}</span>
                        {ft.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">
                  Extra Tags
                  <span className="ml-1 font-normal text-gray-400">(comma-separated)</span>
                </label>
                <input
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                  placeholder="spicy, gluten-free, best-seller…"
                />
              </div>

              {/* Primary Image */}
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">
                  Primary Image
                  <span className="ml-1 font-normal text-gray-400">(backend stores to cloud)</span>
                </label>
                {imgPreview ? (
                  <div className="relative rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <img src={imgPreview} alt="Preview" className="mx-auto h-32 rounded-lg object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setImgPreview(null)
                        setForm(f => ({ ...f, primaryImage: null, imgPreviewUrl: "" }))
                        if (fileRef.current) fileRef.current.value = ""
                      }}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {form.primaryImage && (
                      <p className="mt-1 text-center text-xs text-gray-400">{form.primaryImage.name}</p>
                    )}
                  </div>
                ) : (
                  <label
                    className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center hover:border-[#FF4D00] hover:bg-orange-50 transition-colors"
                    onDrop={e => {
                      e.preventDefault()
                      const f = e.dataTransfer.files[0]
                      if (f) handleImageSelect(f)
                    }}
                    onDragOver={e => e.preventDefault()}
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

              {/* Availability toggles */}
              <div className="flex items-center gap-6">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))}
                    className="h-4 w-4 rounded accent-[#FF4D00]"
                  />
                  <span className="text-xs font-bold text-gray-700">Available for order</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                    className="h-4 w-4 rounded accent-[#FF4D00]"
                  />
                  <span className="text-xs font-bold text-gray-700">Featured</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#FF4D00] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-90 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {form.id ? "Update Dish" : "Create Dish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}