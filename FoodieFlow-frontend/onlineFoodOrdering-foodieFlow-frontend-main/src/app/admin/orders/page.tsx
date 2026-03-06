// "use client"

// import { useEffect, useState, useCallback } from "react"
// import AdminSidebar from "@/components/layout/AdminSidebar"
// import OrderDetailsModal from "@/components/admin/OrderDetailsModal"
// import { adminService } from "@/lib/api/admin-service"
// import type { AdminOrder, OrderStatus, PagedResult } from "@/lib/api/admin-service"
// import {
//   Search, Download, ShoppingBag, Clock, CheckCircle, XCircle,
//   Truck, ChefHat, Eye, RefreshCw, AlertCircle, ChevronLeft,
//   ChevronRight, TrendingUp, Package,
// } from "lucide-react"

// const PAGE_SIZE = 20

// const STATUS_TABS: { label: string; value: "all" | OrderStatus }[] = [
//   { label: "All Orders",       value: "all" },
//   { label: "Pending",          value: "Pending" },
//   { label: "Confirmed",        value: "Confirmed" },
//   { label: "Preparing",        value: "Preparing" },
//   { label: "Out for Delivery", value: "OutForDelivery" },
//   { label: "Delivered",        value: "Delivered" },
//   { label: "Cancelled",        value: "Cancelled" },
// ]

// export function statusLabel(s: OrderStatus | string): string {
//   return s === "OutForDelivery" ? "Out for Delivery" : s
// }

// export function statusBadgeClass(s: OrderStatus): string {
//   const map: Record<OrderStatus, string> = {
//     Pending:        "bg-orange-100 text-orange-700",
//     Confirmed:      "bg-blue-100 text-blue-700",
//     Preparing:      "bg-yellow-100 text-yellow-700",
//     OutForDelivery: "bg-purple-100 text-purple-700",
//     Delivered:      "bg-emerald-100 text-emerald-700",
//     Cancelled:      "bg-red-100 text-red-700",
//   }
//   return map[s] ?? "bg-gray-100 text-gray-700"
// }

// function StatusIcon({ status }: { status: OrderStatus }) {
//   const cls = "h-3.5 w-3.5"
//   switch (status) {
//     case "Pending":        return <Clock className={cls} />
//     case "Confirmed":      return <CheckCircle className={cls} />
//     case "Preparing":      return <ChefHat className={cls} />
//     case "OutForDelivery": return <Truck className={cls} />
//     case "Delivered":      return <CheckCircle className={cls} />
//     case "Cancelled":      return <XCircle className={cls} />
//   }
// }

// export default function OrdersManagementPage() {
//   const [result, setResult]               = useState<PagedResult<AdminOrder> | null>(null)
//   const [isLoading, setIsLoading]         = useState(true)
//   const [error, setError]                 = useState<string | null>(null)
//   const [page, setPage]                   = useState(1)
//   const [activeStatus, setActiveStatus]   = useState<"all" | OrderStatus>("all")
//   const [searchQuery, setSearchQuery]     = useState("")
//   const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)

//   const items      = result?.items ?? []
//   const totalCount = result?.totalCount ?? 0
//   const totalPages = result?.totalPages ?? 1

//   // ── Fetch from backend ──
//   const loadOrders = useCallback(
//     async (targetPage = 1, status: "all" | OrderStatus = activeStatus) => {
//       try {
//         setIsLoading(true)
//         setError(null)
//         const data =
//           status === "all"
//             ? await adminService.getOrders(targetPage, PAGE_SIZE)
//             : await adminService.getOrdersByStatus(status, targetPage, PAGE_SIZE)
//         setResult(data)
//         setPage(targetPage)
//       } catch (err: any) {
//         setError(err?.message || "Failed to load orders.")
//       } finally {
//         setIsLoading(false)
//       }
//     },
//     [activeStatus]
//   )

//   // Reload when status tab changes
//   useEffect(() => {
//     loadOrders(1, activeStatus)
//     setSearchQuery("")
//   }, [activeStatus])

