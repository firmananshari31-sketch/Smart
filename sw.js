/* Service worker Penilai Lembar Jawaban. Naikkan VERSI setiap kali index.html diperbarui. */
const VERSI = 'penilai-v51';
const CANGKANG = ['./', './Pindai.html', './manifest.json', './icon-192.png', './icon-512.png'];

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

  /* Panggilan ke API AI selalu lewat internet dan tidak pernah disimpan. */
  if (url.hostname === 'api.anthropic.com') return;

  /* Berkas aplikasi sendiri: coba internet dulu supaya pembaruan langsung terpasang, cadangan dari cache jika offline. */
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then(function (res) {
        const salinan = res.clone();
        caches.open(VERSI).then(function (c) { c.put(req, salinan); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) { return hit || caches.match('./Pindai.html'); });
      })
    );
    return;
  }

  /* Pustaka dari CDN (Excel, PDF, font): ambil dari cache dulu, jika belum ada baru dari internet lalu disimpan. */
  event.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        const salinan = res.clone();
        caches.open(VERSI).then(function (c) { c.put(req, salinan); });
        return res;
      }).catch(function () { return hit; });
    })
  );
});
