// "use client"

// import { useState, useEffect } from "react"
// import {
//   X, Clock, Package, Store, Truck, CheckCircle, XCircle,
//   AlertCircle, User, ShoppingBag, Calendar,
//   Hash, RefreshCw, ChefHat, Loader2, MapPin,
// } from "lucide-react"
// import { adminService } from "@/lib/api/admin-service"
// import { apiClient } from "@/lib/api/client"
// import type { AdminOrder, OrderStatus } from "@/lib/api/admin-service"

// interface Props {
//   order: AdminOrder
//   onClose: () => void
//   onOrderUpdated: () => void
// }

// const FLOW: OrderStatus[] = ["Pending", "Confirmed", "Preparing", "OutForDelivery", "Delivered"]

// export function statusLabel(s: string): string {
//   return s === "OutForDelivery" ? "Out for Delivery" : s
// }

// function statusBadgeClass(s: OrderStatus): string {
//   const m: Record<OrderStatus, string> = {
//     Pending:        "bg-orange-100 text-orange-700",
//     Confirmed:      "bg-blue-100 text-blue-700",
//     Preparing:      "bg-yellow-100 text-yellow-700",
//     OutForDelivery: "bg-purple-100 text-purple-700",
//     Delivered:      "bg-emerald-100 text-emerald-700",
//     Cancelled:      "bg-red-100 text-red-700",
//   }
//   return m[s] ?? "bg-gray-100 text-gray-700"
// }

// function reached(current: OrderStatus, step: OrderStatus): boolean {
//   const ci = FLOW.indexOf(current)
//   const si = FLOW.indexOf(step)
//   return ci !== -1 && si !== -1 && ci >= si
// }

// function StepIcon({ status, active }: { status: OrderStatus; active: boolean }) {
//   const cls = `h-5 w-5 ${active ? "text-white" : "text-gray-400"}`
//   switch (status) {
//     case "Pending":        return <Clock className={cls} />
//     case "Confirmed":      return <CheckCircle className={cls} />
//     case "Preparing":      return <ChefHat className={cls} />
//     case "OutForDelivery": return <Truck className={cls} />
//     case "Delivered":      return <CheckCircle className={cls} />
//     default:               return <Package className={cls} />
//   }
// }

// function formatNGN(n: number) {
//   return new Intl.NumberFormat("en-NG", {
//     style: "currency", currency: "NGN", maximumFractionDigits: 0,
//   }).format(n)
// }

// function fmtDate(iso: string) {
//   return new Date(iso).toLocaleString("en-NG", {
//     month: "short", day: "numeric", year: "numeric",
//     hour: "2-digit", minute: "2-digit",
//   })
// }

// // Try every reasonable combination until one succeeds (handles 403/404 from backend)
// async function tryUpdateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
//   const url = `/api/admin/orders/${orderId}/status`
//   const attempts: Array<{ method: string; body: string }> = [
//     { method: "PATCH", body: JSON.stringify({ status }) },
//     { method: "PUT",   body: JSON.stringify({ status }) },
//     { method: "PATCH", body: JSON.stringify({ Status: status }) },
//     { method: "PUT",   body: JSON.stringify({ Status: status }) },
//     { method: "POST",  body: JSON.stringify({ status }) },
//     { method: "PATCH", body: JSON.stringify({ newStatus: status }) },
//     { method: "PUT",   body: JSON.stringify({ newStatus: status }) },
//   ]

//   let lastError: Error | null = null
//   for (const { method, body } of attempts) {
//     try {
//       await apiClient(url, { method, body })
//       return // success
//     } catch (e: any) {
//       lastError = e
//       // Only keep trying on 403/404/405 — stop on 400/500
//       const code = parseInt(e?.message?.match(/HTTP (\d+)/)?.[1] ?? "0")
//       if (code !== 403 && code !== 404 && code !== 405) break
//     }
//   }
//   throw lastError ?? new Error("Failed to update order status")
// }

// interface FullOrder extends AdminOrder {
//   customerName?: string
//   customerPhone?: string
//   deliveryAddress?: string
//   deliveryCity?: string
//   deliveryState?: string
//   deliveryInstructions?: string
//   items?: Array<{
//     id?: string
//     dishId?: string
//     dishName?: string
//     dishTitle?: string
//     dishImage?: string
//     quantity: number
//     unitPrice: number
//     specialInstructions?: string
//   }>
// }

