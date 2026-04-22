import jsPDF from "jspdf";

async function loadLogo() {
  try {
    const mod = await import("../assets/logo-vb-clean.png");
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

export async function generarReporteObra({ etapas, obraInfo, rubros = [] }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const M = 15;
  const logo = await loadLogo();

  const allItems = etapas.flatMap(e => e.items || []);
  const total    = allItems.length;
  const comp     = allItems.filter(i => i.estado === "completado").length;
  const pct      = total ? Math.round(comp / total * 100) : 0;
  const fecha    = new Date().toLocaleDateString("es-AR", { dateStyle: "long" });

  // ── Header ─────────────────────────────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, W, 42, "F");
  if (logo) { try { doc.addImage(logo, "PNG", M, 8, 62, 24); } catch {} }
  bold(doc, 10, [100, 100, 110]);
  doc.text("REPORTE DE OBRA", W - M, 16, { align: "right" });
  normal(doc, 8, [150, 150, 160]);
  doc.text(fecha, W - M, 22, { align: "right" });
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(0, 42, W, 42);

  let y = 54;

  // ── Info obra ──────────────────────────────────────────────────
  label(doc, "OBRA", M, y); y += 5;
  bold(doc, 16, [15, 20, 35]);
  doc.text(obraInfo.nombre || "Sin nombre", M, y); y += 6;
  if (obraInfo.cliente) {
    normal(doc, 9, [100, 100, 110]);
    doc.text(`Cliente: ${obraInfo.cliente}`, M, y); y += 4;
  }
  if (obraInfo.direccion) {
    normal(doc, 9, [100, 100, 110]);
    doc.text(obraInfo.direccion, M, y); y += 4;
  }
  const rubroLabel = rubros.find(r => r.id === obraInfo.rubro)?.label;
  if (rubroLabel) {
    normal(doc, 9, [124, 92, 201]);
    doc.text(`Rubro: ${rubroLabel}`, M, y); y += 4;
  }

  y += 4;
  divider(doc, y, M, W); y += 10;

  // ── Resumen avance ─────────────────────────────────────────────
  label(doc, "AVANCE GENERAL", M, y); y += 6;
  bold(doc, 38, [37, 99, 235]);
  doc.text(`${pct}%`, M, y + 4);
  normal(doc, 9, [100, 100, 110]);
  doc.text(`${comp} de ${total} tareas completadas`, M + 26, y);
  doc.text(`${etapas.filter(e => {
    const items = e.items || [];
    return items.length && items.every(i => i.estado === "completado");
  }).length} de ${etapas.length} etapas terminadas`, M + 26, y + 5);
  y += 16;

  // Cajas de estado
  const estadoBoxes = [
    { key: "pendiente",   label: "Pendiente",   rgb: [148, 150, 170] },
    { key: "progreso",    label: "En progreso",  rgb: [217, 119, 6]   },
    { key: "completado",  label: "Completado",   rgb: [5, 150, 105]   },
    { key: "observacion", label: "Observación",  rgb: [220, 38, 38]   },
  ];
  const boxW = (W - M * 2 - 6) / 4;
  estadoBoxes.forEach(({ key, label: lbl, rgb }, i) => {
    const cnt = allItems.filter(it => it.estado === key).length;
    const bx  = M + i * (boxW + 2);
    doc.setFillColor(248, 250, 252);
    doc.rect(bx, y, boxW, 14, "F");
    bold(doc, 16, rgb);
    doc.text(String(cnt), bx + boxW / 2, y + 8, { align: "center" });
    normal(doc, 6.5, [120, 120, 130]);
    doc.text(lbl, bx + boxW / 2, y + 12.5, { align: "center" });
  });
  y += 22;
  divider(doc, y, M, W); y += 10;

  // ── Detalle por etapa ──────────────────────────────────────────
  label(doc, "DETALLE POR ETAPA", M, y); y += 8;

  const stateSymbol = { completado: "+", progreso: ">", pendiente: "o", observacion: "!" };
  const stateRgb    = {
    completado: [5, 150, 105], progreso: [217, 119, 6],
    pendiente: [148, 150, 170], observacion: [220, 38, 38],
  };

  for (const etapa of etapas) {
    const items     = etapa.items || [];
    const eComp     = items.filter(i => i.estado === "completado").length;
    const ePct      = items.length ? Math.round(eComp / items.length * 100) : 0;
    const rowHeight = 12 + items.reduce((acc, it) => acc + (it.comentario ? 9 : 5.5), 0) + 8;

    if (y + rowHeight > 278) { doc.addPage(); y = 20; }

    // Cabecera de etapa
    doc.setFillColor(248, 250, 252);
    doc.rect(M, y - 3, W - M * 2, 11, "F");
    bold(doc, 10.5, [15, 20, 35]);
    doc.text(etapa.nombre, M + 2, y + 4);
    const pctRgb = ePct === 100 ? [5, 150, 105] : [37, 99, 235];
    bold(doc, 10, pctRgb);
    doc.text(`${ePct}%`, W - M - 2, y + 4, { align: "right" });
    if (etapa.monto) {
      const mf = `${(etapa.moneda || "ARS") === "USD" ? "USD " : "$ "}${Number(etapa.monto).toLocaleString("es-AR")}`;
      normal(doc, 7, [5, 150, 105]);
      doc.text(mf, M + 2, y);
    }
    if (etapa.firma) {
      normal(doc, 7, [5, 150, 105]);
      doc.text(`Firmado: ${etapa.firma.firmante}`, W - M - 2, y, { align: "right" });
    }
    y += 12;

    // Items
    for (const item of items) {
      if (y > 278) { doc.addPage(); y = 20; }
      const rgb = stateRgb[item.estado] || [100, 100, 110];
      normal(doc, 7.5, rgb);
      doc.text(stateSymbol[item.estado] || "o", M + 2, y);
      normal(doc, 7.5, [40, 40, 50]);
      const lines = doc.splitTextToSize(item.tarea, W - M * 2 - 14);
      doc.text(lines, M + 7, y);
      y += lines.length > 1 ? lines.length * 3.5 : 5;
      if (item.comentario) {
        normal(doc, 6.5, [120, 120, 130]);
        const cLines = doc.splitTextToSize(`   ${item.comentario}`, W - M * 2 - 14);
        doc.text(cLines, M + 7, y);
        y += cLines.length * 3.5 + 1;
      }
    }
    y += 6;
  }

  // ── Footer ─────────────────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    divider(doc, 287, M, W);
    normal(doc, 7, [160, 160, 170]);
    doc.text("VB Soluciones Eléctricas · Reporte generado digitalmente", W / 2, 292, { align: "center" });
    if (pages > 1) {
      doc.text(`Página ${p} de ${pages}`, W - M, 292, { align: "right" });
    }
  }

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
