"use client"

import { useEffect, useState } from "react"
import AdminSidebar from "@/components/layout/AdminSidebar"
import {
  adminService,
  AdminSummaryReport,
  RevenueReport,
  OrdersReport,
  UsersReport,
  RestaurantsReport,
} from "@/lib/api/admin-service"
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Users, Store, RefreshCw, AlertCircle, Loader2,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

// ── helpers ────────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(1)}K`
  return `₦${n.toLocaleString()}`
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function GrowthBadge({ pct }: { pct: number }) {
  const up = pct >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? "text-emerald-600" : "text-red-500"}`}>
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {Math.abs(pct).toFixed(1)}% vs last month
    </span>
  )
}

const ORANGE  = "#FF4D00"
const BLUE    = "#3B82F6"
const EMERALD = "#10B981"
const PURPLE  = "#8B5CF6"
const AMBER   = "#F59E0B"
const PIE_COLORS = [ORANGE, BLUE, EMERALD, PURPLE, AMBER, "#EC4899", "#14B8A6"]

function ChartTooltip({ active, payload, label, money = false }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-xl text-sm">
      <p className="mb-1 font-bold text-gray-500 text-xs">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {p.name}: {money ? fmtMoney(p.value) : fmtNum(p.value)}
        </p>
      ))}
    </div>
  )
}

// ── stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, growth, accent,
}: {
  icon: any; label: string; value: string; growth: number; accent: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: `${accent}15` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        <GrowthBadge pct={growth} />
      </div>
      <p className="mt-4 text-2xl font-black text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  )
}

// ── section heading ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-400">
      {children}
    </h2>
  )
}

// ── day range selector ─────────────────────────────────────────────────────────

const DAY_OPTIONS = [7, 14, 30, 90]

// ── main page ──────────────────────────────────────────────────────────────────

type Tab = "overview" | "revenue" | "orders" | "users" | "restaurants"

export default function ReportsPage() {
  const [tab, setTab]         = useState<Tab>("overview")
  const [days, setDays]       = useState(30)
  const [data, setData]       = useState<AdminSummaryReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const summary = await adminService.getSummaryReport()
      setData(summary)
    } catch (e: any) {
      setError(e?.message || "Failed to load report data.")
    } finally {
      setLoading(false)
    }
  }

  // reload when day range changes (for individual tabs)
  async function loadTab() {
    if (!data) return
    try {
      setLoading(true)
      const [rev, ord, usr] = await Promise.all([
        adminService.getRevenueReport(days),
        adminService.getOrdersReport(days),
        adminService.getUsersReport(days),
      ])
      setData(d => d ? { ...d, revenue: rev, orders: ord, users: usr } : d)
    } catch (e: any) {
      setError(e?.message || "Failed to reload.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])
  useEffect(() => { if (data) void loadTab() }, [days])

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: "overview",     label: "Overview",     icon: TrendingUp  },
    { key: "revenue",      label: "Revenue",      icon: DollarSign  },
    { key: "orders",       label: "Orders",       icon: ShoppingBag },
    { key: "users",        label: "Users",        icon: Users       },
    { key: "restaurants",  label: "Restaurants",  icon: Store       },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Reports & Analytics</h1>
              <p className="mt-0.5 text-sm text-gray-500">Platform performance at a glance</p>
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

        {/* Tabs */}
        <div className="flex items-end gap-1 border-b border-gray-200 bg-white px-8">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                  active
                    ? "border-[#FF4D00] text-[#FF4D00]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Day range pill (not on overview/restaurants) */}
        {tab !== "overview" && tab !== "restaurants" && (
          <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-8 py-2">
            <span className="text-xs font-bold text-gray-400">PERIOD:</span>
            {DAY_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  days === d
                    ? "bg-[#FF4D00] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        )}

        <main className="p-8">
          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" /> {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !data && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          )}

          {data && (
            <>
              {tab === "overview"    && <OverviewTab    data={data} />}
              {tab === "revenue"     && <RevenueTab     data={data.revenue} days={days} />}
              {tab === "orders"      && <OrdersTab      data={data.orders}  days={days} />}
              {tab === "users"       && <UsersTab       data={data.users}   days={days} />}
              {tab === "restaurants" && <RestaurantsTab data={data.restaurants} />}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: AdminSummaryReport }) {
  const { revenue, orders, users, restaurants } = data

  // Merge daily revenue + orders for combo chart
  const combined = revenue.dailyRevenue.map((d, i) => ({
    date: new Date(d.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
    revenue: d.value,
    orders:  orders.dailyOrders[i]?.value ?? 0,
  }))

  return (
    <div className="space-y-8">
      {/* 4 KPI cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={DollarSign} label="Total Revenue"      value={fmtMoney(revenue.totalRevenue)}         growth={revenue.revenueGrowthPercent} accent={ORANGE}  />
        <StatCard icon={ShoppingBag} label="Total Orders"      value={fmtNum(orders.totalOrders)}             growth={orders.orderGrowthPercent}    accent={BLUE}    />
        <StatCard icon={Users}        label="Total Users"       value={fmtNum(users.totalUsers)}               growth={users.userGrowthPercent}       accent={EMERALD} />
        <StatCard icon={Store}        label="Total Restaurants" value={fmtNum(restaurants.totalRestaurants)}   growth={0}                             accent={PURPLE}  />
      </div>

      {/* Revenue + Orders area chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <SectionTitle>Revenue & Orders — Last 30 Days</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={combined} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={ORANGE}  stopOpacity={0.25} />
                <stop offset="95%" stopColor={ORANGE}  stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gOrd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={BLUE}    stopOpacity={0.2}  />
                <stop offset="95%" stopColor={BLUE}    stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis yAxisId="rev" orientation="left"  tickFormatter={v => fmtMoney(v)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="ord" orientation="right" tickFormatter={v => String(v)}   tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip money />} />
            <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke={ORANGE} fill="url(#gRev)" strokeWidth={2} dot={false} />
            <Area yAxisId="ord" type="monotone" dataKey="orders"  name="Orders"  stroke={BLUE}   fill="url(#gOrd)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Status breakdowns row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order status pie */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SectionTitle>Order Status Breakdown</SectionTitle>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={orders.statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                  {orders.statusBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => fmtNum(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {orders.statusBreakdown.map((s, i) => (
                <div key={s.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs font-semibold text-gray-600">{s.status}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{fmtNum(s.count)} <span className="text-gray-400">({s.percentage}%)</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top restaurants bar */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SectionTitle>Top 5 Restaurants by Revenue</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenue.topRestaurantsByRevenue} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tickFormatter={v => fmtMoney(v)} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="restaurantName" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<ChartTooltip money />} />
              <Bar dataKey="revenue" name="Revenue" fill={ORANGE} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ── Revenue Tab ────────────────────────────────────────────────────────────────

function RevenueTab({ data, days }: { data: RevenueReport; days: number }) {
  const daily = data.dailyRevenue.map(d => ({
    date: new Date(d.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
    value: d.value,
  }))

  const monthly = data.monthlyRevenue.map(m => ({
    month: m.monthName,
    value: m.value,
  }))

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-400">Total Revenue</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{fmtMoney(data.totalRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-400">This Month</p>
          <p className="mt-2 text-3xl font-black text-[#FF4D00]">{fmtMoney(data.totalRevenueThisMonth)}</p>
          <GrowthBadge pct={data.revenueGrowthPercent} />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-400">Last Month</p>
          <p className="mt-2 text-3xl font-black text-gray-500">{fmtMoney(data.totalRevenueLastMonth)}</p>
        </div>
      </div>

      {/* Daily area chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <SectionTitle>Daily Revenue — Last {days} Days</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={daily}>
            <defs>
              <linearGradient id="gRev2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={ORANGE} stopOpacity={0.3} />
                <stop offset="95%" stopColor={ORANGE} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={Math.floor(days / 7)} />
            <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip money />} />
            <Area type="monotone" dataKey="value" name="Revenue" stroke={ORANGE} fill="url(#gRev2)" strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <SectionTitle>Monthly Revenue — Last 12 Months</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip money />} />
            <Bar dataKey="value" name="Revenue" fill={ORANGE} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top restaurants table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <SectionTitle>Top Restaurants by Revenue</SectionTitle>
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Restaurant</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.topRestaurantsByRevenue.map((r, i) => (
                <tr key={r.restaurantId} className="hover:bg-orange-50/30">
                  <td className="px-4 py-3 font-black text-gray-300">#{i + 1}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{r.restaurantName}</td>
                  <td className="px-4 py-3 text-right font-black text-[#FF4D00]">{fmtMoney(r.revenue)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-600">{fmtNum(r.orderCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Orders Tab ─────────────────────────────────────────────────────────────────

function OrdersTab({ data, days }: { data: OrdersReport; days: number }) {
  const daily = data.dailyOrders.map(d => ({
    date: new Date(d.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
    value: d.value,
  }))

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Orders",    value: fmtNum(data.totalOrders),    color: "text-gray-900" },
          { label: "This Month",      value: fmtNum(data.ordersThisMonth), color: "text-[#FF4D00]" },
          { label: "Pending",         value: fmtNum(data.pendingOrders),   color: "text-amber-500" },
          { label: "Completed",       value: fmtNum(data.completedOrders), color: "text-emerald-600" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400">{k.label}</p>
            <p className={`mt-2 text-3xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Daily bar chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <SectionTitle>Daily Orders — Last {days} Days</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={Math.floor(days / 7)} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" name="Orders" fill={BLUE} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status breakdown */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <SectionTitle>Status Breakdown</SectionTitle>
        <div className="flex flex-col gap-3">
          {data.statusBreakdown.map((s, i) => (
            <div key={s.status} className="flex items-center gap-4">
              <span className="w-28 text-sm font-semibold text-gray-600">{s.status}</span>
              <div className="flex-1 rounded-full bg-gray-100 h-3">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{ width: `${s.percentage}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                />
              </div>
              <span className="w-20 text-right text-sm font-black text-gray-700">
                {fmtNum(s.count)} <span className="text-gray-400 font-normal">({s.percentage}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Users Tab ──────────────────────────────────────────────────────────────────

function UsersTab({ data, days }: { data: UsersReport; days: number }) {
  const daily = data.dailySignups.map(d => ({
    date: new Date(d.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
    value: d.value,
  }))

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users",     value: fmtNum(data.totalUsers),        color: "text-gray-900" },
          { label: "New This Month",  value: fmtNum(data.newUsersThisMonth),  color: "text-[#FF4D00]" },
          { label: "Active",          value: fmtNum(data.activeUsers),        color: "text-emerald-600" },
          { label: "Inactive",        value: fmtNum(data.inactiveUsers),      color: "text-gray-400" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400">{k.label}</p>
            <p className={`mt-2 text-3xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Daily signups area */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <SectionTitle>Daily Signups — Last {days} Days</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={daily}>
            <defs>
              <linearGradient id="gUsr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={EMERALD} stopOpacity={0.3} />
                <stop offset="95%" stopColor={EMERALD} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={Math.floor(days / 7)} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="value" name="Signups" stroke={EMERALD} fill="url(#gUsr)" strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Role breakdown + growth */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SectionTitle>Users by Role</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.roleBreakdown} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={80} label={({ role, percent }) => `${role} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {data.roleBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => fmtNum(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SectionTitle>Month-over-Month Growth</SectionTitle>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">New Users This Month</p>
              <p className="text-3xl font-black text-gray-900">{fmtNum(data.newUsersThisMonth)}</p>
              <GrowthBadge pct={data.userGrowthPercent} />
            </div>
            <div className="border-t pt-4">
              <p className="text-xs font-bold text-gray-400 uppercase">Last Month</p>
              <p className="text-2xl font-black text-gray-400">{fmtNum(data.newUsersLastMonth)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Restaurants Tab ────────────────────────────────────────────────────────────

function RestaurantsTab({ data }: { data: RestaurantsReport }) {
  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total",           value: fmtNum(data.totalRestaurants),     color: "text-gray-900" },
          { label: "Active",          value: fmtNum(data.activeRestaurants),     color: "text-emerald-600" },
          { label: "Inactive",        value: fmtNum(data.inactiveRestaurants),   color: "text-gray-400" },
          { label: "New This Month",  value: fmtNum(data.newRestaurantsThisMonth), color: "text-[#FF4D00]" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400">{k.label}</p>
            <p className={`mt-2 text-3xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Top by orders + revenue side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[
          { title: "Top Restaurants by Orders",  items: data.topRestaurantsByOrders,  key: "orderCount" as const,  fmt: fmtNum,    color: BLUE   },
          { title: "Top Restaurants by Revenue", items: data.topRestaurantsByRevenue, key: "revenue"    as const,  fmt: fmtMoney,  color: ORANGE },
        ].map(panel => (
          <div key={panel.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <SectionTitle>{panel.title}</SectionTitle>
            <div className="space-y-3">
              {panel.items.map((r, i) => {
                const max = panel.items[0][panel.key] || 1
                const pct = (r[panel.key] / max) * 100
                return (
                  <div key={r.restaurantId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-800 truncate max-w-[180px]">{r.restaurantName}</span>
                      <span className="text-sm font-black" style={{ color: panel.color }}>{panel.fmt(r[panel.key])}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${pct}%`, background: panel.color, opacity: 1 - i * 0.15 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Active vs Inactive donut */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <SectionTitle>Active vs Inactive Restaurants</SectionTitle>
        <div className="flex items-center gap-8">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: "Active",   value: data.activeRestaurants },
                  { name: "Inactive", value: data.inactiveRestaurants },
                ]}
                dataKey="value"
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
              >
                <Cell fill={EMERALD} />
                <Cell fill="#E5E7EB" />
              </Pie>
              <Tooltip formatter={(v: any) => fmtNum(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">Active</span>
              <span className="ml-auto font-black text-gray-900">{fmtNum(data.activeRestaurants)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-gray-200" />
              <span className="text-sm text-gray-600">Inactive</span>
              <span className="ml-auto font-black text-gray-400">{fmtNum(data.inactiveRestaurants)}</span>
            </div>
            <div className="border-t pt-3 flex items-center gap-3">
              <span className="text-sm text-gray-500">Active rate</span>
              <span className="ml-auto font-black text-emerald-600">
                {data.totalRestaurants > 0
                  ? ((data.activeRestaurants / data.totalRestaurants) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}