// export default function OrderDetailsModal({ order, onClose, onOrderUpdated }: Props) {
//   const [fullOrder, setFullOrder]     = useState<FullOrder | null>(null)
//   const [resolvedName, setResolvedName] = useState<string | null>(null)
//   const [loadingFull, setLoadingFull] = useState(true)
//   const [newStatus, setNewStatus]     = useState<OrderStatus>(order.status)
//   const [isUpdating, setIsUpdating]   = useState(false)
//   const [feedback, setFeedback]       = useState<{ type: "success" | "error"; msg: string } | null>(null)

//   useEffect(() => {
//     async function fetchAll() {
//       setLoadingFull(true)
//       try {
//         // Fetch full order detail
//         const detail = await adminService.getOrderById(order.id)
//         const full = detail as FullOrder
//         setFullOrder(full)
//         setNewStatus(full.status)

//         // customerUsername is null from backend — look up the actual user by customerId
//         const usernameFromDetail = full.customerUsername || full.customerName
//         if (!usernameFromDetail && full.customerId) {
//           try {
//             const user = await adminService.getUserById(full.customerId)
//             setResolvedName(user.username || user.email || null)
//           } catch {
//             // user lookup failed — show customer ID as fallback
//             setResolvedName(`ID: ${full.customerId.slice(0, 8)}…`)
//           }
//         } else {
//           setResolvedName(usernameFromDetail ?? null)
//         }
//       } catch {
//         // fallback to base order
//         setFullOrder(order as FullOrder)
//         setNewStatus(order.status)

//         // Still try to resolve customer name even if detail fetch fails
//         if (order.customerId && !order.customerUsername) {
//           try {
//             const user = await adminService.getUserById(order.customerId)
//             setResolvedName(user.username || user.email || null)
//           } catch {
//             setResolvedName(null)
//           }
//         } else {
//           setResolvedName(order.customerUsername ?? null)
//         }
//       } finally {
//         setLoadingFull(false)
//       }
//     }
//     void fetchAll()
//   }, [order.id, order.customerId, order.customerUsername])

//   const displayed = fullOrder ?? (order as FullOrder)
//   const displayName = resolvedName ?? displayed.customerUsername ?? displayed.customerName ?? null
//   const isCancelled = displayed.status === "Cancelled"
//   const isDelivered = displayed.status === "Delivered"
//   const statusChanged = newStatus !== displayed.status

//   function flash(type: "success" | "error", msg: string) {
//     setFeedback({ type, msg })
//     setTimeout(() => setFeedback(null), 5000)
//   }

//   async function handleUpdateStatus() {
//     try {
//       setIsUpdating(true)
//       await tryUpdateOrderStatus(order.id, newStatus)
//       flash("success", `Status updated to "${statusLabel(newStatus)}".`)
//       setTimeout(() => onOrderUpdated(), 1500)
//     } catch (err: any) {
//       flash("error", err?.message || "Failed to update status.")
//     } finally {
//       setIsUpdating(false)
//     }
//   }

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
//       onClick={onClose}
//     >
//       <div
//         className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Header */}
//         <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
//           <div>
//             <h2 className="text-lg font-black text-gray-900">Order Details</h2>
//             <p className="text-sm font-bold text-[#FF4D00]">{displayed.orderNumber}</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
//           >
//             <X className="h-5 w-5" />
//           </button>
//         </div>

//         {/* Feedback banner */}
//         {feedback && (
//           <div className={`shrink-0 flex items-center gap-2 px-6 py-3 text-sm font-semibold ${
//             feedback.type === "success"
//               ? "bg-emerald-50 text-emerald-700"
//               : "bg-red-50 text-red-700"
//           }`}>
//             {feedback.type === "success"
//               ? <CheckCircle className="h-4 w-4 shrink-0" />
//               : <XCircle className="h-4 w-4 shrink-0" />}
//             {feedback.msg}
//           </div>
//         )}

//         {/* Scrollable body */}
//         <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">

//           {loadingFull && (
//             <div className="flex items-center gap-2 text-sm text-gray-400">
//               <Loader2 className="h-4 w-4 animate-spin text-[#FF4D00]" />
//               Loading order details…
//             </div>
//           )}

//           {/* Cancelled alert */}
//           {isCancelled && (
//             <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
//               <XCircle className="h-6 w-6 shrink-0 text-red-600" />
//               <div>
//                 <p className="font-bold text-red-900">Order Cancelled</p>
//                 <p className="mt-0.5 text-sm text-red-700">No further changes are possible.</p>
//               </div>
//             </div>
//           )}

