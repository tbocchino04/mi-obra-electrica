import { useState } from "react";
import { Wallet, Menu, User, FileCheck, Loader2, Check } from "lucide-react";
import AvanzaLogo from "./AvanzaLogo";
import { RUBROS } from "../constants/data";
import ModalFirma from "./ModalFirma";
import { guardarObra } from "../firebase";

function fmt(n, moneda) {
  if (n == null || n === "") return null;
  return (moneda === "USD" ? "USD " : "$ ") + Number(n).toLocaleString("es-AR");
}

function SectionHeader({ label, color }) {
  const cls = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    violet:  "text-violet-600 dark:text-violet-400",
    ink:     "text-ink-400 dark:text-ink-500",
  }[color] || "text-ink-400 dark:text-ink-500";
  return (
    <div className={`px-4 pt-3 pb-1.5 text-[9px] font-bold tracking-widest uppercase ${cls}`}>
      {label}
    </div>
  );
}

export default function VistaFinanciero({ obras, onOpenSidebar }) {
  const [modalFirma,   setModalFirma]   = useState(null); // { obra, rid }
  const [montoInputs,  setMontoInputs]  = useState({});   // key → monto string
  const [monedaInputs, setMonedaInputs] = useState({});   // key → "ARS"|"USD"
  const [savingMonto,  setSavingMonto]  = useState({});

  const obras_ = obras.filter(o => {
    const rids = o.obraInfo?.rubros?.length
      ? o.obraInfo.rubros
      : o.obraInfo?.rubro ? [o.obraInfo.rubro] : [];
    return rids.length > 0;
  });

  async function onFirmaConfirm(data) {
    const { obra, rid } = modalFirma;
    const cur = obra.rubrosConfig || {};
    await guardarObra(obra.id, {
      rubrosConfig: { ...cur, [rid]: { ...(cur[rid] || {}), firma: { ...data, timestamp: Date.now() } } },
    });
  }

  async function guardarMonto(obra, rid) {
    const key = `${obra.id}_${rid}`;
    const monto = montoInputs[key];
    if (!monto && monto !== "0") return;
    const moneda = monedaInputs[key] || "ARS";
    setSavingMonto(s => ({ ...s, [key]: true }));
    try {
      const cur = obra.rubrosConfig || {};
      await guardarObra(obra.id, {
        rubrosConfig: { ...cur, [rid]: { ...(cur[rid] || {}), monto: Number(monto), moneda } },
      });
      setMontoInputs(s => { const n = { ...s }; delete n[key]; return n; });
    } finally {
      setSavingMonto(s => ({ ...s, [key]: false }));
    }
  }

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
          </div>
        </div>
      </div>

      {/* Obras */}
      <div className="px-4 md:px-8 pt-4 space-y-4 max-w-3xl mx-auto">
        {obras_.length === 0 ? (
          <div className="text-center py-20">
            <Wallet size={44} className="text-ink-200 dark:text-ink-700 mx-auto mb-4" />
            <div className="font-bold text-base text-ink dark:text-ink-50 mb-1.5">Sin rubros configurados</div>
            <div className="text-sm text-ink-500 dark:text-ink-400">Abrí una obra y configurá los rubros.</div>
          </div>
        ) : obras_.map(obra => {
          const rids = obra.obraInfo?.rubros?.length
            ? obra.obraInfo.rubros
            : obra.obraInfo?.rubro ? [obra.obraInfo.rubro] : [];
          const config = obra.rubrosConfig || {};

          // Calcular datos por rubro
          const rubroData = rids.map(rid => {
            const rc  = RUBROS.find(r => r.id === rid);
            const cfg = config[rid] || {};
            const etapas = (obra.etapas || []).filter(e => (e.rubro || obra.obraInfo?.rubro) === rid);
            const items  = etapas.flatMap(e => e.items || []);
            const tot    = items.length;
            const comp   = items.filter(i => i.estado === "completado").length;
            const pct    = tot ? Math.round(comp / tot * 100) : 0;
            const monto  = (cfg.monto != null && cfg.monto !== "") ? Number(cfg.monto) : null;
            const moneda = cfg.moneda || "ARS";
            const firma  = cfg.firma || null;
            return { rid, rc, cfg, pct, tot, comp, monto, moneda, firma };
          });

          // Secciones mutuamente excluyentes
          const sinMonto     = rubroData.filter(r => r.monto === null);
          const conMonto     = rubroData.filter(r => r.monto !== null);
          const cobrados     = conMonto.filter(r => r.firma);
          const listosCobrar = conMonto.filter(r => !r.firma && r.pct === 100);
          const enCurso      = conMonto.filter(r => !r.firma && r.pct < 100);

          // Métricas por moneda
          const monedas = [...new Set(conMonto.map(r => r.moneda))];
          const metricas = monedas.map(moneda => {
            const lista    = conMonto.filter(r => r.moneda === moneda);
            const total    = lista.reduce((a, r) => a + r.monto, 0);
            const cobrado  = lista.filter(r => r.firma).reduce((a, r) => a + r.monto, 0);
            const listo    = lista.filter(r => !r.firma && r.pct === 100).reduce((a, r) => a + r.monto, 0);
            const pendiente = Math.max(0, total - cobrado - listo);
            return { moneda, total, cobrado, listo, pendiente };
          });

          // Barra tricolor
          const barCobrado = conMonto.length ? Math.round(cobrados.length     / conMonto.length * 100) : 0;
          const barListo   = conMonto.length ? Math.round(listosCobrar.length / conMonto.length * 100) : 0;
          const barPend    = Math.max(0, 100 - barCobrado - barListo);

          return (
            <div key={obra.id} className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 overflow-hidden">

              {/* Encabezado obra */}
              <div className="px-4 py-4 border-b border-ink-100 dark:border-ink-800">
                <div className="font-bold text-[15px] text-ink dark:text-ink-50 tracking-tight">
                  {obra.obraInfo?.nombre || "Sin nombre"}
                </div>
                {obra.obraInfo?.cliente && (
                  <div className="flex items-center gap-1 text-[11px] text-ink-400 dark:text-ink-500 mt-0.5">
                    <User size={9} /> {obra.obraInfo.cliente}
                  </div>
                )}
              </div>

              {/* Métricas + barra */}
              {metricas.length > 0 && metricas.map(({ moneda, total, cobrado, listo, pendiente }) => (
                <div key={moneda} className="px-4 pt-4 pb-3 border-b border-ink-100 dark:border-ink-800">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {[
                      { label: "Total presupuestado", val: total,    cls: "text-ink dark:text-ink-50" },
                      { label: "Cobrado",             val: cobrado,  cls: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Listo para cobrar",   val: listo,    cls: "text-violet-600 dark:text-violet-400" },
                      { label: "Saldo pendiente",     val: pendiente,cls: "text-ink-400 dark:text-ink-500" },
                    ].map(({ label, val, cls }) => (
                      <div key={label} className="bg-ink-50 dark:bg-ink-800 rounded-xl px-3 py-2.5">
                        <div className="text-[9px] font-bold tracking-wider uppercase text-ink-400 dark:text-ink-500 mb-0.5 leading-tight">{label}</div>
                        <div className={`text-[12px] font-bold leading-snug ${cls}`}>
                          {fmt(val, moneda) || "$ 0"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Barra tricolor */}
                  <div className="h-2 rounded-full overflow-hidden flex gap-px">
                    {barCobrado > 0 && (
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${barCobrado}%` }} />
                    )}
                    {barListo > 0 && (
                      <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${barListo}%` }} />
                    )}
                    {barPend > 0 && (
                      <div className="h-full bg-ink-200 dark:bg-ink-700 transition-all duration-500" style={{ width: `${barPend}%` }} />
                    )}
                    {barCobrado === 0 && barListo === 0 && (
                      <div className="h-full bg-ink-200 dark:bg-ink-700 w-full" />
                    )}
                  </div>
                  <div className="flex gap-3 mt-1.5">
                    {[
                      { dot: "bg-emerald-500", label: "Cobrado",          cls: "text-emerald-600 dark:text-emerald-400" },
                      { dot: "bg-violet-500",  label: "Listo para cobrar",cls: "text-violet-600 dark:text-violet-400" },
                      { dot: "bg-ink-300 dark:bg-ink-600", label: "Pendiente", cls: "text-ink-400 dark:text-ink-500" },
                    ].map(({ dot, label, cls }) => (
                      <span key={label} className={`flex items-center gap-1 text-[9px] font-semibold ${cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Lista de rubros por sección */}
              <div>
                {/* ── Cobrados ── */}
                {cobrados.length > 0 && (
                  <>
                    <SectionHeader label="Cobrados" color="emerald" />
                    {cobrados.map(r => (
                      <div key={r.rid} className="px-4 py-3 flex items-center gap-3 border-b border-ink-50 dark:border-ink-800/60 last:border-b-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: r.rc?.hex }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-ink dark:text-ink-100 truncate">{r.rc?.label || r.rid}</div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Firmado por {r.firma.firmante} · {r.firma.fecha?.split(",")[0]}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-[13px] font-bold text-ink dark:text-ink-50">{fmt(r.monto, r.moneda)}</div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 justify-end mt-0.5">
                            <FileCheck size={9} /> Cobrado
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* ── Listo para cobrar ── */}
                {listosCobrar.length > 0 && (
                  <>
                    <SectionHeader label="Listo para cobrar" color="violet" />
                    {listosCobrar.map(r => (
                      <div key={r.rid} className="px-4 py-3 border-b border-ink-50 dark:border-ink-800/60 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.rc?.hex }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold text-ink dark:text-ink-100 truncate">{r.rc?.label || r.rid}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="flex-1 h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full w-full" />
                              </div>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">100%</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-[13px] font-bold text-ink dark:text-ink-50">{fmt(r.monto, r.moneda)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setModalFirma({ obra, rid: r.rid })}
                          className="mt-2.5 w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-bold rounded-xl border-0 cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                          <FileCheck size={12} /> Emitir certificado de cobro
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* ── En curso ── */}
                {enCurso.length > 0 && (
                  <>
                    <SectionHeader label="En curso" color="ink" />
                    {enCurso.map(r => (
                      <div key={r.rid} className="px-4 py-3 flex items-center gap-3 border-b border-ink-50 dark:border-ink-800/60 last:border-b-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.rc?.hex }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-ink dark:text-ink-100 truncate">{r.rc?.label || r.rid}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="flex-1 h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-[width_.4s_ease]"
                                style={{ width: `${r.pct}%`, background: r.rc?.hex || "#8b5cf6" }} />
                            </div>
                            <span className="text-[10px] font-semibold text-ink-400 dark:text-ink-500">{r.pct}%</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-[13px] font-bold text-ink dark:text-ink-50">{fmt(r.monto, r.moneda)}</div>
                          <div className="text-[10px] text-ink-400 dark:text-ink-500 mt-0.5">{r.comp}/{r.tot} ítems</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* ── Sin monto ── */}
                {sinMonto.length > 0 && (
                  <>
                    <SectionHeader label="Sin monto configurado" color="ink" />
                    {sinMonto.map(r => {
                      const key  = `${obra.id}_${r.rid}`;
                      const inputMonto  = montoInputs[key]  ?? "";
                      const inputMoneda = monedaInputs[key] ?? "ARS";
                      return (
                        <div key={r.rid} className="px-4 py-3 flex items-center gap-2.5 border-b border-ink-50 dark:border-ink-800/60 last:border-b-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.rc?.hex }} />
                          <div className="text-[12px] font-semibold text-ink dark:text-ink-100 flex-1 min-w-0 truncate">{r.rc?.label || r.rid}</div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <input
                              type="number"
                              placeholder="Monto"
                              value={inputMonto}
                              onChange={e => setMontoInputs(s => ({ ...s, [key]: e.target.value }))}
                              className="w-24 px-2 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 text-[12px] bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-50 outline-none focus:border-violet-500 transition-colors"
                            />
                            <button
                              onClick={() => setMonedaInputs(s => ({ ...s, [key]: s[key] === "USD" ? "ARS" : "USD" }))}
                              className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors flex-shrink-0 ${
                                inputMoneda === "USD"
                                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                  : "border-violet-400 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                              }`}>
                              {inputMoneda}
                            </button>
                            <button
                              onClick={() => guardarMonto(obra, r.rid)}
                              disabled={!inputMonto || savingMonto[key]}
                              className="w-8 h-8 rounded-lg bg-ink dark:bg-white text-white dark:text-ink border-0 cursor-pointer disabled:opacity-40 flex items-center justify-center flex-shrink-0">
                              {savingMonto[key] ? <Loader2 size={11} className="animate-spin" /> : <Check size={12} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal firma */}
      {modalFirma && (() => {
        const { obra, rid } = modalFirma;
        const cfg = (obra.rubrosConfig || {})[rid] || {};
        const rc  = RUBROS.find(r => r.id === rid);
        return (
          <ModalFirma
            etapa={{ id: rid, nombre: rc?.label || rid, monto: cfg.monto != null ? Number(cfg.monto) : undefined, moneda: cfg.moneda || "ARS" }}
            obraInfo={obra.obraInfo || {}}
            onConfirm={onFirmaConfirm}
            onClose={() => setModalFirma(null)}
          />
        );
      })()}
    </div>
  );
}
