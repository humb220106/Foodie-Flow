


"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Package, ChevronRight, Utensils, AlertCircle, Loader2, ShoppingCart } from "lucide-react"
import { customerService, OrderResponse, OrderStatus } from "@/lib/api/customer-service"
import { readOverrides, type OverrideMap } from "@/lib/utils/orderOverrides"

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n)
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const STATUS_STYLES: Record<string, string> = {
  Pending:        "bg-amber-50 text-amber-700 border-amber-200",
  Confirmed:      "bg-blue-50 text-blue-700 border-blue-200",
  Accepted:       "bg-blue-50 text-blue-700 border-blue-200",
  Preparing:      "bg-blue-50 text-blue-700 border-blue-200",
  Ready:          "bg-purple-50 text-purple-700 border-purple-200",
  PickedUp:       "bg-purple-50 text-purple-700 border-purple-200",
  OutForDelivery: "bg-indigo-50 text-indigo-700 border-indigo-200",
  OnTheWay:       "bg-indigo-50 text-indigo-700 border-indigo-200",
  Delivered:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  Completed:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled:      "bg-red-50 text-red-700 border-red-200",
  Rejected:       "bg-red-50 text-red-700 border-red-200",
}
const STATUS_LABEL: Record<string, string> = {
  OnTheWay:       "On the way",
  OutForDelivery: "Out for Delivery",
  PickedUp:       "Picked up",
}

const ACTIVE: OrderStatus[] = ["Pending", "Accepted", "Preparing", "Ready", "PickedUp", "OnTheWay"]

const FILTERS = ["All", "Active", "Delivered", "Completed", "Cancelled"] as const
type Filter = typeof FILTERS[number]

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders]       = useState<OrderResponse[]>([])
  const [overrides, setOverrides] = useState<OverrideMap>({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [filter, setFilter]       = useState<Filter>("All")
  const [page, setPage]           = useState(1)
  const [hasMore, setHasMore]     = useState(false)
  const PAGE_SIZE = 10

  // Load localStorage overrides + listen for admin updates
  useEffect(() => {
    setOverrides(readOverrides())
    function onStorage(e: StorageEvent) {
      if (e.key === "ff_order_overrides") setOverrides(readOverrides())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  useEffect(() => {
    const u = customerService.parseUserFromToken()
    if (!u) { router.replace("/login"); return }
    void load(1, true)
  }, [])

  const load = useCallback(async (p: number, reset = false) => {
    try {
      setLoading(true); setError(null)
      const res = await customerService.getMyOrders(p, PAGE_SIZE)
      setOrders(prev => reset ? res.data : [...prev, ...res.data])
      setHasMore(res.data.length === PAGE_SIZE)
      setPage(p)
    } catch (e: any) {
      setError(e?.message || "Failed to load orders.")
    } finally {
      setLoading(false)
    }
  }, [])

  const filtered = orders.filter(o => {
    const s = (overrides[o.id]?.status ?? o.status) as OrderStatus
    if (filter === "All")    return true
    if (filter === "Active") return ACTIVE.includes(s)
    return s === filter
  })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/customer/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50">
              <ChevronRight className="h-4 w-4 rotate-180 text-gray-600" />
            </Link>
            <div className="flex items-center gap-2 font-black text-gray-900">
              <Package className="h-5 w-5 text-[#FF4D00]" /> My Orders
            </div>
          </div>
          <Link href="/customer/dashboard" className="flex items-center gap-1.5 font-black text-gray-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-[#FF4D00]">
              <Utensils className="h-4 w-4 text-white" />
            </div>
            Foodie<span className="text-[#FF4D00]">Flow</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-6 md:px-6">

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                filter === f
                  ? "bg-[#FF4D00] text-white shadow-md shadow-orange-500/25"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            <button onClick={() => load(1, true)} className="ml-auto font-bold underline">Retry</button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && orders.length === 0 && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
            <Package className="h-12 w-12 text-gray-200" />
            <p className="mt-3 font-bold text-gray-400">No orders yet</p>
            <p className="text-sm text-gray-400">Your order history will appear here</p>
            <Link href="/customer/dashboard"
              className="mt-4 flex items-center gap-2 rounded-xl bg-[#FF4D00] px-5 py-2.5 text-sm font-black text-white hover:opacity-90">
              <ShoppingCart className="h-4 w-4" /> Browse restaurants
            </Link>
          </div>
        )}

        {/* Orders list */}
        <div className="space-y-3">
          {filtered.map(order => {
            const effectiveStatus = (overrides[order.id]?.status ?? order.status) as OrderStatus
            return (
              <Link
                key={order.id}
                href={`/customer/orders/${order.id}`}
                className="flex items-start justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 overflow-hidden">
                    {order.restaurantLogo
                      ? <img src={order.restaurantLogo} alt="" className="h-full w-full object-cover" />
                      : <Utensils className="h-6 w-6 text-[#FF4D00]" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-gray-900 truncate">{order.restaurantName}</p>
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                      {(order.items ?? []).map(i => `${i.quantity}× ${i.dishName}`).join(", ") || "No items"}
                    </p>
                    <p className="mt-1.5 text-[11px] text-gray-400">{formatDate(order.createdAt)}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{order.orderNumber}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 ml-3">
                  <p className="font-black text-gray-900">{formatNGN(order.totalAmount)}</p>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[effectiveStatus] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {STATUS_LABEL[effectiveStatus] ?? effectiveStatus}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Load more */}
        {hasMore && !loading && (
          <button onClick={() => load(page + 1)}
            className="mt-6 w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-600 hover:bg-gray-50">
            Load more
          </button>
        )}
        {loading && orders.length > 0 && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF4D00]" />
          </div>
        )}
      </main>
    </div>
  )
}