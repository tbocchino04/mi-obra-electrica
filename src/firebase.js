import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

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

// Guardar datos de la obra
export async function guardarObra(data) {
  await setDoc(doc(db, "obras", "principal"), data);
}

// Escuchar cambios en tiempo real
// "callback" es una función que se llama cada vez que hay un cambio
export function escucharObra(callback) {
  return onSnapshot(doc(db, "obras", "principal"), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}