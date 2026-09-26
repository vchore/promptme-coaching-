// Network-first service worker: always fresh when online, still works offline
// (including the helpline numbers) from the last cached copy.
const CACHE = "promptme-v2";
const ASSETS = [
  "./", "index.html", "css/styles.css", "js/app.js", "js/data.js", "js/logic.js", "js/ui.js",
  "js/brand.js", "js/plan.js", "js/assess.js", "manifest.webmanifest", "icons/icon.svg", "brand/brand.json",
];

self.addEventListener("install", (e) => {
  // Missing optional files (e.g. no brand/ folder in dev) must not abort install.
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(ASSETS.map((a) => c.add(a)))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
