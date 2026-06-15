// 1. ПОДКЛЮЧЕНИЕ ONESIGNAL (Обязательно в самой первой строке)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// 2. НАСТРОЙКИ КЭШИРОВАНИЯ PWA
const CACHE_NAME = 'stage-clan-cache-v1';

// Список файлов, которые будут сохранены в память телефона/ПК
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
    // Если нужно, сюда можно дописать '/map1.png', '/map2.png' и т.д.
];

// Установка воркера и первичное кэширование
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Кэширование файлов PWA...');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Активация и очистка старого кэша при обновлениях
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Удаляем старый кэш:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Перехват запросов (Стратегия: Сначала сеть, если нет интернета - берём из кэша)
self.addEventListener('fetch', (event) => {
    // ПРОПУСКАЕМ специфичные запросы (API Telegram, Supabase и самого OneSignal), 
    // чтобы они не кэшировались и всегда были свежими
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
                // Если запрос успешен, динамически сохраняем файл в кэш
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Если интернета нет, отдаём файл из кэша
                return caches.match(event.request);
            })
    );
});