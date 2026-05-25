import { useState } from "react";
import { Wallet, Menu, Plus, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import AvanzaLogo from "./AvanzaLogo";
import { guardarObra } from "../firebase";

function fmt(n, moneda) {
  if (n == null || n === "" || Number(n) === 0) return null;
  return (moneda === "USD" ? "USD " : "$ ") + Number(n).toLocaleString("es-AR");
}

function fmtFecha(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d.getDate()} ${meses[d.getMonth()]}`;
}

function MetricCard({ label, value, sub, color }) {
  const colors = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    violet:  "text-violet-600 dark:text-violet-400",
    ink:     "text-ink-500 dark:text-ink-400",
    amber:   "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl p-4 border border-ink-100 dark:border-ink-800">
      <div className="text-[10px] font-bold tracking-widest uppercase text-ink-400 dark:text-ink-500 mb-1.5">{label}</div>
      <div className={`text-[20px] font-bold leading-tight ${colors[color] || colors.ink}`}>{value || "—"}</div>
      {sub && <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function TricolorBar({ firmados, alcanzados, total }) {
  if (total === 0) return null;
  const pFirmado   = Math.round(firmados / total * 100);
  const pAlcanzado = Math.round(alcanzados / total * 100);
  const pPendiente = 100 - pFirmado - pAlcanzado;
  return (
    <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-ink-100 dark:bg-ink-800">
      {pFirmado > 0   && <div style={{ width:`${pFirmado}%`   }} className="bg-emerald-500 transition-all" />}
      {pAlcanzado > 0 && <div style={{ width:`${pAlcanzado}%` }} className="bg-violet-500 transition-all" />}
      {pPendiente > 0 && <div style={{ width:`${pPendiente}%` }} className="bg-ink-200 dark:bg-ink-700 transition-all" />}
    </div>
  );
}

function HitoRow({ hito, idx }) {
  const estado = hito.estado || "pendiente";
  const isFirmado   = estado === "firmado";
  const isAlcanzado = estado === "alcanzado";

  let badgeCls, badgeText, dotCls;
  if (isFirmado) {
    badgeCls = "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400";
    badgeText = "Firmado";
    dotCls = "bg-emerald-500";
  } else if (isAlcanzado) {
    badgeCls = "text-violet-700 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400";
    badgeText = "Pendiente firma";
    dotCls = "bg-violet-500";
  } else {
    badgeCls = "text-ink-500 bg-ink-100 dark:bg-ink-800 dark:text-ink-400";
    badgeText = "Pendiente";
    dotCls = "bg-ink-300 dark:bg-ink-600";
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
      isFirmado   ? "border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10" :
      isAlcanzado ? "border-violet-100 dark:border-violet-900/30 bg-violet-50/40 dark:bg-violet-950/10" :
                    "border-ink-100 dark:border-ink-800"
    }`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${dotCls}`}>
        {isFirmado ? <Check size={13} className="text-white" /> : <span className="text-white text-[11px] font-bold">{idx + 1}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-ink dark:text-ink-50 text-[13px]">{hito.porcentaje}% avance global</span>
          {hito.descripcion && <span className="text-ink-400 dark:text-ink-500 text-[12px]">· {hito.descripcion}</span>}
        </div>
        {hito.monto ? (
          <div className="text-[13px] font-bold mt-0.5 text-ink-600 dark:text-ink-300">
            {fmt(hito.monto, hito.moneda)}
          </div>
        ) : null}
        <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-0.5">
          {isFirmado && hito.nombreFirmante ? `Firmado por ${hito.nombreFirmante}${hito.fechaFirma ? " · " + fmtFecha(hito.fechaFirma) : ""}` :
           isAlcanzado && hito.fechaAlcanzado ? `Alcanzado ${fmtFecha(hito.fechaAlcanzado)}` : ""}
        </div>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeCls}`}>{badgeText}</span>
    </div>
  );
}

