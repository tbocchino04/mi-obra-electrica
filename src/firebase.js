import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDQRAYhSKcSycA-Q9zxPuenS3bpzIJc9_w",
  authDomain: "miobra-554e8.firebaseapp.com",
  databaseURL: "https://miobra-554e8-default-rtdb.firebaseio.com",
  projectId: "miobra-554e8",
  storageBucket: "miobra-554e8.firebasestorage.app",
  messagingSenderId: "319011670590",
  appId: "1:319011670590:web:067297d6308cccd7f01f6f"
};

const app = initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const auth    = getAuth(app);

// ── Auth ───────────────────────────────────────────────────────────

export async function registrar(email, password, nombre) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", cred.user.uid), {
    nombre, email, role: "admin", creadoEn: Date.now(),
  });
  return cred.user;
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export function logout() {
  return signOut(auth);
}

export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Obras ──────────────────────────────────────────────────────────

export async function guardarObra(obraId, data) {
  await setDoc(doc(db, "obras", obraId), data, { merge: true });
}

export function escucharObra(obraId, callback) {
  return onSnapshot(doc(db, "obras", obraId), snap => {
    if (snap.exists()) callback(snap.data());
  });
}

export function escucharObraPorToken(token, callback) {
  const q = query(collection(db, "obras"), where("clienteToken", "==", token));
  return onSnapshot(q, snap => {
    if (!snap.empty) callback({ id: snap.docs[0].id, ...snap.docs[0].data() });
    else callback(null);
  });
}

export function escucharObraPorSocioToken(token, callback) {
  const q = query(collection(db, "obras"), where("socioToken", "==", token));
  return onSnapshot(q, snap => {
    if (!snap.empty) callback({ id: snap.docs[0].id, ...snap.docs[0].data() });
    else callback(null);
  });
}

export function escucharObras(uid, callback) {
  const q = query(collection(db, "obras"), where("uid", "==", uid));
  return onSnapshot(q, snap => {
    const obras = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(obras);
  });
}

export async function crearObra(data) {
  return await addDoc(collection(db, "obras"), data);
}

export async function eliminarObra(obraId) {
  await deleteDoc(doc(db, "obras", obraId));
}

// ── Perfil usuario ─────────────────────────────────────────────────

export async function obtenerPerfil(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
