// "use client"

// import {
//   DollarSign,
//   ShoppingBag,
//   Store,
//   Users,
//   Clock,
//   Star,
//   TrendingUp,
//   UserPlus,
// } from "lucide-react"
// import type { DashboardStats } from "@/lib/api/admin-service"

// interface StatCardProps {
//   title: string
//   value: string | number
//   sub?: string
//   icon: React.ReactNode
//   iconBgColor: string
//   iconColor: string
// }

// function StatCard({ title, value, sub, icon, iconBgColor, iconColor }: StatCardProps) {
//   return (
//     <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
//       <div className="flex items-start justify-between">
//         <div className="flex-1">
//           <p className="text-sm font-semibold text-gray-500">{title}</p>
//           <h3 className="mt-2 text-3xl font-black text-gray-900">{value}</h3>
//           {sub && <p className="mt-1 text-xs font-medium text-gray-400">{sub}</p>}
//         </div>
//         <div className={`rounded-xl ${iconBgColor} p-3`}>
//           <div className={iconColor}>{icon}</div>
//         </div>
//       </div>
//     </div>
//   )
// }

// interface AdminStatsCardsProps {
//   stats: DashboardStats
// }

// export default function AdminStatsCards({ stats }: AdminStatsCardsProps) {
//   const formatCurrency = (value: number) =>
//     new Intl.NumberFormat("en-NG", {
//       style: "currency",
//       currency: "NGN",
//       minimumFractionDigits: 0,
//     }).format(value)

//   const formatNumber = (value: number) =>
//     new Intl.NumberFormat("en-US").format(value)

//   return (
//     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
//       {/* Total Revenue */}
//       <StatCard
//         title="Total Revenue"
//         value={formatCurrency(stats.totalRevenue)}
//         sub={`Today: ${formatCurrency(stats.revenueToday)}`}
//         icon={<DollarSign className="h-6 w-6" />}
//         iconBgColor="bg-emerald-100"
//         iconColor="text-emerald-600"
//       />

//       {/* Total Orders */}
//       <StatCard
//         title="Total Orders"
//         value={formatNumber(stats.totalOrders)}
//         sub={`Today: ${stats.ordersToday} orders`}
//         icon={<ShoppingBag className="h-6 w-6" />}
//         iconBgColor="bg-blue-100"
//         iconColor="text-blue-600"
//       />

//       {/* Active Restaurants */}
//       <StatCard
//         title="Active Restaurants"
//         value={stats.activeRestaurants}
//         sub={`${stats.totalRestaurants} total`}
//         icon={<Store className="h-6 w-6" />}
//         iconBgColor="bg-orange-100"
//         iconColor="text-[#FF4D00]"
//       />

//       {/* Total Users */}
//       <StatCard
//         title="Total Users"
//         value={formatNumber(stats.totalUsers)}
//         sub={`${stats.newUsersToday} new today`}
//         icon={<Users className="h-6 w-6" />}
//         iconBgColor="bg-purple-100"
//         iconColor="text-purple-600"
//       />

//       {/* Pending Orders */}
//       <StatCard
//         title="Pending Orders"
//         value={stats.pendingOrders}
//         sub="Awaiting action"
//         icon={<Clock className="h-6 w-6" />}
//         iconBgColor="bg-amber-100"
//         iconColor="text-amber-600"
//       />

//       {/* Total Dishes */}
//       <StatCard
//         title="Total Dishes"
//         value={formatNumber(stats.totalDishes)}
//         sub="Across all restaurants"
//         icon={<TrendingUp className="h-6 w-6" />}
//         iconBgColor="bg-pink-100"
//         iconColor="text-pink-600"
//       />

//       {/* Total Reviews */}
//       <StatCard
//         title="Total Reviews"
//         value={formatNumber(stats.totalReviews)}
//         sub="All-time"
//         icon={<Star className="h-6 w-6" />}
//         iconBgColor="bg-yellow-100"
//         iconColor="text-yellow-600"
//       />

