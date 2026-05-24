const enviadas = new Map(); // clave → timestamp, persiste en el módulo
const DEDUP_MS = 15_000;

export function notificar(uid, { obraNombre, mensaje, obraId }) {
  const key = `${uid}_${mensaje}`;
  const ultimo = enviadas.get(key) || 0;
  if (Date.now() - ultimo < DEDUP_MS) return;
  enviadas.set(key, Date.now());

  fetch("/api/notify", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, title: obraNombre, body: mensaje, obraId: obraId || "" }),
  }).catch(() => {});
}
