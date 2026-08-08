const CACHE = 'DHDT-lms-v1.5.1';
const BASE = '/duyhoangdaytaon-cantho.1.1';
const STATIC = [
  `${BASE}/style.css`,
  `${BASE}/config.js`,
  `${BASE}/trungthu.css`,
  `${BASE}/trungthu-wish.js`,
  `${BASE}/trungthu-bg.jpg`,
  `${BASE}/css/trungthu-login.css`,
  `${BASE}/js/trungthu-login-ui.js`,
  `${BASE}/app.js`,
  `${BASE}/admin.js`,
  `${BASE}/student.js`,
  `${BASE}/supabase.js`,
  `${BASE}/manifest.json`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-512.png`
];

// Cài đặt: cache file tĩnh, skipWaiting để kích hoạt ngay
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn('[SW] Cache install warning:', err);
        return self.skipWaiting();
      })
  );
});

// Kích hoạt: xóa cache cũ, claim clients, rồi mới báo reload
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
      })
  );
});

// Fetch: HTML luôn lấy mạng; asset network-first
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase.co')) return;
  if (e.request.url.includes('unpkg.com')) return;
  if (e.request.url.includes('cdn.')) return;

  const isHtml = e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').includes('text/html') ||
    e.request.url.endsWith('.html');

  // HTML: luôn network, không ghi cache (tránh kẹt bản cũ)
  if (isHtml) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    Promise.race([
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), 4000);
        fetch(e.request)
          .then(res => {
            clearTimeout(timer);
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then(c => c.put(e.request, clone));
            }
            resolve(res);
          })
          .catch(err => { clearTimeout(timer); reject(err); });
      }),
    ])
    .catch(() => caches.match(e.request))
  );
});

const _proxyMap = new Map();
self.addEventListener('message', e => {
  if (e.data?.type === 'REGISTER_PROXY') {
    const { token, url } = e.data;
    _proxyMap.set(token, url);
    setTimeout(() => _proxyMap.delete(token), 60000);
  }
});
