export function pctEtapa(etapa) {
  if (!etapa.items.length) return 0;
  return Math.round(etapa.items.filter(i => i.estado === "completado").length / etapa.items.length * 100);
}

export function progressColor(pct) {
  return pct === 100 ? "text-emerald-600" : "text-violet-600";
}

export function progressStroke(pct) {
  return pct === 100 ? "#059669" : "#7c5cc9";
}

export function cardAccent(pct) {
  if (pct === 100) return "border-l-emerald-500";
  if (pct > 0)     return "border-l-violet-600";
  return "border-l-transparent";
}

export function statusBadge(pct) {
  if (pct === 100) return { text: "Completado",  cls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" };
  if (pct === 0)   return { text: "Sin iniciar", cls: "text-ink-400   bg-ink-50    dark:bg-ink-800"    };
  return                   { text: "En curso",   cls: "text-violet-600 bg-violet-50 dark:bg-violet-900/30" };
}

export function fmtMonto(etapa) {
  if (!etapa.monto) return null;
  return `${(etapa.moneda || "ARS") === "USD" ? "USD " : "$ "}${Number(etapa.monto).toLocaleString("es-AR")}`;
}

export function calcFinanciero(etapas) {
  const conMonto = etapas.filter(e => e.monto && Number(e.monto) > 0);
  if (!conMonto.length) return null;
  const sum = (arr) => arr.reduce((acc, e) => acc + Number(e.monto), 0);
  const porMoneda = (moneda) => ({
    total:   sum(conMonto.filter(e => (e.moneda || "ARS") === moneda)),
    cobrado: sum(conMonto.filter(e => (e.moneda || "ARS") === moneda && e.firma)),
  });
  const ars = porMoneda("ARS");
  const usd = porMoneda("USD");
  return {
    ars: ars.total > 0 ? ars : null,
    usd: usd.total > 0 ? usd : null,
  };
}

export function fmtNum(n, moneda) {
  const prefix = moneda === "USD" ? "USD " : "$ ";
  return `${prefix}${Number(n).toLocaleString("es-AR")}`;
}

export function traducirError(code) {
  const map = {
    "auth/user-not-found":       "Email no registrado",
    "auth/wrong-password":       "Contraseña incorrecta",
    "auth/email-already-in-use": "El email ya está registrado",
    "auth/weak-password":        "La contraseña debe tener al menos 6 caracteres",
    "auth/invalid-email":        "Email inválido",
    "auth/invalid-credential":   "Email o contraseña incorrectos",
  };
  return map[code] || "Error al ingresar. Intentá de nuevo.";
}
