



"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import {
  ChevronRight, Utensils, AlertCircle, Loader2,
  Package, CheckCircle, Clock, XCircle, MapPin, Phone, Star,
} from "lucide-react"
import { customerService, OrderResponse, OrderStatus } from "@/lib/api/customer-service"
import { readOverrides, type OverrideMap } from "@/lib/utils/orderOverrides"

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n)
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const ACTIVE: OrderStatus[] = ["Pending", "Accepted", "Preparing", "Ready", "PickedUp", "OnTheWay"]

const STEPS: { status: OrderStatus[]; label: string; icon: React.ReactNode }[] = [
  { status: ["Pending"],              label: "Order placed",    icon: <Package className="h-4 w-4" /> },
  { status: ["Accepted"],             label: "Accepted",        icon: <CheckCircle className="h-4 w-4" /> },
  { status: ["Preparing"],            label: "Preparing",       icon: <Clock className="h-4 w-4" /> },
  { status: ["Ready"],                label: "Ready",           icon: <CheckCircle className="h-4 w-4" /> },
  { status: ["PickedUp", "OnTheWay"], label: "On the way",      icon: <MapPin className="h-4 w-4" /> },
  { status: ["Delivered","Completed"],label: "Delivered",       icon: <CheckCircle className="h-4 w-4" /> },
]

