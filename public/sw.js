// Minimal service worker. Web push and background notifications were removed
// (daily reminders now come through LINE), but the app is still installable.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Remove the task snapshot cache the old background-notification feature stored
      try {
        await caches.delete('dashboard-data');
      } catch (e) {
        /* ignore */
      }
      await self.clients.claim();
    })()
  );
});
