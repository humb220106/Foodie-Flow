"use client"

import { useState } from "react"
import {
  X,
  Mail,
  Phone,
  Shield,
  Trash2,
  Calendar,
  Clock,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
} from "lucide-react"
import { adminService, AdminUser } from "@/lib/api/admin-service"

interface UserDetailsModalProps {
  user: AdminUser
  onClose: () => void
  onUserUpdated: () => void
}

type Tab = "profile" | "security" | "roles"

export default function UserDetailsModal({
  user,
  onClose,
  onUserUpdated,
}: UserDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [isActive, setIsActive] = useState(user.isActive)
  const [reason, setReason] = useState("")
  const [roleInput, setRoleInput] = useState("")
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [isAssigningRole, setIsAssigningRole] = useState(false)
  const [isDeletingUser, setIsDeletingUser] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  async function handleSaveStatus() {
    try {
      setIsSavingStatus(true)
      await adminService.updateUserStatus(user.id, isActive, reason || undefined)
      showFeedback("success", `Account ${isActive ? "activated" : "deactivated"} successfully.`)
      setReason("")
      onUserUpdated()
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to update status.")
      setIsActive(user.isActive) // revert
    } finally {
      setIsSavingStatus(false)
    }
  }

  async function handleAssignRole() {
    if (!roleInput.trim()) return
    try {
      setIsAssigningRole(true)
      await adminService.assignUserRole(user.id, roleInput.trim())
      showFeedback("success", `Role "${roleInput.trim()}" assigned successfully.`)
      setRoleInput("")
      onUserUpdated()
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to assign role.")
    } finally {
      setIsAssigningRole(false)
    }
  }

  async function handleDeleteUser() {
    if (
      !confirm(
        `Delete "${user.username}" permanently? This action cannot be undone.`
      )
    )
      return
    try {
      setIsDeletingUser(true)
      await adminService.deleteUser(user.id)
      onUserUpdated()
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to delete user.")
      setIsDeletingUser(false)
    }
  }

  const statusChanged = isActive !== user.isActive

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-black text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Feedback Banner ── */}
        {feedback && (
          <div
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            {feedback.message}
          </div>
        )}

        {/* ── Profile Summary ── */}
        <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-black text-white shrink-0">
            {getInitials(user.username)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-gray-900 truncate">{user.username}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {user.roles.map((r) => (
                <span
                  key={r}
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    r === "Admin"
                      ? "bg-purple-100 text-purple-700"
                      : r === "RestaurantOwner"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
              user.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {user.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-200 bg-white px-6">
          {(["profile", "security", "roles"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`mr-6 pb-3 pt-3 text-sm font-bold capitalize transition ${
                activeTab === tab
                  ? "border-b-2 border-[#FF4D00] text-[#FF4D00]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <>
              {/* Basic info grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={user.phoneNumber || "—"}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Joined"
                  value={new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Last Login"
                  value={
                    user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never"
                  }
                />
                <InfoRow
                  icon={<Globe className="h-4 w-4" />}
                  label="Last Login IP"
                  value={user.lastLoginIp || "—"}
                />
                <InfoRow
                  icon={<CheckCircle className="h-4 w-4" />}
                  label="Email Verified"
                  value={user.emailVerified ? "Yes" : "No"}
                  valueColor={user.emailVerified ? "text-emerald-600" : "text-red-600"}
                />
              </div>

              {/* Account Status Toggle */}
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Account Status</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Toggle to activate or deactivate this account
                    </p>
                  </div>
                  <button
                    onClick={() => setIsActive((v) => !v)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      isActive ? "bg-[#FF4D00]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        isActive ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {statusChanged && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason (optional, stored in audit log)"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
                    />
                    <button
                      onClick={handleSaveStatus}
                      disabled={isSavingStatus}
                      className="w-full rounded-lg bg-[#FF4D00] py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {isSavingStatus
                        ? "Saving…"
                        : `Confirm — ${isActive ? "Activate" : "Deactivate"} Account`}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === "security" && (
            <>
              <div className="space-y-3">
                {/* Email Verification */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Email Verification</p>
                      <p className="text-xs text-gray-500">
                        {user.emailVerified
                          ? "Email address has been verified"
                          : "Email address is not yet verified"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      user.emailVerified
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {user.emailVerified ? "Verified" : "Unverified"}
                  </span>
                </div>

                {/* Locked Out */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Account Locked</p>
                      <p className="text-xs text-gray-500">
                        {user.isLockedOut
                          ? "Account is currently locked out"
                          : "Account is not locked"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      user.isLockedOut
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {user.isLockedOut ? "Locked" : "Unlocked"}
                  </span>
                </div>

                {/* Failed Login Attempts */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Failed Login Attempts</p>
                      <p className="text-xs text-gray-500">
                        Number of consecutive failed logins
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      user.failedLoginAttempts > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {user.failedLoginAttempts}
                  </span>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-900">Delete User Account</p>
                    <p className="text-xs text-red-700 mt-1">
                      Permanently removes this user and all their data. This cannot be undone.
                      You cannot delete your own account.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteUser}
                    disabled={isDeletingUser}
                    className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeletingUser ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── ROLES TAB ── */}
          {activeTab === "roles" && (
            <>
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">Current Roles</p>
                <div className="flex flex-wrap gap-2">
                  {user.roles.length > 0 ? (
                    user.roles.map((r) => (
                      <span
                        key={r}
                        className={`rounded-full px-3 py-1.5 text-sm font-bold ${
                          r === "Admin"
                            ? "bg-purple-100 text-purple-700"
                            : r === "RestaurantOwner"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        <Shield className="inline h-3.5 w-3.5 mr-1" />
                        {r}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No roles assigned.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                <p className="text-sm font-bold text-gray-900">Assign a New Role</p>
                <p className="text-xs text-gray-500">
                  Valid roles: <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">Admin</code>{" "}
                  <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">Customer</code>{" "}
                  <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">RestaurantOwner</code>
                </p>
                <div className="flex gap-2">
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
                  >
                    <option value="">Select role…</option>
                    <option value="Admin">Admin</option>
                    <option value="Customer">Customer</option>
                    <option value="RestaurantOwner">RestaurantOwner</option>
                  </select>
                  <button
                    onClick={handleAssignRole}
                    disabled={!roleInput || isAssigningRole}
                    className="rounded-lg bg-[#FF4D00] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
                  >
                    {isAssigningRole ? "Assigning…" : "Assign"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-200 px-6 py-4">
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

// ── Helper component ──
function InfoRow({
  icon,
  label,
  value,
  valueColor = "text-gray-900",
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <p className={`text-sm font-bold ${valueColor}`}>{value}</p>
      </div>
    </div>
  )
}