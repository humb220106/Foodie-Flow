"use client"

import { useState } from "react"
import { X, Send, Loader2, Users, Store, UserCheck } from "lucide-react"

interface PushNotificationModalProps {
  onClose: () => void
  onSuccess: () => void
}

type RecipientType = "all" | "customers" | "restaurants"

export default function PushNotificationModal({
  onClose,
  onSuccess,
}: PushNotificationModalProps) {
  const [recipientType, setRecipientType] = useState<RecipientType>("all")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !message.trim()) {
      setError("Please fill in both title and message")
      return
    }

    try {
      setIsSending(true)

      // TODO: Call API to send push notification
      // await adminService.sendPushNotification({
      //   recipientType,
      //   title: title.trim(),
      //   message: message.trim(),
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const recipientCount = getRecipientCount(recipientType)
      alert(`Push notification sent successfully to ${recipientCount} ${recipientType}!`)
      onSuccess()
    } catch (err: any) {
      console.error("Failed to send notification:", err)
      setError(err.message || "Failed to send notification. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  function getRecipientCount(type: RecipientType): number {
    // Mock data - replace with actual counts from API
    switch (type) {
      case "all":
        return 12085 // Total users
      case "customers":
        return 12000 // Customers only
      case "restaurants":
        return 85 // Restaurants only
      default:
        return 0
    }
  }

  const recipientCount = getRecipientCount(recipientType)

  // Prevent closing when clicking inside the modal
  function handleModalClick(e: React.MouseEvent) {
    e.stopPropagation()
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between sticky top-0 bg-white pb-4 border-b z-10">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-3">
              <Send className="h-6 w-6 text-[#FF4D00]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">
                Push Notification
              </h2>
              <p className="text-sm text-gray-500">Send alerts to users</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSend} className="space-y-5">
          {/* Recipient Type */}
          <div>
            <label className="mb-3 block text-sm font-bold text-gray-700">
              Send To
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* All Users */}
              <button
                type="button"
                onClick={() => setRecipientType("all")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition ${
                  recipientType === "all"
                    ? "border-[#FF4D00] bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Users
                  className={`h-6 w-6 ${
                    recipientType === "all" ? "text-[#FF4D00]" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-xs font-bold ${
                    recipientType === "all" ? "text-[#FF4D00]" : "text-gray-600"
                  }`}
                >
                  All Users
                </span>
                <span className="text-xs text-gray-500">12,085</span>
              </button>

              {/* Customers Only */}
              <button
                type="button"
                onClick={() => setRecipientType("customers")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition ${
                  recipientType === "customers"
                    ? "border-[#FF4D00] bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <UserCheck
                  className={`h-6 w-6 ${
                    recipientType === "customers" ? "text-[#FF4D00]" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-xs font-bold ${
                    recipientType === "customers" ? "text-[#FF4D00]" : "text-gray-600"
                  }`}
                >
                  Customers
                </span>
                <span className="text-xs text-gray-500">12,000</span>
              </button>

              {/* Restaurants Only */}
              <button
                type="button"
                onClick={() => setRecipientType("restaurants")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition ${
                  recipientType === "restaurants"
                    ? "border-[#FF4D00] bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Store
                  className={`h-6 w-6 ${
                    recipientType === "restaurants" ? "text-[#FF4D00]" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-xs font-bold ${
                    recipientType === "restaurants" ? "text-[#FF4D00]" : "text-gray-600"
                  }`}
                >
                  Restaurants
                </span>
                <span className="text-xs text-gray-500">85</span>
              </button>
            </div>
          </div>

          {/* Notification Title */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Notification Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., New Feature Released!"
              maxLength={60}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {title.length}/60 characters
            </p>
          </div>

          {/* Notification Message */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your notification message here..."
              rows={4}
              maxLength={200}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {message.length}/200 characters
            </p>
          </div>

          {/* Preview */}
          {(title || message) && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-bold text-gray-600">Preview:</p>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                {title && (
                  <p className="font-bold text-gray-900">{title}</p>
                )}
                {message && (
                  <p className="mt-1 text-sm text-gray-600">{message}</p>
                )}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs text-blue-900">
              <strong>Recipients:</strong> This notification will be sent to{" "}
              <strong>{recipientCount.toLocaleString()}</strong>{" "}
              {recipientType === "all"
                ? "users"
                : recipientType === "customers"
                  ? "customers"
                  : "restaurant owners"}
              .
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF4D00] px-4 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}