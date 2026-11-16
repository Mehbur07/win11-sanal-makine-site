// VirtualMOS service worker: sitenin dosyalarını cihazda önbelleğe alır, böylece site
// internet olmadan da açılır. Bu dosya bir şablondur; derlemede (vite-pwa-plugin.ts)
// aşağıdaki iki satıra sürüm ve dosya listesi yazılıp dist/sw.js üretilir.

const VERSION = __VERSION__;
const PRECACHE = __PRECACHE__;
const CACHE = `vmos-${VERSION}`;
// Bu adreslerle açılan sayfa, önbellekteki index.html ile açılır
const PAGES = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  // cache: 'reload' → tarayıcının kendi HTTP önbelleğindeki eski kopyalar alınmasın
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  // Eski sürümlerin önbelleklerini temizle
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith('vmos-') && k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Kullanıcı "Yenile" dediğinde bekleyen yeni sürüm hemen devreye girer
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Başka sitelere giden istekler (GitHub API, tarayıcı uygulamasındaki siteler) karışılmaz
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    if (!PAGES.includes(url.pathname)) return;
    event.respondWith(
      caches.match('/index.html', { cacheName: CACHE }).then((hit) => hit || fetch(req)),
    );
    return;
  }

  if (!PRECACHE.includes(url.pathname)) return;
  event.respondWith(
    caches.match(url.pathname, { cacheName: CACHE }).then((hit) => hit || fetch(req)),
  );
});
