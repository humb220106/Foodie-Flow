"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import {
  ChevronLeft, Star, ShoppingCart, Plus, Minus,
  UtensilsCrossed, Loader2, AlertCircle, MessageSquare,
  CheckCircle, Package, Utensils, User, Search,
  SlidersHorizontal, X, ChevronDown, TrendingUp, Filter,
  Clock, MapPin, Phone, Share2, Heart, Sparkles,
  ChevronRight, StarHalf, BookOpen, Menu, Camera,
  ChevronUp, Newspaper, Eye, Tag, BadgeCheck,
} from "lucide-react"
import {
  customerService,
  cartService,
  DishResponse,
  ReviewResponse,
  ReviewSummary,
  RestaurantResponse,
  MenuResponse,
  CategoryResponse,
} from "@/lib/api/customer-service"
import { restaurantService, BookSummaryResponse } from "@/lib/api/restaurant-service"

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })
}

// Renders a category icon safely:
// - If icon is a URL (Cloudinary image) → <img>
// - If icon is an emoji or short string  → <span>
// - If icon is null/empty               → nothing
function CategoryIcon({ icon, className = "h-4 w-4" }: { icon: string | null | undefined; className?: string }) {
  if (!icon) return null
  const isUrl = icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("/")
  if (isUrl) return <img src={icon} alt="" className={`${className} object-cover rounded`} />
  return <span className="text-sm leading-none">{icon}</span>
}

function StarRating({ rating, size = "md", showNumber = false }: {
  rating: number; size?: "sm" | "md" | "lg"; showNumber?: boolean
}) {
  const cls = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" }[size]
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < full) return <Star key={i} className={`${cls} fill-amber-400 text-amber-400`} />
          if (i === full && half) return (
            <div key={i} className="relative">
              <Star className={`${cls} text-gray-200`} />
              <StarHalf className={`${cls} absolute top-0 left-0 fill-amber-400 text-amber-400`} />
            </div>
          )
          return <Star key={i} className={`${cls} text-gray-200`} />
        })}
      </div>
      {showNumber && <span className="text-sm font-semibold text-gray-700 ml-1">{rating.toFixed(1)}</span>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER STATE
// ─────────────────────────────────────────────────────────────────────────────

interface FilterState {
  query: string
  foodTypes: string[]   // child category ids (Veg, Non-Veg, etc.) — from API
  cuisines: string[]    // root category ids — from API
  priceRange: [number, number]
  onlyAvailable: boolean
  onlyFeatured: boolean
  minRating: number
  sortBy: string
}

const DEFAULT_FILTER: FilterState = {
  query: "", foodTypes: [], cuisines: [],
  priceRange: [0, 50000], onlyAvailable: false,
  onlyFeatured: false, minRating: 0, sortBy: "default",
}

const SORT_OPTIONS = [
  { id: "default",    label: "Recommended" },
  { id: "price_asc",  label: "Price: Low → High" },
  { id: "price_desc", label: "Price: High → Low" },
  { id: "rating",     label: "Top Rated" },
  { id: "popular",    label: "Most Popular" },
]

const PRICE_PRESETS = [
  { label: "Under ₦2k",  min: 0,     max: 2000  },
  { label: "₦2k–5k",    min: 2000,  max: 5000  },
  { label: "₦5k–10k",   min: 5000,  max: 10000 },
  { label: "₦10k+",     min: 10000, max: 50000 },
]

function applyFilters(dishes: DishResponse[], f: FilterState): DishResponse[] {
  let r = [...dishes]
  if (f.query.trim()) {
    const q = f.query.toLowerCase()
    r = r.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.shortDescription?.toLowerCase().includes(q) ||
      d.tags?.toLowerCase().includes(q) ||
      d.categoryName.toLowerCase().includes(q)
    )
  }
  // food-type filter: match against dish tags OR categoryId
  if (f.foodTypes.length > 0) {
    r = r.filter(d => {
      const tags = (d.tags ?? "").toLowerCase()
      return f.foodTypes.some(ft => tags.includes(ft.toLowerCase()) || d.categoryId === ft)
    })
  }
  if (f.cuisines.length > 0) {
    r = r.filter(d => f.cuisines.includes(d.categoryId))
  }
  r = r.filter(d => d.price >= f.priceRange[0] && d.price <= f.priceRange[1])
  if (f.onlyAvailable) r = r.filter(d => d.isAvailable && d.isActive)
  if (f.onlyFeatured)  r = r.filter(d => d.isFeatured)
  if (f.minRating > 0) r = r.filter(d => d.averageRating >= f.minRating)
  switch (f.sortBy) {
    case "price_asc":  r.sort((a, b) => a.price - b.price); break
    case "price_desc": r.sort((a, b) => b.price - a.price); break
    case "rating":     r.sort((a, b) => b.averageRating - a.averageRating); break
    case "popular":    r.sort((a, b) => b.viewCount - a.viewCount); break
  }
  return r
}

