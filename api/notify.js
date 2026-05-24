import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const DEDUP_TTL = 10_000; // ms — ignora duplicados dentro de 10 segundos

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { uid, title, body, obraId } = req.body;
  if (!uid || !title) return res.status(400).json({ error: "Faltan campos" });

  const db = getFirestore();

  // Deduplicación server-side: misma notificación dentro de 10s → ignorar
  const dedupeId = `${uid}_${body}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
  const dedupeRef = db.doc(`notifDedup/${dedupeId}`);
  const dedupeSnap = await dedupeRef.get();
  if (dedupeSnap.exists && Date.now() - dedupeSnap.data().ts < DEDUP_TTL) {
    return res.status(200).json({ sent: 0, reason: "dedup" });
  }
  await dedupeRef.set({ ts: Date.now() });

  // Tokens
  const userSnap = await db.doc(`users/${uid}`).get();
  const tokens = [...new Set(userSnap.data()?.fcmTokens || [])];
  if (!tokens.length) return res.status(200).json({ sent: 0, reason: "sin tokens" });

  // Enviar
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

  // Limpiar: quedarse solo con el último token válido
  const validTokens = tokens.filter((_, i) => result.responses[i].success);
  if (validTokens.length !== tokens.length || tokens.length > 1) {
    const tokenFinal = validTokens.length ? [validTokens[validTokens.length - 1]] : [];
    await db.doc(`users/${uid}`).update({ fcmTokens: tokenFinal });
  }

  res.status(200).json({ sent: result.successCount });
}
