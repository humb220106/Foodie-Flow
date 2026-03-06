"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import AdminSidebar from "@/components/layout/AdminSidebar"
import AdminStatsCards from "@/components/admin/AdminStatsCards"
import { adminService } from "@/lib/api/admin-service"
import type { DashboardStats, AdminOrder } from "@/lib/api/admin-service"
import { Bell, RefreshCw, TrendingUp, TrendingDown } from "lucide-react"

// ==================== MINI CHART ====================

function Sparkline({
  data,
  color,
}: {
  data: { date: string; value: number }[]
  color: string
}) {
  if (!data || data.length === 0) return null

  const max = Math.max(...data.map((d) => d.value))
  const min = Math.min(...data.map((d) => d.value))
  const range = max - min || 1
  const height = 60
  const width = 280

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((d.value - min) / range) * (height - 10) - 5
      return `${x},${y}`
    })
    .join(" ")

  const last = data[data.length - 1]?.value ?? 0
  const prev = data[data.length - 2]?.value ?? 0
  const isUp = last >= prev

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {color === "#10b981" ? "Orders (7 days)" : "Revenue (7 days)"}
          </p>
          <p className="text-2xl font-black text-gray-900">
            {color === "#10b981"
              ? last.toLocaleString()
              : `₦${last.toLocaleString("en-NG")}`}
          </p>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
            isUp ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}
        >
          {isUp ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          vs prev day
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* last point dot */}
        {data.length > 0 && (() => {
          const last = data[data.length - 1]
          const x = width
          const y = height - ((last.value - min) / range) * (height - 10) - 5
          return (
            <circle cx={x} cy={y} r="3.5" fill={color} />
          )
        })()}
      </svg>

      <div className="mt-2 flex justify-between">
        {data.map((d) => (
          <span key={d.date} className="text-xs text-gray-400">
            {new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })}
          </span>
        ))}
      </div>
    </div>
  )
}

// ==================== ORDER STATUS BADGE ====================

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Delivered: "bg-emerald-100 text-emerald-700",
    Pending: "bg-orange-100 text-orange-700",
    Cancelled: "bg-red-100 text-red-700",
    Confirmed: "bg-blue-100 text-blue-700",
    Preparing: "bg-yellow-100 text-yellow-700",
    OutForDelivery: "bg-purple-100 text-purple-700",
  }
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
        map[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {status === "OutForDelivery" ? "Out for Delivery" : status}
    </span>
  )
}

// ==================== RECENT ORDERS TABLE ====================

function RecentOrdersTable({ orders }: { orders: AdminOrder[] }) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(v)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-black text-gray-900">Recent Orders</h2>
        <a
          href="/admin/orders"
          className="text-sm font-bold text-[#FF4D00] hover:opacity-80"
        >
          View All
        </a>
      </div>

      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Order #", "Customer", "Restaurant", "Amount", "Items", "Status", "Date"].map(
                  (h) => (
                    <th
                      key={h}
                      className="pb-3 text-left text-xs font-bold uppercase text-gray-500"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-3 text-sm font-bold text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 text-sm text-gray-700">{order.customerUsername}</td>
                  <td className="py-3 text-sm text-gray-600">{order.restaurantName}</td>
                  <td className="py-3 text-sm font-semibold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="py-3 text-sm text-gray-600">{order.itemCount}</td>
                  <td className="py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="py-3 text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ==================== MAIN PAGE ====================

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [statsData, ordersData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getOrders(1, 10),
      ])

      setStats(statsData)
      setRecentOrders(ordersData.items)
      setLastRefreshed(new Date())
    } catch (err: any) {
      if (err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
        router.push("/login")
        return
      }
      setError(err?.message || "Failed to load dashboard data.")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: "256px" }}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
          <div className="flex h-16 items-center justify-between px-8">
            <div>
              <h1 className="text-xl font-black text-gray-900">Dashboard Overview</h1>
              {lastRefreshed && (
                <p className="text-xs text-gray-400">
                  Last updated:{" "}
                  {lastRefreshed.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh */}
              <button
                onClick={loadDashboardData}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>

              {/* Notifications */}
              <button className="relative rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50">
                <Bell className="h-5 w-5 text-gray-600" />
                {stats && stats.pendingOrders > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              ⚠️ {error}
              <button
                onClick={loadDashboardData}
                className="ml-4 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !stats && (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#FF4D00]" />
            </div>
          )}

          {/* Loaded State */}
          {stats && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <AdminStatsCards stats={stats} />

              {/* 7-Day Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Sparkline data={stats.last7DaysOrders} color="#3b82f6" />
                <Sparkline data={stats.last7DaysRevenue} color="#10b981" />
              </div>

              {/* Recent Orders */}
              <RecentOrdersTable orders={recentOrders} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}