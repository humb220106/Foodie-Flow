"use client"

import { useState } from "react"
import AdminSidebar from "@/components/layout/AdminSidebar"
import { adminService, PushNotificationRequest } from "@/lib/api/admin-service"
import {
  Bell, Users, Store, Globe, Send,
  Loader2, CheckCircle, AlertCircle,
  Megaphone, Info,
} from "lucide-react"

// ── recipient options ─────────────────────────────────────────────────────────

const RECIPIENTS = [
  {
    key: "all" as const,
    label: "Everyone",
    description: "All customers and restaurant owners",
    icon: Globe,
    color: "text-[#FF4D00]",
    bg: "bg-orange-50",
    border: "border-orange-200",
    activeBorder: "border-[#FF4D00]",
    activeRing: "ring-[#FF4D00]/20",
  },
  {
    key: "customers" as const,
    label: "Customers",
    description: "Only registered customers",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    activeBorder: "border-blue-500",
    activeRing: "ring-blue-500/20",
  },
  {
    key: "restaurants" as const,
    label: "Restaurants",
    description: "Only restaurant owners",
    icon: Store,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    activeBorder: "border-emerald-500",
    activeRing: "ring-emerald-500/20",
  },
] as const

// ── quick templates ───────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    label: "New Feature",
    title: "🚀 New Feature Available",
    message: "We've added exciting new features to improve your experience. Update the app to check them out!",
    for: "all" as const,
  },
  {
    label: "Maintenance",
    title: "🛠️ Scheduled Maintenance",
    message: "FoodieFlow will undergo scheduled maintenance tonight from 2:00 AM – 4:00 AM. We apologise for any inconvenience.",
    for: "all" as const,
  },
  {
    label: "Weekend Promo",
    title: "🎉 Weekend Special Offers",
    message: "Enjoy exclusive weekend deals from your favourite restaurants! Open the app to discover today's offers.",
    for: "customers" as const,
  },
  {
    label: "Boost Orders",
    title: "📈 Tips to Boost Your Sales",
    message: "Check your dashboard for personalised tips on increasing orders and improving your restaurant's visibility.",
    for: "restaurants" as const,
  },
]

// ── component ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [recipientType, setRecipientType] =
    useState<PushNotificationRequest["recipientType"]>("all")
  const [title, setTitle]     = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<{ msg: string; count: number } | null>(null)
  const [error, setError]     = useState<string | null>(null)

  // history (client-side only — just the current session)
  const [history, setHistory] = useState<
    Array<{ recipientType: string; title: string; message: string; sentAt: string; recipientCount: number }>
  >([])

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    setTitle(t.title)
    setMessage(t.message)
    setRecipientType(t.for)
    setSuccess(null)
    setError(null)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim())   { setError("Title is required."); return }
    if (!message.trim()) { setError("Message is required."); return }
    setError(null)

    try {
      setSending(true)
      const res = await adminService.sendPushNotification({
        recipientType,
        title: title.trim(),
        message: message.trim(),
      })

      const count = res.recipientCount ?? 0
      setSuccess({ msg: res.message ?? "Notification sent!", count })
      setHistory(h => [
        { recipientType, title: title.trim(), message: message.trim(), sentAt: new Date().toISOString(), recipientCount: count },
        ...h.slice(0, 9), // keep last 10
      ])
      setTitle("")
      setMessage("")
    } catch (e: any) {
      setError(e?.message || "Failed to send notification.")
    } finally {
      setSending(false)
    }
  }

  const selectedRecipient = RECIPIENTS.find(r => r.key === recipientType)!
  const charLeft = 250 - message.length

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <Bell className="h-5 w-5 text-[#FF4D00]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Push Notifications</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Send broadcast notifications to users and restaurants
              </p>
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="mx-auto max-w-3xl space-y-6">

            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Notifications are delivered as push notifications to all users with the app installed and notifications enabled.
            </div>

            {/* Success */}
            {success && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-bold">{success.msg}</p>
                  {success.count > 0 && (
                    <p className="mt-0.5 text-emerald-600">
                      Delivered to <span className="font-bold">{success.count.toLocaleString()}</span> recipients.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {/* Compose card */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-[#FF4D00]" />
                  <h2 className="text-base font-black text-gray-900">Compose Notification</h2>
                </div>
              </div>

              <form onSubmit={handleSend} className="p-6 space-y-6">

                {/* Recipient type */}
                <div>
                  <label className="mb-3 block text-sm font-bold text-gray-700">
                    Send To <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {RECIPIENTS.map(r => {
                      const Icon = r.icon
                      const active = recipientType === r.key
                      return (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => setRecipientType(r.key)}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all hover:shadow-sm ${
                            active
                              ? `${r.activeBorder} ring-2 ${r.activeRing} ${r.bg}`
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.bg}`}>
                            <Icon className={`h-5 w-5 ${r.color}`} />
                          </div>
                          <div>
                            <p className={`text-sm font-black ${active ? r.color : "text-gray-700"}`}>
                              {r.label}
                            </p>
                            <p className="mt-0.5 text-[10px] text-gray-400">{r.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Quick templates */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Quick Templates
                    <span className="ml-1 text-xs font-normal text-gray-400">(click to autofill)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-[#FF4D00] hover:bg-orange-50 hover:text-[#FF4D00] transition-colors"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-700">
                    Notification Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={100}
                    placeholder="e.g. 🎉 Weekend Special Offers"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
                    required
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">{title.length}/100</p>
                </div>

                {/* Message */}
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-700">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    maxLength={250}
                    placeholder="Write your notification message here…"
                    className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
                    required
                  />
                  <p className={`mt-1 text-right text-xs ${charLeft < 30 ? "text-amber-500 font-semibold" : "text-gray-400"}`}>
                    {charLeft} characters remaining
                  </p>
                </div>

                {/* Preview */}
                {(title || message) && (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase text-gray-400 tracking-wide">Preview</p>
                    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF4D00] shadow-sm">
                        <Bell className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {title || <span className="text-gray-400 font-normal italic">Title here…</span>}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                          {message || <span className="italic">Message here…</span>}
                        </p>
                        <p className="mt-1 text-[10px] text-gray-400">
                          To: <span className="font-semibold">{selectedRecipient.label}</span> · just now
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Send button */}
                <button
                  type="submit"
                  disabled={sending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF4D00] py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 hover:opacity-95 disabled:opacity-50 transition-opacity"
                >
                  {sending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                    : <><Send className="h-4 w-4" /> Send Notification</>}
                </button>
              </form>
            </div>

            {/* Sent history (session only) */}
            {history.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="text-base font-black text-gray-900">Sent This Session</h2>
                  <p className="text-xs text-gray-400 mt-0.5">History clears when you leave this page</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {history.map((h, i) => {
                    const rec = RECIPIENTS.find(r => r.key === h.recipientType)
                    const Icon = rec?.icon ?? Bell
                    return (
                      <div key={i} className="flex items-start gap-4 px-6 py-4">
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${rec?.bg ?? "bg-gray-100"}`}>
                          <Icon className={`h-4 w-4 ${rec?.color ?? "text-gray-500"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{h.title}</p>
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{h.message}</p>
                          <p className="mt-1 text-[10px] text-gray-400">
                            {rec?.label} ·{" "}
                            {h.recipientCount > 0 && <span className="font-semibold">{h.recipientCount.toLocaleString()} recipients · </span>}
                            {new Date(h.sentAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                          Sent
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}