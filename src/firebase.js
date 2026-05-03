import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, onSnapshot, collection, addDoc, query, where } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);

// ── Auth ───────────────────────────────────────────────────────────

export async function registrar(email, password, nombre) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", cred.user.uid), {
    nombre, email, role: "admin", creadoEn: Date.now(), emailVerified: false,
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

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function enviarVerificacion() {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay usuario autenticado");

  const perfil = await obtenerPerfil(user.uid);
  const nombre = perfil?.nombre || "";
  const token  = crypto.randomUUID();

  await setDoc(doc(db, "verificationTokens", token), {
    uid: user.uid, email: user.email,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });

  const res = await fetch("/api/send-verification", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email: user.email, nombre, token }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
}

export async function verificarEmailToken(token) {
  const snap = await getDoc(doc(db, "verificationTokens", token));
  if (!snap.exists()) throw new Error("Link inválido o ya utilizado");
  const data = snap.data();
  if (data.expiresAt < Date.now()) throw new Error("El link expiró. Pedí uno nuevo desde la app.");
  if (data.uid !== auth.currentUser?.uid) throw new Error("Este link corresponde a otra cuenta");
  await setDoc(doc(db, "users", data.uid), { emailVerified: true }, { merge: true });
  await deleteDoc(doc(db, "verificationTokens", token));
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
  let resA = undefined;
  let resB = undefined;

  function update() {
    if (resA === undefined || resB === undefined) return;
    callback(resA || resB || null);
  }

  const qA = query(collection(db, "obras"), where("socioTokensArray", "array-contains", token));
  const unsubA = onSnapshot(qA,
    snap => { resA = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }; update(); },
    ()   => { resA = null; update(); }
  );

  const qB = query(collection(db, "obras"), where("socioToken", "==", token));
  const unsubB = onSnapshot(qB,
    snap => { resB = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }; update(); },
    ()   => { resB = null; update(); }
  );

  return () => { unsubA(); unsubB(); };
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
