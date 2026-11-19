// Service Worker for LIFE.HELP PWA.
const VERSION = "v3";
const STATIC_CACHE = `life-help-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];
const MAX_STATIC_ENTRIES = 120;

// On localhost/development, never intercept or cache; immediately unregister
if (typeof self !== "undefined" && (self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1")) {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    );
  });
}

// Same-origin paths that are never handled by the worker at all (always straight to the network).
const BYPASS_PREFIXES = ["/api/", "/admin", "/tech", "/chat", "/login", "/auth", "/jiu", "/sys", "/payment", "/request", "/review", "/study", "/learn-content/"];

function isCacheableStatic(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/logos/") || /^\/icon-\d+\.png$/.test(url.pathname);
}

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_STATIC_ENTRIES; i++) await cache.delete(keys[i]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => {})).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      // drops every older cache, including the v1 cache that held HTML pages
      .then((names) => Promise.all(names.filter((n) => n !== STATIC_CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (BYPASS_PREFIXES.some((p) => url.pathname === p.replace(/\/$/, "") || url.pathname.startsWith(p))) return;

  // Page navigations: always the network; offline -> the minimal offline page. The response is never cached.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match(OFFLINE_URL);
        return offline || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }),
    );
    return;
  }

  // Static build output / icons: cache-first (content-hashed or rarely changing), only successful, non-private responses are stored.
  if (isCacheableStatic(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            const cc = response.headers.get("Cache-Control") || "";
            if (response.status === 200 && response.type === "basic" && !/no-store|private/i.test(cc) && !response.headers.has("Set-Cookie")) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy).then(() => trim(cache))).catch(() => {});
            }
            return response;
          }),
      ),
    );
  }
  // everything else (RSC/data requests, other assets): not intercepted
});
