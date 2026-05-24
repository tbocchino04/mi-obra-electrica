export function notificar(uid, { obraNombre, mensaje, obraId }) {
  fetch("/api/notify", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, title: obraNombre, body: mensaje, obraId: obraId || "" }),
  }).catch(() => {});
}