//   // ── Client-side search on current page ──
//   const filtered = items.filter((o) => {
//     const q = searchQuery.toLowerCase()
//     return (
//       !q ||
//       o.orderNumber.toLowerCase().includes(q) ||
//       (o.customerUsername ?? "").toLowerCase().includes(q) ||
//       o.restaurantName.toLowerCase().includes(q)
//     )
//   })

//   // ── Summary stats from current page ──
//   const pendingCount  = items.filter((o) => o.status === "Pending").length
//   const activeCount   = items.filter(
//     (o) => o.status === "Confirmed" || o.status === "Preparing" || o.status === "OutForDelivery"
//   ).length
//   const deliveredRev  = items
//     .filter((o) => o.status === "Delivered")
//     .reduce((s, o) => s + o.totalAmount, 0)

//   // ── CSV export (current visible page) ──
//   function handleExportCSV() {
//     const headers = ["Order #", "Customer", "Restaurant", "Amount", "Items", "Status", "Date"]
//     const rows = filtered.map((o) => [
//       o.orderNumber,
//       o.customerUsername ?? "",
//       o.restaurantName,
//       `₦${o.totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
//       o.itemCount,
//       statusLabel(o.status),
//       new Date(o.createdAt).toLocaleDateString(),
//     ])
//     const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
//     const blob = new Blob([csv], { type: "text/csv" })
//     const url  = URL.createObjectURL(blob)
//     const a    = document.createElement("a")
//     a.href     = url
//     a.download = `orders-${activeStatus}-p${page}-${new Date().toISOString().split("T")[0]}.csv`
//     a.click()
//     URL.revokeObjectURL(url)
//   }

//   // ── Smart page numbers with ellipsis ──
//   function pageNums(): (number | null)[] {
//     const out: (number | null)[] = []
//     const delta = 2
//     const left  = Math.max(2, page - delta)
//     const right = Math.min(totalPages - 1, page + delta)
//     out.push(1)
//     if (left > 2) out.push(null)
//     for (let i = left; i <= right; i++) out.push(i)
//     if (right < totalPages - 1) out.push(null)
//     if (totalPages > 1) out.push(totalPages)
//     return out
//   }

//   return (
//     <div className="flex h-screen bg-gray-50">
//       <AdminSidebar />

//       <div className="flex-1 overflow-auto" style={{ marginLeft: "256px" }}>

