"use client"

import { useEffect, useState, useMemo } from "react"
import AdminSidebar from "@/components/layout/AdminSidebar"
import { adminService, Category } from "@/lib/api/admin-service"
import { getOptimizedImageUrl } from "@/lib/utils/cloudinary-utils"
import {
  Plus, Search, Edit, Trash2, ImageIcon, Tag,
  Loader2, AlertCircle, CheckCircle, RefreshCw,
  UtensilsCrossed, Leaf,
} from "lucide-react"
import CategoryModal from "@/components/admin/CategoryModal"

// ── helpers ─────────────────────────────────────────────────────────────────

/** Cuisine categories have no parent. Food types have a parentCategoryId. */
function isCuisineCategory(c: Category) {
  return c.parentCategoryId === null
}

type ModalTarget =
  | { mode: "create-category" }
  | { mode: "edit-category"; item: Category }
  | { mode: "create-foodtype" }
  | { mode: "edit-foodtype"; item: Category }

// ── component ────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [allItems, setAllItems] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"categories" | "foodtypes">("categories")
  const [modal, setModal] = useState<ModalTarget | null>(null)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  async function load() {
    try {
      setIsLoading(true)
      const data = await adminService.getCategories()
      setAllItems(data)
    } catch (e: any) {
      flash("error", e?.message || "Failed to load.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function flash(type: "success" | "error", msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  // ── derived lists ─────────────────────────────────────────────────────────

  const cuisineCategories = useMemo(
    () => allItems.filter(isCuisineCategory),
    [allItems]
  )
  const foodTypes = useMemo(
    () => allItems.filter(c => !isCuisineCategory(c)),
    [allItems]
  )

  const q = search.trim().toLowerCase()
  const displayedCategories = q
    ? cuisineCategories.filter(c => c.name.toLowerCase().includes(q))
    : cuisineCategories
  const displayedFoodTypes = q
    ? foodTypes.filter(c => c.name.toLowerCase().includes(q))
    : foodTypes

  // ── delete ────────────────────────────────────────────────────────────────

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      setDeletingId(id)
      await adminService.deleteCategory(id)
      await load()
      flash("success", `"${name}" deleted.`)
    } catch (e: any) {
      flash("error", e?.message || "Failed to delete.")
    } finally {
      setDeletingId(null)
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  const isCatTab = tab === "categories"
  const currentList = isCatTab ? displayedCategories : displayedFoodTypes
  const totalCat = cuisineCategories.length
  const totalFood = foodTypes.length

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>

        {/* ── Header ── */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Categories & Food Types</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Manage cuisine categories and food type labels for restaurants
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => load()}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setModal(isCatTab ? { mode: "create-category" } : { mode: "create-foodtype" })}
                className="flex items-center gap-2 rounded-lg bg-[#FF4D00] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-95 transition"
              >
                <Plus className="h-4 w-4" />
                {isCatTab ? "Add Category" : "Add Food Type"}
              </button>
            </div>
          </div>
        </header>

        {/* ── Feedback banner ── */}
        {feedback && (
          <div className={`flex items-center gap-2 px-8 py-3 text-sm font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-b border-emerald-100"
              : "bg-red-50 text-red-700 border-b border-red-100"
          }`}>
            {feedback.type === "success"
              ? <CheckCircle className="h-4 w-4 shrink-0" />
              : <AlertCircle className="h-4 w-4 shrink-0" />}
            {feedback.msg}
          </div>
        )}

        {/* ── Tabs + Search ── */}
        <div className="border-b border-gray-200 bg-white px-8">
          {/* Stat tabs */}
          <div className="flex items-end gap-1 pt-1">
            <button
              onClick={() => setTab("categories")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                isCatTab
                  ? "border-[#FF4D00] text-[#FF4D00]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <UtensilsCrossed className="h-4 w-4" />
              Cuisine Categories
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                isCatTab ? "bg-orange-100 text-[#FF4D00]" : "bg-gray-100 text-gray-500"
              }`}>
                {totalCat}
              </span>
            </button>
            <button
              onClick={() => setTab("foodtypes")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                !isCatTab
                  ? "border-[#FF4D00] text-[#FF4D00]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Leaf className="h-4 w-4" />
              Food Types
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                !isCatTab ? "bg-orange-100 text-[#FF4D00]" : "bg-gray-100 text-gray-500"
              }`}>
                {totalFood}
              </span>
            </button>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div className="border-b border-gray-200 bg-white px-8 py-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${isCatTab ? "categories" : "food types"}…`}
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
            />
          </div>
        </div>

        {/* ── Context help ── */}
        <div className={`mx-8 mt-6 mb-0 rounded-xl border px-5 py-3.5 text-sm ${
          isCatTab
            ? "border-blue-100 bg-blue-50 text-blue-700"
            : "border-emerald-100 bg-emerald-50 text-emerald-700"
        }`}>
          {isCatTab ? (
            <span>
              <strong>Cuisine Categories</strong> represent the type of cuisine your restaurants offer — e.g. Nigerian, Italian, Chinese.
              Each category has an image. Restaurants pick a category when creating dishes.
            </span>
          ) : (
            <span>
              <strong>Food Types</strong> describe dietary attributes of dishes — e.g. 🌿 Vegetarian, 🥩 Non-Veg, 🌶️ Spicy, ✅ Halal.
              Each food type has an emoji icon. Restaurants pick a food type for every dish they add.
            </span>
          )}
        </div>

        {/* ── Content ── */}
        <main className="p-8 pt-4">
          {isLoading ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-4 border-b border-gray-100 px-6 py-4">
                  <div className={`shrink-0 rounded-lg bg-gray-200 ${isCatTab ? "h-14 w-14" : "h-10 w-10"}`} />
                  <div className="h-4 w-40 rounded bg-gray-200" />
                  <div className="ml-auto h-6 w-16 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : currentList.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
              {isCatTab
                ? <UtensilsCrossed className="h-12 w-12 text-gray-200" />
                : <Tag className="h-12 w-12 text-gray-200" />}
              <p className="mt-3 text-sm font-semibold text-gray-400">
                {search ? "No results match your search." : `No ${isCatTab ? "categories" : "food types"} yet.`}
              </p>
              {!search && (
                <button
                  onClick={() => setModal(isCatTab ? { mode: "create-category" } : { mode: "create-foodtype" })}
                  className="mt-4 text-sm font-bold text-[#FF4D00] hover:opacity-80"
                >
                  + Add your first {isCatTab ? "category" : "food type"}
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Table header */}
              <div className="grid border-b border-gray-100 bg-gray-50 px-6 py-3 text-xs font-bold uppercase text-gray-500"
                style={{ gridTemplateColumns: isCatTab ? "56px 1fr 2fr auto auto" : "48px 1fr 2fr auto" }}
              >
                <span>{isCatTab ? "Image" : "Icon"}</span>
                <span>Name</span>
                <span>Description</span>
                {isCatTab && <span className="text-center">Dishes</span>}
                <span className="text-center">Actions</span>
              </div>

              {/* Rows */}
              {currentList.map((item, i) => (
                <div
                  key={item.id}
                  className={`grid items-center gap-4 px-6 py-4 hover:bg-orange-50/30 transition-colors ${
                    i < currentList.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                  style={{ gridTemplateColumns: isCatTab ? "56px 1fr 2fr auto auto" : "48px 1fr 2fr auto" }}
                >
                  {/* Icon / image */}
                  {isCatTab ? (
                    // Category: show image URL or placeholder
                    item.icon && (item.icon.startsWith("http") || item.icon.startsWith("https")) ? (
                      <img
                        src={getOptimizedImageUrl(item.icon, 56, 56)}
                        alt={item.name}
                        className="h-14 w-14 rounded-lg object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100">
                        <ImageIcon className="h-6 w-6 text-gray-300" />
                      </div>
                    )
                  ) : (
                    // Food type: always render icon as plain text (emoji), never as <img>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-2xl shadow-sm select-none">
                      {item.icon && !item.icon.startsWith("http") ? item.icon : "🍽️"}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <p className="font-bold text-gray-900">{item.name}</p>
                    {!isCatTab && item.parentCategoryId && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        linked to category
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="truncate text-sm text-gray-500">
                    {item.description || <span className="text-gray-300">—</span>}
                  </p>

                  {/* Dish count (categories only) */}
                  {isCatTab && (
                    <span className="text-center text-sm font-semibold text-gray-500">
                      {item.dishCount ?? 0}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() =>
                        setModal(
                          isCatTab
                            ? { mode: "edit-category", item }
                            : { mode: "edit-foodtype", item }
                        )
                      }
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      disabled={deletingId === item.id}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      {deletingId === item.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Footer count */}
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-bold text-gray-600">{currentList.length}</span> of{" "}
                  <span className="font-bold text-gray-600">{isCatTab ? totalCat : totalFood}</span>{" "}
                  {isCatTab ? "categories" : "food types"}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <CategoryModal
          target={modal}
          cuisineCategories={cuisineCategories}
          onClose={() => setModal(null)}
          onSuccess={async (msg) => {
            setModal(null)
            flash("success", msg)
            await load()
          }}
        />
      )}
    </div>
  )
}