function ModalConfigHitos({ obra, onClose }) {
  const existentes = (obra.hitosCobroModoB || []).map(h => ({ ...h }));
  const [filas, setFilas] = useState(
    existentes.length > 0
      ? existentes
      : [{ id: `h_${Date.now()}_0`, porcentaje: "", monto: "", moneda: "ARS", descripcion: "" },
         { id: `h_${Date.now()}_1`, porcentaje: "", monto: "", moneda: "ARS", descripcion: "" }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  function addFila() {
    if (filas.length >= 6) return;
    setFilas(prev => [...prev, { id: `h_${Date.now()}`, porcentaje: "", monto: "", moneda: "ARS", descripcion: "" }]);
  }

  function removeFila(id) {
    if (filas.length <= 2) return;
    setFilas(prev => prev.filter(f => f.id !== id));
  }

  function update(id, key, val) {
    setFilas(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f));
  }

  async function guardar() {
    setError("");
    for (const f of filas) {
      if (!f.porcentaje || isNaN(Number(f.porcentaje)) || Number(f.porcentaje) < 1 || Number(f.porcentaje) > 100) {
        setError("Todos los hitos deben tener un porcentaje entre 1 y 100."); return;
      }
    }
    const pcts = filas.map(f => Number(f.porcentaje));
    if (new Set(pcts).size !== pcts.length) { setError("Los porcentajes no pueden repetirse."); return; }
    setSaving(true);
    const sorted = [...filas].sort((a, b) => Number(a.porcentaje) - Number(b.porcentaje));
    const merged = sorted.map(f => {
      const exist = existentes.find(e => e.id === f.id) || {};
      return {
        id: f.id,
        porcentaje: Number(f.porcentaje),
        monto: f.monto !== "" ? Number(f.monto) : null,
        moneda: f.moneda || "ARS",
        descripcion: f.descripcion || "",
        estado: exist.estado || "pendiente",
        fechaAlcanzado: exist.fechaAlcanzado || null,
        fechaFirma: exist.fechaFirma || null,
        nombreFirmante: exist.nombreFirmante || null,
      };
    });
    await guardarObra(obra.id, { hitosCobroModoB: merged });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-ink/50">
      <div className="bg-white dark:bg-ink-900 rounded-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-ink-900 px-5 py-4 border-b border-ink-100 dark:border-ink-800 flex items-center justify-between">
          <div className="font-bold text-ink dark:text-ink-50 text-[16px]">Configurar hitos de cobro</div>
          <button onClick={onClose} className="border-0 bg-transparent p-1 cursor-pointer text-ink-400 dark:text-ink-500"><X size={18} /></button>
        </div>
        <div className="p-5">
          <div className="text-[12px] text-ink-500 dark:text-ink-400 mb-4">
            Definí entre 2 y 6 hitos. Cuando el avance global llegue al porcentaje, el cliente recibirá una solicitud de firma.
          </div>
          <div className="flex flex-col gap-3">
            {filas.map((f, i) => (
              <div key={f.id} className="border border-ink-100 dark:border-ink-800 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 justify-between">
                  <div className="text-[11px] font-bold text-ink-400 dark:text-ink-500 tracking-widest uppercase">Hito {i + 1}</div>
                  {filas.length > 2 && (
                    <button onClick={() => removeFila(f.id)} className="border-0 bg-transparent p-0.5 cursor-pointer text-ink-300 dark:text-ink-600 hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-shrink-0">
                    <div className="text-[10px] text-ink-400 mb-0.5">% avance</div>
                    <input type="number" min="1" max="100" value={f.porcentaje}
                      onChange={e => update(f.id, "porcentaje", e.target.value)}
                      placeholder="50"
                      className="w-16 border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink dark:text-ink-50 rounded-lg px-2 py-1.5 text-[13px] font-bold" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-ink-400 mb-0.5">Monto</div>
                    <div className="flex gap-1">
                      <select value={f.moneda} onChange={e => update(f.id, "moneda", e.target.value)}
                        className="border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink dark:text-ink-50 rounded-lg px-1.5 py-1.5 text-[12px]">
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                      </select>
                      <input type="number" value={f.monto} onChange={e => update(f.id, "monto", e.target.value)}
                        placeholder="Opcional"
                        className="flex-1 border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink dark:text-ink-50 rounded-lg px-2 py-1.5 text-[13px]" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-ink-400 mb-0.5">Descripción (opcional)</div>
                  <input type="text" value={f.descripcion} onChange={e => update(f.id, "descripcion", e.target.value)}
                    placeholder="Ej: Obra gruesa terminada"
                    className="w-full border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink dark:text-ink-50 rounded-lg px-2 py-1.5 text-[13px]" />
                </div>
              </div>
            ))}
          </div>

          {filas.length < 6 && (
            <button onClick={addFila}
              className="mt-3 w-full border border-dashed border-ink-200 dark:border-ink-700 rounded-xl py-2.5 text-[13px] font-semibold text-ink-400 dark:text-ink-500 flex items-center justify-center gap-1.5 cursor-pointer bg-transparent hover:border-violet-400 hover:text-violet-600 transition-colors">
              <Plus size={14} /> Agregar hito
            </button>
          )}

          {error && <div className="mt-3 text-[12px] text-red-500 font-semibold">{error}</div>}

          <button onClick={guardar} disabled={saving}
            className="mt-4 w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 font-bold text-[14px] border-0 cursor-pointer disabled:opacity-60 transition-colors">
            {saving ? "Guardando…" : "Guardar hitos"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ObraFinanciero({ obra }) {
  const [expanded,   setExpanded]   = useState(true);
  const [modalConfig, setModalConfig] = useState(false);
  const hitos = obra.hitosCobroModoB || [];

  const conMonto = hitos.filter(h => h.monto);
  // Calcular métricas por moneda
  const calcMetricas = (moneda) => {
    const h = conMonto.filter(x => (x.moneda || "ARS") === moneda);
    const total    = h.reduce((s, x) => s + Number(x.monto), 0);
    const cobrado  = h.filter(x => x.estado === "firmado").reduce((s, x) => s + Number(x.monto), 0);
    const pfirma   = h.filter(x => x.estado === "alcanzado").reduce((s, x) => s + Number(x.monto), 0);
    const saldo    = h.filter(x => x.estado !== "firmado" && x.estado !== "alcanzado").reduce((s, x) => s + Number(x.monto), 0);
    return total > 0 ? { total, cobrado, pfirma, saldo } : null;
  };
  const ars = calcMetricas("ARS");
  const usd = calcMetricas("USD");

  const total   = hitos.length;
  const firmados   = hitos.filter(h => h.estado === "firmado").length;
  const alcanzados = hitos.filter(h => h.estado === "alcanzado").length;

  // Avance global de la obra
  const todosItems  = (obra.etapas || []).flatMap(e => e.items || []);
  const pctObra = todosItems.length
    ? Math.round(todosItems.filter(i => i.estado === "completado").length / todosItems.length * 100)
    : 0;

  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 overflow-hidden">
      {/* Obra header */}
      <div className="px-4 pt-4 pb-3 border-b border-ink-100 dark:border-ink-800">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-bold text-ink dark:text-ink-50 text-[15px] leading-tight truncate">
              {obra.obraInfo?.nombre || "Sin nombre"}
            </div>
            {obra.obraInfo?.cliente && (
              <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-0.5">{obra.obraInfo.cliente}</div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-[12px] font-bold text-ink-400 dark:text-ink-500">{pctObra}%</div>
            <button onClick={() => setModalConfig(true)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-colors">
              {hitos.length === 0 ? "+ Configurar" : "Editar hitos"}
            </button>
            <button onClick={() => setExpanded(v => !v)}
              className="border-0 bg-transparent p-0.5 cursor-pointer text-ink-400">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Tricolor bar */}
        {total > 0 && (
          <div className="mt-3">
            <TricolorBar firmados={firmados} alcanzados={alcanzados} total={total} />
            <div className="flex gap-3 mt-1.5">
              {firmados > 0   && <div className="flex items-center gap-1 text-[10px] text-ink-400"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{firmados} cobrado{firmados > 1 ? "s" : ""}</div>}
              {alcanzados > 0 && <div className="flex items-center gap-1 text-[10px] text-ink-400"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />{alcanzados} pend. firma</div>}
              {total - firmados - alcanzados > 0 && <div className="flex items-center gap-1 text-[10px] text-ink-400"><span className="w-2 h-2 rounded-full bg-ink-300 dark:bg-ink-600 inline-block" />{total - firmados - alcanzados} pendiente{total - firmados - alcanzados > 1 ? "s" : ""}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Métricas */}
      {(ars || usd) && expanded && (
        <div className={`grid gap-2 p-4 ${ars && usd ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"}`}>
          {[ars ? { ...ars, moneda: "ARS" } : null, usd ? { ...usd, moneda: "USD" } : null].filter(Boolean).map(m => (
            <>
              <MetricCard key={`t_${m.moneda}`} label="Total contrato" value={fmt(m.total, m.moneda)} color="ink" />
              <MetricCard key={`c_${m.moneda}`} label="Cobrado" value={fmt(m.cobrado, m.moneda)} color="emerald" sub={`${firmados} hito${firmados !== 1 ? "s" : ""} firmado${firmados !== 1 ? "s" : ""}`} />
              <MetricCard key={`p_${m.moneda}`} label="Pend. firma" value={fmt(m.pfirma, m.moneda)} color="violet" sub={alcanzados > 0 ? `${alcanzados} hito${alcanzados !== 1 ? "s" : ""}` : null} />
              <MetricCard key={`s_${m.moneda}`} label="Saldo pend." value={fmt(m.saldo, m.moneda)} color="ink" />
            </>
          ))}
        </div>
      )}

      {/* Lista de hitos */}
      {expanded && hitos.length > 0 && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          {[...hitos].sort((a, b) => Number(a.porcentaje) - Number(b.porcentaje)).map((h, i) => (
            <HitoRow key={h.id} hito={h} idx={i} />
          ))}
        </div>
      )}

      {expanded && hitos.length === 0 && (
        <div className="px-4 pb-4 pt-2 text-center text-[12px] text-ink-400 dark:text-ink-500">
          No hay hitos configurados. Tocá "Configurar" para definir el esquema de cobro.
        </div>
      )}

      {modalConfig && <ModalConfigHitos obra={obra} onClose={() => setModalConfig(false)} />}
    </div>
  );
}

export default function VistaFinanciero({ obras, onOpenSidebar }) {
  const obrasConHitos = obras.filter(o => {
    const rids = o.obraInfo?.rubros?.length ? o.obraInfo.rubros : o.obraInfo?.rubro ? [o.obraInfo.rubro] : [];
    return rids.length > 0 || (o.hitosCobroModoB || []).length > 0;
  });

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink pb-10">

      {/* Header */}
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-700 px-5 md:px-8 pt-7 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={onOpenSidebar}
            className="md:hidden bg-ink-50 dark:bg-ink-800 border-0 rounded-xl p-2 cursor-pointer text-ink-500 dark:text-ink-400 flex-shrink-0">
            <Menu size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <AvanzaLogo size={12} className="text-violet-600 dark:text-violet-400" />
              <span className="text-[10px] font-bold tracking-widest text-ink-400 dark:text-ink-500">AVANZA</span>
            </div>
            <div className="text-[26px] font-bold text-ink dark:text-ink-50 tracking-[-0.04em] leading-none">Financiero</div>
            <div className="text-[12px] text-ink-400 dark:text-ink-500 mt-1">Hitos de cobro por avance</div>
          </div>
          <div className="ml-auto">
            <Wallet size={20} className="text-ink-300 dark:text-ink-600" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 pt-6 max-w-3xl mx-auto flex flex-col gap-4">
        {obrasConHitos.length === 0 && (
          <div className="text-center py-16 text-ink-400 dark:text-ink-500">
            <Wallet size={32} className="mx-auto mb-3 opacity-30" />
            <div className="font-bold text-[14px]">Sin obras activas</div>
            <div className="text-[12px] mt-1">Las obras con rubros configurados aparecerán aquí.</div>
          </div>
        )}
        {obrasConHitos.map(o => (
          <ObraFinanciero key={o.id} obra={o} />
        ))}
      </div>
    </div>
  );
}
