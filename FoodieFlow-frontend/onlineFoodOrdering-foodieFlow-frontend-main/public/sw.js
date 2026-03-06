// FoodieFlow Service Worker — handles incoming Web Push notifications

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()))

// ── Receive push from backend ─────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let payload = { title: "FoodieFlow", message: "You have a new notification." }

  if (event.data) {
    try { payload = event.data.json() }
    catch { payload = { title: "FoodieFlow", message: event.data.text() } }
  }

  const title = payload.title || "FoodieFlow"
  const options = {
    body: payload.message || payload.body || "",
    icon: "/next.svg",
    badge: "/next.svg",
    tag: `foodieflow-${Date.now()}`,
    data: { url: payload.url || "/", createdAt: new Date().toISOString(), ...payload },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  }

  // Broadcast to open tabs so they can show in-app toast + update inbox
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
    clients.forEach(client => client.postMessage({ type: "PUSH_RECEIVED", payload: { title, ...options.data } }))
  })

  event.waitUntil(self.registration.showNotification(title, options))
})

// ── Notification click — focus or open app ────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ("focus" in client) { client.focus(); return }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})