//           {/* Progress timeline */}
//           {!isCancelled && (
//             <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-orange-50 to-white p-5">
//               <p className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-500">
//                 Order Progress
//               </p>
//               <div className="flex items-start">
//                 {FLOW.map((step, i) => {
//                   const isReached = reached(displayed.status, step)
//                   return (
//                     <div key={step} className="flex flex-1 items-start">
//                       <div className="flex flex-col items-center">
//                         <div className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
//                           isReached
//                             ? "bg-[#FF4D00] shadow-lg shadow-orange-500/30"
//                             : "bg-gray-200"
//                         }`}>
//                           <StepIcon status={step} active={isReached} />
//                         </div>
//                         <p className={`mt-2 max-w-[60px] text-center text-[10px] font-semibold leading-tight ${
//                           isReached ? "text-gray-900" : "text-gray-400"
//                         }`}>
//                           {statusLabel(step)}
//                         </p>
//                       </div>
//                       {i < FLOW.length - 1 && (
//                         <div className={`mx-1 mt-5 h-1 flex-1 rounded-full transition ${
//                           reached(displayed.status, FLOW[i + 1])
//                             ? "bg-[#FF4D00]"
//                             : "bg-gray-200"
//                         }`} />
//                       )}
//                     </div>
//                   )
//                 })}
//               </div>
//             </div>
//           )}

//           {/* Info grid */}
//           <div className="grid gap-3 sm:grid-cols-2">

//             <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
//               <Hash className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
//               <div className="min-w-0">
//                 <p className="text-xs font-semibold text-gray-400">Order Number</p>
//                 <p className="truncate font-mono text-xs font-bold text-gray-900">
//                   {displayed.orderNumber}
//                 </p>
//               </div>
//             </div>

//             {/* Customer — resolved from getUserById if null */}
//             <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
//               <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
//               <div className="min-w-0">
//                 <p className="text-xs font-semibold text-gray-400">Customer</p>
//                 {loadingFull && !displayName ? (
//                   <div className="mt-1 h-3 w-24 animate-pulse rounded bg-gray-200" />
//                 ) : (
//                   <p className="truncate text-sm font-bold text-gray-900">
//                     {displayName ?? "—"}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
//               <Store className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
//               <div className="min-w-0">
//                 <p className="text-xs font-semibold text-gray-400">Restaurant</p>
//                 <p className="truncate text-sm font-bold text-gray-900">
//                   {displayed.restaurantName}
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
//               <span className="mt-0.5 shrink-0 font-black text-gray-400">₦</span>
//               <div className="min-w-0">
//                 <p className="text-xs font-semibold text-gray-400">Total Amount</p>
//                 <p className="text-sm font-black text-[#FF4D00]">
//                   {formatNGN(displayed.totalAmount)}
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
//               <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
//               <div>
//                 <p className="text-xs font-semibold text-gray-400">Items</p>
//                 <p className="text-sm font-bold text-gray-900">
//                   {displayed.itemCount} item{displayed.itemCount !== 1 ? "s" : ""}
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
//               <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
//               <div>
//                 <p className="text-xs font-semibold text-gray-400">Placed At</p>
//                 <p className="text-sm font-bold text-gray-900">{fmtDate(displayed.createdAt)}</p>
//               </div>
//             </div>

//             {displayed.deliveredAt && (
//               <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
//                 <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
//                 <div>
//                   <p className="text-xs font-semibold text-gray-400">Delivered At</p>
//                   <p className="text-sm font-bold text-gray-900">
//                     {fmtDate(displayed.deliveredAt)}
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Delivery address */}
//           {displayed.deliveryAddress && (
//             <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
//               <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4D00]" />
//               <div>
//                 <p className="text-xs font-semibold text-gray-400">Delivery Address</p>
//                 <p className="text-sm font-bold text-gray-900">
//                   {displayed.deliveryAddress}
//                   {displayed.deliveryCity ? `, ${displayed.deliveryCity}` : ""}
//                   {displayed.deliveryState ? `, ${displayed.deliveryState}` : ""}
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* Order items */}
//           {displayed.items && displayed.items.length > 0 && (
//             <div>
//               <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
//                 Order Items
//               </p>
//               <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
//                 {displayed.items.map((item, i) => (
//                   <div key={item.id ?? i} className="flex items-center gap-3 bg-white px-4 py-3">
//                     {item.dishImage && (
//                       <img
//                         src={item.dishImage}
//                         alt=""
//                         className="h-10 w-10 shrink-0 rounded-lg object-cover"
//                       />
//                     )}
//                     <div className="min-w-0 flex-1">
//                       <p className="truncate text-sm font-bold text-gray-900">
//                         {item.dishName || item.dishTitle || "—"}
//                       </p>
//                       {item.specialInstructions && (
//                         <p className="text-xs italic text-gray-400">
//                           {item.specialInstructions}
//                         </p>
//                       )}
//                     </div>
//                     <div className="shrink-0 text-right">
//                       <p className="text-sm font-black text-[#FF4D00]">
//                         {formatNGN(item.unitPrice * item.quantity)}
//                       </p>
//                       <p className="text-xs text-gray-400">
//                         {item.quantity}× {formatNGN(item.unitPrice)}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Current status */}
//           <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
//             <p className="text-sm font-bold text-gray-700">Current Status</p>
//             <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(displayed.status)}`}>
//               {statusLabel(displayed.status)}
//             </span>
//           </div>

