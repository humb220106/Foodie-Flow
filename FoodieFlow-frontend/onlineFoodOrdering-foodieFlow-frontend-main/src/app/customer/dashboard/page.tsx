"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search, Star, LogOut, Utensils,
  Package, ChevronRight, Flame, RefreshCw, AlertCircle,
  UtensilsCrossed, ShoppingCart, ShoppingBag, X,
} from "lucide-react"
import { customerService, RestaurantResponse, OrderResponse, CategoryResponse, cartService } from "@/lib/api/customer-service"
import { clearTokens } from "@/lib/api/tokens"
import { readOverrides, type OverrideMap } from "@/lib/utils/orderOverrides"

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const p = name.trim().split(" ")
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function formatNGN(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount)
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STATUS_STYLES: Record<string, string> = {
  Pending:   "bg-amber-50 text-amber-700 border-amber-200",
  Accepted:  "bg-blue-50 text-blue-700 border-blue-200",
  Preparing: "bg-blue-50 text-blue-700 border-blue-200",
  Ready:     "bg-purple-50 text-purple-700 border-purple-200",
  PickedUp:  "bg-purple-50 text-purple-700 border-purple-200",
  OnTheWay:  "bg-indigo-50 text-indigo-700 border-indigo-200",
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
  Rejected:  "bg-red-50 text-red-700 border-red-200",
}

const STATUS_LABEL: Record<string, string> = {
  OnTheWay: "On the way",
  PickedUp: "Picked up",
}

// ── CategoryIcon ──────────────────────────────────────────────────────────────
// Safely renders a category icon:
//  - Cloudinary / any URL → <img>
//  - Emoji / short text   → <span>
//  - null / empty         → null

function CategoryIcon({ icon, className = "h-5 w-5" }: { icon: string | null | undefined; className?: string }) {
  if (!icon) return null
  const isUrl = icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("/")
  if (isUrl) return <img src={icon} alt="" className={`${className} object-cover rounded`} />
  return <span className="text-base leading-none">{icon}</span>
}

// ── RestaurantCard ─────────────────────────────────────────────────────────────

