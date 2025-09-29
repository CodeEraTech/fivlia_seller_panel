/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD2kNJ9bPAzuGBvUh8OFfBY6yFnBvKZVNU",
  authDomain: "fivlia-quick-commerce.firebaseapp.com",
  projectId: "fivlia-quick-commerce",
  messagingSenderId: "566192067637",
  appId: "1:566192067637:web:e0b4ec3148b11fe965cd7c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message (FB):', payload);

  const title = payload.notification?.title || "New Notification";
  const body = payload.notification?.body || "";
  const click_action = payload.data?.click_action || "/";

  const options = {
    body,
    icon: '/logo192.png',
    data: { click_action }
  };

  self.registration.showNotification(title, options);
});

// Fallback push listener
self.addEventListener('push', function(event) {
  console.log('[SW push] event.data:', event.data);
  let payload = {};
  try {
    payload = event.data.json();
  } catch (err) {
    console.warn('Push event had no JSON', err);
  }
  const title = payload.notification?.title || "New Notification";
  const body = payload.notification?.body || "";
  const click_action = payload.data?.click_action || "/";

  const options = {
    body,
    icon: '/favicon.png',
    data: { click_action }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Click handler (top-level)
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification click:', event.notification);
  const targetUrl = event.notification.data?.click_action || "/";
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