//           {/* Update status */}
//           {!isCancelled && !isDelivered && (
//             <div className="rounded-xl border-2 border-[#FF4D00]/20 bg-orange-50 p-4">
//               <p className="mb-3 text-sm font-black text-gray-900">Update Order Status</p>
//               <div className="flex gap-3">
//                 <select
//                   value={newStatus}
//                   onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
//                   className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
//                 >
//                   <option value="Pending">⏳ Pending</option>
//                   <option value="Confirmed">✅ Confirmed</option>
//                   <option value="Preparing">👨‍🍳 Preparing</option>
//                   <option value="OutForDelivery">🚚 Out for Delivery</option>
//                   <option value="Delivered">📦 Delivered</option>
//                   <option value="Cancelled">❌ Cancelled</option>
//                 </select>
//                 <button
//                   onClick={handleUpdateStatus}
//                   disabled={!statusChanged || isUpdating}
//                   className="flex items-center gap-2 rounded-lg bg-[#FF4D00] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-40"
//                 >
//                   {isUpdating && <RefreshCw className="h-4 w-4 animate-spin" />}
//                   {isUpdating ? "Saving…" : "Update"}
//                 </button>
//               </div>
//               {statusChanged && (
//                 <p className="mt-2 text-xs font-semibold text-amber-700">
//                   ⚠️ The customer will be notified of this change.
//                 </p>
//               )}
//             </div>
//           )}

//           {(isDelivered || isCancelled) && (
//             <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
//               <p className="text-sm font-semibold text-gray-500">
//                 {isDelivered
//                   ? "Order delivered — status is locked."
//                   : "Order cancelled — status is locked."}
//               </p>
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="shrink-0 border-t border-gray-200 px-6 py-4">
//           <button
//             onClick={onClose}
//             className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }




"use client"

import { useState, useEffect } from "react"
import {
  X, Clock, Package, Store, Truck, CheckCircle, XCircle,
  User, ShoppingBag, Calendar, Hash, ChefHat, Loader2, MapPin,
} from "lucide-react"
import { adminService } from "@/lib/api/admin-service"
import { writeOverride } from "@/lib/utils/orderOverrides"
import type { AdminOrder, OrderStatus } from "@/lib/api/admin-service"

interface Props {
  order: AdminOrder
  onClose: () => void
  onOrderUpdated: () => void
  /** Called immediately when admin picks a new status — updates parent table locally */
  onStatusOverride: (orderId: string, newStatus: OrderStatus) => void
}

const FLOW: OrderStatus[] = ["Pending", "Confirmed", "Preparing", "OutForDelivery", "Delivered"]

export function statusLabel(s: string): string {
  return s === "OutForDelivery" ? "Out for Delivery" : s
}

function statusBadgeClass(s: OrderStatus): string {
  const m: Record<OrderStatus, string> = {
    Pending:        "bg-orange-100 text-orange-700",
    Confirmed:      "bg-blue-100 text-blue-700",
    Preparing:      "bg-yellow-100 text-yellow-700",
    OutForDelivery: "bg-purple-100 text-purple-700",
    Delivered:      "bg-emerald-100 text-emerald-700",
    Cancelled:      "bg-red-100 text-red-700",
  }
  return m[s] ?? "bg-gray-100 text-gray-700"
}

function reached(current: OrderStatus, step: OrderStatus): boolean {
  return FLOW.indexOf(current) >= FLOW.indexOf(step) && FLOW.indexOf(current) !== -1
}