//         {/* ── Header ── */}
//         <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-8 py-5">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-2xl font-black text-gray-900">Orders Management</h1>
//               <p className="mt-0.5 text-sm text-gray-500">
//                 {totalCount > 0
//                   ? `${totalCount.toLocaleString()} orders${activeStatus !== "all" ? ` · ${statusLabel(activeStatus as OrderStatus)}` : ""}`
//                   : "Monitor and manage all platform orders"}
//               </p>
//             </div>
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => loadOrders(page, activeStatus)}
//                 disabled={isLoading}
//                 className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
//               >
//                 <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
//                 Refresh
//               </button>
//               <button
//                 onClick={handleExportCSV}
//                 disabled={filtered.length === 0}
//                 className="flex items-center gap-2 rounded-lg bg-[#FF4D00] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-95 disabled:opacity-40"
//               >
//                 <Download className="h-4 w-4" />
//                 Export CSV
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* ── Summary cards ── */}
//         <div className="border-b border-gray-200 bg-white px-8 py-5">
//           <div className="grid gap-4 md:grid-cols-4">
//             {[
//               { icon: <ShoppingBag className="h-5 w-5 text-blue-600" />,   bg: "bg-blue-100",   label: "Total (filter)",       val: totalCount.toLocaleString() },
//               { icon: <Clock className="h-5 w-5 text-orange-600" />,       bg: "bg-orange-100", label: "Pending (this page)",  val: pendingCount.toString() },
//               { icon: <TrendingUp className="h-5 w-5 text-purple-600" />,  bg: "bg-purple-100", label: "Active (this page)",   val: activeCount.toString() },
//               { icon: <span className="text-lg font-black text-emerald-600">₦</span>, bg: "bg-emerald-100", label: "Delivered rev (page)", val: `₦${deliveredRev.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
//             ].map(({ icon, bg, label, val }) => (
//               <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//                 <div className={`rounded-lg ${bg} p-2 shrink-0`}>{icon}</div>
//                 <div className="min-w-0">
//                   <p className="truncate text-xs font-semibold text-gray-500">{label}</p>
//                   <p className="text-xl font-black text-gray-900">{val}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* ── Status tabs ── */}
//         <div className="border-b border-gray-200 bg-white px-8">
//           <div className="flex gap-1 overflow-x-auto">
//             {STATUS_TABS.map((tab) => {
//               const isActive = activeStatus === tab.value
//               const cnt = tab.value === "all"
//                 ? items.length
//                 : items.filter((o) => o.status === tab.value).length
//               return (
//                 <button
//                   key={tab.value}
//                   onClick={() => setActiveStatus(tab.value)}
//                   className={`whitespace-nowrap px-5 py-3 text-sm font-bold transition ${
//                     isActive
//                       ? "border-b-2 border-[#FF4D00] text-[#FF4D00]"
//                       : "text-gray-500 hover:text-gray-800"
//                   }`}
//                 >
//                   {tab.label}
//                   {!isLoading && cnt > 0 && (
//                     <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
//                       isActive ? "bg-orange-100 text-[#FF4D00]" : "bg-gray-100 text-gray-500"
//                     }`}>
//                       {cnt}
//                     </span>
//                   )}
//                 </button>
//               )
//             })}
//           </div>
//         </div>

//         {/* ── Search ── */}
//         <div className="border-b border-gray-200 bg-white px-8 py-3">
//           <div className="relative max-w-md">
//             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
//             <input
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search order #, customer or restaurant…"
//               className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
//             />
//           </div>
//         </div>

//         {/* ── Main ── */}
//         <main className="p-8">

//           {error && (
//             <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
//               <AlertCircle className="h-5 w-5 shrink-0" />
//               {error}
//               <button onClick={() => loadOrders(page)} className="ml-auto underline">Retry</button>
//             </div>
//           )}

//           {/* Skeleton */}
//           {isLoading && (
//             <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse">
//               {Array.from({ length: 10 }).map((_, i) => (
//                 <div key={i} className="flex items-center gap-4 border-b border-gray-100 px-6 py-4">
//                   <div className="h-3 w-24 rounded bg-gray-200" />
//                   <div className="h-3 w-28 rounded bg-gray-200" />
//                   <div className="h-3 w-32 rounded bg-gray-200" />
//                   <div className="ml-auto h-6 w-20 rounded-full bg-gray-200" />
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Table */}
//           {!isLoading && (
//             <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr className="border-b border-gray-200 bg-gray-50">
//                       {["Order #", "Customer", "Restaurant", "Amount", "Items", "Status", "Date", ""].map((h) => (
//                         <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
//                           {h}
//                         </th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-100">
//                     {filtered.length === 0 ? (
//                       <tr>
//                         <td colSpan={8} className="px-6 py-16 text-center">
//                           <ShoppingBag className="mx-auto h-12 w-12 text-gray-200" />
//                           <p className="mt-3 text-sm font-semibold text-gray-400">
//                             {searchQuery ? `No orders match "${searchQuery}"` : "No orders found."}
//                           </p>
//                         </td>
//                       </tr>
//                     ) : filtered.map((order) => (
//                       <tr key={order.id} className="hover:bg-orange-50/20 transition-colors">

//                         {/* Order # */}
//                         <td className="px-5 py-4">
//                           <p className="text-sm font-black text-[#FF4D00]">{order.orderNumber}</p>
//                         </td>

