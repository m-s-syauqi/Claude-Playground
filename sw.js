// Network first, so a new deploy shows up straight away; the cache is only
// used when the device is offline.
const CACHE = 'stride-v5';
// Holds an image shared to Stride from another app until the page picks it up.
const SHARE_CACHE = 'stride-share';
const ASSETS = ['./', 'index.html', 'styles.css', 'app.js', 'sync-merge.js', 'screenshot.js', 'mcu.html', 'mcu.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== SHARE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Share target: Android's share sheet POSTs the image here (see manifest.webmanifest).
// The site is static, so the service worker answers: it keeps the image and opens
// the app, which reads it and fills in the Add run form.
async function receiveShare(req) {
  const home = new URL('./', self.registration.scope);
  try {
    const form = await req.formData();
    const file = form.getAll('image').find((f) => f && typeof f !== 'string');
    if (!file) return Response.redirect(home.href, 303);
    const cache = await caches.open(SHARE_CACHE);
    await cache.put('shared-image', new Response(file, {
      headers: {
        'content-type': file.type || 'image/jpeg',
        'x-file-name': encodeURIComponent(file.name || 'screenshot'),
        'x-last-modified': String(file.lastModified || Date.now()),
      },
    }));
    home.searchParams.set('shared', '1');
  } catch { /* fall through to the app without an image */ }
  return Response.redirect(home.href, 303);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method === 'POST' && new URL(req.url).pathname.endsWith('/share-target')) {
    e.respondWith(receiveShare(req));
    return;
  }
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
  );
});
