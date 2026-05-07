import { useState } from "react";
import { Sun, Moon, PenLine, Check, FileCheck } from "lucide-react";
import AvanzaLogo from "./AvanzaLogo";
import { guardarObra } from "../firebase";
import { RUBROS } from "../constants/data";
import { useTheme } from "../hooks/useTheme";
import ModalFirma from "./ModalFirma";
import { pctEtapa } from "../utils/helpers";

function fmtFechaCorta(iso) {
  if (!iso) return null;
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const [, m, d] = iso.split("-");
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}`;
}

function diasHasta(iso) {
  if (!iso) return null;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  return Math.round((new Date(iso + "T00:00:00") - hoy) / 86400000);
}

function fmtTimestamp(ts) {
  const diff = Math.round((Date.now() - ts) / 86400000);
  if (diff === 0) return "hoy";
  if (diff === 1) return "ayer";
  if (diff < 7) return `hace ${diff} días`;
  const d = new Date(ts);
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d.getDate()} ${meses[d.getMonth()]}`;
}

function StackedProgress({ rubros, height = 10 }) {
  if (!rubros.length) return null;
  return (
    <div style={{ display:"flex", height, borderRadius:999, overflow:"hidden", gap:3 }}>
      {rubros.map(r => (
        <div key={r.id} style={{ flex:1, background: r.hex + "28", borderRadius:999, overflow:"hidden" }}>
          <div style={{ width:`${r.pct}%`, height:"100%", background: r.hex, transition:"width .5s ease" }} />
        </div>
      ))}
    </div>
  );
}