//                         {/* Customer */}
//                         <td className="px-5 py-4">
//                           <div className="flex items-center gap-2.5">
//                             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-black text-white">
//                               {(order.customerUsername ?? "?").substring(0, 2).toUpperCase()}
//                             </div>
//                             <p className="text-sm font-semibold text-gray-900">{order.customerUsername ?? "Unknown"}</p>
//                           </div>
//                         </td>

//                         {/* Restaurant */}
//                         <td className="px-5 py-4">
//                           <p className="max-w-[160px] truncate text-sm text-gray-700">{order.restaurantName}</p>
//                         </td>

//                         {/* Amount */}
//                         <td className="px-5 py-4">
//                           <p className="text-sm font-bold text-gray-900">₦{order.totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
//                         </td>

//                         {/* Items */}
//                         <td className="px-5 py-4">
//                           <p className="text-sm text-gray-600">{order.itemCount}</p>
//                         </td>

//                         {/* Status */}
//                         <td className="px-5 py-4">
//                           <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusBadgeClass(order.status)}`}>
//                             <StatusIcon status={order.status} />
//                             {statusLabel(order.status)}
//                           </span>
//                         </td>

//                         {/* Date */}
//                         <td className="px-5 py-4">
//                           <p className="text-xs text-gray-600">
//                             {new Date(order.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
//                           </p>
//                           <p className="text-xs text-gray-400">
//                             {new Date(order.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
//                           </p>
//                         </td>

//                         {/* Actions */}
//                         <td className="px-5 py-4">
//                           <button
//                             onClick={() => setSelectedOrder(order)}
//                             className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-[#FF4D00] hover:bg-orange-50 transition-colors"
//                           >
//                             <Eye className="h-3.5 w-3.5" />
//                             View
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Pagination */}
//               {result && totalPages > 1 && (
//                 <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
//                   <p className="text-sm text-gray-600">
//                     Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span> — <span className="font-bold">{totalCount.toLocaleString()}</span> orders
//                   </p>
//                   <div className="flex items-center gap-1.5">
//                     <button
//                       onClick={() => loadOrders(page - 1)}
//                       disabled={page === 1 || isLoading}
//                       className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
//                     >
//                       <ChevronLeft className="h-4 w-4" />
//                     </button>
//                     {pageNums().map((p, i) =>
//                       p === null ? (
//                         <span key={`g-${i}`} className="px-1 text-gray-400">…</span>
//                       ) : (
//                         <button
//                           key={p}
//                           onClick={() => loadOrders(p)}
//                           disabled={isLoading}
//                           className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition ${
//                             p === page ? "bg-[#FF4D00] text-white" : "border border-gray-200 text-gray-700 hover:bg-gray-50"
//                           }`}
//                         >
//                           {p}
//                         </button>
//                       )
//                     )}
//                     <button
//                       onClick={() => loadOrders(page + 1)}
//                       disabled={page === totalPages || isLoading}
//                       className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
//                     >
//                       <ChevronRight className="h-4 w-4" />
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </main>
//       </div>

//       {selectedOrder && (
//         <OrderDetailsModal
//           order={selectedOrder}
//           onClose={() => setSelectedOrder(null)}
//           onOrderUpdated={async () => {
//             setSelectedOrder(null)
//             await loadOrders(page, activeStatus)
//           }}
//         />
//       )}
//     </div>
//   )
// }




"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import AdminSidebar from "@/components/layout/AdminSidebar"
import OrderDetailsModal from "@/components/admin/OrderDetailsModal"
import { adminService } from "@/lib/api/admin-service"
import type { AdminOrder, OrderStatus, PagedResult } from "@/lib/api/admin-service"
import {
  Search, Download, ShoppingBag, Clock, CheckCircle, XCircle,
  Truck, ChefHat, Eye, RefreshCw, AlertCircle, ChevronLeft,
  ChevronRight, DollarSign, TrendingUp, Package,
} from "lucide-react"

const PAGE_SIZE = 20

