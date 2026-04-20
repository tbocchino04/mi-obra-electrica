import emailjs from "@emailjs/browser";

// Completar con tus datos de EmailJS:
// emailjs.com → Email Services → Service ID
// emailjs.com → Email Templates → Template ID
// emailjs.com → Account → API Keys → Public Key
const SERVICE_ID  = "service_n9hy9x9";
const TEMPLATE_ID = "template_0mtlk3j";
const PUBLIC_KEY  = "Hb6zEV3n3vauw42T6";

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
