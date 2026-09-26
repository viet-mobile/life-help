// Service Worker for LIFE.HELP PWA
const CACHE_NAME = "life-help-pwa-v1";
const OFFLINE_FALLBACK = [
  "/",
  "/manifest.json",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_FALLBACK).catch(() => {
        // Continue even if some fallback assets fail to pre-cache
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network-first with cache fallback)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Do not cache API requests or non-http protocols
  if (url.pathname.startsWith("/api/") || !url.protocol.startsWith("http")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (event.request.mode === "navigate") {
          const fallback = await caches.match("/");
          if (fallback) return fallback;
        }
        return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
      })
  );
});


// ---------------------------------------------------------------------------
// Web Push
// Payloads are minimal ({ v, type, audience, title, body, url, tag }): no names, addresses,
// conversation text, capabilities or tokens. Only fixed same-origin routes may be opened.
// ---------------------------------------------------------------------------
const PUSH_ROUTES = ["/tech/assignments", "/request", "/"];
const PUSH_FOCUS_PREFIX = { helper: "/tech", customer: "/chat" };

function parsePushPayload(raw) {
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }
  const text = (value, fallback) => (typeof value === "string" && value.trim() ? value.trim().slice(0, 160) : fallback);
  const audience = data.audience === "helper" || data.audience === "customer" ? data.audience : "any";
  return {
    type: text(data.type, "LIFE_HELP"),
    audience,
    title: text(data.title, "LIFE.HELP"),
    body: text(data.body, ""),
    url: PUSH_ROUTES.includes(data.url) ? data.url : "/",
    tag: typeof data.tag === "string" && /^[a-z0-9_-]{1,64}$/.test(data.tag) ? data.tag : "life-help",
  };
}

// Prefer focusing a window the user already has open (a customer chat tab keeps its private
// capability in its own URL); otherwise open the safe route from the payload.
async function focusOrOpen(data) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const sameOrigin = windows.filter((client) => new URL(client.url).origin === self.location.origin);
  const prefix = PUSH_FOCUS_PREFIX[data.audience];
  const preferred = (prefix && sameOrigin.find((client) => new URL(client.url).pathname.startsWith(prefix))) || null;
  if (preferred) return preferred.focus();
  return self.clients.openWindow(PUSH_ROUTES.includes(data.url) ? data.url : "/");
}

self.addEventListener("push", (event) => {
  const data = parsePushPayload(event.data ? event.data.text() : "");
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
      data: { type: data.type, audience: data.audience, url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = parsePushPayload(JSON.stringify(event.notification.data || {}));
  event.waitUntil(focusOrOpen(data));
});

// Exposed for automated service-worker checks only (no side effects).
self.__lifeHelpPush = { parsePushPayload, PUSH_ROUTES };
