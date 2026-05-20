// Claude Team Monitor — Service Worker v1.1 (Firebase 대응)
const CACHE = 'ctm-v1.1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Firebase·Firestore 도메인은 캐시 우회 (실시간 동기화 보장)
const BYPASS_HOSTS = [
  'firestore.googleapis.com',
  'firebaseio.com',
  'googleapis.com',
  'gstatic.com',
  'firebaseapp.com',
  'identitytoolkit.googleapis.com'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;

  // Firebase 통신은 항상 네트워크 직접 통과 (캐싱 금지)
  const url = new URL(e.request.url);
  if(BYPASS_HOSTS.some(h => url.hostname.endsWith(h))) {
    return; // 브라우저 기본 동작
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if(res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
