import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { uid, title, body, obraId } = req.body;
  if (!uid || !title) return res.status(400).json({ error: "Faltan campos" });

  const db = getFirestore();
  const userSnap = await db.doc(`users/${uid}`).get();
  const tokens = userSnap.data()?.fcmTokens || [];

  if (!tokens.length) return res.status(200).json({ sent: 0, reason: "sin tokens" });

  const messaging = getMessaging();
  const result = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    webpush: {
      notification: {
        icon: "/logo-app.png",
        badge: "/logo-app.png",
        requireInteraction: false,
        vibrate: [200, 100, 200],
      },
      fcmOptions: { link: "/" },
    },
    data: { obraId: obraId || "" },
  });

  // Limpiar tokens inválidos
  const invalidIdxs = result.responses
    .map((r, i) => (!r.success ? i : -1))
    .filter(i => i >= 0);

  if (invalidIdxs.length) {
    const valid = tokens.filter((_, i) => !invalidIdxs.includes(i));
    await db.doc(`users/${uid}`).update({ fcmTokens: valid });
  }

  res.status(200).json({ sent: result.successCount });
}
