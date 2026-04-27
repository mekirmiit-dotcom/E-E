const CACHE_NAME = "is-takibi-v1"

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()))

/* ── Push geldi ─────────────────────────────────────────── */
self.addEventListener("push", (event) => {
  if (!event.data) return

  let data = {}
  try { data = event.data.json() } catch { data = { title: "İş Takibi", body: event.data.text() } }

  const title   = data.title || "İş Takibi"
  const body    = data.body  || ""
  const taskId  = data.task_id || null
  const taskUrl = taskId ? `/tasks/${taskId}` : "/"

  const options = {
    body,
    icon:      "/icon-512.png",
    badge:     "/icon-512.png",
    vibrate:   [200, 100, 200],
    tag:       taskId || "is-takibi-general",
    renotify:  true,
    timestamp: Date.now(),
    data:      { url: taskUrl },
    actions: [
      { action: "open",    title: "Görevi Aç" },
      { action: "dismiss", title: "Kapat"     },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

/* ── Bildirime tıklandı ─────────────────────────────────── */
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  if (event.action === "dismiss") return

  const url = event.notification.data?.url || "/"

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        // Açık sekme varsa onu odakla ve URL'e git
        for (const client of list) {
          if ("focus" in client) {
            client.focus()
            if ("navigate" in client) client.navigate(url)
            return
          }
        }
        // Yoksa yeni sekme aç
        return clients.openWindow(url)
      })
  )
})
