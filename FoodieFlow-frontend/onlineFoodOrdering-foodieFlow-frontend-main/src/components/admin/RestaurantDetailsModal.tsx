"use client"

import { useState } from "react"
import {
  X,
  MapPin,
  Phone,
  Star,
  Trash2,
  Store,
  ShoppingBag,
  DollarSign,
  MessageSquare,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Hash,
} from "lucide-react"
import { adminService } from "@/lib/api/admin-service"
import type { AdminRestaurant } from "@/lib/api/admin-service"

interface RestaurantDetailsModalProps {
  restaurant: AdminRestaurant
  onClose: () => void
  onRestaurantUpdated: () => void
}

type Tab = "overview" | "stats" | "status"

export default function RestaurantDetailsModal({
  restaurant,
  onClose,
  onRestaurantUpdated,
}: RestaurantDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  // Status tab state
  const [isActive, setIsActive] = useState(restaurant.isActive)
  const [reason, setReason] = useState("")
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Feedback
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  const statusChanged = isActive !== restaurant.isActive

  async function handleSaveStatus() {
    try {
      setIsSavingStatus(true)
      await adminService.updateRestaurantStatus(
        restaurant.id,
        isActive,
        reason || undefined
      )
      showFeedback(
        "success",
        `Restaurant ${isActive ? "activated" : "deactivated"} successfully.`
      )
      setReason("")
      onRestaurantUpdated()
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to update status.")
      setIsActive(restaurant.isActive) // revert optimistic
    } finally {
      setIsSavingStatus(false)
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Soft-delete "${restaurant.restaurantName}"? The restaurant record will remain in the database but become inactive.`
      )
    )
      return
    try {
      setIsDeleting(true)
      await adminService.deleteRestaurant(restaurant.id)
      onRestaurantUpdated()
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to delete restaurant.")
      setIsDeleting(false)
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(v)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

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
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
          <h2 className="text-lg font-black text-gray-900">Restaurant Details</h2>
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
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold shrink-0 ${
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

        {/* ── Restaurant Summary Hero ── */}
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 shrink-0">
          <div className="flex items-center gap-4">
            {restaurant.restaurantLogo ? (
              <img
                src={restaurant.restaurantLogo}
                alt={restaurant.restaurantName}
                className="h-14 w-14 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-black text-white">
                {restaurant.restaurantName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-gray-900 truncate">
                {restaurant.restaurantName}
              </p>
              <p className="text-sm text-gray-500 truncate">
                /{restaurant.restaurantSlug}
              </p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    restaurant.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {restaurant.isActive ? "Active" : "Inactive"}
                </span>
                <span className="flex items-center gap-1 text-xs text-yellow-600 font-semibold">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {restaurant.averageRating.toFixed(1)} ({restaurant.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-200 bg-white px-6 shrink-0">
          {(["overview", "stats", "status"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`mr-6 pb-3 pt-3 text-sm font-bold capitalize transition ${
                activeTab === tab
                  ? "border-b-2 border-[#FF4D00] text-[#FF4D00]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "status" ? "Status & Actions" : tab}
            </button>
          ))}
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <>
              {/* Description */}
              {restaurant.restaurantDescription && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                    Description
                  </p>
                  <p className="text-sm text-gray-700">
                    {restaurant.restaurantDescription}
                  </p>
                </div>
              )}

              {/* Info grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Owner"
                  value={restaurant.ownerUsername}
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={restaurant.phoneNumber}
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Address"
                  value={restaurant.address}
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="City"
                  value={`${restaurant.city}, ${restaurant.country}`}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Joined"
                  value={formatDate(restaurant.createdAt)}
                />
                <InfoRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Restaurant ID"
                  value={restaurant.id.substring(0, 16) + "…"}
                  mono
                />
                <InfoRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Owner User ID"
                  value={restaurant.userId.substring(0, 16) + "…"}
                  mono
                />
                <InfoRow
                  icon={<Store className="h-4 w-4" />}
                  label="Total Listings"
                  value={restaurant.totalListings.toString()}
                />
              </div>
            </>
          )}

          {/* ── STATS TAB ── */}
          {activeTab === "stats" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard
                  icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
                  iconBg="bg-emerald-100"
                  label="Total Revenue"
                  value={formatCurrency(restaurant.totalRevenue)}
                />
                <StatCard
                  icon={<ShoppingBag className="h-5 w-5 text-blue-600" />}
                  iconBg="bg-blue-100"
                  label="Total Orders"
                  value={restaurant.totalOrders.toLocaleString()}
                />
                <StatCard
                  icon={<Store className="h-5 w-5 text-[#FF4D00]" />}
                  iconBg="bg-orange-100"
                  label="Dish Listings"
                  value={restaurant.totalListings.toLocaleString()}
                />
                <StatCard
                  icon={<MessageSquare className="h-5 w-5 text-purple-600" />}
                  iconBg="bg-purple-100"
                  label="Total Reviews"
                  value={restaurant.reviewCount.toLocaleString()}
                />
                <StatCard
                  icon={<Star className="h-5 w-5 text-yellow-500" />}
                  iconBg="bg-yellow-100"
                  label="Average Rating"
                  value={`${restaurant.averageRating.toFixed(2)} / 5.00`}
                />
              </div>

              {/* Rating bar */}
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="mb-2 text-xs font-semibold text-gray-500 uppercase">
                  Rating Breakdown
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-gray-900">
                    {restaurant.averageRating.toFixed(1)}
                  </span>
                  <div className="flex-1">
                    <div className="h-2.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2.5 rounded-full bg-yellow-400"
                        style={{
                          width: `${(restaurant.averageRating / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Based on {restaurant.reviewCount.toLocaleString()} reviews
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STATUS TAB ── */}
          {activeTab === "status" && (
            <>
              {/* Toggle */}
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Restaurant Status</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Toggle to activate or deactivate this restaurant
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
                      placeholder="Reason (optional — stored in audit log)"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
                    />
                    <button
                      onClick={handleSaveStatus}
                      disabled={isSavingStatus}
                      className="w-full rounded-lg bg-[#FF4D00] py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {isSavingStatus
                        ? "Saving…"
                        : `Confirm — ${isActive ? "Activate" : "Deactivate"} Restaurant`}
                    </button>
                  </div>
                )}
              </div>

              {/* Status info */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-600">Current status</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      restaurant.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {restaurant.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-600">Slug</span>
                  <span className="font-mono text-xs text-gray-700">
                    {restaurant.restaurantSlug}
                  </span>
                </div>
              </div>

              {/* Danger zone */}
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-900">
                      Soft-Delete Restaurant
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      Sets the restaurant to inactive. The record is preserved in the database.
                    </p>
                  </div>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-200 px-6 py-4 shrink-0">
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

// ── Helpers ──

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <span className="mt-0.5 text-gray-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400">{label}</p>
        <p className={`text-sm font-bold text-gray-900 truncate ${mono ? "font-mono text-xs" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

function StatCard({
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
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
      <div className={`rounded-lg ${iconBg} p-2.5 shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <p className="text-lg font-black text-gray-900">{value}</p>
      </div>
    </div>
  )
}