const STATUS_TABS: { label: string; value: "all" | OrderStatus }[] = [
  { label: "All Orders",       value: "all" },
  { label: "Pending",          value: "Pending" },
  { label: "Confirmed",        value: "Confirmed" },
  { label: "Preparing",        value: "Preparing" },
  { label: "Out for Delivery", value: "OutForDelivery" },
  { label: "Delivered",        value: "Delivered" },
  { label: "Cancelled",        value: "Cancelled" },
]

export function statusLabel(s: OrderStatus | string): string {
  return s === "OutForDelivery" ? "Out for Delivery" : s
}

export function statusBadgeClass(s: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    Pending:        "bg-orange-100 text-orange-700",
    Confirmed:      "bg-blue-100 text-blue-700",
    Preparing:      "bg-yellow-100 text-yellow-700",
    OutForDelivery: "bg-purple-100 text-purple-700",
    Delivered:      "bg-emerald-100 text-emerald-700",
    Cancelled:      "bg-red-100 text-red-700",
  }
  return map[s] ?? "bg-gray-100 text-gray-700"
}

function StatusIcon({ status }: { status: OrderStatus }) {
  const cls = "h-3.5 w-3.5"
  switch (status) {
    case "Pending":        return <Clock className={cls} />
    case "Confirmed":      return <CheckCircle className={cls} />
    case "Preparing":      return <ChefHat className={cls} />
    case "OutForDelivery": return <Truck className={cls} />
    case "Delivered":      return <CheckCircle className={cls} />
    case "Cancelled":      return <XCircle className={cls} />
  }
}

