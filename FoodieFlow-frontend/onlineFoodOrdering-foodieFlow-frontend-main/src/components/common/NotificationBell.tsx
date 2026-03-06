"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Bell, BellOff, CheckCheck, X, Trash2, Loader2 } from "lucide-react"
import { pushNotificationService, LocalNotification } from "@/lib/api/notification-service"

// ── time helper ───────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return "just now"
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// ── Toast component (shows when push arrives while tab is open) ───────────────
function PushToast({ notif, onClose }: { notif: LocalNotification; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex max-w-sm items-start gap-3 rounded-2xl border border-orange-200 bg-white p-4 shadow-2xl shadow-orange-100 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF4D00]">
        <Bell className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-gray-900">{notif.title}</p>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{notif.message}</p>
      </div>
      <button onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NotificationBell() {
  const [open, setOpen]                 = useState(false)
  const [notifications, setNotifs]      = useState<LocalNotification[]>([])
  const [permission, setPermission]     = useState<NotificationPermission | "unsupported">("default")
  const [subscribing, setSubscribing]   = useState(false)
  const [toast, setToast]               = useState<LocalNotification | null>(null)
  const dropRef                         = useRef<HTMLDivElement>(null)

  const reload = useCallback(() => {
    setNotifs(pushNotificationService.getNotifications())
  }, [])

  // Boot: register SW, load inbox, set permission
  useEffect(() => {
    void pushNotificationService.registerServiceWorker()
    setPermission(pushNotificationService.getPermissionStatus())
    reload()

    // Listen for live pushes (SW sends message to tab)
    function onPush(e: Event) {
      const detail = (e as CustomEvent<LocalNotification>).detail
      setToast({ id: `toast-${Date.now()}`, title: detail.title, message: (detail as any).message || (detail as any).body || "", isRead: false, createdAt: new Date().toISOString() })
      reload()
    }
    window.addEventListener("ff-notification", onPush)
    return () => window.removeEventListener("ff-notification", onPush)
  }, [reload])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  async function handleEnable() {
    setSubscribing(true)
    const result = await pushNotificationService.subscribe()
    setPermission(pushNotificationService.getPermissionStatus())
    setSubscribing(false)
  }

  function handleMarkRead(id: string) {
    pushNotificationService.markRead(id)
    reload()
  }

  function handleMarkAll() {
    pushNotificationService.markAllRead()
    reload()
  }

  function handleClear() {
    pushNotificationService.clearAll()
    reload()
  }

  const unread = notifications.filter(n => !n.isRead).length

  return (
    <>
      {/* In-app toast */}
      {toast && <PushToast notif={toast} onClose={() => setToast(null)} />}

      <div className="relative" ref={dropRef}>
        {/* Bell button */}
        <button
          onClick={() => { setOpen(o => !o); if (!open) reload() }}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-[#FF4D00] transition-colors"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF4D00] text-[9px] font-black text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-12 z-50 w-[340px] rounded-2xl border border-gray-200 bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#FF4D00]" />
                <h3 className="text-sm font-black text-gray-900">Notifications</h3>
                {unread > 0 && (
                  <span className="rounded-full bg-[#FF4D00] px-1.5 py-0.5 text-[9px] font-black text-white">{unread}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button onClick={handleMarkAll} className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Mark all read">
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={handleClear} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Clear all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Permission banner */}
            {permission === "default" && (
              <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3">
                <p className="text-xs font-black text-orange-900">🔔 Enable push notifications</p>
                <p className="mt-0.5 text-xs text-orange-700">Get instant alerts from FoodieFlow even when this tab is closed.</p>
                <button
                  onClick={handleEnable}
                  disabled={subscribing}
                  className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#FF4D00] px-3 py-1.5 text-xs font-black text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {subscribing ? <><Loader2 className="h-3 w-3 animate-spin" /> Enabling…</> : "Enable Now"}
                </button>
              </div>
            )}

            {permission === "denied" && (
              <div className="border-b border-red-100 bg-red-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <BellOff className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <div>
                    <p className="text-xs font-bold text-red-800">Notifications blocked</p>
                    <p className="text-xs text-red-600">Go to browser Settings → Site Settings → Notifications to allow them.</p>
                  </div>
                </div>
              </div>
            )}

            {permission === "granted" && notifications.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                  <Bell className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="mt-3 text-xs font-black text-gray-400">You're all caught up!</p>
                <p className="mt-0.5 text-[10px] text-gray-300">Admin messages will appear here</p>
              </div>
            )}

            {permission === "default" && notifications.length === 0 && (
              <div className="flex flex-col items-center py-8 text-center">
                <Bell className="h-10 w-10 text-gray-200" />
                <p className="mt-2 text-xs text-gray-400">No notifications yet</p>
              </div>
            )}

            {/* Notification list */}
            {notifications.length > 0 && (
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={`flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-orange-50/60" : ""}`}
                  >
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.isRead ? "bg-gray-100" : "bg-[#FF4D00]"}`}>
                      <Bell className={`h-4 w-4 ${n.isRead ? "text-gray-400" : "text-white"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black leading-snug ${n.isRead ? "text-gray-500" : "text-gray-900"}`}>{n.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 leading-snug">{n.message}</p>
                      <p className="mt-1 text-[10px] text-gray-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#FF4D00]" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}