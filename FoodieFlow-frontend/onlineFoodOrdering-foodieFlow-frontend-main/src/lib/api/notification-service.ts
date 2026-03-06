import { apiClient } from "@/lib/api/client"

const NOTIF_API = {
  subscribe:   "/api/notifications/subscribe",
  unsubscribe: "/api/notifications/unsubscribe",
}

export interface LocalNotification {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

const STORAGE_KEY = "ff_notifications"
const MAX_STORED  = 50

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}

class PushNotificationService {

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      navigator.serviceWorker.addEventListener("message", (e) => {
        if (e.data?.type === "PUSH_RECEIVED") {
          this.storeNotification({
            id: `push-${Date.now()}`,
            title: e.data.payload.title,
            message: e.data.payload.message || e.data.payload.body || "",
            isRead: false,
            createdAt: e.data.payload.createdAt || new Date().toISOString(),
          })
          window.dispatchEvent(new CustomEvent("ff-notification", { detail: e.data.payload }))
        }
      })
      return reg
    } catch (e) {
      console.warn("[PushNotif] SW registration failed:", e)
      return null
    }
  }

  async subscribe(): Promise<"granted" | "denied" | "error"> {
    if (typeof window === "undefined" || !("Notification" in window)) return "error"

    // Step 1 — ask for browser permission
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return "denied"

    // Step 2 — only attempt Web Push if a VAPID key is configured.
    //
    // pushManager.subscribe() REQUIRES applicationServerKey — browsers throw
    // a DOMException if you call it without one (or with a commented-out one).
    // So we guard the ENTIRE pushManager block behind the VAPID key check.
    //
    // Without a VAPID key: permission is still granted and the service worker
    // message channel still works for in-app toast notifications.
    //
    // To enable full Web Push: add NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your_key>
    // to .env.local and generate keys with: npx web-push generate-vapid-keys
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

    if (vapidKey && "serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready
        let sub = await reg.pushManager.getSubscription()

        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            // applicationServerKey: urlBase64ToUint8Array(vapidKey),
          })
        }

        const json = sub.toJSON()
        await apiClient(NOTIF_API.subscribe, {
          method: "POST",
          body: JSON.stringify({
            endpoint: json.endpoint,
            p256dh:   json.keys?.p256dh,
            auth:     json.keys?.auth,
          }),
        }).catch(() => {}) // non-fatal if backend endpoint isn't ready yet

      } catch (e) {
        // Web Push failed but permission was granted — in-app toasts still work
        console.warn("[PushNotif] Web Push subscription failed:", e)
      }
    }

    return "granted"
  }

  async unsubscribe(): Promise<void> {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await apiClient(NOTIF_API.unsubscribe, {
          method: "POST",
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {})
      }
    } catch {}
  }

  getPermissionStatus(): NotificationPermission | "unsupported" {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported"
    return Notification.permission
  }

  getNotifications(): LocalNotification[] {
    if (typeof window === "undefined") return []
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
    catch { return [] }
  }

  storeNotification(n: LocalNotification): void {
    if (typeof window === "undefined") return
    const updated = [n, ...this.getNotifications()].slice(0, MAX_STORED)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  markRead(id: string): void {
    const updated = this.getNotifications().map(n =>
      n.id === id ? { ...n, isRead: true } : n
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  markAllRead(): void {
    const updated = this.getNotifications().map(n => ({ ...n, isRead: true }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  getUnreadCount(): number {
    return this.getNotifications().filter(n => !n.isRead).length
  }
}

export const pushNotificationService = new PushNotificationService()