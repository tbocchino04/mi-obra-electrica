import emailjs from "@emailjs/browser";

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export async function enviarComprobante({ obraNombre, etapaNombre, monto, firmante, fecha, clienteEmail, adminEmail, pdfUrl = "" }) {
  const params = { obra_nombre: obraNombre, etapa_nombre: etapaNombre, monto, firmante, fecha, pdf_url: pdfUrl };

  const destinatarios = [clienteEmail, adminEmail].filter(e => e?.trim());
  console.log("📧 Enviando a:", destinatarios);
  if (destinatarios.length === 0) throw new Error("No hay emails configurados en la obra.");

  const resultados = await Promise.allSettled(
    destinatarios.map(to_email =>
      emailjs.send(SERVICE_ID, TEMPLATE_ID, { ...params, to_email }, PUBLIC_KEY)
    )
  );

  const fallidos = resultados.filter(r => r.status === "rejected");
  if (fallidos.length > 0) {
    const detalle = fallidos.map(f => f.reason?.text || f.reason?.message || String(f.reason)).join(" | ");
    throw new Error(detalle);
  }
}
