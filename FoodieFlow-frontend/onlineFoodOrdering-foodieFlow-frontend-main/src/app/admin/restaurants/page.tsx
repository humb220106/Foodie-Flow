"use client"

import { useEffect, useState, useCallback } from "react"
import AdminSidebar from "@/components/layout/AdminSidebar"
import RestaurantDetailsModal from "@/components/admin/RestaurantDetailsModal"
import { adminService } from "@/lib/api/admin-service"
import type { AdminRestaurant, PagedResult } from "@/lib/api/admin-service"
import {
  Search,
  Store,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Trash2,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  TrendingUp,
} from "lucide-react"

const PAGE_SIZE = 20

export default function RestaurantManagementPage() {
  // ── Data ──
  const [result, setResult] = useState<PagedResult<AdminRestaurant> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Pagination ──
  const [page, setPage] = useState(1)

  // ── Client-side filter (on current page) ──
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [ratingFilter, setRatingFilter] = useState<"all" | "4.5" | "4.0" | "3.0">("all")

  // ── Modal / actions ──
  const [selectedRestaurant, setSelectedRestaurant] = useState<AdminRestaurant | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Load ──
  const loadRestaurants = useCallback(async (targetPage = 1) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await adminService.getRestaurants(targetPage, PAGE_SIZE)
      setResult(data)
      setPage(targetPage)
    } catch (err: any) {
      setError(err?.message || "Failed to load restaurants.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRestaurants(1)
  }, [loadRestaurants])

  // ── Client-side filter on current page ──
  const filteredRestaurants = (result?.items ?? []).filter((r) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      r.restaurantName.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q) ||
      r.ownerUsername.toLowerCase().includes(q)

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? r.isActive : !r.isActive)

    const matchesRating =
      ratingFilter === "all" ||
      r.averageRating >= parseFloat(ratingFilter)

    return matchesSearch && matchesStatus && matchesRating
  })

  // ── Stats (from all-page totalCount + current page items) ──
  const totalCount = result?.totalCount ?? 0
  const activeCount = (result?.items ?? []).filter((r) => r.isActive).length
  const topRatedCount = (result?.items ?? []).filter((r) => r.averageRating >= 4.5).length

  // ── Delete ──
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" permanently? This is a soft-delete (the record stays in the database but becomes inactive).`)) return
    try {
      setDeletingId(id)
      await adminService.deleteRestaurant(id)
      await loadRestaurants(page)
    } catch (err: any) {
      alert(err?.message || "Failed to delete restaurant.")
    } finally {
      setDeletingId(null)
    }
  }

  // ── After modal update ──
  async function handleRestaurantUpdated() {
    setSelectedRestaurant(null)
    await loadRestaurants(page)
  }

  // ── Pagination helpers ──
  const totalPages = result?.totalPages ?? 1

  function pageNumbers() {
    const pages: (number | null)[] = []
    const delta = 2
    const left = Math.max(2, page - delta)
    const right = Math.min(totalPages - 1, page + delta)
    pages.push(1)
    if (left > 2) pages.push(null)
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push(null)
    if (totalPages > 1) pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: "256px" }}>
        {/* ── Header ── */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Restaurant Management</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                {totalCount > 0
                  ? `${totalCount.toLocaleString()} restaurants on the platform`
                  : "Manage and monitor all restaurant partners"}
              </p>
            </div>
            <button
              onClick={() => loadRestaurants(page)}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* ── Summary Cards ── */}
        <div className="border-b border-gray-200 bg-white px-8 py-5">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              icon={<Store className="h-6 w-6 text-[#FF4D00]" />}
              iconBg="bg-orange-100"
              label="Total Restaurants (all pages)"
              value={totalCount.toLocaleString()}
            />
            <SummaryCard
              icon={<CheckCircle className="h-6 w-6 text-emerald-600" />}
              iconBg="bg-emerald-100"
              label="Active (this page)"
              value={activeCount.toString()}
            />
            <SummaryCard
              icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
              iconBg="bg-purple-100"
              label="Top Rated 4.5+ (this page)"
              value={topRatedCount.toString()}
            />
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="border-b border-gray-200 bg-white px-8 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, city, country or owner…"
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#FF4D00]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Rating */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as typeof ratingFilter)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#FF4D00]"
            >
              <option value="all">All Ratings</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.0">3.0+ Stars</option>
            </select>

            {/* Clear */}
            {(searchQuery || statusFilter !== "all" || ratingFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setRatingFilter("all")
                }}
                className="text-sm font-semibold text-[#FF4D00] hover:opacity-70"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Main ── */}
        <main className="p-8">
          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
              <button onClick={() => loadRestaurants(page)} className="ml-auto underline">
                Retry
              </button>
            </div>
          )}

          {/* Skeleton */}
          {isLoading && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-gray-100 px-6 py-4">
                  <div className="h-12 w-12 rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 rounded bg-gray-200" />
                    <div className="h-3 w-24 rounded bg-gray-100" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-gray-200" />
                  <div className="h-6 w-16 rounded-full bg-gray-200" />
                  <div className="h-8 w-20 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          {!isLoading && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {[
                        "Restaurant",
                        "Owner",
                        "Location",
                        "Rating",
                        "Orders",
                        "Revenue",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRestaurants.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <Store className="mx-auto h-12 w-12 text-gray-200" />
                          <p className="mt-3 text-sm font-semibold text-gray-400">
                            {searchQuery || statusFilter !== "all" || ratingFilter !== "all"
                              ? "No restaurants match your filters on this page."
                              : "No restaurants found."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredRestaurants.map((r) => (
                        <tr key={r.id} className="hover:bg-orange-50/20 transition-colors">
                          {/* Restaurant */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {r.restaurantLogo ? (
                                <img
                                  src={r.restaurantLogo}
                                  alt={r.restaurantName}
                                  className="h-12 w-12 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-black text-white">
                                  {r.restaurantName.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate max-w-[160px]">
                                  {r.restaurantName}
                                </p>
                                <p className="text-xs text-gray-400 font-mono">
                                  #{r.id.substring(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Owner */}
                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-700">{r.ownerUsername}</p>
                          </td>

                          {/* Location */}
                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-700">{r.city}</p>
                            <p className="text-xs text-gray-400">{r.country}</p>
                          </td>

                          {/* Rating */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">★</span>
                              <span className="text-sm font-bold text-gray-900">
                                {r.averageRating.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({r.reviewCount})
                              </span>
                            </div>
                          </td>

                          {/* Orders */}
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-900">
                              {r.totalOrders.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {r.totalListings} listings
                            </p>
                          </td>

                          {/* Revenue */}
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-900">
                              ${r.totalRevenue.toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                r.isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {r.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedRestaurant(r)}
                                title="View / edit details"
                                className="rounded-lg p-2 text-gray-500 hover:bg-orange-50 hover:text-[#FF4D00] transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id, r.restaurantName)}
                                disabled={deletingId === r.id}
                                title="Delete restaurant"
                                className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                              >
                                {deletingId === r.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {!isLoading && result && result.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                  <p className="text-sm text-gray-600">
                    Page <span className="font-bold">{page}</span> of{" "}
                    <span className="font-bold">{totalPages}</span> —{" "}
                    <span className="font-bold">{totalCount.toLocaleString()}</span> total
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => loadRestaurants(page - 1)}
                      disabled={page === 1 || isLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {pageNumbers().map((p, i) =>
                      p === null ? (
                        <span key={`gap-${i}`} className="px-1 text-gray-400">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => loadRestaurants(p)}
                          disabled={isLoading}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition ${
                            p === page
                              ? "bg-[#FF4D00] text-white"
                              : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => loadRestaurants(page + 1)}
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

      {/* ── Modal ── */}
      {selectedRestaurant && (
        <RestaurantDetailsModal
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
          onRestaurantUpdated={handleRestaurantUpdated}
        />
      )}
    </div>
  )
}

// ── Summary card ──
function SummaryCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`rounded-xl ${iconBg} p-3 shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  )
}