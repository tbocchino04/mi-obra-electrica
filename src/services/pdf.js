import jsPDF from "jspdf";

async function loadLogo() {
  try {
    const mod = await import("../assets/logo.png");
    return mod.default;
  } catch { return null; }
}

export async function generarComprobante({
  obraNombre, etapaNombre, monto, firmante, fecha,
  firmaBase64, clienteNombre = "", direccion = "",
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const M = 15;
  const logo = await loadLogo();

  // ── Header ─────────────────────────────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, W, 42, "F");

  // Logo
  if (logo) { try { doc.addImage(logo, "PNG", M, 8, 62, 24); } catch {} }

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 110);
  doc.text("COMPROBANTE DE PAGO", W - M, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 160);
  doc.text("Documento generado digitalmente", W - M, 22, { align: "right" });

  // Línea accent azul
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(0, 42, W, 42);

  let y = 54;

  // ── Datos obra ─────────────────────────────────────────────────
  label(doc, "OBRA", M, y);
  y += 5;
  bold(doc, 14, [15, 20, 35]);
  doc.text(obraNombre, M, y);
  y += 5;

  if (clienteNombre) {
    normal(doc, 9, [100, 100, 110]);
    doc.text(`Cliente: ${clienteNombre}`, M, y);
    y += 4;
  }
  if (direccion) {
    normal(doc, 9, [100, 100, 110]);
    doc.text(direccion, M, y);
    y += 4;
  }

  y += 5;
  divider(doc, y, M, W);
  y += 10;

  // ── Etapa / Monto ──────────────────────────────────────────────
  const col2 = 115;
  label(doc, "ETAPA", M, y);
  label(doc, "MONTO ABONADO", col2, y);
  y += 5;

  bold(doc, 12, [15, 20, 35]);
  doc.text(etapaNombre, M, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(37, 99, 235);
  doc.text(monto, col2, y);

  y += 10;
  label(doc, "FECHA", M, y);
  y += 5;
  normal(doc, 10, [15, 20, 35]);
  doc.text(fecha, M, y);

  y += 10;
  divider(doc, y, M, W);
  y += 10;

  // ── Firma ──────────────────────────────────────────────────────
  label(doc, "CONFORMIDAD FIRMADA POR", M, y);
  y += 5;
  bold(doc, 13, [15, 20, 35]);
  doc.text(firmante, M, y);
  y += 9;

  if (firmaBase64) {
    label(doc, "FIRMA DIGITAL", M, y);
    y += 3;
    doc.setDrawColor(200, 200, 215);
    doc.setLineWidth(0.3);
    doc.rect(M, y, 90, 36, "S");
    try { doc.addImage(firmaBase64, "PNG", M + 2, y + 2, 86, 32); } catch {}
    y += 41;
  }

  y += 4;
  divider(doc, y, M, W);

  // ── Footer ─────────────────────────────────────────────────────
  normal(doc, 7.5, [160, 160, 170]);
  doc.text(
    "VB Soluciones Eléctricas · Este documento tiene validez como comprobante de pago de la etapa indicada.",
    W / 2, 285, { align: "center" },
  );

  return doc;
}

// ── Helpers ────────────────────────────────────────────────────────
function label(doc, text, x, y) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 130);
  doc.text(text, x, y);
}
function bold(doc, size, rgb) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size);
  doc.setTextColor(...rgb);
}
function normal(doc, size, rgb) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  doc.setTextColor(...rgb);
}
function divider(doc, y, margin, W) {
  doc.setDrawColor(225, 228, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
}