function RestaurantCard({ r }: { r: RestaurantResponse }) {
  // Backend list endpoint may return any of these field names
  const raw = r as any
  const reviewCount =
    (typeof raw.reviewCount    === "number" && raw.reviewCount    > 0 ? raw.reviewCount    : null) ??
    (typeof raw.totalReviews   === "number" && raw.totalReviews   > 0 ? raw.totalReviews   : null) ??
    (typeof raw.reviews        === "number" && raw.reviews        > 0 ? raw.reviews        : null) ??
    (typeof raw.reviewsCount   === "number" && raw.reviewsCount   > 0 ? raw.reviewsCount   : null) ??
    (Array.isArray(raw.reviews) ? raw.reviews.length : null) ??
    0

  // DEV: log first card to confirm backend field names — remove after confirming
  if (process.env.NODE_ENV === "development" && (r as any)._logged !== true) {
    ;(r as any)._logged = true
    console.log("[RestaurantCard] fields:", JSON.stringify({
      id: r.id, name: r.restaurantName,
      reviewCount: (r as any).reviewCount,
      totalReviews: (r as any).totalReviews,
      reviews: (r as any).reviews,
      reviewsCount: (r as any).reviewsCount,
      averageRating: (r as any).averageRating,
      rating: (r as any).rating,
    }, null, 2))
  }

  const avgRating =
    (typeof raw.averageRating === "number" && raw.averageRating > 0 ? raw.averageRating : null) ??
    (typeof raw.rating        === "number" && raw.rating        > 0 ? raw.rating        : null) ??
    0

  return (
    <Link
      href={`/customer/restaurant/${r.id}`}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-[#FF4D00]/40 transition-all duration-200 overflow-hidden"
    >
      <div className="relative h-44 bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden">
        {r.restaurantBanner ? (
          <img
            src={r.restaurantBanner}
            alt={r.restaurantName}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <UtensilsCrossed className="h-16 w-16 text-orange-200" />
          </div>
        )}
        {r.restaurantLogo && (
          <img
            src={r.restaurantLogo}
            alt=""
            className="absolute bottom-3 left-3 h-12 w-12 rounded-xl border-2 border-white object-cover shadow-md"
          />
        )}
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-bold shadow-sm">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {avgRating > 0 ? avgRating.toFixed(1) : "New"}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-black text-gray-900 group-hover:text-[#FF4D00] transition-colors line-clamp-1">
          {r.restaurantName}
        </h3>
        {r.restaurantDescription && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{r.restaurantDescription}</p>
        )}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            {reviewCount > 0
              ? `${reviewCount} review${reviewCount !== 1 ? "s" : ""}`
              : "No reviews yet"}
          </span>
          <span className="font-semibold text-[#FF4D00]">View menu →</span>
        </div>
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const router = useRouter()

  const [username, setUsername]           = useState("")
  const [categories, setCategories]       = useState<CategoryResponse[]>([])
  const [restaurants, setRestaurants]     = useState<RestaurantResponse[]>([])
  const [activeOrders, setActiveOrders]   = useState<OrderResponse[]>([])
  const [recentOrders, setRecentOrders]   = useState<OrderResponse[]>([])
  const [overrides, setOverrides]         = useState<OverrideMap>({})
  const [cartCount, setCartCount]         = useState(0)
  const [query, setQuery]                 = useState("")
  const [searching, setSearching]         = useState(false)
  const [searchResults, setSearchResults] = useState<RestaurantResponse[] | null>(null)
  const [loading, setLoading]             = useState(true)
  const [loadError, setLoadError]         = useState<string | null>(null)

  // Selected cuisine category filter (null = All)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    const u = customerService.parseUserFromToken()
    if (!u) { router.replace("/login"); return }
    setUsername(u.username)
    setCartCount(cartService.count())
    void loadAll()
  }, [])

  useEffect(() => {
    const refresh = () => { try { setOverrides(readOverrides()) } catch { } }
    refresh()
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [])

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(null)

      const [cats, featured, active, orders] = await Promise.allSettled([
        // Root categories = cuisine types (set by admin, no parent)
        customerService.getRootCategories(),
        customerService.getAllRestaurants(1, 20),
        customerService.getMyActiveOrders(),
        customerService.getMyOrders(1, 5),
      ])

      if (cats.status     === "fulfilled") setCategories(cats.value)
      if (featured.status === "fulfilled") setRestaurants(featured.value)
      if (active.status   === "fulfilled") setActiveOrders(active.value)
      if (orders.status   === "fulfilled") setRecentOrders(orders.value.data)
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setSearchResults(null); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try { setSearchResults(await customerService.searchRestaurants(query.trim())) }
      catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  function handleLogout() { clearTokens(); router.push("/login") }

  // Decide which list to show:
  // 1. Search results override everything
  // 2. Category filter — search API with category name as query
  //    (since the backend /restaurant/search filters by name/description,
  //     we filter client-side against restaurantDescription or do a name search)
  //    Simplest reliable approach: filter loaded restaurants by checking if
  //    their name/description contains the category name.
  const displayedRestaurants = (() => {
    if (searchResults !== null) return searchResults
    if (!selectedCategory) return restaurants
    const cat = categories.find(c => c.id === selectedCategory)
    if (!cat) return restaurants
    const q = cat.name.toLowerCase()
    return restaurants.filter(r =>
      r.restaurantName.toLowerCase().includes(q) ||
      (r.restaurantDescription ?? "").toLowerCase().includes(q)
    )
  })()

  const TERMINAL = new Set(["Delivered", "Completed", "Cancelled", "Rejected"])
  const visibleActiveOrders = activeOrders.filter(o => !TERMINAL.has(overrides[o.id]?.status ?? o.status))

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/customer/dashboard" className="flex items-center gap-2 font-black text-gray-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-[#FF4D00] shadow">
              <Utensils className="h-4 w-4 text-white" />
            </div>
            Foodie<span className="text-[#FF4D00]">Flow</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/customer/cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
              <ShoppingCart className="h-4 w-4 text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF4D00] text-[10px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link href="/customer/orders"
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              <Package className="h-4 w-4" /> Orders
            </Link>

            {username && (
              <Link href="/customer/profile"
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-[#FF4D00] text-[11px] font-black text-white">
                  {getInitials(username)}
                </div>
                <span className="hidden text-sm font-bold text-gray-800 sm:block">{username}</span>
              </Link>
            )}

            <button onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:px-6">

        {/* Hero / Search */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-[#FF4D00] to-orange-600 px-8 py-10 text-white shadow-xl shadow-orange-500/20">
          <p className="text-sm font-bold uppercase tracking-widest opacity-80">
            Welcome back, {username} 👋
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
            What are you<br />craving today?
          </h1>
          <div className="relative mt-6 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedCategory(null) }}
              placeholder="Search restaurants…"
              className="w-full rounded-2xl border-0 bg-white py-3.5 pl-12 pr-10 text-sm font-medium text-gray-900 shadow-lg outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/40"
            />
            {searching
              ? <RefreshCw className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
              : query && (
                <button onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )
            }
          </div>
        </div>

        {/* Error */}
        {loadError && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {loadError}
            <button onClick={loadAll} className="ml-auto font-bold underline">Retry</button>
          </div>
        )}

        {/* Active orders */}
        {visibleActiveOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-base font-black text-gray-900">
              <span className="flex h-2 w-2 rounded-full bg-[#FF4D00] animate-pulse" />
              Active Orders
            </h2>
            <div className="space-y-3">
              {visibleActiveOrders.map(order => {
                const effectiveStatus = overrides[order.id]?.status ?? order.status
                return (
                  <Link key={order.id} href={`/customer/orders/${order.id}`}
                    className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 hover:border-[#FF4D00] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF4D00]/10">
                        <Package className="h-5 w-5 text-[#FF4D00]" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{order.restaurantName}</p>
                        <p className="text-xs text-gray-500">
                          {order.orderNumber} · {(order.items ?? []).length} item{(order.items ?? []).length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLES[effectiveStatus] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {STATUS_LABEL[effectiveStatus] ?? effectiveStatus}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Cuisine categories — dropdown select */}
        {categories.length > 0 && !query && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black text-gray-900">Browse by Cuisine</h2>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-[#FF4D00] transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>

            {/* Grid of cuisine cards */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {/* All card */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all hover:shadow-md ${
                  selectedCategory === null
                    ? "border-[#FF4D00] bg-[#FF4D00] text-white shadow-lg shadow-[#FF4D00]/20"
                    : "border-gray-200 bg-white text-gray-700 hover:border-[#FF4D00]/40"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${selectedCategory === null ? "bg-white/20" : "bg-orange-50"}`}>
                  🍽️
                </div>
                <span className="text-xs font-bold truncate w-full text-center">All</span>
              </button>

              {categories.map(cat => {
                const active = selectedCategory === cat.id
                const isUrl = cat.icon && (cat.icon.startsWith("http") || cat.icon.startsWith("/"))
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setQuery("")
                      setSelectedCategory(active ? null : cat.id)
                    }}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all hover:shadow-md ${
                      active
                        ? "border-[#FF4D00] bg-[#FF4D00] text-white shadow-lg shadow-[#FF4D00]/20"
                        : "border-gray-200 bg-white text-gray-700 hover:border-[#FF4D00]/40"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden ${active ? "bg-white/20" : "bg-orange-50"}`}>
                      {isUrl
                        ? <img src={cat.icon!} alt={cat.name} className="h-8 w-8 object-cover rounded-lg" />
                        : <span className="text-xl">{cat.icon || "🍴"}</span>
                      }
                    </div>
                    <span className="text-xs font-bold truncate w-full text-center leading-tight">{cat.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Restaurants grid */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-black text-gray-900">
              {query
                ? <><Search className="h-5 w-5 text-[#FF4D00]" /> Results for "{query}"</>
                : selectedCategory
                ? <><Flame className="h-5 w-5 text-[#FF4D00]" /> {categories.find(c => c.id === selectedCategory)?.name ?? ""} Restaurants</>
                : <><Flame className="h-5 w-5 text-[#FF4D00]" /> Popular Restaurants</>
              }
            </h2>
            {(query || selectedCategory) && (
              <button
                onClick={() => { setQuery(""); setSelectedCategory(null) }}
                className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800"
              >
                <X className="h-4 w-4" /> Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          ) : displayedRestaurants.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
              <UtensilsCrossed className="h-12 w-12 text-gray-200" />
              <p className="mt-3 font-bold text-gray-400">No restaurants found</p>
              {(query || selectedCategory) && (
                <button onClick={() => { setQuery(""); setSelectedCategory(null) }}
                  className="mt-3 text-sm font-bold text-[#FF4D00] hover:underline">
                  Show all restaurants
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {displayedRestaurants.map(r => <RestaurantCard key={r.id} r={r} />)}
            </div>
          )}
        </div>

        {/* Recent orders */}
        {recentOrders.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900">Recent Orders</h2>
              <Link href="/customer/orders" className="flex items-center gap-1 text-sm font-bold text-[#FF4D00] hover:opacity-80">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.slice(0, 3).map(order => (
                <Link key={order.id} href={`/customer/orders/${order.id}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm hover:border-gray-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                      <ShoppingBag className="h-5 w-5 text-[#FF4D00]" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{order.restaurantName}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {(order.items ?? []).map(i => i.dishName).join(", ")}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400">{timeAgo(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <p className="font-black text-gray-900">{formatNGN(order.totalAmount)}</p>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white md:hidden">
        <div className="flex">
          {[
            { href: "/customer/dashboard", icon: <Utensils className="h-5 w-5" />,    label: "Home",    active: true  },
            { href: "/customer/orders",    icon: <Package className="h-5 w-5" />,      label: "Orders",  active: false },
            { href: "/customer/cart",      icon: <ShoppingCart className="h-5 w-5" />, label: "Cart",    active: false },
            { href: "/customer/profile",   icon: <ShoppingBag className="h-5 w-5" />,  label: "Profile", active: false },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold ${item.active ? "text-[#FF4D00]" : "text-gray-400"}`}>
              {item.icon}{item.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  )
}