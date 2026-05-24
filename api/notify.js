import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const DEDUP_TTL = 15_000;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { uid, title, body, obraId } = req.body;
  if (!uid || !title) return res.status(400).json({ error: "Faltan campos" });

  const db = getFirestore();
  const dedupeId = `${uid}_${body}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
  const dedupeRef = db.doc(`notifDedup/${dedupeId}`);

  // Dedup atómico: solo una de dos llamadas simultáneas pasa
  let isDuplicate = false;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(dedupeRef);
    if (snap.exists && Date.now() - snap.data().ts < DEDUP_TTL) {
      isDuplicate = true;
      return;
    }
    tx.set(dedupeRef, { ts: Date.now() });
  });
  if (isDuplicate) return res.status(200).json({ sent: 0, reason: "dedup" });

  const userSnap = await db.doc(`users/${uid}`).get();
  const tokens = [...new Set(userSnap.data()?.fcmTokens || [])];
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

  const validTokens = tokens.filter((_, i) => result.responses[i].success);
  if (validTokens.length !== tokens.length || tokens.length > 1) {
    const tokenFinal = validTokens.length ? [validTokens[validTokens.length - 1]] : [];
    await db.doc(`users/${uid}`).update({ fcmTokens: tokenFinal });
  }

  res.status(200).json({ sent: result.successCount });
}
