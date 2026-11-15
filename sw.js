/* Service worker Penilai Lembar Jawaban (template sekolah). Naikkan VERSI setiap kali index.html diperbarui. */
const VERSI = 'penilai-template-v6';
const CANGKANG = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(VERSI).then(function (cache) { return cache.addAll(CANGKANG); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (nama) {
      return Promise.all(nama.filter(function (n) { return n !== VERSI; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'api.anthropic.com') return;
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then(function (res) {
        const salinan = res.clone();
        caches.open(VERSI).then(function (c) { c.put(req, salinan); });
        return res;
      }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match('./index.html'); }); })
    );
  }
});
