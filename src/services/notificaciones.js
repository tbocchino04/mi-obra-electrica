import { db } from "../firebase";
import {
  collection, addDoc, onSnapshot, query,
  orderBy, limit, updateDoc, doc, writeBatch, getDocs,
} from "firebase/firestore";

function notifCol(uid) {
  return collection(db, "notificaciones", uid, "items");
}

export async function crearNotificacion(uid, { tipo, obraId, obraNombre, mensaje }) {
  await addDoc(notifCol(uid), { tipo, obraId, obraNombre, mensaje, leida: false, ts: Date.now() });
}

export function escucharNotificaciones(uid, callback) {
  const q = query(notifCol(uid), orderBy("ts", "desc"), limit(50));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export async function marcarLeida(uid, notifId) {
  await updateDoc(doc(db, "notificaciones", uid, "items", notifId), { leida: true });
}

export async function marcarTodasLeidas(uid) {
  const snap = await getDocs(notifCol(uid));
  const batch = writeBatch(db);
  snap.docs.forEach(d => { if (!d.data().leida) batch.update(d.ref, { leida: true }); });
  await batch.commit();
}
