import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { writeFileSync } from "fs";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Genera el service worker con el config de Firebase embebido
  const sw = `importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "${env.VITE_FIREBASE_API_KEY}",
  authDomain:        "${env.VITE_FIREBASE_AUTH_DOMAIN}",
  projectId:         "${env.VITE_FIREBASE_PROJECT_ID}",
  storageBucket:     "${env.VITE_FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${env.VITE_FIREBASE_MESSAGING_SENDER_ID}",
  appId:             "${env.VITE_FIREBASE_APP_ID}",
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
`;

  writeFileSync("public/firebase-messaging-sw.js", sw);

  return {
    plugins: [react()],
  };
});

