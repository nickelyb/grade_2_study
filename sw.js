const CACHE_NAME = 'chinese-helper-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/audio.js',
  '/progress.js',
  '/manifest.json',
  '/templates/choice_gate.js',
  '/templates/judge_run.js',
  '/templates/fill_treasure.js',
  '/templates/match_link.js',
  '/templates/multi_choice_orbs.js',
  '/templates/word_builder.js',
  '/tiku/unit4_questions_v2.json',
  '/tiku/unit4_taskpacks_v1.json',
  '/assets/bgm.mp3',
  '/assets/click.mp3',
  '/assets/success.mp3',
  '/assets/fail.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ 缓存资源中...');
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ 删除旧缓存:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      if (event.request.destination === 'document') {
        return caches.match('/index.html');
      }
    })
  );
});