//       {/* New Users Today */}
//       <StatCard
//         title="New Users Today"
//         value={stats.newUsersToday}
//         sub="Registered today (UTC)"
//         icon={<UserPlus className="h-6 w-6" />}
//         iconBgColor="bg-teal-100"
//         iconColor="text-teal-600"
//       />
//     </div>
//   )
// }




"use client"

import {
  DollarSign, ShoppingBag, Users, Store,
  Clock, Star, TrendingUp, UserCheck,
} from "lucide-react"
import type { DashboardStats } from "@/lib/api/admin-service"

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 0,
  }).format(v ?? 0)
}

function StatCard({
  title, value, sub, icon, iconBg, iconColor, alert,
}: {
  title: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  alert?: boolean
}) {
  return (
    <div className={`rounded-xl border bg-white p-6 shadow-sm ${alert ? "border-orange-300" : "border-gray-200"}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-black text-gray-900 truncate">{value}</p>
          {sub && (
            <p className={`mt-1.5 text-xs font-medium ${alert ? "text-orange-600" : "text-gray-400"}`}>{sub}</p>
          )}
        </div>
        <div className={`${iconBg} ${iconColor} rounded-xl p-3 shrink-0 ml-3`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function AdminStatsCards({ stats }: { stats: DashboardStats }) {
  // Guard — if stats somehow isn't loaded yet, show zeros
  const s = stats ?? {} as DashboardStats

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={formatCurrency(s.totalRevenue ?? 0)}
        sub={`Today: ${formatCurrency(s.revenueToday ?? 0)}`}
        icon={<DollarSign className="h-6 w-6" />}
        iconBg="bg-emerald-100"
        iconColor="text-emerald-600"
      />

      <StatCard
        title="Total Orders"
        value={(s.totalOrders ?? 0).toLocaleString()}
        sub={`Today: ${(s.ordersToday ?? 0).toLocaleString()} orders`}
        icon={<ShoppingBag className="h-6 w-6" />}
        iconBg="bg-blue-100"
        iconColor="text-blue-600"
      />

      <StatCard
        title="Total Users"
        value={(s.totalUsers ?? 0).toLocaleString()}
        sub={`New today: ${(s.newUsersToday ?? 0).toLocaleString()}`}
        icon={<Users className="h-6 w-6" />}
        iconBg="bg-violet-100"
        iconColor="text-violet-600"
      />

      <StatCard
        title="Restaurants"
        value={(s.totalRestaurants ?? 0).toLocaleString()}
        sub={`Active: ${(s.activeRestaurants ?? 0).toLocaleString()}`}
        icon={<Store className="h-6 w-6" />}
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
      />

      <StatCard
        title="Pending Orders"
        value={(s.pendingOrders ?? 0).toLocaleString()}
        sub={(s.pendingOrders ?? 0) > 0 ? "Needs attention" : "All caught up"}
        icon={<Clock className="h-6 w-6" />}
        iconBg="bg-orange-100"
        iconColor="text-orange-600"
        alert={(s.pendingOrders ?? 0) > 0}
      />

      <StatCard
        title="Total Reviews"
        value={(s.totalReviews ?? 0).toLocaleString()}
        sub="Across all restaurants"
        icon={<Star className="h-6 w-6" />}
        iconBg="bg-yellow-100"
        iconColor="text-yellow-600"
      />

      <StatCard
        title="Total Dishes"
        value={(s.totalDishes ?? 0).toLocaleString()}
        sub="Across all restaurants"
        icon={<TrendingUp className="h-6 w-6" />}
        iconBg="bg-rose-100"
        iconColor="text-rose-600"
      />

      <StatCard
        title="Active Restaurants"
        value={(s.activeRestaurants ?? 0).toLocaleString()}
        sub={`of ${(s.totalRestaurants ?? 0).toLocaleString()} total`}
        icon={<UserCheck className="h-6 w-6" />}
        iconBg="bg-teal-100"
        iconColor="text-teal-600"
      />
    </div>
  )
}