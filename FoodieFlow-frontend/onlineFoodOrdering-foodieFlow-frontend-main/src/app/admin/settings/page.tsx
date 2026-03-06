"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminSidebar from "@/components/layout/AdminSidebar"
import {
  User, Mail, Phone, Lock, Bell,
  Shield, Key, Eye, EyeOff, Crown,
  CheckCircle, AlertCircle, Loader2,
  Calendar, BadgeCheck, XCircle,
  RefreshCw, AtSign, Fingerprint,
} from "lucide-react"
import { adminService, AdminUser } from "@/lib/api/admin-service"
import { authService } from "@/lib/api/auth-service"
import { getAccessToken, clearTokens } from "@/lib/api/tokens"

// ── helpers ───────────────────────────────────────────────────────────────────

function parseJwt(token: string): any {
  try {
    const b = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(
      decodeURIComponent(
        atob(b).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
      )
    )
  } catch { return null }
}

/** Extract user ID from JWT — handles both standard and ASP.NET Core claim formats */
function getUserIdFromToken(token: string): string | null {
  const p = parseJwt(token)
  if (!p) return null
  // ASP.NET Core stores ID under the full nameidentifier claim URI or "sub" or "nameid"
  return (
    p["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
    p.sub ||
    p.nameid ||
    p.userId ||
    p.id ||
    null
  )
}

/** Anyone who has the "Admin" role in their roles array is an admin */
function checkIsAdmin(user: AdminUser): boolean {
  return user.roles.some(r =>
    r.toLowerCase() === "admin" ||
    r.toLowerCase() === "superadmin" ||
    r.toLowerCase() === "super_admin"
  )
}

function getInitials(name: string) {
  const parts = name.trim().split(" ")
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

function formatDate(iso: string | null) {
  if (!iso) return "Never"
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

// ── component ─────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications">("profile")

  const [user, setUser]         = useState<AdminUser | null>(null)
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [currentPw, setCurrentPw]   = useState("")
  const [newPw, setNewPw]           = useState("")
  const [confirmPw, setConfirmPw]   = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwSaving, setPwSaving]       = useState(false)

  const [emailNotifs, setEmailNotifs]   = useState(true)
  const [orderAlerts, setOrderAlerts]   = useState(true)
  const [systemAlerts, setSystemAlerts] = useState(false)

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)

  function flash(type: "success" | "error", msg: string) {
    if (type === "success") { setSuccessMsg(msg); setErrorMsg(null) }
    else                    { setErrorMsg(msg); setSuccessMsg(null) }
    setTimeout(() => { setSuccessMsg(null); setErrorMsg(null) }, 4500)
  }

  useEffect(() => { void load() }, [])

  async function load() {
    try {
      setLoading(true)
      setLoadError(null)

      const token = getAccessToken()
      if (!token) { router.push("/login"); return }

      const userId = getUserIdFromToken(token)
      if (!userId) throw new Error("Could not read user ID from token — please log in again.")

      const data = await adminService.getUserById(userId)
      setUser(data)
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load profile.")
    } finally {
      setLoading(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) { flash("error", "New passwords do not match."); return }
    if (newPw.length < 8)    { flash("error", "Password must be at least 8 characters."); return }
    try {
      setPwSaving(true)
      await authService.changePassword({ currentPassword: currentPw, newPassword: newPw })
      flash("success", "Password changed successfully!")
      setCurrentPw(""); setNewPw(""); setConfirmPw("")
    } catch (e: any) {
      flash("error", e?.message || "Failed to change password.")
    } finally {
      setPwSaving(false)
    }
  }

  // Simple: anyone with Admin role is an admin
  const isAdmin = user ? checkIsAdmin(user) : false

  const TABS = [
    { key: "profile" as const,       label: "Account Profile" },
    { key: "security" as const,      label: "Security" },
    { key: "notifications" as const, label: "Notifications" },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Settings</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Manage your account and security preferences
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        <main className="p-8">

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
              <p className="mt-1 text-sm text-gray-400">
                Make sure you are logged in and your session is valid.
              </p>
              <button
                onClick={load}
                className="mt-4 rounded-lg bg-[#FF4D00] px-5 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !loadError && user && (
            <div className="mx-auto max-w-4xl">

              {/* ── Profile hero card ── */}
              <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                {/* Top row: avatar + info + status */}
                <div className="flex items-center gap-5">

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-[#FF4D00] text-2xl font-black text-white shadow-lg shadow-orange-200">
                      {getInitials(user.username)}
                    </div>
                    {isAdmin && (
                      <div className="absolute -bottom-1.5 -right-1.5 rounded-full bg-white p-1 shadow-md">
                        <Crown className="h-4 w-4 text-[#FF4D00]" />
                      </div>
                    )}
                  </div>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-gray-900">{user.username}</h2>

                      {/* Role badges */}
                      {user.roles.map(r => (
                        <span
                          key={r}
                          className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-[#FF4D00]"
                        >
                          {r}
                        </span>
                      ))}

                      {/* Email verified */}
                      {user.emailVerified
                        ? <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <BadgeCheck className="h-3 w-3" /> Verified
                          </span>
                        : <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            <XCircle className="h-3 w-3" /> Unverified Email
                          </span>
                      }

                      {/* Locked */}
                      {user.isLockedOut && (
                        <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          🔒 Locked Out
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{user.email}</p>
                  </div>

                  {/* Account active status */}
                  <div className={`shrink-0 rounded-xl border px-4 py-2.5 text-center ${
                    user.isActive ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                  }`}>
                    <p className={`text-sm font-black ${user.isActive ? "text-emerald-700" : "text-red-700"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </p>
                    <p className={`text-[10px] ${user.isActive ? "text-emerald-600" : "text-red-600"}`}>
                      Account
                    </p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 md:grid-cols-4">
                  {[
                    { icon: <Mail className="h-4 w-4" />,     label: "Email",      value: user.email },
                    { icon: <Phone className="h-4 w-4" />,    label: "Phone",      value: user.phoneNumber || "Not set" },
                    { icon: <Calendar className="h-4 w-4" />, label: "Joined",     value: formatDate(user.createdAt) },
                    { icon: <Calendar className="h-4 w-4" />, label: "Last Login", value: formatDate(user.lastLoginAt) },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        {item.icon}
                        <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-gray-700">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Security metrics */}
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <AtSign className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">Last Login IP</span>
                    </div>
                    <p className="mt-1 font-mono text-sm font-semibold text-gray-700">
                      {user.lastLoginIp || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Shield className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">Failed Logins</span>
                    </div>
                    <p className={`mt-1 text-sm font-semibold ${user.failedLoginAttempts > 0 ? "text-red-600" : "text-gray-700"}`}>
                      {user.failedLoginAttempts} attempt{user.failedLoginAttempts !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Lock className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">Account Lock</span>
                    </div>
                    <p className={`mt-1 text-sm font-semibold ${user.isLockedOut ? "text-red-600" : "text-emerald-600"}`}>
                      {user.isLockedOut ? "Locked out" : "Not locked"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Tabs ── */}
              <div className="mb-5 flex gap-1 border-b border-gray-200">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-4 py-3 text-sm font-bold transition-colors ${
                      activeTab === t.key
                        ? "border-b-2 border-[#FF4D00] text-[#FF4D00]"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Alerts */}
              {successMsg && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
                </div>
              )}

              {/* ── Profile tab ── */}
              {activeTab === "profile" && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="font-black text-gray-900">Account Information</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your profile details as stored on the server
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {[
                      { icon: <User className="h-4 w-4 text-gray-400" />,       label: "Username",    value: user.username },
                      { icon: <Mail className="h-4 w-4 text-gray-400" />,       label: "Email",       value: user.email },
                      { icon: <Phone className="h-4 w-4 text-gray-400" />,      label: "Phone",       value: user.phoneNumber || "Not provided" },
                      { icon: <Fingerprint className="h-4 w-4 text-gray-400" />,label: "User ID",     value: user.id },
                      { icon: <Shield className="h-4 w-4 text-gray-400" />,     label: "Role(s)",     value: user.roles.join(", ") },
                      { icon: <BadgeCheck className="h-4 w-4 text-gray-400" />, label: "Email Status",value: user.emailVerified ? "Verified ✅" : "Unverified ⚠️" },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="mb-1.5 block text-sm font-bold text-gray-700">{f.label}</label>
                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                          {f.icon}
                          <span className="truncate text-sm text-gray-700">{f.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    <span className="font-bold">Note:</span> Username, email and phone can only be updated by a Super Admin through the User Management panel.
                  </div>
                </div>
              )}

              {/* ── Security tab ── */}
              {activeTab === "security" && (
                <div className="space-y-4">

                  {/* Change password */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-orange-50 p-2.5">
                        <Key className="h-5 w-5 text-[#FF4D00]" />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900">Change Password</h3>
                        <p className="text-sm text-gray-500">Update your login password</p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                      {[
                        { label: "Current Password", value: currentPw, set: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
                        { label: "New Password",      value: newPw,     set: setNewPw,     show: showNew,     toggle: () => setShowNew(v => !v) },
                        { label: "Confirm Password",  value: confirmPw, set: setConfirmPw, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
                      ].map(f => (
                        <div key={f.label}>
                          <label className="mb-1.5 block text-sm font-bold text-gray-700">{f.label}</label>
                          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/20 transition-all">
                            <Lock className="h-4 w-4 shrink-0 text-gray-400" />
                            <input
                              type={f.show ? "text" : "password"}
                              value={f.value}
                              onChange={e => f.set(e.target.value)}
                              placeholder={f.label}
                              className="flex-1 bg-transparent text-sm outline-none"
                              required
                            />
                            <button type="button" onClick={f.toggle} className="text-gray-400 hover:text-gray-600">
                              {f.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700 space-y-1">
                        <p className="font-bold">Password requirements:</p>
                        <p>• At least 8 characters &nbsp;• Uppercase &amp; lowercase &nbsp;• A number &nbsp;• A special character</p>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                          className="flex items-center gap-2 rounded-lg bg-[#FF4D00] px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-95 disabled:opacity-50"
                        >
                          {pwSaving
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</>
                            : "Update Password"
                          }
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Login activity */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-50 p-2.5">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900">Login Activity</h3>
                        <p className="text-sm text-gray-500">Recent account access information</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {[
                        { label: "Last Login",      value: formatDate(user.lastLoginAt),  highlight: false },
                        { label: "Last Login IP",   value: user.lastLoginIp || "—",       highlight: false, mono: true },
                        { label: "Failed Attempts", value: `${user.failedLoginAttempts} attempt${user.failedLoginAttempts !== 1 ? "s" : ""}`, highlight: user.failedLoginAttempts > 0 },
                        { label: "Account Status",  value: user.isLockedOut ? "🔒 Locked out" : "✅ Normal", highlight: user.isLockedOut },
                      ].map(item => (
                        <div key={item.label} className="rounded-xl bg-gray-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{item.label}</p>
                          <p className={`mt-1 text-sm font-semibold ${item.highlight ? "text-red-600" : "text-gray-700"} ${(item as any).mono ? "font-mono" : ""}`}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Notifications tab ── */}
              {activeTab === "notifications" && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="font-black text-gray-900">Notification Preferences</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Control how you receive admin alerts (saved in your browser)
                  </p>

                  <div className="mt-5 space-y-3">
                    {[
                      {
                        label: "Email Notifications",
                        desc: "Receive email updates about orders, users and system events",
                        val: emailNotifs, set: setEmailNotifs,
                      },
                      {
                        label: "Order Alerts",
                        desc: "Get notified when new orders are placed or status changes",
                        val: orderAlerts, set: setOrderAlerts,
                      },
                      {
                        label: "System Alerts",
                        desc: "Critical system events and security warnings",
                        val: systemAlerts, set: setSystemAlerts,
                      },
                    ].map(n => (
                      <div key={n.label} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-orange-100 p-2">
                            <Bell className="h-4 w-4 text-[#FF4D00]" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{n.label}</p>
                            <p className="text-xs text-gray-500">{n.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => n.set(!n.val)}
                          className={`relative h-6 w-11 rounded-full transition-colors ${n.val ? "bg-[#FF4D00]" : "bg-gray-300"}`}
                        >
                          <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${n.val ? "right-0.5" : "left-0.5"}`} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-xs text-gray-400">
                    These preferences are saved locally in your browser only.
                  </p>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  )
}