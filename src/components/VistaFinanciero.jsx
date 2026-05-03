import { Wallet, Menu, User, FileCheck, Zap } from "lucide-react";
import { RUBROS } from "../constants/data";
import { Label } from "./ui";
import { calcFinanciero, fmtNum, fmtMonto } from "../utils/helpers";

export default function VistaFinanciero({ obras, onOpenSidebar }) {
  const todasEtapas = obras.flatMap(o => o.etapas || []);
  const finGlobal   = calcFinanciero(todasEtapas);
  const conDatos    = obras.filter(o => (o.etapas || []).some(e => e.monto && Number(e.monto) > 0));

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink pb-8">
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-700 px-5 md:px-8 pt-7 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onOpenSidebar}
            className="md:hidden bg-ink-50 dark:bg-ink-800 border-0 rounded-xl p-2 cursor-pointer text-ink-500 dark:text-ink-400 flex-shrink-0">
            <Menu size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Zap size={12} className="text-violet-600 dark:text-violet-400" />
              <Label>AVANZA</Label>
            </div>
            <div className="text-[26px] font-bold text-ink dark:text-ink-50 tracking-[-0.04em] leading-none">Financiero</div>
          </div>
        </div>

        {finGlobal && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[finGlobal.ars && { ...finGlobal.ars, moneda: "ARS" }, finGlobal.usd && { ...finGlobal.usd, moneda: "USD" }]
              .filter(Boolean).map(({ total, cobrado, moneda }) => (
                <div key={moneda} className="bg-ink-50 dark:bg-ink-800 rounded-2xl px-4 py-3">
                  <div className="text-[10px] font-bold tracking-wider text-ink-400 dark:text-ink-500 uppercase mb-1">{moneda} · Total</div>
                  <div className="text-[18px] font-bold text-ink dark:text-ink-50 leading-none">{fmtNum(total, moneda)}</div>
                  <div className="h-1 bg-ink-200 dark:bg-ink-700 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${total ? Math.round(cobrado / total * 100) : 0}%` }} />
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Cobrado {fmtNum(cobrado, moneda)}</div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="px-3.5 md:px-8 pt-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:items-start">
        {conDatos.length === 0 ? (
          <div className="text-center py-16 px-5">
            <Wallet size={44} className="text-ink-200 dark:text-ink-700 mx-auto mb-4" />
            <div className="font-bold text-base text-ink dark:text-ink-50 mb-1.5 tracking-tight">Sin montos registrados</div>
            <div className="text-sm text-ink-500 dark:text-ink-400">Abrí una obra y asigná montos a cada etapa.</div>
          </div>
        ) : conDatos.map(obra => {
          const finObra = calcFinanciero(obra.etapas || []);
          const etapasConMonto = (obra.etapas || []).filter(e => e.monto && Number(e.monto) > 0);
          return (
            <div key={obra.id} className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 overflow-hidden">
              <div className="px-4 py-4 border-b border-ink-100 dark:border-ink-800">
                <div className="font-bold text-[15px] text-ink dark:text-ink-50 tracking-tight">{obra.obraInfo?.nombre}</div>
                {obra.obraInfo?.cliente && (
                  <div className="flex items-center gap-1.5 text-xs text-ink-400 dark:text-ink-500 mt-0.5">
                    <User size={10} /> {obra.obraInfo.cliente}
                  </div>
                )}
              </div>

              {finObra && (
                <div className="px-4 py-3 border-b border-ink-100 dark:border-ink-800">
                  {[finObra.ars && { ...finObra.ars, moneda: "ARS" }, finObra.usd && { ...finObra.usd, moneda: "USD" }]
                    .filter(Boolean).map(({ total, cobrado, moneda }) => {
                      const pend = total - cobrado;
                      const pctC = total ? Math.round(cobrado / total * 100) : 0;
                      return (
                        <div key={moneda} className="mb-3 last:mb-0">
                          <div className="flex justify-between items-baseline mb-1.5">
                            <span className="text-[11px] text-ink-400 dark:text-ink-500">Total {moneda}</span>
                            <span className="text-[15px] font-bold text-ink dark:text-ink-50">{fmtNum(total, moneda)}</span>
                          </div>
                          <div className="h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden mb-1.5">
                            <div className="h-full bg-emerald-500 rounded-full transition-[width_.5s_ease]" style={{ width: `${pctC}%` }} />
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Cobrado {fmtNum(cobrado, moneda)}</span>
                            <span className="text-ink-400 dark:text-ink-500">Pendiente {fmtNum(pend, moneda)}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {etapasConMonto.map((etapa, idx) => (
                <div key={etapa.id} className={`flex items-center gap-3 px-4 py-3 ${idx < etapasConMonto.length - 1 ? "border-b border-ink-50 dark:border-ink-800" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-ink dark:text-ink-100 truncate">{etapa.nombre}</div>
                    {etapa.firma && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Firmado por {etapa.firma.firmante}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {etapa.firma
                      ? <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-md px-1.5 py-0.5 flex items-center gap-1"><FileCheck size={9} /> Cobrado</span>
                      : <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-1.5 py-0.5">Pendiente</span>
                    }
                    <span className="text-[13px] font-bold text-ink dark:text-ink-50">{fmtMonto(etapa)}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
