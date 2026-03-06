"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Store,
  DollarSign,
  ShoppingBag,
  Clock,
  Star,
  LogOut,
  Plus,
  Eye,
  Edit,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChefHat,
  TrendingUp,
} from "lucide-react"
import RestaurantSidebar from "@/components/layout/RestaurantSidebar"
import NotificationBell from "@/components/common/NotificationBell"
import { restaurantService, RestaurantResponse, OrderResponse, OrderStatus } from "@/lib/api/restaurant-service"

// ── helpers ────────────────────────────────────────────────────────────────────

function parseJwt(token: string): any {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    )
  } catch {
    return null
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

const STATUS_COLOR: Record<string, string> = {
  Pending:   "bg-amber-100 text-amber-700",
  Accepted:  "bg-blue-100 text-blue-700",
  Preparing: "bg-indigo-100 text-indigo-700",
  Ready:     "bg-purple-100 text-purple-700",
  Delivered: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-gray-100 text-gray-500",
  Rejected:  "bg-red-100 text-red-600",
}

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; fn: (id: string) => Promise<any> }>> = {
  Pending:   { label: "Accept",          fn: (id) => restaurantService.acceptOrder(id) },
  Accepted:  { label: "Start Preparing", fn: (id) => restaurantService.markAsPreparing(id) },
  Preparing: { label: "Mark Ready",      fn: (id) => restaurantService.markAsReady(id) },
  Ready:     { label: "Mark Delivered",  fn: (id) => restaurantService.markAsDelivered(id) },
}

// ── component ──────────────────────────────────────────────────────────────────

