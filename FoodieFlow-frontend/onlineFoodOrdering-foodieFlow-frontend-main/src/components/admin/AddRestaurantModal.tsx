"use client"

import { useState } from "react"
import {
  X,
  Info,
  UserPlus,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react"
import { adminService } from "@/lib/api/admin-service"

interface AddRestaurantModalProps {
  onClose: () => void
  onSuccess: () => void
}

/**
 * Onboard a new restaurant partner.
 *
 * The backend API does not have a direct "admin creates restaurant" endpoint.
 * The real flow is:
 *  1. A user registers on the platform (or already exists).
 *  2. Admin assigns the "RestaurantOwner" role to that user via
 *     POST /api/admin/users/:userId/roles
 *  3. The user then completes their restaurant profile through their own
 *     restaurant dashboard.
 *
 * This modal handles step 2 — assigning the RestaurantOwner role to an
 * existing user by their User ID.
 */
export default function AddRestaurantModal({ onClose, onSuccess }: AddRestaurantModalProps) {
  const [userId, setUserId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message })
    if (type === "success") {
      setTimeout(() => {
        onSuccess()
      }, 2000)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = userId.trim()
    if (!trimmed) return

    try {
      setIsSubmitting(true)
      setFeedback(null)

      // Assign RestaurantOwner role to the user
      await adminService.assignUserRole(trimmed, "RestaurantOwner")

      showFeedback(
        "success",
        `"RestaurantOwner" role assigned successfully. The user can now create and manage their restaurant profile.`
      )
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to assign role. Check the User ID and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
              <UserPlus className="h-5 w-5 text-[#FF4D00]" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">
                Onboard Restaurant Partner
              </h2>
              <p className="text-xs text-gray-500">Assign RestaurantOwner role to a user</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ── How it works ── */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800 space-y-1">
                <p className="font-bold">How restaurant onboarding works</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700">
                  <li>The prospective owner registers a regular account on the platform.</li>
                  <li>
                    You (admin) assign the <code className="rounded bg-blue-100 px-1">RestaurantOwner</code> role to their user account using their User ID below.
                  </li>
                  <li>
                    They log in and complete their restaurant profile (name, address, menu, etc.) through the restaurant dashboard.
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* ── Feedback banner ── */}
          {feedback && (
            <div
              className={`flex items-start gap-3 rounded-xl p-4 text-sm font-semibold ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                User ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 font-mono text-sm outline-none focus:border-[#FF4D00] focus:bg-white focus:ring-2 focus:ring-[#FF4D00]/20"
                required
              />
              <p className="mt-1.5 text-xs text-gray-400">
                Find the User ID in{" "}
                <a
                  href="/admin/users"
                  className="font-semibold text-[#FF4D00] hover:opacity-70 inline-flex items-center gap-0.5"
                >
                  User Management
                  <ExternalLink className="h-3 w-3" />
                </a>
                . The user must have already registered.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !userId.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF4D00] py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Assigning…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Assign RestaurantOwner Role
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}