function StepIcon({ status, active }: { status: OrderStatus; active: boolean }) {
  const cls = `h-5 w-5 ${active ? "text-white" : "text-gray-400"}`
  switch (status) {
    case "Pending":        return <Clock className={cls} />
    case "Confirmed":      return <CheckCircle className={cls} />
    case "Preparing":      return <ChefHat className={cls} />
    case "OutForDelivery": return <Truck className={cls} />
    case "Delivered":      return <CheckCircle className={cls} />
    default:               return <Package className={cls} />
  }
}

function formatNGN(n: number) {
  return "₦" + n.toLocaleString("en-NG")
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

interface FullOrder extends AdminOrder {
  customerName?: string
  customerPhone?: string
  deliveryAddress?: string
  deliveryCity?: string
  deliveryState?: string
  items?: Array<{
    id?: string
    dishName?: string
    dishTitle?: string
    dishImage?: string
    quantity: number
    unitPrice: number
    specialInstructions?: string
  }>
}

export default function OrderDetailsModal({ order, onClose, onOrderUpdated, onStatusOverride }: Props) {
  const [fullOrder, setFullOrder]       = useState<FullOrder | null>(null)
  const [resolvedName, setResolvedName] = useState<string | null>(order.customerUsername || null)
  const [loadingFull, setLoadingFull]   = useState(true)
  const [localStatus, setLocalStatus]   = useState<OrderStatus>(order.status)
  const [pendingStatus, setPending]     = useState<OrderStatus>(order.status)
  const [saved, setSaved]               = useState(false)

  // Keep localStatus in sync if parent passes updated order (e.g. after another edit)
  useEffect(() => {
    setLocalStatus(order.status)
    setPending(order.status)
  }, [order.id, order.status])

  // Fetch full detail + resolve customer name on open
  useEffect(() => {
    async function fetchAll() {
      setLoadingFull(true)
      try {
        const detail = await adminService.getOrderById(order.id)
        const full = detail as FullOrder
        setFullOrder(full)

        const nameFromDetail = full.customerUsername || full.customerName
        if (nameFromDetail) {
          setResolvedName(nameFromDetail)
        } else if (full.customerId) {
          try {
            const user = await adminService.getUserById(full.customerId)
            setResolvedName(user.username || user.email || null)
          } catch { /* leave as null */ }
        }
      } catch {
        setFullOrder(order as FullOrder)
        // Still try name lookup on detail failure
        if (!order.customerUsername && order.customerId) {
          try {
            const user = await adminService.getUserById(order.customerId)
            setResolvedName(user.username || user.email || null)
          } catch { /* leave as null */ }
        }
      } finally {
        setLoadingFull(false)
      }
    }
    void fetchAll()
  }, [order.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const displayed    = fullOrder ?? (order as FullOrder)
  const isCancelled  = localStatus === "Cancelled"
  const isDelivered  = localStatus === "Delivered"
  const statusChanged = pendingStatus !== localStatus

  function handleUpdateStatus() {
    // Write to localStorage so customer pages pick it up immediately
    writeOverride(order.id, pendingStatus)
    // Update local modal state
    setLocalStatus(pendingStatus)
    // Update parent table immediately
    onStatusOverride(order.id, pendingStatus)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-gray-900">Order Details</h2>
            <p className="text-sm font-bold text-[#FF4D00]">{displayed.orderNumber}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success banner */}
        {saved && (
          <div className="shrink-0 flex items-center gap-2 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Status updated to &ldquo;{statusLabel(localStatus)}&rdquo; — visible to customer immediately.
          </div>
        )}

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">

          {loadingFull && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin text-[#FF4D00]" />
              Loading order details…
            </div>
          )}

          {/* Cancelled alert */}
          {isCancelled && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <XCircle className="h-6 w-6 shrink-0 text-red-600" />
              <div>
                <p className="font-bold text-red-900">Order Cancelled</p>
                <p className="mt-0.5 text-sm text-red-700">Status is locked.</p>
              </div>
            </div>
          )}

          {/* Progress timeline */}
          {!isCancelled && (
            <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-orange-50 to-white p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-500">Order Progress</p>
              <div className="flex items-start">
                {FLOW.map((step, i) => {
                  const isReached = reached(localStatus, step)
                  return (
                    <div key={step} className="flex flex-1 items-start">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                          isReached ? "bg-[#FF4D00] shadow-lg shadow-orange-500/30" : "bg-gray-200"
                        }`}>
                          <StepIcon status={step} active={isReached} />
                        </div>
                        <p className={`mt-2 max-w-[60px] text-center text-[10px] font-semibold leading-tight ${
                          isReached ? "text-gray-900" : "text-gray-400"
                        }`}>
                          {statusLabel(step)}
                        </p>
                      </div>
                      {i < FLOW.length - 1 && (
                        <div className={`mx-1 mt-5 h-1 flex-1 rounded-full transition ${
                          reached(localStatus, FLOW[i + 1]) ? "bg-[#FF4D00]" : "bg-gray-200"
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Info grid */}
          <div className="grid gap-3 sm:grid-cols-2">

            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <Hash className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400">Order Number</p>
                <p className="truncate font-mono text-xs font-bold text-gray-900">{displayed.orderNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400">Customer</p>
                {loadingFull && !resolvedName
                  ? <div className="mt-1 h-3 w-24 animate-pulse rounded bg-gray-200" />
                  : <p className="truncate text-sm font-bold text-gray-900">{resolvedName ?? "—"}</p>
                }
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <Store className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400">Restaurant</p>
                <p className="truncate text-sm font-bold text-gray-900">{displayed.restaurantName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <span className="mt-0.5 shrink-0 text-sm font-black text-gray-400">₦</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400">Total Amount</p>
                <p className="text-sm font-black text-[#FF4D00]">{formatNGN(displayed.totalAmount)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <p className="text-xs font-semibold text-gray-400">Items</p>
                <p className="text-sm font-bold text-gray-900">
                  {displayed.itemCount} item{displayed.itemCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <p className="text-xs font-semibold text-gray-400">Placed At</p>
                <p className="text-sm font-bold text-gray-900">{fmtDate(displayed.createdAt)}</p>
              </div>
            </div>

            {displayed.deliveredAt && (
              <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-xs font-semibold text-gray-400">Delivered At</p>
                  <p className="text-sm font-bold text-gray-900">{fmtDate(displayed.deliveredAt)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Delivery address */}
          {displayed.deliveryAddress && (
            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4D00]" />
              <div>
                <p className="text-xs font-semibold text-gray-400">Delivery Address</p>
                <p className="text-sm font-bold text-gray-900">
                  {displayed.deliveryAddress}
                  {displayed.deliveryCity  ? `, ${displayed.deliveryCity}` : ""}
                  {displayed.deliveryState ? `, ${displayed.deliveryState}` : ""}
                </p>
              </div>
            </div>
          )}

          {/* Order items */}
          {displayed.items && displayed.items.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Order Items</p>
              <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
                {displayed.items.map((item, i) => (
                  <div key={item.id ?? i} className="flex items-center gap-3 bg-white px-4 py-3">
                    {item.dishImage && (
                      <img src={item.dishImage} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {item.dishName || item.dishTitle || "—"}
                      </p>
                      {item.specialInstructions && (
                        <p className="text-xs italic text-gray-400">{item.specialInstructions}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black text-[#FF4D00]">
                        {formatNGN(item.unitPrice * item.quantity)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.quantity}× {formatNGN(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current status */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-sm font-bold text-gray-700">Current Status</p>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(localStatus)}`}>
              {statusLabel(localStatus)}
            </span>
          </div>

          {/* Update status — purely local, no backend */}
          {!isCancelled && !isDelivered && (
            <div className="rounded-xl border-2 border-[#FF4D00]/20 bg-orange-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-black text-gray-900">Update Order Status</p>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Local only
                </span>
              </div>
              <div className="flex gap-3">
                <select
                  value={pendingStatus}
                  onChange={e => setPending(e.target.value as OrderStatus)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
                >
                  <option value="Pending">⏳ Pending</option>
                  <option value="Confirmed">✅ Confirmed</option>
                  <option value="Preparing">👨‍🍳 Preparing</option>
                  <option value="OutForDelivery">🚚 Out for Delivery</option>
                  <option value="Delivered">📦 Delivered</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
                <button
                  onClick={handleUpdateStatus}
                  disabled={!statusChanged}
                  className="flex items-center gap-2 rounded-lg bg-[#FF4D00] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  Update
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Changes are saved locally and visible to the customer right away.
              </p>
            </div>
          )}

          {(isDelivered || isCancelled) && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="text-sm font-semibold text-gray-500">
                {isDelivered ? "Order delivered — status locked." : "Order cancelled — status locked."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}