function getStepIndex(status: OrderStatus) {
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (STEPS[i].status.includes(status)) return i
  }
  return 0
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [order, setOrder]           = useState<OrderResponse | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [overrides, setOverrides] = useState<OverrideMap>({})
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [showCancel, setShowCancel] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const o = await customerService.getOrderById(id)
      setOrder(o)
    } catch (e: any) {
      setError(e?.message || "Failed to load order.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const u = customerService.parseUserFromToken()
    if (!u) { router.replace("/login"); return }
    // Load overrides from localStorage (written by admin panel)
    setOverrides(readOverrides())
    // Listen for real-time updates if admin changes status in another tab
    function onStorage(e: StorageEvent) {
      if (e.key === "ff_order_overrides") setOverrides(readOverrides())
    }
    window.addEventListener("storage", onStorage)
    void load()
    return () => window.removeEventListener("storage", onStorage)
  }, [load])

  // Poll every 10s while order is active
  useEffect(() => {
    if (!order || !ACTIVE.includes(order.status)) return
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [order, load])

  async function handleCancel() {
    if (!cancelReason.trim()) { setCancelError("Please provide a reason."); return }
    try {
      setCancelling(true); setCancelError(null)
      const updated = await customerService.cancelOrder(id, cancelReason)
      setOrder(updated)
      setShowCancel(false)
    } catch (e: any) {
      setCancelError(e?.message || "Failed to cancel.")
    } finally {
      setCancelling(false)
    }
  }

  // Apply admin local override if present
  const effectiveStatus = order
    ? ((overrides[order.id]?.status ?? order.status) as OrderStatus)
    : null
  const displayOrder = order && effectiveStatus && effectiveStatus !== order.status
    ? { ...order, status: effectiveStatus }
    : order

  const isActive      = displayOrder && ACTIVE.includes(displayOrder.status)
  const isCancellable = displayOrder && ["Pending", "Accepted"].includes(displayOrder.status)
  const stepIndex     = displayOrder ? getStepIndex(displayOrder.status) : 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/customer/orders"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50">
              <ChevronRight className="h-4 w-4 rotate-180 text-gray-600" />
            </Link>
            <span className="font-black text-gray-900">Order Detail</span>
          </div>
          {isActive && (
            <span className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF4D00]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D00] animate-pulse" /> Live tracking
            </span>
          )}
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 py-6 md:px-6 space-y-5">

        {/* Loading */}
        {loading && !order && (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF4D00]" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            <button onClick={load} className="ml-auto font-bold underline">Retry</button>
          </div>
        )}

        {displayOrder && (
          <>
            {/* Status card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-mono">{displayOrder.orderNumber}</p>
                  <p className="mt-1 text-xl font-black text-gray-900">{displayOrder.restaurantName}</p>
                  <p className="text-xs text-gray-500">{formatDate(displayOrder.createdAt)}</p>
                </div>
                <div className={`rounded-full border px-4 py-1.5 text-sm font-black ${
                  displayOrder.status === "Cancelled" || displayOrder.status === "Rejected"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : displayOrder.status === "Completed" || displayOrder.status === "Delivered"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-orange-200 bg-orange-50 text-[#FF4D00]"
                }`}>
                  {displayOrder.status === "OnTheWay" ? "On the way" : displayOrder.status}
                </div>
              </div>

              {/* Progress tracker */}
              {!["Cancelled", "Rejected"].includes(displayOrder.status) && (
                <div className="mt-6">
                  <div className="relative flex items-center justify-between">
                    <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-gray-100" />
                    <div
                      className="absolute left-0 top-3.5 h-0.5 bg-[#FF4D00] transition-all duration-500"
                      style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }}
                    />
                    {STEPS.map((step, i) => {
                      const done    = i < stepIndex
                      const current = i === stepIndex
                      return (
                        <div key={i} className="relative flex flex-col items-center gap-1">
                          <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                            done    ? "border-[#FF4D00] bg-[#FF4D00] text-white"
                            : current ? "border-[#FF4D00] bg-white text-[#FF4D00]"
                            : "border-gray-200 bg-white text-gray-300"
                          }`}>
                            {step.icon}
                          </div>
                          <span className={`text-[9px] font-bold text-center leading-tight max-w-[50px] ${
                            done || current ? "text-gray-700" : "text-gray-300"
                          }`}>{step.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ETA */}
              {displayOrder.estimatedDeliveryTime && isActive && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
                  <Clock className="h-4 w-4 shrink-0" />
                  Estimated delivery: <span className="font-bold">{formatDate(displayOrder.estimatedDeliveryTime)}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="font-black text-gray-900">Order Items</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {displayOrder.items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-orange-50">
                      {item.dishImage
                        ? <img src={item.dishImage} alt="" className="h-full w-full object-cover" />
                        : <Utensils className="h-5 w-5 text-orange-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.dishName}</p>
                      {item.specialInstructions && (
                        <p className="text-xs text-gray-400 italic">{item.specialInstructions}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-gray-900">{formatNGN(item.subTotal)}</p>
                      <p className="text-xs text-gray-400">{item.quantity} × {formatNGN(item.unitPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
              <h3 className="font-black text-gray-900 mb-3">Price Breakdown</h3>
              {[
                { label: "Subtotal",     value: displayOrder.subTotal     },
                { label: "Delivery fee", value: displayOrder.deliveryFee  },
                { label: "Service fee",  value: displayOrder.serviceFee   },
                { label: "Tax",          value: displayOrder.tax          },
                ...(displayOrder.discount > 0 ? [{ label: "Discount", value: -displayOrder.discount }] : []),
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm text-gray-600">
                  <span>{row.label}</span>
                  <span className={row.value < 0 ? "text-emerald-600 font-semibold" : ""}>
                    {formatNGN(row.value)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-gray-900">
                <span>Total</span>
                <span>{formatNGN(displayOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Delivery info */}
            {displayOrder.deliveryAddress && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="font-black text-gray-900 mb-3">Delivery Info</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#FF4D00]" />
                    <span>
                      {displayOrder.deliveryAddress}
                      {displayOrder.deliveryCity  ? `, ${displayOrder.deliveryCity}`  : ""}
                      {displayOrder.deliveryState ? `, ${displayOrder.deliveryState}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-[#FF4D00]" />
                    <span>{displayOrder.customerPhone}</span>
                  </div>
                  {displayOrder.deliveryInstructions && (
                    <p className="text-xs text-gray-400 italic">"{displayOrder.deliveryInstructions}"</p>
                  )}
                </div>
              </div>
            )}

            {/* Customer notes */}
            {displayOrder.customerNotes && (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-sm text-gray-500 italic">
                Note: "{displayOrder.customerNotes}"
              </div>
            )}

            {/* Cancel button */}
            {isCancellable && !showCancel && (
              <button onClick={() => setShowCancel(true)}
                className="w-full rounded-2xl border-2 border-red-200 py-3.5 text-sm font-black text-red-600 hover:bg-red-50 transition-colors">
                Cancel Order
              </button>
            )}

            {/* Cancel form */}
            {showCancel && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-3">
                <p className="font-black text-red-800">Cancel this order?</p>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation (required)…"
                  rows={3}
                  className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-400 resize-none"
                />
                {cancelError && <p className="text-xs text-red-600 font-semibold">{cancelError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowCancel(false); setCancelReason("") }}
                    className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">
                    Keep Order
                  </button>
                  <button onClick={handleCancel} disabled={cancelling}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-black text-white hover:opacity-90 disabled:opacity-50">
                    {cancelling
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling…</>
                      : "Confirm Cancel"
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Review prompt after delivery */}
            {(displayOrder.status === "Delivered" || displayOrder.status === "Completed") && !displayOrder.rating && (
              <div className="flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                <Star className="h-6 w-6 text-yellow-500 shrink-0" />
                <div className="flex-1">
                  <p className="font-black text-gray-800 text-sm">How was your order?</p>
                  <p className="text-xs text-gray-500">Help others by leaving a review</p>
                </div>
                <Link href={`/customer/restaurant/${displayOrder.restaurantId}?review=1`}
                  className="shrink-0 rounded-xl bg-[#FF4D00] px-4 py-2 text-xs font-black text-white hover:opacity-90">
                  Review
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}