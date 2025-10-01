/* eslint-disable no-restricted-globals */
// firebase-messaging-sw.js
/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD2kNJ9bPAzuGBvUh8OFfBY6yFnBvKZVNU",
  authDomain: "fivlia-quick-commerce.firebaseapp.com",
  projectId: "fivlia-quick-commerce",
  messagingSenderId: "566192067637",
  appId: "1:566192067637:web:e0b4ec3148b11fe965cd7c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message:", payload);

  const title = payload.notification?.title || payload.data?.title || "Default Title";
  const body = payload.notification?.body || payload.data?.body || "Default Body";

  self.registration.showNotification(title, {
    body,
    icon: "/logo192.png",
    data: payload.data,
  });
});

self.addEventListener('push', function(event) {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json(); // JSON payload
    } catch (err) {
      // fallback for plain text
      payload = {
        notification: { title: "New Notification", body: event.data.text() },
        data: { click_action: "/" },
      };
    }
  } else {
    payload = {
      notification: { title: "New Notification", body: "You have a new message" },
      data: { click_action: "/" },
    };
  }

  const title = payload.notification.title;
  const options = {
    body: payload.notification.body,
    icon: "/logo192.png",
    data: payload.data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.click_action || "/";
  event.waitUntil(clients.openWindow(targetUrl));
});
