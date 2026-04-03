import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, deleteDoc, getDocs } from "firebase/firestore";

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
export const db = getFirestore(app);

// Guardar una obra
export async function guardarObra(obraId, data) {
  await setDoc(doc(db, "obras", obraId), data);
}

// Escuchar una obra en tiempo real
export function escucharObra(obraId, callback) {
  return onSnapshot(doc(db, "obras", obraId), snap => {
    if (snap.exists()) callback(snap.data());
  });
}

// Escuchar lista de obras en tiempo real
export function escucharObras(callback) {
  return onSnapshot(collection(db, "obras"), snap => {
    const obras = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(obras);
  });
}

// Crear obra nueva
export async function crearObra(data) {
  return await addDoc(collection(db, "obras"), data);
}

// Eliminar obra
export async function eliminarObra(obraId) {
  await deleteDoc(doc(db, "obras", obraId));
}