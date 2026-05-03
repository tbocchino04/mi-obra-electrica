import { useState } from "react";
import { Sun, Moon, ArrowLeft, User, MapPin, Zap, FileCheck, Check, ChevronRight, PenLine } from "lucide-react";
import { guardarObra } from "../firebase";
import { RUBROS, ESTADO_CONFIG } from "../constants/data";
import { useTheme } from "../hooks/useTheme";
import { Label } from "./ui";
import ModalFirma from "./ModalFirma";
import { progressColor, progressStroke, pctEtapa } from "../utils/helpers";

function TimelineRubro({ etapas, rubroConfig, esPublica, obraId, obraInfo, onFirma }) {
  const color = rubroConfig?.hex || "#8b5cf6";
  const items = etapas.flatMap(e => e.items || []);
  const comp  = items.filter(i => i.estado === "completado").length;
  const pct   = items.length ? Math.round(comp / items.length * 100) : 0;

  return (
    <div>
      <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-[11px] font-bold tracking-widest text-ink-400 dark:text-ink-500 uppercase">{rubroConfig?.label}</span>
        </div>
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-[42px] font-bold tracking-[-0.05em] leading-none" style={{ color }}>{pct}%</span>
          <span className="text-sm text-ink-400 dark:text-ink-500">completado</span>
        </div>
        <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-[width_.6s_ease]" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-1.5 text-right">{comp} de {items.length} tareas</div>
      </div>

      <div>
        {etapas.map((etapa, idx) => {
          const ep          = pctEtapa(etapa);
          const isLast      = idx === etapas.length - 1;
          const isCompleted = ep === 100;
          const isInProgress = ep > 0 && ep < 100;
          const hasFirma    = !!etapa.firma;
          const obs         = (etapa.items || []).filter(i => i.estado === "observacion").length;

          return (
            <div key={etapa.id} className="flex gap-4">
              <div className="flex flex-col items-center flex-shrink-0 w-8">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: hasFirma ? "#10b981" : color }}>
                    <Check size={13} strokeWidth={3} color="white" />
                  </div>
                ) : isInProgress ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-[3px]"
                    style={{ borderColor: color }}>
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: color }} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900" />
                )}
                {!isLast && (
                  <div className="w-0.5 flex-1 my-1.5 min-h-[24px] rounded-full"
                    style={{ background: isCompleted ? color : "#c5c3d4" }} />
                )}
              </div>

              <div className={`flex-1 min-w-0 ${isLast ? "pb-2" : "pb-5"}`}>
                <div className="flex items-start justify-between gap-2 pt-0.5 mb-1">
                  <div className="font-bold text-[14px] text-ink dark:text-ink-50 tracking-tight leading-snug">{etapa.nombre}</div>
                  <span className="text-[12px] font-bold flex-shrink-0"
                    style={{ color: isCompleted ? (hasFirma ? "#10b981" : color) : isInProgress ? color : "#9896aa" }}>
                    {ep}%
                  </span>
                </div>
                <div className="text-[12px] text-ink-400 dark:text-ink-500 mb-2">
                  {(etapa.items || []).filter(i => i.estado === "completado").length} de {(etapa.items || []).length} tareas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hasFirma && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg px-2 py-1">
                      <FileCheck size={10} /> Firmado · {etapa.firma.firmante}
                    </div>
                  )}
                  {obs > 0 && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-2 py-1">
                      ⚠ {obs} observación{obs > 1 ? "es" : ""}
                    </div>
                  )}
                  {esPublica && isCompleted && !hasFirma && (
                    <button onClick={() => onFirma(etapa)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg px-2 py-1 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors">
                      <PenLine size={10} /> Firmar conformidad
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function VistaCliente({ etapas, obraInfo, onVolver, esPublica = false, obraId = null }) {
  const [modalFirma,         setModalFirma]         = useState(null);
  const [rubroActivoCliente, setRubroActivoCliente] = useState(null);
  const { dark, toggle: toggleDark } = useTheme();

  const todosItems  = etapas.flatMap(e => e.items || []);
  const total       = todosItems.length;
  const comp        = todosItems.filter(i => i.estado === "completado").length;
  const pct         = total ? Math.round(comp / total * 100) : 0;
  const pColor      = progressStroke(pct);

  const rubrosPresentes = RUBROS.filter(r =>
    etapas.some(e => (e.rubro || obraInfo.rubro) === r.id)
  );
  const etapasFiltradas = rubroActivoCliente === null
    ? etapas
    : etapas.filter(e => (e.rubro || obraInfo.rubro) === rubroActivoCliente);
  const rubroConfig = RUBROS.find(r => r.id === rubroActivoCliente);

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink">

      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-700 px-5 md:px-8 pt-6 pb-5">
        <div className="flex items-center justify-between mb-5">
          {!esPublica ? (
            <button onClick={onVolver}
              className="bg-transparent border-0 text-ink-400 dark:text-ink-500 cursor-pointer text-sm font-medium flex items-center gap-1.5 p-0">
              <ArrowLeft size={14} /> Volver
            </button>
          ) : <div />}
          <button onClick={toggleDark}
            className="border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 rounded-full p-1.5 text-ink-500 dark:text-ink-400 cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors">
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap size={13} className="text-violet-600 dark:text-violet-400" />
              <Label>GRUPO V&B · CLIENTE</Label>
            </div>
            <div className="text-[22px] font-bold text-ink dark:text-ink-50 tracking-[-0.04em] leading-snug">{obraInfo.nombre}</div>
            {obraInfo.cliente && (
              <div className="flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400 mt-1.5">
                <User size={13} /> {obraInfo.cliente}
              </div>
            )}
            {obraInfo.direccion && (
              <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400 mt-1">
                <MapPin size={12} /> {obraInfo.direccion}
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-[40px] font-bold tracking-[-0.05em] leading-none ${progressColor(pct)}`}>{pct}%</div>
            <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-1">completado</div>
          </div>
        </div>
        <div className="h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full mt-4 overflow-hidden">
          <div className="h-full rounded-full transition-[width_.6s_ease]" style={{ width: `${pct}%`, background: pColor }} />
        </div>
      </div>

      {rubrosPresentes.length > 0 && (
        <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-700 px-5 md:px-8">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-3">
            <button onClick={() => setRubroActivoCliente(null)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                rubroActivoCliente === null
                  ? "bg-ink dark:bg-white text-white dark:text-ink border-transparent"
                  : "bg-transparent border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800"
              }`}>
              General
            </button>
            {rubrosPresentes.map(r => {
              const active = rubroActivoCliente === r.id;
              return (
                <button key={r.id} onClick={() => setRubroActivoCliente(r.id)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                    active ? "border-transparent" : "border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800"
                  }`}
                  style={active ? { background: r.hex, borderColor: r.hex, color: "white" } : {}}>
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-3.5 md:px-8 pt-4 md:pt-6 pb-10 md:max-w-2xl">
        {rubroActivoCliente === null ? (
          <div>
            {rubrosPresentes.length > 0 && (
              <div className="flex flex-col gap-2.5 mb-4">
                {rubrosPresentes.map(r => {
                  const rEtapas = etapas.filter(e => (e.rubro || obraInfo.rubro) === r.id);
                  const rItems  = rEtapas.flatMap(e => e.items || []);
                  const rComp   = rItems.filter(i => i.estado === "completado").length;
                  const rPct    = rItems.length ? Math.round(rComp / rItems.length * 100) : 0;
                  const rObs    = rItems.filter(i => i.estado === "observacion").length;
                  return (
                    <button key={r.id} onClick={() => setRubroActivoCliente(r.id)}
                      className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 p-4 text-left hover:shadow-card transition-shadow cursor-pointer w-full">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.hex }} />
                          <span className="text-sm font-bold text-ink dark:text-ink-50">{r.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {rObs > 0 && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/40 rounded-md px-1.5 py-0.5">⚠ {rObs}</span>
                          )}
                          <span className="text-sm font-bold" style={{ color: r.hex }}>{rPct}%</span>
                          <ChevronRight size={14} className="text-ink-300 dark:text-ink-600" />
                        </div>
                      </div>
                      <div className="h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-[width_.5s_ease]" style={{ width: `${rPct}%`, background: r.hex }} />
                      </div>
                      <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-1.5">{rComp} de {rItems.length} tareas · Ver detalle →</div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(ESTADO_CONFIG).map(([k, v]) => {
                const cnt = todosItems.filter(i => i.estado === k).length;
                return (
                  <div key={k} className={`bg-white dark:bg-ink-900 rounded-xl p-4 border border-ink-200 dark:border-ink-700 border-t-2 ${v.border}`}>
                    <div className={`text-[28px] font-bold tracking-[-0.04em] leading-none ${v.color}`}>{cnt}</div>
                    <div className="text-xs text-ink-500 dark:text-ink-400 mt-1 font-medium">{v.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <TimelineRubro
            etapas={etapasFiltradas}
            rubroConfig={rubroConfig}
            esPublica={esPublica}
            obraId={obraId}
            obraInfo={obraInfo}
            etapasAll={etapas}
            onFirma={setModalFirma}
          />
        )}
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
          }}
          onClose={() => setModalFirma(null)} />
      )}
    </div>
  );
}