export default function RestaurantDashboard() {
  const router = useRouter()

  const [restaurant, setRestaurant]     = useState<RestaurantResponse | null>(null)
  const [activeOrders, setActiveOrders] = useState<OrderResponse[]>([])
  const [totalOrderCount, setTotalOrderCount] = useState<number | null>(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const displayName = restaurant?.restaurantName || (() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    if (!token) return "Your Restaurant"
    const payload = parseJwt(token)
    return payload?.unique_name || payload?.username || "Your Restaurant"
  })()

  useEffect(() => { void load() }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)

      const [me, active] = await Promise.allSettled([
        restaurantService.getMyRestaurant(),
        restaurantService.getActiveOrders(),
      ])

      if (me.status === "fulfilled" && me.value) setRestaurant(me.value)
      if (active.status === "fulfilled") setActiveOrders(active.value ?? [])

      // Fetch ALL orders (page 1, large page) to get accurate total count.
      // The /me endpoint aggregates may lag — the orders list is always accurate.
      try {
        const allOrders = await restaurantService.getRestaurantOrders(1, 200)
        const d = allOrders as any
        const count =
          (typeof d.count      === "number" && d.count      > 0 ? d.count      : null) ??
          (typeof d.totalCount === "number" && d.totalCount > 0 ? d.totalCount : null) ??
          (typeof d.total      === "number" && d.total      > 0 ? d.total      : null) ??
          (Array.isArray(d.data)  ? d.data.length  : null) ??
          (Array.isArray(d.items) ? d.items.length : null) ??
          null
        setTotalOrderCount(count)
      } catch {
        // not fatal — will fall back to active orders length
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(orderId: string, action: { label: string; fn: (id: string) => Promise<any> }) {
    setActionLoading(orderId)
    try {
      await action.fn(orderId)
      await load()
    } catch (e: any) {
      alert(e?.message || "Action failed")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleLogout() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("token_expires_at")
    router.push("/login")
  }

  // ── Derived stats ────────────────────────────────────────────────────────────
  // RestaurantResponse type defines: totalSales, totalReviews, averageRating
  // However /me aggregates can lag — totalOrderCount from orders list is more reliable

  const pending = activeOrders.filter((o) => o.status === "Pending").length

  // Use typed fields directly — these match the RestaurantResponse interface
  const avgRating    = restaurant?.averageRating ?? 0
  // totalReviews: prefer typed field; /me may return 0 even when reviews exist
  // so also check reviewCount (some backend versions use this name)
  const totalReviews = (restaurant as any)?.reviewCount > 0
    ? (restaurant as any).reviewCount
    : (restaurant?.totalReviews ?? 0)

  // Revenue: totalSales is the typed field name in RestaurantResponse
  const totalSales   = restaurant?.totalSales ?? 0

  // Orders: paginated count from orders list endpoint is most accurate
  // /me.totalOrders may not exist or may lag
  const totalOrders  =
    (totalOrderCount !== null && totalOrderCount > 0 ? totalOrderCount : null) ??
    activeOrders.length

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RestaurantSidebar restaurantName={displayName} restaurantLogo={restaurant?.restaurantLogo} />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <div>
            <h1 className="text-xl font-black text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-500">Welcome back, <span className="font-bold text-[#FF4D00]">{displayName}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button onClick={load} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF4D00] text-xs font-bold text-white overflow-hidden">
                {restaurant?.restaurantLogo ? (
                  <img src={restaurant.restaurantLogo} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  getInitials(displayName)
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-400">Restaurant Owner</p>
              </div>
            </div>
            <button onClick={handleLogout} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="p-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#FF4D00]" />
            </div>
          ) : error ? (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" /> {error}
            </div>
          ) : null}

          {!loading && (
            <div className="space-y-8">

              {/* Welcome banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-[#FF4D00] to-orange-600 p-8 text-white shadow-lg shadow-orange-500/30">
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
                <div className="absolute -bottom-6 -right-4 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative">
                  <p className="text-sm font-semibold uppercase tracking-widest text-orange-200">Welcome to</p>
                  <h2 className="mt-1 text-3xl font-black">{displayName} 👋</h2>
                  <p className="mt-2 text-base text-orange-100">Here's how your restaurant is performing today.</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Total Revenue",
                    value: `₦${totalSales.toLocaleString()}`,
                    icon: <span className="h-6 w-6 flex items-center justify-center text-green-600 font-black text-lg">₦</span>,
                    bg: "bg-green-50",
                    note: "Lifetime earnings",
                  },
                  {
                    label: "Total Orders",
                    value: totalOrders.toLocaleString(),
                    icon: <ShoppingBag className="h-6 w-6 text-blue-600" />,
                    bg: "bg-blue-50",
                    note: "All time",
                  },
                  {
                    label: "Avg Rating",
                    value: avgRating > 0 ? `${avgRating.toFixed(1)} / 5.0` : "—",
                    icon: <Star className="h-6 w-6 text-yellow-500" />,
                    bg: "bg-yellow-50",
                    note: totalReviews > 0
                      ? `${totalReviews} review${totalReviews !== 1 ? "s" : ""}`
                      : "No reviews yet",
                  },
                  {
                    label: "Pending Orders",
                    value: pending,
                    icon: <Clock className="h-6 w-6 text-[#FF4D00]" />,
                    bg: "bg-orange-50",
                    note: pending > 0 ? "Needs attention" : "All caught up",
                    alert: pending > 0,
                  },
                ].map((card) => (
                  <div key={card.label}
                    className={`rounded-xl border ${(card as any).alert ? "border-orange-300" : "border-gray-200"} bg-white p-6 shadow-sm`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-500">{card.label}</p>
                        <p className="mt-1 text-2xl font-black text-gray-900">{card.value}</p>
                      </div>
                      <div className={`rounded-full ${card.bg} p-3`}>{card.icon}</div>
                    </div>
                    <p className={`mt-3 text-xs font-medium ${(card as any).alert ? "text-orange-600" : "text-gray-400"}`}>
                      {card.note}
                    </p>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Link href="/restaurant/dishes"
                  className="group flex items-center justify-between rounded-xl bg-[#FF4D00] p-6 text-white shadow-lg shadow-orange-500/25 hover:opacity-95">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-orange-100">Menu</p>
                    <h3 className="mt-1 text-lg font-black">Manage Dishes</h3>
                    <p className="mt-1 text-xs text-orange-200">Add, edit or delete dishes</p>
                  </div>
                  <Plus className="h-7 w-7 opacity-80 group-hover:rotate-90 transition-transform" />
                </Link>

                <Link href="/restaurant/orders"
                  className="group flex items-center justify-between rounded-xl bg-gray-900 p-6 text-white shadow-lg hover:opacity-95">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Orders</p>
                    <h3 className="mt-1 text-lg font-black">All Orders</h3>
                    <p className="mt-1 text-xs text-gray-400">View & manage orders</p>
                  </div>
                  <Eye className="h-7 w-7 opacity-60 group-hover:scale-110 transition-transform" />
                </Link>

                <Link href="/restaurant/profile"
                  className="group flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-6 text-gray-900 hover:border-[#FF4D00]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Settings</p>
                    <h3 className="mt-1 text-lg font-black">Restaurant Profile</h3>
                    <p className="mt-1 text-xs text-gray-400">Edit info & change password</p>
                  </div>
                  <Edit className="h-7 w-7 text-gray-400 group-hover:text-[#FF4D00] transition-colors" />
                </Link>
              </div>

              {/* Active orders */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Active Orders</h2>
                    <p className="text-xs text-gray-400">
                      {activeOrders.length > 0
                        ? `${activeOrders.length} order${activeOrders.length !== 1 ? "s" : ""} in progress`
                        : "No active orders right now"}
                    </p>
                  </div>
                  <Link href="/restaurant/orders" className="text-sm font-bold text-[#FF4D00] hover:opacity-75">
                    View All →
                  </Link>
                </div>

                {activeOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                    <ChefHat className="h-12 w-12 text-gray-300" />
                    <p className="mt-3 text-sm font-semibold text-gray-500">No active orders</p>
                    <p className="mt-1 text-xs text-gray-400">New orders will appear here in real time.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-6 py-4">Order #</th>
                          <th className="px-6 py-4">Customer</th>
                          <th className="px-6 py-4">Items</th>
                          <th className="px-6 py-4">Total</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activeOrders.map((order) => {
                          const action = NEXT_ACTION[order.status as OrderStatus]
                          const isProcessing = actionLoading === order.id
                          return (
                            <tr key={order.id} className="hover:bg-gray-50/60">
                              <td className="px-6 py-4 font-bold text-[#FF4D00]">
                                #{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                {(order as any).customerName || (order as any).customerUsername || "Customer"}
                              </td>
                              <td className="px-6 py-4 text-gray-500">
                                {order.items?.map((i) => `${i.quantity}× ${(i as any).dishTitle ?? (i as any).dishName}`).join(", ") || "—"}
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-900">
                                ₦{order.totalAmount?.toLocaleString()}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLOR[order.status] || "bg-gray-100 text-gray-600"}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {action ? (
                                  <button
                                    disabled={isProcessing}
                                    onClick={() => handleAction(order.id, action)}
                                    className="rounded-lg bg-[#FF4D00] px-3 py-1.5 text-xs font-bold text-white hover:opacity-85 disabled:opacity-50">
                                    {isProcessing ? "…" : action.label}
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400">{order.status}</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Restaurant profile summary */}
              {restaurant && (
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-gray-900">Restaurant Info</h2>
                    <Link href="/restaurant/profile" className="text-xs font-bold text-[#FF4D00] hover:opacity-75">
                      Edit Profile →
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { label: "Name",          value: restaurant.restaurantName },
                      { label: "Description",   value: restaurant.restaurantDescription || "Not set" },
                      { label: "Average Rating",value: avgRating ? `${avgRating.toFixed(1)} / 5.0` : "No ratings yet" },
                      { label: "Total Reviews", value: totalReviews > 0 ? totalReviews : "No reviews yet" },
                      { label: "Total Orders",  value: totalOrders > 0 ? totalOrders.toLocaleString() : "0" },
                      { label: "Member Since",  value: new Date(restaurant.createdAt).toLocaleDateString() },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 truncate">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  )
}