function countActive(f: FilterState) {
  let n = f.foodTypes.length + f.cuisines.length
  if (f.priceRange[0] > 0 || f.priceRange[1] < 50000) n++
  if (f.onlyAvailable) n++
  if (f.onlyFeatured) n++
  if (f.minRating > 0) n++
  if (f.sortBy !== "default") n++
  return n
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER DRAWER
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${on ? "bg-[#FF4D00]" : "bg-gray-300"}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-1"}`} />
    </button>
  )
}

function FilterDrawer({
  open, onClose, filters, onChange, onReset,
  foodTypes, cuisines,
}: {
  open: boolean; onClose: () => void
  filters: FilterState; onChange: (p: Partial<FilterState>) => void
  onReset: () => void
  foodTypes: CategoryResponse[]
  cuisines: CategoryResponse[]
}) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <SlidersHorizontal className="h-5 w-5 text-[#FF4D00]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Filters & Sort</h3>
          </div>
          <button onClick={onReset} className="text-sm font-medium text-gray-500 hover:text-[#FF4D00]">Reset all</button>
        </div>

        <div className="p-5 space-y-6">
          {/* Sort */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sort by</h4>
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => onChange({ sortBy: opt.id })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    filters.sortBy === opt.id ? "bg-[#FF4D00] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Food types from API */}
          {foodTypes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Food Type</h4>
              <div className="flex flex-wrap gap-2">
                {foodTypes.map(ft => {
                  const active = filters.foodTypes.includes(ft.id) || filters.foodTypes.includes(ft.name)
                  return (
                    <button key={ft.id} onClick={() => onChange({
                      foodTypes: active
                        ? filters.foodTypes.filter(x => x !== ft.id && x !== ft.name)
                        : [...filters.foodTypes, ft.id]
                    })}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                        active ? "bg-[#FF4D00] text-white border-transparent" : "bg-gray-50 border-gray-200 text-gray-700 hover:border-[#FF4D00]"
                      }`}>
                      <CategoryIcon icon={ft.icon} />
                      {ft.name}
                      {active && <CheckCircle className="h-3 w-3 ml-1" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cuisine categories from API */}
          {cuisines.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cuisine</h4>
              <div className="flex flex-wrap gap-2">
                {cuisines.map(c => {
                  const active = filters.cuisines.includes(c.id)
                  return (
                    <button key={c.id} onClick={() => onChange({
                      cuisines: active ? filters.cuisines.filter(x => x !== c.id) : [...filters.cuisines, c.id]
                    })}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                        active ? "bg-[#FF4D00] text-white border-transparent" : "bg-gray-50 border-gray-200 text-gray-700 hover:border-[#FF4D00]"
                      }`}>
                      <CategoryIcon icon={c.icon} />
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Price range */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Price range</h4>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {PRICE_PRESETS.map(p => {
                const active = filters.priceRange[0] === p.min && filters.priceRange[1] === p.max
                return (
                  <button key={p.label} onClick={() => onChange({ priceRange: [p.min, p.max] })}
                    className={`px-2 py-2 rounded-xl text-xs font-medium transition-all ${
                      active ? "bg-[#FF4D00] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}>
                    {p.label}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Min (₦)</label>
                <input type="number" min={0} value={filters.priceRange[0]}
                  onChange={e => onChange({ priceRange: [Number(e.target.value) || 0, filters.priceRange[1]] })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF4D00]" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Max (₦)</label>
                <input type="number" min={0} value={filters.priceRange[1] >= 50000 ? "" : filters.priceRange[1]}
                  placeholder="Any"
                  onChange={e => onChange({ priceRange: [filters.priceRange[0], Number(e.target.value) || 50000] })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF4D00]" />
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Minimum rating</h4>
            <div className="flex gap-2">
              {[0, 3, 3.5, 4, 4.5].map(r => (
                <button key={r} onClick={() => onChange({ minRating: r })}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-medium transition-all ${
                    filters.minRating === r ? "bg-amber-400 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}>
                  {r === 0 ? "Any" : <><Star className={`h-3 w-3 ${filters.minRating === r ? "fill-white" : ""}`} />{r}+</>}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium text-gray-700">Available items only</span>
              </div>
              <Toggle on={filters.onlyAvailable} onToggle={() => onChange({ onlyAvailable: !filters.onlyAvailable })} />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[#FF4D00]" />
                <span className="text-sm font-medium text-gray-700">Featured dishes only</span>
              </div>
              <Toggle on={filters.onlyFeatured} onToggle={() => onChange({ onlyFeatured: !filters.onlyFeatured })} />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5">
          <button onClick={onClose}
            className="w-full py-3 bg-[#FF4D00] text-white font-semibold rounded-xl shadow-lg shadow-[#FF4D00]/30 hover:opacity-90">
            Show results
          </button>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DISH CARD
// ─────────────────────────────────────────────────────────────────────────────

function DishCard({ dish, foodTypes, onCartChange }: {
  dish: DishResponse
  foodTypes: CategoryResponse[]
  onCartChange: () => void
}) {
  const [qty, setQty] = useState(() => cartService.get().find(c => c.dishId === dish.id)?.quantity ?? 0)
  const unavailable = !dish.isAvailable || !dish.isActive

  function add() {
    const ok = cartService.add({
      dishId: dish.id, dishName: dish.title, dishImage: dish.primaryImage,
      price: dish.price, quantity: 1, restaurantId: dish.restaurantId, restaurantName: dish.restaurantName,
    })
    if (ok) { setQty(cartService.get().find(c => c.dishId === dish.id)?.quantity ?? 1); onCartChange() }
  }

  function dec() {
    cartService.updateQty(dish.id, qty - 1)
    setQty(Math.max(0, qty - 1))
    onCartChange()
  }

  // Match dish tags against food types from API
  const matchedTypes = foodTypes.filter(ft =>
    (dish.tags ?? "").toLowerCase().includes(ft.name.toLowerCase()) ||
    dish.categoryId === ft.id
  )

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        {dish.primaryImage ? (
          <img src={dish.primaryImage} alt={dish.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
            <UtensilsCrossed className="h-12 w-12 text-[#FF4D00]/30" />
          </div>
        )}
        {dish.isFeatured && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#FF4D00] text-white text-xs font-bold rounded-lg shadow-lg">
              <Sparkles className="h-3 w-3" /> Featured
            </span>
          </div>
        )}
        {unavailable && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1.5 bg-black/80 text-white text-sm font-bold rounded-full">Unavailable</span>
          </div>
        )}
        <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-base font-bold text-gray-900 line-clamp-1 flex-1">{dish.title}</h3>
          <span className="text-base font-bold text-[#FF4D00] shrink-0">{formatNGN(dish.price)}</span>
        </div>

        {(dish.shortDescription || dish.description) && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{dish.shortDescription ?? dish.description}</p>
        )}

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {dish.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={dish.averageRating} size="sm" />
              <span className="text-xs text-gray-400">({dish.reviewCount})</span>
            </div>
          )}
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{dish.categoryName}</span>
        </div>

        {/* Matched food type badges from API */}
        {matchedTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {matchedTypes.slice(0, 3).map(ft => (
              <span key={ft.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 border border-orange-100 rounded-lg text-[10px] font-medium text-orange-700">
                <CategoryIcon icon={ft.icon} />
                {ft.name}
              </span>
            ))}
          </div>
        )}

        {!unavailable && (
          qty > 0 ? (
            <div className="flex items-center gap-2">
              <button onClick={dec} className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                <Minus className="h-4 w-4 text-gray-600" />
              </button>
              <span className="w-8 text-center font-semibold text-gray-900">{qty}</span>
              <button onClick={add} className="p-2 bg-[#FF4D00] rounded-xl hover:opacity-90 transition-opacity">
                <Plus className="h-4 w-4 text-white" />
              </button>
            </div>
          ) : (
            <button onClick={add}
              className="w-full py-2.5 bg-[#FF4D00] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </button>
          )
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MENU SECTION (orderable)
// ─────────────────────────────────────────────────────────────────────────────

function MenuDishRow({ dish, restaurantId, restaurantName, onCartChange }: {
  dish: { dishId: string; dishName: string; dishImage?: string | null; price: number; isAvailable: boolean }
  restaurantId: string
  restaurantName: string
  onCartChange: () => void
}) {
  const [qty, setQty] = useState(() => cartService.get().find(c => c.dishId === dish.dishId)?.quantity ?? 0)

  function add() {
    const ok = cartService.add({
      dishId: dish.dishId, dishName: dish.dishName,
      dishImage: dish.dishImage ?? null,
      price: dish.price, quantity: 1,
      restaurantId, restaurantName,
    })
    if (ok) { setQty(cartService.get().find(c => c.dishId === dish.dishId)?.quantity ?? 1); onCartChange() }
  }

  function dec() {
    cartService.updateQty(dish.dishId, qty - 1)
    setQty(Math.max(0, qty - 1))
    onCartChange()
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      dish.isAvailable ? "border-gray-100 bg-white hover:border-orange-100 hover:bg-orange-50/30" : "border-gray-100 bg-gray-50 opacity-60"
    }`}>
      <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0 bg-orange-50 flex items-center justify-center">
        {dish.dishImage
          ? <img src={dish.dishImage} alt={dish.dishName} className="h-full w-full object-cover" />
          : <UtensilsCrossed className="h-5 w-5 text-[#FF4D00]/40" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate text-sm">{dish.dishName}</p>
        <p className="text-sm font-bold text-[#FF4D00]">{formatNGN(dish.price)}</p>
        {!dish.isAvailable && <p className="text-[10px] text-gray-400">Currently unavailable</p>}
      </div>
      {dish.isAvailable && (
        qty > 0 ? (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={dec} className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200">
              <Minus className="h-3.5 w-3.5 text-gray-600" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-gray-900">{qty}</span>
            <button onClick={add} className="p-1.5 bg-[#FF4D00] rounded-lg hover:opacity-90">
              <Plus className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        ) : (
          <button onClick={add}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-[#FF4D00] text-white text-xs font-bold rounded-xl hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        )
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => onChange(s)}
          className="transition-transform hover:scale-110 active:scale-95">
          <Star className={`h-9 w-9 transition-colors ${s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"}`} />
        </button>
      ))}
    </div>
  )
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"]

function ReviewModal({ restaurantId, restaurantName, onClose, onSuccess }: {
  restaurantId: string
  restaurantName: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addImages(files: FileList | null) {
    if (!files) return
    const arr = Array.from(files).slice(0, 3 - images.length)
    setImages(p => [...p, ...arr])
    setPreviews(p => [...p, ...arr.map(f => URL.createObjectURL(f))])
  }

  function removeImage(i: number) {
    setImages(p => p.filter((_, idx) => idx !== i))
    setPreviews(p => p.filter((_, idx) => idx !== i))
  }

  async function submit() {
    if (rating === 0) { setError("Please select a rating."); return }
    setSubmitting(true); setError(null)
    try {
      await customerService.submitRestaurantReview(restaurantId, rating, comment, images.length ? images : undefined)
      onSuccess()
    } catch (e: any) {
      setError(e?.message || "Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50 bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900">Rate your experience</h3>
            <p className="text-xs text-gray-500">{restaurantName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-1">
            <StarPicker value={rating} onChange={setRating} />
            {rating > 0 && <p className="text-sm font-bold text-[#FF4D00]">{RATING_LABELS[rating]}</p>}
          </div>

          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Share your experience — food quality, service, delivery…"
            rows={4}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF4D00] focus:bg-white focus:outline-none" />

          {/* Image upload */}
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Add photos (optional, max 3)</p>
            <div className="flex gap-2 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative h-16 w-16">
                  <img src={src} alt="" className="h-full w-full rounded-xl object-cover" />
                  <button onClick={() => removeImage(i)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-[#FF4D00]">
                  <Camera className="h-5 w-5 text-gray-400" />
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={e => addImages(e.target.files)} />
                </label>
              )}
            </div>
          </div>

          <button onClick={submit} disabled={submitting || rating === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF4D00] py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 hover:opacity-90 disabled:opacity-50">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Review"}
          </button>
          <p className="text-center text-xs text-gray-400">Reviews are published after admin approval.</p>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW CARD
// ─────────────────────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: ReviewResponse }) {
  const name = review.authorUsername || review.authorName || "Customer"
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF4D00] to-amber-500 flex items-center justify-center text-white font-bold">
              {name[0]?.toUpperCase() ?? "?"}
            </div>
            {review.isVerifiedPurchase && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{name}</h4>
            <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      {review.comment && <p className="text-sm text-gray-600 leading-relaxed mb-3">{review.comment}</p>}
      {review.restaurantReply && (
        <div className="mt-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
          <p className="text-xs font-semibold text-[#FF4D00] mb-1">Restaurant reply</p>
          <p className="text-sm text-gray-600">{review.restaurantReply}</p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function RestaurantPage() {
  const router       = useRouter()
  const params       = useParams()
  const searchParams = useSearchParams()
  const id           = params?.id as string

  const [restaurant, setRestaurant]   = useState<RestaurantResponse | null>(null)
  const [allDishes, setAllDishes]     = useState<DishResponse[]>([])
  const [menus, setMenus]             = useState<MenuResponse[]>([])
  const [books, setBooks]             = useState<BookSummaryResponse[]>([])
  const [reviews, setReviews]         = useState<ReviewResponse[]>([])
  const [summary, setSummary]         = useState<ReviewSummary | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  // Dynamic filter data from API
  const [foodTypes, setFoodTypes]   = useState<CategoryResponse[]>([])
  const [cuisines, setCuisines]     = useState<CategoryResponse[]>([])

  const [activeTab, setActiveTab]         = useState<"menu" | "menus" | "blog" | "reviews">("menu")
  const [filters, setFilters]             = useState<FilterState>(DEFAULT_FILTER)
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const [showAllReviews, setShowAllReviews]     = useState(false)
  const [showReviewModal, setShowReviewModal]   = useState(false)
  const [reviewSuccess, setReviewSuccess]       = useState(false)
  const [cartCount, setCartCount]               = useState(() => cartService.count())
  const [cartTotal, setCartTotal]               = useState(() => cartService.total())
  const [isScrolled, setIsScrolled]             = useState(false)
  const [expandedMenu, setExpandedMenu]         = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Auto-open review modal if ?review=1
  useEffect(() => {
    if (searchParams.get("review") === "1") {
      setActiveTab("reviews")
      setShowReviewModal(true)
    }
  }, [searchParams])

  const refreshCart = useCallback(() => {
    setCartCount(cartService.count())
    setCartTotal(cartService.total())
  }, [])

  const patchFilter  = useCallback((p: Partial<FilterState>) => setFilters(prev => ({ ...prev, ...p })), [])
  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTER), [])

  useEffect(() => {
    if (!id) return
    const user = customerService.parseUserFromToken()
    if (!user) { router.replace("/login"); return }

    async function load() {
      try {
        setLoading(true); setError(null)

        const [restRes, dishRes, reviewRes, allCatsRes, menusRes, booksRes] = await Promise.allSettled([
          customerService.getRestaurantById(id),
          customerService.getDishesByRestaurant(id, 1, 100),
          customerService.getRestaurantReviews(id, 1, 20),
          customerService.getCategories(),              // all categories (root + children)
          restaurantService.getRestaurantMenus(id).then(async (summaries) => {
            // fetch full menu details (with sections) for each menu
            const full = await Promise.allSettled(
              summaries.slice(0, 5).map(s => restaurantService.getMenuById(s.id))
            )
            return full.flatMap(r => r.status === "fulfilled" ? [r.value] : [])
          }),
          restaurantService.getRestaurantBooks(id, 1).then(r => r.data ?? []),
        ])

        if (restRes.status === "fulfilled")  setRestaurant(restRes.value)
        else throw new Error("Restaurant not found")

        if (dishRes.status === "fulfilled")  setAllDishes(dishRes.value.data)

        if (reviewRes.status === "fulfilled" && reviewRes.value) {
          setReviews((reviewRes.value.items ?? []).map((i: any) => i.review ?? i))
          setSummary(reviewRes.value.summary ?? null)
        }

        if (allCatsRes.status === "fulfilled") {
          const all = allCatsRes.value
          // root = cuisine categories (no parent), children = food types
          setCuisines(all.filter(c => !c.parentCategoryId))
          setFoodTypes(all.filter(c => !!c.parentCategoryId))
        }

        if (menusRes.status === "fulfilled") {
          // Normalize restaurant-service MenuResponse (description?: string)
          // to customer-service MenuResponse (description: string | null)
          const normalized = menusRes.value.map(m => ({
            ...m,
            description: m.description ?? null,
            updatedAt: (m as any).updatedAt ?? null,
            sections: m.sections.map(s => ({
              ...s,
              description: s.description ?? null,
              dishes: s.dishes.map(d => ({
                ...d,
                dishImage: (d as any).dishImage ?? null,
              })),
            })),
          }))
          setMenus(normalized)
          if (normalized.length > 0) setExpandedMenu(normalized[0].id)
        }

        if (booksRes.status === "fulfilled") setBooks(booksRes.value)

      } catch (e: any) {
        setError(e?.message || "Failed to load restaurant.")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id, router])

  const filteredDishes    = useMemo(() => applyFilters(allDishes, filters), [allDishes, filters])
  const activeFilterCount = countActive(filters)
  const isFiltering       = !!filters.query || activeFilterCount > 0
  const publishedBooks    = books.filter(b => b.isPublished)

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[#FF4D00]/20 border-t-[#FF4D00] rounded-full animate-spin mx-auto mb-4" />
            <UtensilsCrossed className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-[#FF4D00] animate-pulse" />
          </div>
          <p className="text-gray-500 font-medium">Loading restaurant…</p>
        </div>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-500 mb-6">{error ?? "Restaurant not found"}</p>
          <Link href="/customer/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF4D00] text-white font-semibold rounded-xl hover:opacity-90">
            <ChevronLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        {restaurant.restaurantBanner
          ? <img src={restaurant.restaurantBanner} alt={restaurant.restaurantName} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-r from-[#FF4D00] to-amber-500" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button onClick={() => router.back()}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg hover:bg-white">
            <ChevronLeft className="h-5 w-5 text-gray-800" />
          </button>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg hover:bg-white">
              <Share2 className="h-5 w-5 text-gray-800" />
            </button>
            <Link href="/customer/cart"
              className="relative w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg hover:bg-white">
              <ShoppingCart className="h-5 w-5 text-gray-800" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF4D00] rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Restaurant info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white overflow-hidden shadow-xl bg-white">
              {restaurant.restaurantLogo
                ? <img src={restaurant.restaurantLogo} alt={restaurant.restaurantName} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                    <Utensils className="h-8 w-8 text-[#FF4D00]" />
                  </div>
              }
            </div>
            <div className="flex-1 text-white">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{restaurant.restaurantName}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{restaurant.averageRating > 0 ? restaurant.averageRating.toFixed(1) : "New"}</span>
                  {(restaurant.totalReviews ?? 0) > 0 && <span className="text-white/70">({restaurant.totalReviews})</span>}
                </div>
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Clock className="h-4 w-4" /> <span>30–45 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Description bar ──────────────────────────────────────────────────── */}
      {restaurant.restaurantDescription && (
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">{restaurant.restaurantDescription}</p>
        </div>
      )}

      {/* ── Sticky Tabs ──────────────────────────────────────────────────────── */}
      <div className={`sticky top-0 z-30 bg-white border-b border-gray-100 transition-shadow ${isScrolled ? "shadow-md" : ""}`}>
        <div className="max-w-6xl mx-auto px-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {([
              { id: "menu",    label: "Dishes",    icon: Utensils },
              { id: "menus",   label: `Menus${menus.length > 0 ? ` (${menus.length})` : ""}`, icon: Menu },
              { id: "blog",    label: `Blog${publishedBooks.length > 0 ? ` (${publishedBooks.length})` : ""}`, icon: Newspaper },
              { id: "reviews", label: `Reviews${summary?.totalReviews ? ` (${summary.totalReviews})` : ""}`, icon: MessageSquare },
            ] as const).map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`relative py-4 px-4 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    active ? "text-[#FF4D00]" : "text-gray-400 hover:text-gray-600"
                  }`}>
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF4D00] rounded-full" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* ── DISHES TAB ─────────────────────────────────────────────────────── */}
        {activeTab === "menu" && (
          <div className="space-y-5">
            {/* Search + filter bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#FF4D00]" />
                <input type="text" value={filters.query} onChange={e => patchFilter({ query: e.target.value })}
                  placeholder="Search dishes…"
                  className="w-full h-12 pl-11 pr-10 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#FF4D00] focus:ring-4 focus:ring-[#FF4D00]/10" />
                {filters.query && (
                  <button onClick={() => patchFilter({ query: "" })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              <button onClick={() => setShowFilterDrawer(true)}
                className={`relative px-4 rounded-2xl border flex items-center gap-2 transition-all ${
                  activeFilterCount > 0 ? "bg-[#FF4D00] border-[#FF4D00] text-white shadow-lg" : "bg-white border-gray-200 text-gray-600 hover:border-[#FF4D00] hover:text-[#FF4D00]"
                }`}>
                <SlidersHorizontal className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Food Type + Cuisine — clean inline dropdowns */}
            {(foodTypes.length > 0 || cuisines.length > 0) && (
              <div className="flex flex-wrap gap-3">

                {/* Food Type dropdown */}
                {foodTypes.length > 0 && (() => {
                  const activeFt = foodTypes.find(ft => filters.foodTypes.includes(ft.id))
                  return (
                    <div className="relative">
                      <select
                        value={filters.foodTypes[0] ?? ""}
                        onChange={e => {
                          const v = e.target.value
                          patchFilter({ foodTypes: v ? [v] : [] })
                        }}
                        className={`h-10 appearance-none rounded-xl border pl-3 pr-8 text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/30 transition-all ${
                          filters.foodTypes.length > 0
                            ? "border-[#FF4D00] bg-[#FF4D00] text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:border-[#FF4D00]"
                        }`}
                      >
                        <option value="">🍽 All Food Types</option>
                        {foodTypes.map(ft => (
                          <option key={ft.id} value={ft.id}>{ft.name}</option>
                        ))}
                      </select>
                      <ChevronDown className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${filters.foodTypes.length > 0 ? "text-white" : "text-gray-400"}`} />
                      {filters.foodTypes.length > 0 && (
                        <button
                          onClick={() => patchFilter({ foodTypes: [] })}
                          className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-black"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  )
                })()}

                {/* Cuisine dropdown */}
                {cuisines.length > 0 && (
                  <div className="relative">
                    <select
                      value={filters.cuisines[0] ?? ""}
                      onChange={e => {
                        const v = e.target.value
                        patchFilter({ cuisines: v ? [v] : [] })
                      }}
                      className={`h-10 appearance-none rounded-xl border pl-3 pr-8 text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all ${
                        filters.cuisines.length > 0
                          ? "border-gray-800 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <option value="">🌍 All Cuisines</option>
                      {cuisines.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${filters.cuisines.length > 0 ? "text-white" : "text-gray-400"}`} />
                    {filters.cuisines.length > 0 && (
                      <button
                        onClick={() => patchFilter({ cuisines: [] })}
                        className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-black"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Results summary */}
            {isFiltering && (
              <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4 text-[#FF4D00]" />
                  <span className="text-[#FF4D00] font-medium">
                    {filteredDishes.length} {filteredDishes.length === 1 ? "dish" : "dishes"} found
                  </span>
                  {filters.query && <span className="text-gray-500">for "{filters.query}"</span>}
                </div>
                <button onClick={resetFilters} className="text-sm text-gray-500 hover:text-[#FF4D00] flex items-center gap-1">
                  <X className="h-4 w-4" /> Clear
                </button>
              </div>
            )}

            {/* Dishes grid */}
            {filteredDishes.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No dishes found</h3>
                <p className="text-gray-500 mb-6">{filters.query ? `No results for "${filters.query}"` : "Try adjusting your filters"}</p>
                <button onClick={resetFilters}
                  className="px-6 py-2 bg-[#FF4D00] text-white font-medium rounded-xl hover:opacity-90">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDishes.map(dish => (
                  <DishCard key={dish.id} dish={dish} foodTypes={foodTypes} onCartChange={refreshCart} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MENUS TAB ──────────────────────────────────────────────────────── */}
        {activeTab === "menus" && (
          <div className="space-y-4">
            {menus.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
                <Menu className="h-14 w-14 text-gray-200" />
                <p className="mt-4 font-semibold text-gray-400">No menus uploaded yet</p>
                <p className="text-sm text-gray-300 mt-1">The restaurant hasn't published any menus.</p>
              </div>
            ) : (
              menus.map(menu => (
                <div key={menu.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  {/* Menu header */}
                  <button
                    onClick={() => setExpandedMenu(expandedMenu === menu.id ? null : menu.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-xl">
                        <BookOpen className="h-5 w-5 text-[#FF4D00]" />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-gray-900">{menu.name}</p>
                        {menu.description && <p className="text-xs text-gray-500">{menu.description}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {menu.sections.length} section{menu.sections.length !== 1 ? "s" : ""} ·{" "}
                          {menu.sections.reduce((acc, s) => acc + s.dishes.length, 0)} items
                        </p>
                      </div>
                      {menu.isDefault && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">Default</span>
                      )}
                    </div>
                    {expandedMenu === menu.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </button>

                  {/* Sections */}
                  {expandedMenu === menu.id && (
                    <div className="border-t border-gray-100 divide-y divide-gray-100">
                      {menu.sections.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-center text-gray-400">No sections in this menu.</p>
                      ) : (
                        menu.sections
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map(section => (
                            <div key={section.id} className="px-5 py-4">
                              <div className="mb-3">
                                <h4 className="font-black text-gray-900">{section.name}</h4>
                                {section.description && <p className="text-xs text-gray-500">{section.description}</p>}
                              </div>
                              {section.dishes.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No dishes in this section.</p>
                              ) : (
                                <div className="space-y-2">
                                  {section.dishes
                                    .sort((a, b) => a.displayOrder - b.displayOrder)
                                    .map(dish => (
                                      <MenuDishRow
                                        key={dish.dishId}
                                        dish={dish}
                                        restaurantId={restaurant.id}
                                        restaurantName={restaurant.restaurantName}
                                        onCartChange={refreshCart}
                                      />
                                    ))}
                                </div>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── BLOG TAB ───────────────────────────────────────────────────────── */}
        {activeTab === "blog" && (
          <div className="space-y-4">
            {publishedBooks.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
                <Newspaper className="h-14 w-14 text-gray-200" />
                <p className="mt-4 font-semibold text-gray-400">No posts yet</p>
                <p className="text-sm text-gray-300 mt-1">The restaurant hasn't published any blog posts.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {publishedBooks.map(book => (
                  <Link key={book.id} href={`/customer/blog/${book.slug ?? book.id}`}
                    className="group rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    {book.coverImage ? (
                      <div className="h-44 overflow-hidden">
                        <img src={book.coverImage} alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="h-44 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                        <Newspaper className="h-12 w-12 text-[#FF4D00]/30" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-black text-gray-900 line-clamp-2 mb-1">{book.title}</h3>
                      {book.excerpt && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{book.excerpt}</p>}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{formatDate(book.publishedAt ?? book.createdAt)}</span>
                        <div className="flex items-center gap-3">
                          {book.viewCount > 0 && (
                            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{book.viewCount}</span>
                          )}
                          {book.tags && (
                            <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{book.tags.split(",")[0]}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REVIEWS TAB ────────────────────────────────────────────────────── */}
        {activeTab === "reviews" && (
          <div className="space-y-5">
            {/* Write review button */}
            {reviewSuccess ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-800 text-sm">Review submitted!</p>
                  <p className="text-xs text-emerald-600">It will appear after admin approval.</p>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowReviewModal(true)}
                className="w-full flex items-center gap-3 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 p-4 hover:border-[#FF4D00] hover:bg-orange-100/50 transition-colors">
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400 shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-gray-800 text-sm">Leave a Review</p>
                  <p className="text-xs text-gray-500">Share your experience with others</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
              </button>
            )}

            {summary && summary.totalReviews > 0 ? (
              <>
                {/* Summary */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                    <div className="text-center md:text-left shrink-0">
                      <div className="text-5xl font-bold text-gray-900 mb-2">{summary.averageRating.toFixed(1)}</div>
                      <StarRating rating={summary.averageRating} size="lg" />
                      <p className="text-sm text-gray-500 mt-2">
                        {summary.totalReviews} {summary.totalReviews === 1 ? "review" : "reviews"}
                      </p>
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      {[
                        { stars: 5, count: summary.fiveStar  ?? summary.fiveStars  ?? 0 },
                        { stars: 4, count: summary.fourStar  ?? summary.fourStars  ?? 0 },
                        { stars: 3, count: summary.threeStar ?? summary.threeStars ?? 0 },
                        { stars: 2, count: summary.twoStar   ?? summary.twoStars   ?? 0 },
                        { stars: 1, count: summary.oneStar   ?? 0 },
                      ].map(({ stars, count }) => {
                        const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0
                        return (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 w-8">{stars} ★</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm text-gray-500 w-8">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Review list */}
                <div className="space-y-4">
                  {(showAllReviews ? reviews : reviews.slice(0, 4)).map((review, i) => (
                    <ReviewCard key={review.id ?? i} review={review} />
                  ))}
                </div>

                {reviews.length > 4 && (
                  <button onClick={() => setShowAllReviews(v => !v)}
                    className="w-full py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-[#FF4D00] hover:text-[#FF4D00] flex items-center justify-center gap-2">
                    {showAllReviews
                      ? <><ChevronDown className="h-4 w-4 rotate-180" /> Show less</>
                      : <>View all {reviews.length} reviews <ChevronRight className="h-4 w-4" /></>
                    }
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-500">Be the first to leave a review!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom nav (mobile) ───────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 md:hidden">
        <div className="flex items-center justify-around py-2">
          {[
            { href: "/customer/dashboard", icon: Utensils,     label: "Home" },
            { href: "/customer/orders",    icon: Package,      label: "Orders" },
            { href: "/customer/cart",      icon: ShoppingCart, label: "Cart" },
            { href: "/customer/profile",   icon: User,         label: "Profile" },
          ].map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-gray-400 hover:text-[#FF4D00]">
                <Icon className="h-5 w-5" />{item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── Floating cart ────────────────────────────────────────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button onClick={() => router.push("/customer/cart")}
            className="flex items-center gap-3 bg-gray-900 text-white pl-2 pr-5 py-2 rounded-full shadow-2xl hover:bg-[#FF4D00] transition-all duration-300 group">
            <div className="relative">
              <div className="w-10 h-10 bg-[#FF4D00] rounded-full flex items-center justify-center text-white font-bold group-hover:bg-white group-hover:text-[#FF4D00] transition-colors">
                {cartCount}
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-400 group-hover:text-white/80">Cart total</div>
              <div className="font-bold">{formatNGN(cartTotal)}</div>
            </div>
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* ── Filter drawer ────────────────────────────────────────────────────── */}
      <FilterDrawer
        open={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        filters={filters}
        onChange={patchFilter}
        onReset={() => { resetFilters(); setShowFilterDrawer(false) }}
        foodTypes={foodTypes}
        cuisines={cuisines}
      />

      {/* ── Review modal ─────────────────────────────────────────────────────── */}
      {showReviewModal && restaurant && (
        <ReviewModal
          restaurantId={restaurant.id}
          restaurantName={restaurant.restaurantName}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => { setShowReviewModal(false); setReviewSuccess(true) }}
        />
      )}
    </div>
  )
}