const CACHE_NAME = 'stage-pwa-v1';

// Список файлов, которые нужно сохранить в память телефона для работы приложения
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Установка Service Worker и кэширование файлов
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Файлы успешно закэшированы');
        return cache.addAll(urlsToCache);
      })
  );
});

// Перехват запросов (достаем из кэша или идем в сеть)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если файл есть в кэше телефона — отдаем его (работает даже без интернета)
        if (response) {
          return response;
        }
        // Если файла нет в памяти — скачиваем его из интернета
        return fetch(event.request);
      })
  );
});

// Активация и удаление старого кэша (полезно, когда будешь обновлять сайт)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});