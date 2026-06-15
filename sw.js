// 1. ПОДКЛЮЧЕНИЕ ONESIGNAL
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = 'stage-clan-cache-v2';

// Список файлов PWA
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/bg.png',
    '/roster_bg.png',
    '/maps_bg.png',
    '/board_bg.png',
    '/chat_page_bg.png',
    '/chat_bg.png',
    '/creators_bg.png',
    '/founders_bg.png',
    '/chat_logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[Service Worker] Кэширование файлов PWA...');
            // Бронебойный метод: кэшируем файлы строго по одному.
            // Если какого-то файла нет (404), воркер не упадет и успешно установится!
            for (let url of urlsToCache) {
                try {
                    await cache.add(url);
                } catch (error) {
                    console.warn(`[Service Worker] Пропущен файл (не найден на сервере): ${url}`);
                }
            }
        })
    );
    // Принудительно активируем воркер, не дожидаясь закрытия вкладок
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    if (
        event.request.url.includes('onesignal.com') || 
        event.request.url.includes('supabase.co') || 
        event.request.url.includes('api.telegram.org') ||
        event.request.url.includes('mymemory.translated.net')
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});