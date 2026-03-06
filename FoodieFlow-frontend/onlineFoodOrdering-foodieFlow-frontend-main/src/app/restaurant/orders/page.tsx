"use client"

import { useEffect, useState, useCallback } from "react"
import RestaurantSidebar from "@/components/layout/RestaurantSidebar"
import {
  restaurantService,
  OrderResponse,
  OrderStatus,
  OrderItemResponse,
} from "@/lib/api/restaurant-service"
import { apiClient } from "@/lib/api/client"
import {
  Loader2, RefreshCw, AlertCircle, ChefHat,
  Eye, X, MapPin, Phone, UtensilsCrossed,
  CheckCircle, XCircle, Clock, Flame,
  PackageCheck, Truck, ChevronRight,
} from "lucide-react"

// ── constants ──────────────────────────────────────────────────────────────────

const ALL_STATUSES: (OrderStatus | "All")[] = [
  "All", "Pending", "Accepted", "Preparing", "Ready", "Delivered", "Cancelled", "Rejected",
]

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  Pending:   { bg: "bg-amber-50  border-amber-200",  text: "text-amber-700",  dot: "bg-amber-400"  },
  Accepted:  { bg: "bg-blue-50   border-blue-200",   text: "text-blue-700",   dot: "bg-blue-400"   },
  Preparing: { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-500" },
  Ready:     { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  Delivered: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  Completed: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  Cancelled: { bg: "bg-gray-100  border-gray-200",   text: "text-gray-500",   dot: "bg-gray-400"   },
  Rejected:  { bg: "bg-red-50    border-red-200",    text: "text-red-600",    dot: "bg-red-400"    },
}

// status flow steps shown in the modal progress bar
const FLOW = ["Pending", "Accepted", "Preparing", "Ready", "Delivered"]

function flowIndex(status: string) {
  return FLOW.indexOf(status)
}

function fmtNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 0,
  }).format(n)
}

// ── action config ──────────────────────────────────────────────────────────────

interface ActionConfig {
  label: string
  icon: any
  color: string
  fn: (id: string) => Promise<any>
}

function getActions(status: OrderStatus): ActionConfig[] {
  switch (status) {
    case "Pending":
      return [
        {
          label: "Accept Order",
          icon: CheckCircle,
          color: "bg-emerald-500 hover:bg-emerald-600 text-white",
          fn: (id) => restaurantService.acceptOrder(id),
        },
        {
          label: "Reject",
          icon: XCircle,
          color: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
          fn: (id) => restaurantService.rejectOrder(id, "Rejected by restaurant"),
        },
      ]
    case "Accepted":
      return [
        {
          label: "Start Preparing",
          icon: Flame,
          color: "bg-indigo-500 hover:bg-indigo-600 text-white",
          fn: (id) => restaurantService.markAsPreparing(id),
        },
      ]
    case "Preparing":
      return [
        {
          label: "Mark Ready",
          icon: PackageCheck,
          color: "bg-purple-500 hover:bg-purple-600 text-white",
          fn: (id) => restaurantService.markAsReady(id),
        },
      ]
    case "Ready":
      return [
        {
          label: "Mark Delivered",
          icon: Truck,
          color: "bg-[#FF4D00] hover:opacity-90 text-white",
          fn: (id) => restaurantService.markAsDelivered(id),
        },
      ]
    default:
      return []
  }
}

// ── status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE["Cancelled"]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}

// ── progress bar ───────────────────────────────────────────────────────────────

