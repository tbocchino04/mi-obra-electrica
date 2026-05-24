importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyDQRAYhSKcSycA-Q9zxPuenS3bpzIJc9_w",
  authDomain:        "miobra-554e8.firebaseapp.com",
  projectId:         "miobra-554e8",
  storageBucket:     "miobra-554e8.firebasestorage.app",
  messagingSenderId: "319011670590",
  appId:             "1:319011670590:web:067297d6308cccd7f01f6f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {};
  if (!title) return;
  self.registration.showNotification(title, {
    body,
    icon:  '/logo-app.png',
    badge: '/logo-app.png',
    data:  payload.data,
  });
});
