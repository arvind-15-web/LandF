// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Replace with your actual Firebase config values
firebase.initializeApp({
 apiKey: "AIzaSyDL8C0IKuK1DFqlDCM6ygnmlPhtf5suMEU",
  authDomain: "landf-75040.firebaseapp.com",
  projectId: "landf-75040",
  storageBucket: "landf-75040.firebasestorage.app",
  messagingSenderId: "529017952828",
  appId: "1:529017952828:web:179ef812a5b4e87a990139",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: payload.data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.link || '/';
  event.waitUntil(clients.openWindow(url));
});