function OrderProgress({ status }: { status: string }) {
  const idx = flowIndex(status)
  if (idx === -1) return null // cancelled / rejected — don't show flow

  return (
    <div className="flex items-center gap-1">
      {FLOW.map((step, i) => {
        const done    = i < idx
        const current = i === idx
        const future  = i > idx
        return (
          <div key={step} className="flex items-center gap-1">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black transition-all
              ${current ? "bg-[#FF4D00] text-white shadow-lg shadow-orange-200 scale-110"
                : done  ? "bg-emerald-500 text-white"
                : "bg-gray-100 text-gray-400"}`}>
              {done ? "✓" : i + 1}
            </div>
            {i < FLOW.length - 1 && (
              <div className={`h-0.5 w-6 rounded-full transition-all ${done ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        )
      })}
      <span className="ml-2 text-xs font-bold text-gray-500">
        {FLOW[idx]}
      </span>
    </div>
  )
}

// ── order detail modal ─────────────────────────────────────────────────────────

function OrderModal({
  order,
  onClose,
  onRefresh,
}: {
  order: OrderResponse
  onClose: () => void
  onRefresh: () => void
}) {
  const [full, setFull]           = useState<OrderResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [acting, setActing]       = useState<string | null>(null)
  const [current, setCurrent]     = useState<OrderResponse>(order)

  const orderId = order.id || (order as any).orderId || ""

  useEffect(() => {
    async function fetch() {
      try {
        const res = await apiClient<any>(`/api/order/${orderId}`)
        const data = res?.data ?? res
        setFull(data)
        setCurrent(data)
      } catch {
        setFull(order)
      } finally {
        setLoading(false)
      }
    }
    void fetch()
  }, [orderId])

  async function handleAction(action: ActionConfig) {
    setActing(action.label)
    try {
      const updated = await action.fn(orderId)
      const newOrder = (updated as any)?.data ?? updated
      setCurrent(newOrder)
      onRefresh()
    } catch (e: any) {
      alert(e?.message || "Action failed")
    } finally {
      setActing(null)
    }
  }

  const displayed = full ?? current
  const actions   = getActions(current.status as OrderStatus)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-gray-900">
              #{current.orderNumber || orderId.slice(0, 8).toUpperCase()}
            </h2>
            <p className="text-xs text-gray-400">
              {current.createdAt ? new Date(current.createdAt).toLocaleString() : "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={current.status} />
            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="border-b border-gray-100 px-6 py-4">
          <OrderProgress status={current.status} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[#FF4D00]" />
          </div>
        ) : (
          <div className="space-y-5 p-6">

            {/* Customer */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-[#FF4D00] font-black text-white">
                {(displayed.customerName || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-900">{displayed.customerName || "—"}</p>
                {displayed.customerPhone && (
                  <p className="flex items-center gap-1 text-xs text-gray-500">
                    <Phone className="h-3 w-3" /> {displayed.customerPhone}
                  </p>
                )}
              </div>
            </div>

            {/* Delivery address */}
            {displayed.deliveryAddress && (
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#FF4D00]" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Delivery Address</p>
                  <p className="mt-0.5 font-semibold text-gray-800">
                    {displayed.deliveryAddress}
                    {displayed.deliveryCity ? `, ${displayed.deliveryCity}` : ""}
                    {displayed.deliveryState ? `, ${displayed.deliveryState}` : ""}
                  </p>
                  {displayed.deliveryInstructions && (
                    <p className="mt-1 text-xs italic text-gray-400">"{displayed.deliveryInstructions}"</p>
                  )}
                </div>
              </div>
            )}

            {/* Items */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Order Items</p>
              <div className="overflow-hidden rounded-xl border border-gray-100 divide-y divide-gray-100">
                {displayed.items?.length ? displayed.items.map((item, i) => (
                  <div key={item.id ?? i} className="flex items-center gap-3 bg-white px-4 py-3">
                    {(item as any).dishImage ? (
                      <img src={(item as any).dishImage} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                        <UtensilsCrossed className="h-5 w-5 text-orange-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {item.dishTitle || (item as any).dishName || "—"}
                      </p>
                      {(item as any).specialInstructions && (
                        <p className="text-xs italic text-gray-400">{(item as any).specialInstructions}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-black text-[#FF4D00]">{fmtNGN((item.unitPrice ?? 0) * item.quantity)}</p>
                      <p className="text-xs text-gray-400">{item.quantity}× {fmtNGN(item.unitPrice ?? 0)}</p>
                    </div>
                  </div>
                )) : (
                  <div className="bg-white px-4 py-6 text-center text-sm text-gray-400">No items</div>
                )}
              </div>
            </div>

            {/* Notes */}
            {displayed.customerNotes && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700 italic">
                📝 "{displayed.customerNotes}"
              </div>
            )}

            {/* Totals */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100 overflow-hidden text-sm">
              {[
                { label: "Subtotal",    value: displayed.subTotal },
                { label: "Service Fee", value: displayed.serviceFee },
                { label: "Tax (7.5%)",  value: displayed.tax },
                ...(displayed.deliveryFee ? [{ label: "Delivery Fee", value: displayed.deliveryFee }] : []),
                ...(displayed.discount   ? [{ label: "Discount",      value: -displayed.discount  }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-4 py-2">
                  <span className="text-gray-500">{row.label}</span>
                  <span className={`font-semibold ${(row.value ?? 0) < 0 ? "text-emerald-600" : "text-gray-800"}`}>
                    {(row.value ?? 0) < 0 ? `-${fmtNGN(Math.abs(row.value ?? 0))}` : fmtNGN(row.value ?? 0)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-white px-4 py-3">
                <span className="font-bold text-gray-800">Total</span>
                <span className="text-xl font-black text-[#FF4D00]">{fmtNGN(displayed.totalAmount ?? 0)}</span>
              </div>
            </div>

            {/* Action buttons */}
            {actions.length > 0 && (
              <div className="flex gap-3 pt-1">
                {actions.map(action => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.label}
                      disabled={acting !== null}
                      onClick={() => handleAction(action)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black transition-all active:scale-[0.98] ${action.color} disabled:opacity-50`}
                    >
                      {acting === action.label
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><Icon className="h-4 w-4" /> {action.label}</>
                      }
                    </button>
                  )
                })}
              </div>
            )}

            {actions.length === 0 && !["Cancelled", "Rejected"].includes(current.status) && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle className="h-4 w-4" /> Order completed
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function RestaurantOrdersPage() {
  const [orders, setOrders]         = useState<OrderResponse[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [filter, setFilter]         = useState<OrderStatus | "All">("All")
  const [total, setTotal]           = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [actingId, setActingId]     = useState<string | null>(null)

  const selectedOrder = selectedId ? orders.find(o => (o.id || (o as any).orderId) === selectedId) ?? null : null

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await restaurantService.getRestaurantOrders(1, 50, filter === "All" ? undefined : filter)
      const items = (res as any).data ?? (res as any).items ?? (Array.isArray(res) ? res : [])
      setOrders(items)
      setTotal((res as any).totalCount ?? (res as any).count ?? items.length)
    } catch (e: any) {
      setError(e?.message || "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { void load() }, [load])

  async function handleQuickAction(orderId: string, action: ActionConfig, e: React.MouseEvent) {
    e.stopPropagation()
    setActingId(orderId + action.label)
    try {
      await action.fn(orderId)
      await load()
    } catch (e: any) {
      alert(e?.message || "Action failed")
    } finally {
      setActingId(null)
    }
  }

  // pending count for badge
  const pendingCount = orders.filter(o => o.status === "Pending").length

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RestaurantSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>

        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                Orders
                {pendingCount > 0 && (
                  <span className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FF4D00] text-xs font-black text-white">
                    {pendingCount}
                  </span>
                )}
              </h1>
              <p className="mt-1 text-sm text-gray-500">Tap a row or use the quick buttons to update order status.</p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* Filter tabs */}
        <div className="flex items-end gap-1 overflow-x-auto border-b border-gray-200 bg-white px-8">
          {ALL_STATUSES.map(s => {
            const count = s === "All" ? orders.length : orders.filter(o => o.status === s).length
            return (
              <button
                key={s}
                onClick={() => setFilter(s as any)}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                  filter === s
                    ? "border-[#FF4D00] text-[#FF4D00]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {s}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    filter === s ? "bg-[#FF4D00] text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="p-8">
          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" /> {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading orders...
            </div>
          )}

          {/* Empty */}
          {!loading && !error && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
              <ChefHat className="h-14 w-14 text-gray-200" />
              <p className="mt-4 font-semibold text-gray-400">No orders yet</p>
              <p className="mt-1 text-sm text-gray-300">
                {filter !== "All" ? `No "${filter}" orders.` : "Orders will appear here once customers place them."}
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && orders.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-black uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(o => {
                    const oid     = o.id || (o as any).orderId || ""
                    const actions = getActions(o.status as OrderStatus)
                    const itemSummary = o.items?.length
                      ? `${o.items.length} item${o.items.length !== 1 ? "s" : ""}`
                      : `${(o as any).itemCount ?? "—"} item${(o as any).itemCount !== 1 ? "s" : ""}`

                    return (
                      <tr
                        key={oid}
                        onClick={() => setSelectedId(oid)}
                        className="cursor-pointer hover:bg-orange-50/40 transition-colors"
                      >
                        {/* Order # */}
                        <td className="px-6 py-4">
                          <p className="font-black text-[#FF4D00]">
                            #{o.orderNumber || oid.slice(0, 8).toUpperCase()}
                          </p>
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-[#FF4D00] text-xs font-black text-white">
                              {(o.customerName || "?")[0].toUpperCase()}
                            </div>
                            <span className="text-gray-700">
                              {o.customerName || <span className="text-xs italic text-gray-300">tap to view</span>}
                            </span>
                          </div>
                        </td>

                        {/* Items */}
                        <td className="px-6 py-4 text-gray-500">{itemSummary}</td>

                        {/* Total */}
                        <td className="px-6 py-4 font-black text-gray-900">
                          {o.totalAmount != null ? fmtNGN(o.totalAmount) : "—"}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <StatusBadge status={o.status || "—"} />
                        </td>

                        {/* Time */}
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          <br />
                          <span className="text-gray-300">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ""}</span>
                        </td>

                        {/* Quick actions */}
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {actions.map(action => {
                              const Icon = action.icon
                              const key  = oid + action.label
                              return (
                                <button
                                  key={action.label}
                                  disabled={actingId === key}
                                  onClick={e => handleQuickAction(oid, action, e)}
                                  title={action.label}
                                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${action.color} disabled:opacity-50`}
                                >
                                  {actingId === key
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <><Icon className="h-3.5 w-3.5" /> {action.label}</>
                                  }
                                </button>
                              )
                            })}
                            {actions.length === 0 && (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Footer */}
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 text-xs text-gray-400">
                {total} order{total !== 1 ? "s" : ""} total · click any row to view details & update status
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selectedId && selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedId(null)}
          onRefresh={load}
        />
      )}
    </div>
  )
}