"use client"

import { useEffect, useState, useCallback } from "react"
import AdminSidebar from "@/components/layout/AdminSidebar"
import { adminService, AdminUser } from "@/lib/api/admin-service"
import {
  Shield, Crown, UserPlus, Search, RefreshCw,
  Loader2, AlertCircle, CheckCircle, MoreVertical,
  Trash2, UserX, UserCheck, ShieldOff, ShieldCheck,
  Mail, Phone, Calendar, AtSign, BadgeCheck, XCircle,
  X, ChevronLeft, ChevronRight,
} from "lucide-react"

// ── helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const p = name.trim().split(" ")
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function formatDate(iso: string | null) {
  if (!iso) return "Never"
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function isAdminRole(user: AdminUser) {
  return user.roles.some(r =>
    r.toLowerCase() === "admin" ||
    r.toLowerCase() === "superadmin" ||
    r.toLowerCase() === "super_admin"
  )
}

function roleBadgeColor(role: string) {
  const r = role.toLowerCase()
  if (r === "superadmin" || r === "super_admin") return "bg-orange-100 text-[#FF4D00] border-orange-200"
  if (r === "admin")      return "bg-purple-50 text-purple-700 border-purple-200"
  if (r === "restaurant") return "bg-blue-50 text-blue-700 border-blue-200"
  return "bg-gray-100 text-gray-600 border-gray-200"
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
interface ConfirmProps {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onCancel }: ConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${danger ? "bg-red-100" : "bg-orange-100"}`}>
            <AlertCircle className={`h-5 w-5 ${danger ? "text-red-600" : "text-[#FF4D00]"}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-black text-white transition-opacity hover:opacity-90 ${
              danger ? "bg-red-600" : "bg-[#FF4D00]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Promote Modal ─────────────────────────────────────────────────────────────
interface PromoteModalProps {
  onSubmit: (userId: string) => void
  onClose: () => void
  allUsers: AdminUser[]
  loading: boolean
}

function PromoteModal({ onSubmit, onClose, allUsers, loading }: PromoteModalProps) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<AdminUser | null>(null)

  const nonAdmins = allUsers.filter(u =>
    !isAdminRole(u) &&
    (u.username.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
              <UserPlus className="h-5 w-5 text-[#FF4D00]" />
            </div>
            <div>
              <h3 className="font-black text-gray-900">Promote to Admin</h3>
              <p className="text-xs text-gray-400">Search and select a user to grant admin access</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={e => { setSearch(e.target.value); setSelected(null) }}
              placeholder="Search by username or email…"
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
            />
          </div>

          {/* User list */}
          <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-gray-100 bg-gray-50 p-2">
            {nonAdmins.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                {search ? "No users match your search" : "All users are already admins"}
              </p>
            ) : (
              nonAdmins.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    selected?.id === u.id
                      ? "bg-orange-50 border border-[#FF4D00]"
                      : "bg-white border border-transparent hover:border-gray-200"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-500 text-xs font-black text-white">
                    {getInitials(u.username)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{u.username}</p>
                    <p className="truncate text-xs text-gray-400">{u.email}</p>
                  </div>
                  <div className="flex gap-1">
                    {u.roles.map(r => (
                      <span key={r} className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${roleBadgeColor(r)}`}>{r}</span>
                    ))}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Selected preview */}
          {selected && (
            <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <p className="text-xs font-bold text-orange-800">
                Promoting <span className="text-[#FF4D00]">{selected.username}</span> will give them full admin access to the panel.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            disabled={!selected || loading}
            onClick={() => selected && onSubmit(selected.id)}
            className="flex items-center gap-2 rounded-lg bg-[#FF4D00] px-5 py-2 text-sm font-black text-white disabled:opacity-50 hover:opacity-90"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Promoting…</> : "Promote to Admin"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Admin Card ────────────────────────────────────────────────────────────────
interface AdminCardProps {
  user: AdminUser
  onDemote: (u: AdminUser) => void
  onToggleStatus: (u: AdminUser) => void
  onDelete: (u: AdminUser) => void
  actionLoading: string | null
}

function AdminCard({ user, onDemote, onToggleStatus, onDelete, actionLoading }: AdminCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const busy = actionLoading === user.id
  const isSuperAdmin = user.roles.some(r => r.toLowerCase() === "superadmin" || r.toLowerCase() === "super_admin")

  return (
    <div className={`relative rounded-2xl border bg-white p-5 shadow-sm transition-all ${
      !user.isActive ? "border-red-100 opacity-75" : "border-gray-200"
    }`}>
      {/* Top row */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-lg font-black text-white shadow-sm ${
            isSuperAdmin
              ? "bg-gradient-to-br from-orange-400 to-[#FF4D00]"
              : "bg-gradient-to-br from-purple-400 to-purple-600"
          }`}>
            {getInitials(user.username)}
          </div>
          {isSuperAdmin && (
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
              <Crown className="h-3 w-3 text-[#FF4D00]" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-base font-black text-gray-900">{user.username}</h3>
            {user.roles.map(r => (
              <span key={r} className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${roleBadgeColor(r)}`}>{r}</span>
            ))}
            {!user.isActive && (
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Inactive</span>
            )}
            {user.isLockedOut && (
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">🔒 Locked</span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
            <Mail className="h-3 w-3" />
            <span className="truncate">{user.email}</span>
            {user.emailVerified
              ? <BadgeCheck className="ml-1 h-3 w-3 text-emerald-500" />
              : <XCircle className="ml-1 h-3 w-3 text-amber-400" />
            }
          </div>
          {user.phoneNumber && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
              <Phone className="h-3 w-3" />
              <span>{user.phoneNumber}</span>
            </div>
          )}
        </div>

        {/* Actions menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-10 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
              {/* Toggle active */}
              <button
                onClick={() => { setMenuOpen(false); onToggleStatus(user) }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                {user.isActive
                  ? <><UserX className="h-4 w-4 text-amber-500" /> Deactivate</>
                  : <><UserCheck className="h-4 w-4 text-emerald-500" /> Activate</>
                }
              </button>

              {/* Demote (not for super admin) */}
              {!isSuperAdmin && (
                <button
                  onClick={() => { setMenuOpen(false); onDemote(user) }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <ShieldOff className="h-4 w-4 text-orange-500" />
                  Remove Admin Role
                </button>
              )}

              {/* Delete */}
              {!isSuperAdmin && (
                <>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(user) }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-50 pt-4">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Last Login</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-gray-700">{formatDate(user.lastLoginAt)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Joined</p>
          <p className="mt-0.5 text-xs font-semibold text-gray-700">{formatDate(user.createdAt)}</p>
        </div>
        {user.lastLoginIp && (
          <div className="col-span-2 rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Last IP</p>
            <p className="mt-0.5 font-mono text-xs font-semibold text-gray-700">{user.lastLoginIp}</p>
          </div>
        )}
      </div>

      {/* Failed login warning */}
      {user.failedLoginAttempts > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p className="text-xs font-semibold text-amber-700">
            {user.failedLoginAttempts} failed login attempt{user.failedLoginAttempts !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

type Confirm =
  | { type: "demote";  user: AdminUser }
  | { type: "delete";  user: AdminUser }
  | { type: "status";  user: AdminUser }

export default function ManageAdminsPage() {
  const [allUsers, setAllUsers]       = useState<AdminUser[]>([])
  const [admins, setAdmins]           = useState<AdminUser[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadError, setLoadError]     = useState<string | null>(null)
  const [search, setSearch]           = useState("")
  const [page, setPage]               = useState(1)
  const [totalPages, setTotalPages]   = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirm, setConfirm]         = useState<Confirm | null>(null)
  const [showPromote, setShowPromote] = useState(false)
  const [promoteLoading, setPromoteLoading] = useState(false)
  const [flash, setFlash]             = useState<{ type: "success" | "error"; msg: string } | null>(null)

  function showFlash(type: "success" | "error", msg: string) {
    setFlash({ type, msg })
    setTimeout(() => setFlash(null), 4000)
  }

  // Load all users (to get admin list + to populate promote modal)
  const load = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(null)
      // Load multiple pages to get all users
      const first = await adminService.getUsers(1, 100)
      let users = first.items
      // If there are more pages, load them
      for (let p = 2; p <= first.totalPages; p++) {
        const more = await adminService.getUsers(p, 100)
        users = [...users, ...more.items]
      }
      setAllUsers(users)
      const adminList = users.filter(isAdminRole)
      setAdmins(adminList)
      setTotalPages(Math.ceil(adminList.length / 12) || 1)
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load users.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // Filtered + paginated admins
  const filtered = admins.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )
  const pageSize = 12
  const pages = Math.ceil(filtered.length / pageSize) || 1
  const paged  = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Stats
  const active    = admins.filter(u => u.isActive).length
  const superAdmins = admins.filter(u => u.roles.some(r => r.toLowerCase().includes("super"))).length

  // ── actions ──────────────────────────────────────────────────────────────

  async function handleConfirm() {
    if (!confirm) return
    const { user } = confirm
    try {
      setActionLoading(user.id)
      setConfirm(null)

      if (confirm.type === "demote") {
        // Remove admin role by assigning "Customer" (removes admin)
        await adminService.assignUserRole(user.id, "Customer")
        showFlash("success", `${user.username} has been demoted.`)
      } else if (confirm.type === "delete") {
        await adminService.deleteUser(user.id)
        showFlash("success", `${user.username}'s account has been deleted.`)
      } else if (confirm.type === "status") {
        await adminService.updateUserStatus(user.id, !user.isActive)
        showFlash("success", `${user.username} has been ${user.isActive ? "deactivated" : "activated"}.`)
      }

      await load()
    } catch (e: any) {
      showFlash("error", e?.message || "Action failed.")
    } finally {
      setActionLoading(null)
    }
  }

  async function handlePromote(userId: string) {
    try {
      setPromoteLoading(true)
      await adminService.assignUserRole(userId, "Admin")
      setShowPromote(false)
      showFlash("success", "User has been promoted to Admin.")
      await load()
    } catch (e: any) {
      showFlash("error", e?.message || "Failed to promote user.")
    } finally {
      setPromoteLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      {/* Modals */}
      {confirm && (
        <ConfirmModal
          title={
            confirm.type === "demote"  ? `Remove Admin — ${confirm.user.username}` :
            confirm.type === "delete"  ? `Delete Account — ${confirm.user.username}` :
            `${confirm.user.isActive ? "Deactivate" : "Activate"} — ${confirm.user.username}`
          }
          message={
            confirm.type === "demote"  ? "This will remove their Admin role. They will still have a Customer account." :
            confirm.type === "delete"  ? "This will permanently delete the account. This action cannot be undone." :
            `This will ${confirm.user.isActive ? "deactivate" : "activate"} the admin account.`
          }
          confirmLabel={
            confirm.type === "demote"  ? "Remove Admin Role" :
            confirm.type === "delete"  ? "Delete Account" :
            confirm.user.isActive ? "Deactivate" : "Activate"
          }
          danger={confirm.type === "delete"}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {showPromote && (
        <PromoteModal
          allUsers={allUsers}
          loading={promoteLoading}
          onSubmit={handlePromote}
          onClose={() => setShowPromote(false)}
        />
      )}

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                <Shield className="h-5 w-5 text-[#FF4D00]" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">Manage Admins</h1>
                <p className="mt-0.5 text-sm text-gray-500">
                  Control who has admin access to the FoodieFlow panel
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowPromote(true)}
                className="flex items-center gap-2 rounded-lg bg-[#FF4D00] px-4 py-2 text-sm font-black text-white shadow-md shadow-orange-500/25 hover:opacity-90 transition-opacity"
              >
                <UserPlus className="h-4 w-4" />
                Promote User
              </button>
            </div>
          </div>
        </header>

        <main className="p-8">

          {/* Flash */}
          {flash && (
            <div className={`mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
              flash.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {flash.type === "success"
                ? <CheckCircle className="h-4 w-4 shrink-0" />
                : <AlertCircle className="h-4 w-4 shrink-0" />
              }
              {flash.msg}
            </div>
          )}

          {/* Stats */}
          {!loading && !loadError && (
            <div className="mb-6 grid grid-cols-3 gap-4">
              {[
                { label: "Total Admins",  value: admins.length,  icon: <Shield className="h-5 w-5 text-[#FF4D00]" />,   bg: "bg-orange-50"  },
                { label: "Active Admins", value: active,          icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50" },
                { label: "Super Admins",  value: superAdmins,     icon: <Crown className="h-5 w-5 text-purple-600" />,   bg: "bg-purple-50"  },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900">{s.value}</p>
                    <p className="text-sm text-gray-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          {!loading && !loadError && (
            <div className="mb-6 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search admins by name or email…"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
                />
              </div>
              {search && (
                <p className="text-sm text-gray-500">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF4D00]" />
            </div>
          )}

          {/* Error */}
          {!loading && loadError && (
            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-red-200 bg-white py-16 text-center">
              <AlertCircle className="h-12 w-12 text-red-300" />
              <p className="mt-3 font-bold text-red-600">{loadError}</p>
              <button onClick={load} className="mt-4 rounded-lg bg-[#FF4D00] px-5 py-2 text-sm font-bold text-white hover:opacity-90">
                Try Again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !loadError && filtered.length === 0 && (
            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
              <Shield className="h-12 w-12 text-gray-200" />
              <p className="mt-3 font-bold text-gray-400">
                {search ? "No admins match your search" : "No admins yet"}
              </p>
              {!search && (
                <button
                  onClick={() => setShowPromote(true)}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-[#FF4D00] px-5 py-2 text-sm font-bold text-white hover:opacity-90"
                >
                  <UserPlus className="h-4 w-4" /> Promote First Admin
                </button>
              )}
            </div>
          )}

          {/* Admin cards grid */}
          {!loading && !loadError && paged.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {paged.map(user => (
                <AdminCard
                  key={user.id}
                  user={user}
                  actionLoading={actionLoading}
                  onDemote={u => setConfirm({ type: "demote", user: u })}
                  onToggleStatus={u => setConfirm({ type: "status", user: u })}
                  onDelete={u => setConfirm({ type: "delete", user: u })}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                    page === p
                      ? "bg-[#FF4D00] text-white shadow-md"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}