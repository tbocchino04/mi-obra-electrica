import { getMessaging, getToken } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function initFCM() {
  try {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (!VAPID_KEY) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const sw = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: sw });

    if (token && auth.currentUser) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fcmTokens: arrayUnion(token),
      });
    }
  } catch (err) {
    // Silencioso: notificaciones no críticas
    console.warn("FCM:", err?.message);
  }
}