export default function OrdersManagementPage() {
  const [result, setResult]               = useState<PagedResult<AdminOrder> | null>(null)
  const [isLoading, setIsLoading]         = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [page, setPage]                   = useState(1)
  const [activeStatus, setActiveStatus]   = useState<"all" | OrderStatus>("all")
  const [searchQuery, setSearchQuery]     = useState("")
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  // Local overrides: orderId → status (survives re-fetches this session)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, OrderStatus>>({})
  // Resolved customer names: customerId → username
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({})
  const resolving = useRef(false)

  const items      = result?.items ?? []
  const totalCount = result?.totalCount ?? 0
  const totalPages = result?.totalPages ?? 1

  // ── Resolve customer names from customerId ──
  async function resolveCustomerNames(orders: AdminOrder[]) {
    if (resolving.current) return
    const missing = orders.filter(o => !o.customerUsername && o.customerId)
    if (missing.length === 0) return
    resolving.current = true
    const updates: Record<string, string> = {}
    await Promise.allSettled(
      missing.map(async (o) => {
        try {
          const user = await adminService.getUserById(o.customerId)
          updates[o.customerId] = user.username || user.email || o.customerId.slice(0, 8)
        } catch {
          updates[o.customerId] = o.customerId.slice(0, 8) + "…"
        }
      })
    )
    setCustomerNames(prev => ({ ...prev, ...updates }))
    resolving.current = false
  }

  // ── Local status override (no backend needed) ──
  function localUpdateStatus(orderId: string, newStatus: OrderStatus) {
    setStatusOverrides(prev => ({ ...prev, [orderId]: newStatus }))
    // Also update selectedOrder so modal reflects new status immediately
    setSelectedOrder(prev => prev?.id === orderId ? { ...prev, status: newStatus } : prev)
  }

  // ── Fetch from backend ──
  const loadOrders = useCallback(
    async (targetPage = 1, status: "all" | OrderStatus = activeStatus) => {
      try {
        setIsLoading(true)
        setError(null)
        const data =
          status === "all"
            ? await adminService.getOrders(targetPage, PAGE_SIZE)
            : await adminService.getOrdersByStatus(status, targetPage, PAGE_SIZE)
        setResult(data)
        setPage(targetPage)
        resolveCustomerNames(data.items)
      } catch (err: any) {
        setError(err?.message || "Failed to load orders.")
      } finally {
        setIsLoading(false)
      }
    },
    [activeStatus]
  )

  // Reload when status tab changes
  useEffect(() => {
    loadOrders(1, activeStatus)
    setSearchQuery("")
  }, [activeStatus])

  // ── Client-side search on current page ──
  const filtered = items.filter((o) => {
    const q = searchQuery.toLowerCase()
    return (
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customerUsername ?? "").toLowerCase().includes(q) ||
      (customerNames[o.customerId] ?? "").toLowerCase().includes(q) ||
      o.restaurantName.toLowerCase().includes(q)
    )
  })

  // ── Summary stats from current page ──
  const pendingCount  = items.filter((o) => o.status === "Pending").length
  const activeCount   = items.filter(
    (o) => o.status === "Confirmed" || o.status === "Preparing" || o.status === "OutForDelivery"
  ).length
  const deliveredRev  = items
    .filter((o) => o.status === "Delivered")
    .reduce((s, o) => s + o.totalAmount, 0)

  // ── CSV export (current visible page) ──
  function handleExportCSV() {
    const headers = ["Order #", "Customer", "Restaurant", "Amount", "Items", "Status", "Date"]
    const rows = filtered.map((o) => [
      o.orderNumber,
      o.customerUsername || customerNames[o.customerId] || "Unknown",
      o.restaurantName,
      `₦${o.totalAmount.toLocaleString("en-NG")}`,
      o.itemCount,
      statusLabel(o.status),
      new Date(o.createdAt).toLocaleDateString(),
    ])
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `orders-${activeStatus}-p${page}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Smart page numbers with ellipsis ──
  function pageNums(): (number | null)[] {
    const out: (number | null)[] = []
    const delta = 2
    const left  = Math.max(2, page - delta)
    const right = Math.min(totalPages - 1, page + delta)
    out.push(1)
    if (left > 2) out.push(null)
    for (let i = left; i <= right; i++) out.push(i)
    if (right < totalPages - 1) out.push(null)
    if (totalPages > 1) out.push(totalPages)
    return out
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: "256px" }}>

        {/* ── Header ── */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Orders Management</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                {totalCount > 0
                  ? `${totalCount.toLocaleString()} orders${activeStatus !== "all" ? ` · ${statusLabel(activeStatus as OrderStatus)}` : ""}`
                  : "Monitor and manage all platform orders"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadOrders(page, activeStatus)}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={handleExportCSV}
                disabled={filtered.length === 0}
                className="flex items-center gap-2 rounded-lg bg-[#FF4D00] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-95 disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </header>

        {/* ── Summary cards ── */}
        <div className="border-b border-gray-200 bg-white px-8 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: <ShoppingBag className="h-5 w-5 text-blue-600" />,   bg: "bg-blue-100",   label: "Total (filter)",       val: totalCount.toLocaleString() },
              { icon: <Clock className="h-5 w-5 text-orange-600" />,       bg: "bg-orange-100", label: "Pending (this page)",  val: pendingCount.toString() },
              { icon: <TrendingUp className="h-5 w-5 text-purple-600" />,  bg: "bg-purple-100", label: "Active (this page)",   val: activeCount.toString() },
              { icon: <DollarSign className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-100",label: "Delivered rev (page)", val: `₦${deliveredRev.toLocaleString("en-NG")}` },
            ].map(({ icon, bg, label, val }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className={`rounded-lg ${bg} p-2 shrink-0`}>{icon}</div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-gray-500">{label}</p>
                  <p className="text-xl font-black text-gray-900">{val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Status tabs ── */}
        <div className="border-b border-gray-200 bg-white px-8">
          <div className="flex gap-1 overflow-x-auto">
            {STATUS_TABS.map((tab) => {
              const isActive = activeStatus === tab.value
              const cnt = tab.value === "all"
                ? items.length
                : items.filter((o) => o.status === tab.value).length
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveStatus(tab.value)}
                  className={`whitespace-nowrap px-5 py-3 text-sm font-bold transition ${
                    isActive
                      ? "border-b-2 border-[#FF4D00] text-[#FF4D00]"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab.label}
                  {!isLoading && cnt > 0 && (
                    <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                      isActive ? "bg-orange-100 text-[#FF4D00]" : "bg-gray-100 text-gray-500"
                    }`}>
                      {cnt}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Search ── */}
        <div className="border-b border-gray-200 bg-white px-8 py-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer or restaurant…"
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
            />
          </div>
        </div>

        {/* ── Main ── */}
        <main className="p-8">

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
              <button onClick={() => loadOrders(page)} className="ml-auto underline">Retry</button>
            </div>
          )}

          {/* Skeleton */}
          {isLoading && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-gray-100 px-6 py-4">
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-28 rounded bg-gray-200" />
                  <div className="h-3 w-32 rounded bg-gray-200" />
                  <div className="ml-auto h-6 w-20 rounded-full bg-gray-200" />
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          {!isLoading && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {["Order #", "Customer", "Restaurant", "Amount", "Items", "Status", "Date", ""].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <ShoppingBag className="mx-auto h-12 w-12 text-gray-200" />
                          <p className="mt-3 text-sm font-semibold text-gray-400">
                            {searchQuery ? `No orders match "${searchQuery}"` : "No orders found."}
                          </p>
                        </td>
                      </tr>
                    ) : filtered.map((order) => (
                      <tr key={order.id} className="hover:bg-orange-50/20 transition-colors">

                        {/* Order # */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-[#FF4D00]">{order.orderNumber}</p>
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-4">
                          {(() => {
                            const name = order.customerUsername || customerNames[order.customerId]
                            return (
                              <div className="flex items-center gap-2.5">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${name ? "bg-gradient-to-br from-orange-400 to-orange-600" : "bg-gray-300"}`}>
                                  {name ? name.substring(0, 2).toUpperCase() : "?"}
                                </div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {name ?? <span className="italic text-gray-400 text-xs">Loading…</span>}
                                </p>
                              </div>
                            )
                          })()}
                        </td>

                        {/* Restaurant */}
                        <td className="px-5 py-4">
                          <p className="max-w-[160px] truncate text-sm text-gray-700">{order.restaurantName}</p>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-gray-900">₦{order.totalAmount.toLocaleString("en-NG")}</p>
                        </td>

                        {/* Items */}
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-600">{order.itemCount}</p>
                        </td>

                        {/* Status — uses local override if set */}
                        <td className="px-5 py-4">
                          {(() => {
                            const effectiveStatus = statusOverrides[order.id] ?? order.status
                            return (
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusBadgeClass(effectiveStatus)}`}>
                                <StatusIcon status={effectiveStatus} />
                                {statusLabel(effectiveStatus)}
                                {statusOverrides[order.id] && (
                                  <span className="ml-0.5 rounded bg-amber-200 px-1 py-0.5 text-[9px] font-black text-amber-800">LOCAL</span>
                                )}
                              </span>
                            )
                          })()}
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4">
                          <p className="text-xs text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-[#FF4D00] hover:bg-orange-50 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {result && totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                  <p className="text-sm text-gray-600">
                    Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span> — <span className="font-bold">{totalCount.toLocaleString()}</span> orders
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => loadOrders(page - 1)}
                      disabled={page === 1 || isLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {pageNums().map((p, i) =>
                      p === null ? (
                        <span key={`g-${i}`} className="px-1 text-gray-400">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => loadOrders(p)}
                          disabled={isLoading}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition ${
                            p === page ? "bg-[#FF4D00] text-white" : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => loadOrders(page + 1)}
                      disabled={page === totalPages || isLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={{ ...selectedOrder, status: statusOverrides[selectedOrder.id] ?? selectedOrder.status }}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={async () => {
            setSelectedOrder(null)
            await loadOrders(page, activeStatus)
          }}
          onStatusOverride={localUpdateStatus}
        />
      )}
    </div>
  )
}