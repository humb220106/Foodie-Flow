"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import AdminSidebar from "@/components/layout/AdminSidebar"
import UserDetailsModal from "@/components/admin/UserDetailsModal"
import { adminService } from "@/lib/api/admin-service"
import type { AdminUser, PagedResult } from "@/lib/api/admin-service"
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Eye,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
} from "lucide-react"

const PAGE_SIZE = 20

export default function UserManagementPage() {
  // ── Data state ──
  const [result, setResult] = useState<PagedResult<AdminUser> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Pagination ──
  const [page, setPage] = useState(1)

  // ── Client-side search / filter (applied on top of paged data) ──
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "Admin" | "Customer" | "RestaurantOwner">(
    "all"
  )
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  // ── Modal ──
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  // ── Deletion ──
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)

  // ── Load users from API ──
  const loadUsers = useCallback(async (targetPage = 1) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await adminService.getUsers(targetPage, PAGE_SIZE)
      setResult(data)
      setPage(targetPage)
    } catch (err: any) {
      setError(err?.message || "Failed to load users.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers(1)
  }, [loadUsers])

  // ── Client-side filter on current page ──
  const filteredUsers = (result?.items ?? []).filter((user) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      user.username.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.phoneNumber ?? "").toLowerCase().includes(q)

    const matchesRole =
      roleFilter === "all" || user.roles.includes(roleFilter)

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? user.isActive : !user.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

  // ── Stats derived from current page ──
  const pageItems = result?.items ?? []
  const activeCount = pageItems.filter((u) => u.isActive).length
  const lockedCount = pageItems.filter((u) => u.isLockedOut).length

  // ── Delete ──
  async function handleDeleteUser(userId: string, username: string) {
    if (!confirm(`Delete "${username}" permanently? This cannot be undone.`)) return
    try {
      setDeletingId(userId)
      await adminService.deleteUser(userId)
      await loadUsers(page)
    } catch (err: any) {
      alert(err?.message || "Failed to delete user.")
    } finally {
      setDeletingId(null)
    }
  }

  // ── After modal action ──
  async function handleUserUpdated() {
    setSelectedUser(null)
    await loadUsers(page)
  }

  // ── Pagination helpers ──
  const totalPages = result?.totalPages ?? 1
  const totalCount = result?.totalCount ?? 0

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

  // ── Role badge color ──
  function roleBadge(role: string) {
    if (role === "Admin") return "bg-purple-100 text-purple-700"
    if (role === "RestaurantOwner") return "bg-orange-100 text-orange-700"
    return "bg-blue-100 text-blue-700"
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: "256px" }}>
        {/* ── Page Header ── */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">User Management</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                {totalCount > 0
                  ? `${totalCount.toLocaleString()} registered users`
                  : "Manage all registered users"}
              </p>
            </div>
            <button
              onClick={() => loadUsers(page)}
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
              icon={<Users className="h-6 w-6 text-blue-600" />}
              iconBg="bg-blue-100"
              label="Total Users (all pages)"
              value={totalCount.toLocaleString()}
            />
            <SummaryCard
              icon={<UserCheck className="h-6 w-6 text-emerald-600" />}
              iconBg="bg-emerald-100"
              label="Active (this page)"
              value={activeCount.toString()}
            />
            <SummaryCard
              icon={<ShieldAlert className="h-6 w-6 text-red-600" />}
              iconBg="bg-red-100"
              label="Locked Out (this page)"
              value={lockedCount.toString()}
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
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email or phone…"
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
              />
            </div>

            {/* Role filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#FF4D00]"
              >
                <option value="all">All Roles</option>
                <option value="Customer">Customer</option>
                <option value="RestaurantOwner">Restaurant Owner</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#FF4D00]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Clear filters */}
            {(searchQuery || roleFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setRoleFilter("all")
                  setStatusFilter("all")
                }}
                className="text-sm font-semibold text-[#FF4D00] hover:opacity-70"
              >
                Clear filters
              </button>
            )}

            {/* Filtered count */}
            {(searchQuery || roleFilter !== "all" || statusFilter !== "all") && (
              <span className="text-sm text-gray-500">
                {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""} on this page
              </span>
            )}
          </div>
        </div>

        {/* ── Main Content ── */}
        <main className="p-8">
          {/* Error state */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
              <button
                onClick={() => loadUsers(page)}
                className="ml-auto underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 border-b border-gray-100 px-6 py-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 rounded bg-gray-200" />
                      <div className="h-3 w-48 rounded bg-gray-100" />
                    </div>
                    <div className="h-6 w-16 rounded-full bg-gray-200" />
                    <div className="h-6 w-16 rounded-full bg-gray-200" />
                    <div className="h-8 w-20 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          {!isLoading && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {["User", "Email", "Phone", "Roles", "Joined", "Status", "Actions"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-500"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <Users className="mx-auto h-12 w-12 text-gray-200" />
                          <p className="mt-3 text-sm font-semibold text-gray-400">
                            {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                              ? "No users match your filters on this page."
                              : "No users found."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="group hover:bg-orange-50/30 transition-colors"
                        >
                          {/* User */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-bold text-white">
                                {user.username.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{user.username}</p>
                                <p className="text-xs text-gray-400 font-mono">
                                  #{user.id.substring(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm text-gray-700">{user.email}</p>
                              {user.emailVerified && (
                                <span title="Email verified" className="text-emerald-500">✓</span>
                              )}
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-600">
                              {user.phoneNumber || <span className="text-gray-300">—</span>}
                            </p>
                          </td>

                          {/* Roles */}
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((r) => (
                                <span
                                  key={r}
                                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${roleBadge(r)}`}
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Joined */}
                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-600">
                              {new Date(user.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  user.isActive
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {user.isActive ? "Active" : "Inactive"}
                              </span>
                              {user.isLockedOut && (
                                <span className="w-fit rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                                  Locked
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedUser(user)}
                                title="View details"
                                className="rounded-lg p-2 text-gray-500 hover:bg-orange-50 hover:text-[#FF4D00] transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                disabled={deletingId === user.id}
                                title="Delete user"
                                className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                              >
                                {deletingId === user.id ? (
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
                    <span className="font-bold">{totalCount.toLocaleString()}</span> total users
                  </p>

                  <div className="flex items-center gap-1.5">
                    {/* Prev */}
                    <button
                      onClick={() => loadUsers(page - 1)}
                      disabled={page === 1 || isLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page numbers */}
                    {pageNumbers().map((p, i) =>
                      p === null ? (
                        <span key={`gap-${i}`} className="px-1 text-gray-400">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => loadUsers(p)}
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

                    {/* Next */}
                    <button
                      onClick={() => loadUsers(page + 1)}
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
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUserUpdated={handleUserUpdated}
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
      <div className={`rounded-xl ${iconBg} p-3`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  )
}