// Сервис-воркер для TaskFlow PWA
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "taskflow-pwa-v1";
const offlineFallbackPage = "offline.html";

// Автоматическое обновление сервис-воркера
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Установка и кэширование основных ресурсов
self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => {
        // Кэшируем оффлайн-страницу и основные ресурсы
        return cache.addAll([
          offlineFallbackPage,
          '/',
          '/static/js/bundle.js',
          '/static/css/main.css',
          '/manifest.json'
        ]);
      })
  );
});

// Активация - очистка старых кэшей
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Включение navigation preload (если поддерживается)
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Обработка запросов
self.addEventListener('fetch', (event) => {
  // Для навигационных запросов
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // Пытаемся получить ответ из сети
        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {
        // Если сеть недоступна - возвращаем оффлайн-страницу
        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
  
  // Для других запросов (API, статические файлы)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем из кэша или делаем сетевой запрос
        return response || fetch(event.request);
      })
  );
});