export default function VistaCliente({ etapas, obraInfo, onVolver, esPublica = false, obraId = null, rubrosConfig = {} }) {
  const [modalFirma, setModalFirma] = useState(null);
  const { dark, toggle: toggleDark } = useTheme();

  const todosItems  = etapas.flatMap(e => e.items || []);
  const totalItems  = todosItems.length;
  const completados = todosItems.filter(i => i.estado === "completado").length;
  const totalPct    = totalItems ? Math.round(completados / totalItems * 100) : 0;

  const rubrosActivos = obraInfo.rubros?.length
    ? obraInfo.rubros
    : (obraInfo.rubro ? [obraInfo.rubro] : []);

  function getRubroDeEtapa(e) { return e.rubro || obraInfo.rubro || null; }

  const rubrosData = rubrosActivos.map(rid => {
    const rc      = RUBROS.find(r => r.id === rid);
    const rEtapas = etapas.filter(e => getRubroDeEtapa(e) === rid);
    const rItems  = rEtapas.flatMap(e => e.items || []);
    const rComp   = rItems.filter(i => i.estado === "completado").length;
    const rPct    = rItems.length ? Math.round(rComp / rItems.length * 100) : 0;
    const etapaActivaIdx = rEtapas.findIndex(e => pctEtapa(e) < 100);
    const porFirmar = rEtapas.some(e => pctEtapa(e) === 100 && !e.firma);
    const cfg       = rubrosConfig[rid] || {};
    const hoy       = new Date().toISOString().slice(0, 10);
    const atrasado  = cfg.fechaEstimadaFin && cfg.fechaEstimadaFin < hoy && rPct < 100;
    return {
      id: rid,
      label: rc?.label || rid,
      hex:   rc?.hex   || "#8b5cf6",
      pct:   rPct,
      etapas: rEtapas.map(e => e.nombre),
      etapaActiva: etapaActivaIdx >= 0 ? etapaActivaIdx : rEtapas.length,
      porFirmar,
      fechaFin: cfg.fechaEstimadaFin || null,
      atrasado,
    };
  });

  const finDates  = rubrosData.map(r => r.fechaFin).filter(Boolean).sort();
  const finFinal  = finDates[finDates.length - 1];
  const dias      = diasHasta(finFinal);
  const atrasados = rubrosData.filter(r => r.atrasado).length;
  const porFirmarEtapas = etapas.filter(e => pctEtapa(e) === 100 && !e.firma);

  const actividadReciente = etapas
    .flatMap(e => (e.items || [])
      .filter(i => i.ultimoCambio?.timestamp && i.estado === "completado")
      .map(i => ({
        tarea:      i.tarea,
        timestamp:  i.ultimoCambio.timestamp,
        rubroId:    getRubroDeEtapa(e),
        etapaNombre: e.nombre,
      }))
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const pctColor = totalPct === 100 ? "#047857" : totalPct > 50 ? "#7c5cc9" : "var(--ink)";

  return (
    <div className={"vc " + (dark ? "dark" : "")} style={{ background:"var(--bg)", color:"var(--ink)", minHeight:"100dvh", fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"28px 20px 64px" }}>

        {/* Top nav */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:"var(--ink-500)" }}>
            {!esPublica && (
              <button onClick={onVolver} style={{ background:"transparent", border:0, color:"var(--ink-400)", cursor:"pointer", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4, padding:0, marginRight:4 }}>
                ← Volver
              </button>
            )}
            <AvanzaLogo size={13} className="text-violet-600 dark:text-violet-400" />
            <span style={{ fontWeight:700, color:"var(--ink)", fontSize:12 }}>AVANZA</span>
            <span>· obra compartida</span>
          </div>
          <button onClick={toggleDark} style={{ border:"1px solid var(--border)", background:"var(--card)", borderRadius:999, padding:"5px 8px", cursor:"pointer", color:"var(--ink-500)", display:"flex", alignItems:"center" }}>
            {dark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>

        {/* Hero title */}
        <h1 style={{ fontSize:34, fontWeight:800, letterSpacing:"-0.035em", margin:0, lineHeight:1.05, color:"var(--ink)" }}>
          {obraInfo.nombre}
        </h1>
        {obraInfo.cliente && (
          <div style={{ fontSize:13, color:"var(--ink-500)", marginTop:5 }}>{obraInfo.cliente}</div>
        )}
        {obraInfo.direccion && (
          <div style={{ fontSize:12, color:"var(--ink-400)", marginTop:3 }}>{obraInfo.direccion}</div>
        )}

        {/* Big % card */}
        <div style={{ marginTop:22, padding:"22px 24px", background:"var(--card)", border:"1px solid var(--border)", borderRadius:18, display:"flex", gap:24, alignItems:"center" }}>
          <div style={{ flexShrink:0 }}>
            <div style={{ fontSize:60, fontWeight:800, letterSpacing:"-0.05em", lineHeight:.85, fontVariantNumeric:"tabular-nums" }}>
              <span style={{ color: pctColor }}>{totalPct}</span>
              <span style={{ fontSize:24, color:"var(--ink-400)" }}>%</span>
            </div>
            <div style={{ fontSize:11, color:"var(--ink-400)", letterSpacing:".1em", textTransform:"uppercase", marginTop:4 }}>
              de tu obra está hecha
            </div>
          </div>

          <div style={{ flex:1, paddingLeft:24, borderLeft:"1px solid var(--border)", minWidth:0 }}>
            <div style={{ fontSize:13, color:"var(--ink-500)", marginBottom:10, lineHeight:1.5 }}>
              {atrasados > 0
                ? <>Hay <b style={{ color:"#dc2626" }}>{atrasados} {atrasados === 1 ? "rubro con atraso" : "rubros con atraso"}</b>. Te vamos a contar.</>
                : finFinal
                  ? <>Vamos <b style={{ color:"#047857" }}>en fecha</b>. Estimamos terminar el <b>{fmtFechaCorta(finFinal)}</b>{dias !== null && dias > 0 ? <> · faltan <b>{dias} días</b></> : null}.</>
                  : <>Tu obra avanza correctamente.</>
              }
            </div>
            {rubrosData.length > 0 ? (
              <>
                <StackedProgress rubros={rubrosData} height={10} />
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px", marginTop:10 }}>
                  {rubrosData.map(r => (
                    <div key={r.id} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--ink-500)" }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:r.hex, display:"inline-block", flexShrink:0 }} />
                      <span style={{ fontWeight:700, color:"var(--ink)" }}>{r.label}</span>
                      <span>· {r.pct === 100 ? "✓" : `${r.pct}%`}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ height:10, borderRadius:999, background:"var(--border)", overflow:"hidden" }}>
                <div style={{ width:`${totalPct}%`, height:"100%", background:"#7c5cc9", transition:"width .5s ease" }} />
              </div>
            )}
          </div>
        </div>

        {/* Conformidades pendientes */}
        {porFirmarEtapas.length > 0 && esPublica && (
          <div style={{ marginTop:16, padding:"16px 20px", background:"#fef3c7", borderRadius:14, display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#f59e0b", display:"inline-flex", alignItems:"center", justifyContent:"center", color:"white", flexShrink:0 }}>
              <PenLine size={17} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, color:"#78350f", fontSize:14 }}>
                Te esperamos para firmar conformidad
              </div>
              <div style={{ fontSize:12, color:"#92400e", marginTop:2 }}>
                {porFirmarEtapas.map(e => e.nombre).join(" · ")}
              </div>
            </div>
            <button onClick={() => setModalFirma(porFirmarEtapas[0])}
              style={{ padding:"10px 16px", borderRadius:10, border:0, background:"#78350f", color:"#fef3c7", fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
              Firmar →
            </button>
          </div>
        )}

        {/* Actividad reciente */}
        {actividadReciente.length > 0 && (
          <div style={{ marginTop:16, padding:"20px 24px", background:"var(--card)", border:"1px solid var(--border)", borderRadius:18 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:"var(--ink-400)", marginBottom:14 }}>
              Completado recientemente
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {actividadReciente.map((a, i) => {
                const rc = RUBROS.find(r => r.id === a.rubroId);
                return (
                  <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ width:8, height:8, borderRadius:999, background: rc?.hex || "#8b5cf6", marginTop:5, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color:"var(--ink)", lineHeight:1.4 }}>{a.tarea}</div>
                      <div style={{ fontSize:11, color:"var(--ink-500)", marginTop:2, fontWeight:600 }}>
                        {fmtTimestamp(a.timestamp)} · {rc?.label || a.etapaNombre}
                      </div>
                    </div>
                    <Check size={13} style={{ color:"#047857", marginTop:3, flexShrink:0 }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Por rubro */}
        {rubrosData.length > 0 && (
          <div style={{ marginTop:16, padding:"20px 24px", background:"var(--card)", border:"1px solid var(--border)", borderRadius:18 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:"var(--ink-400)", marginBottom:14 }}>
              Cómo va cada parte
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {rubrosData.map(r => {
                const etapaActual = r.etapas[r.etapaActiva];
                return (
                  <div key={r.id} style={{ display:"grid", gridTemplateColumns:"40px 1fr auto", gap:14, alignItems:"center" }}>
                    <div style={{ width:40, height:40, borderRadius:12, background: r.hex + "1a", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ width:10, height:10, borderRadius:3, background: r.hex }} />
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)" }}>{r.label}</div>
                      <div style={{ fontSize:12, color:"var(--ink-500)", marginTop:2 }}>
                        {r.pct === 100
                          ? <span style={{ color:"#047857", fontWeight:700 }}>✓ Listo{r.porFirmar ? " · esperando tu firma" : ""}</span>
                          : etapaActual
                            ? <>Vamos por <b style={{ color: r.hex }}>{etapaActual}</b></>
                            : <>En progreso</>
                        }
                      </div>
                      {r.fechaFin && (
                        <div style={{ fontSize:11, color: r.atrasado ? "#dc2626" : "var(--ink-400)", marginTop:2, fontWeight:600 }}>
                          {r.atrasado ? "⚠ Atrasado" : `Hasta ${fmtFechaCorta(r.fechaFin)}`}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize:20, fontWeight:800, color: r.hex, fontVariantNumeric:"tabular-nums" }}>
                      {r.pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Conformidades firmadas */}
        {etapas.some(e => e.firma) && (
          <div style={{ marginTop:16, padding:"20px 24px", background:"var(--card)", border:"1px solid var(--border)", borderRadius:18 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:"var(--ink-400)", marginBottom:14 }}>
              Conformidades firmadas
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {etapas.filter(e => e.firma).map(e => (
                <div key={e.id} style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <FileCheck size={14} style={{ color:"#047857", flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{e.nombre}</div>
                    <div style={{ fontSize:11, color:"var(--ink-500)", marginTop:1 }}>
                      {e.firma.firmante} · {e.firma.fecha}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop:28, textAlign:"center", fontSize:11, color:"var(--ink-400)" }}>
          Powered by <span style={{ fontWeight:700, color:"#7c5cc9" }}>AVANZA</span>
          {obraInfo.adminEmail && (
            <> · <a href={`mailto:${obraInfo.adminEmail}`} style={{ color:"var(--ink-500)", textDecoration:"none" }}>Contactar al equipo →</a></>
          )}
        </div>

      </div>

      {modalFirma && (
        <ModalFirma
          etapa={modalFirma}
          obraInfo={obraInfo}
          onConfirm={async data => {
            const newEtapas = etapas.map(e =>
              e.id === modalFirma.id ? { ...e, firma: { ...data, timestamp: Date.now() } } : e
            );
            await guardarObra(obraId, { etapas: newEtapas });
            setModalFirma(null);
          }}
          onClose={() => setModalFirma(null)} />
      )}

      <style>{`
        .vc {
          --bg: #f7f5fc;
          --card: #ffffff;
          --border: #e8e6f2;
          --ink: #0d0b14;
          --ink-500: #6e6c7a;
          --ink-400: #9896aa;
        }
        .vc.dark {
          --bg: #0d0b14;
          --card: #141120;
          --border: #1a1828;
          --ink: #f0ebfb;
          --ink-500: #6e6c7a;
          --ink-400: #4a4858;
        }
      `}</style>
    </div>
  );
}
