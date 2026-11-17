const CACHE = 'mgm-ndrc-2026.11.17-2211';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.endsWith('version.json')) { e.respondWith(fetch(req, {cache: 'no-store'})); return; }
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (isPage) {
    // Réseau d'abord : la dernière version s'affiche dès qu'il y a internet
    // Réseau d'abord (sans cache) ; si le réseau traîne plus de 4 s, on affiche la copie locale.
    const net = fetch(req, {cache: 'no-store'}).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
      return res;
    });
    const slow = new Promise(r => setTimeout(r, 4000)).then(() => caches.match('./index.html', {ignoreSearch: true})).then(hit => hit || net);
    e.respondWith(Promise.race([net, slow]).catch(() => caches.match('./index.html', {ignoreSearch: true})));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req)));
});
