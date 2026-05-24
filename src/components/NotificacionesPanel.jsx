import { useState } from "react";
import { Bell, X, CheckCheck, Camera, Layers, TrendingUp, Clock } from "lucide-react";
import { marcarLeida, marcarTodasLeidas } from "../services/notificaciones";

const TIPO_CONFIG = {
  etapa_completada: { Icon: Layers,     color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  hito_progreso:    { Icon: TrendingUp, color: "text-violet-500",  bg: "bg-violet-50 dark:bg-violet-950/30"  },
  foto_subida:      { Icon: Camera,     color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/30"      },
  inactividad:      { Icon: Clock,      color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/30"    },
};

function relTime(ts) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1)  return "ahora";
  if (mins < 60) return `${mins}m`;
  const hs = Math.floor(mins / 60);
  if (hs < 24)   return `${hs}h`;
  return `${Math.floor(hs / 24)}d`;
}

export default function NotificacionesPanel({ uid, notifs, noLeidas, onSelectObra, obras, variant = "light" }) {
  const [open, setOpen] = useState(false);

  async function handleClick(notif) {
    if (!notif.leida) await marcarLeida(uid, notif.id);
    if (notif.obraId && onSelectObra && obras) {
      const obra = obras.find(o => o.id === notif.obraId);
      if (obra) { onSelectObra(obra); setOpen(false); }
    }
  }

  const bellCls = variant === "dark"
    ? "relative flex items-center justify-center w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer text-white/60 hover:bg-white/10 transition-colors"
    : "relative flex items-center justify-center w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors";

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => setOpen(true)}
        className={bellCls}
      >
        <Bell size={18} />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {/* Backdrop mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-ink/40 z-[95] md:hidden"
        />
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-[100dvh] w-full max-w-sm bg-white dark:bg-ink-900 z-[100] flex flex-col border-l border-ink-200 dark:border-ink-700 shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>

        {/* Header panel */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-ink-100 dark:border-ink-800 flex-shrink-0">
          <div>
            <div className="font-bold text-[17px] text-ink dark:text-ink-50 tracking-tight">Notificaciones</div>
            {noLeidas > 0
              ? <div className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">{noLeidas} sin leer</div>
              : <div className="text-xs text-ink-300 dark:text-ink-600 mt-0.5">Todo al día</div>
            }
          </div>
          <div className="flex items-center gap-2">
            {noLeidas > 0 && (
              <button
                onClick={() => marcarTodasLeidas(uid)}
                className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-transparent border-0 cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
              >
                <CheckCheck size={13} /> Leer todas
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-ink-50 dark:bg-ink-800 border-0 cursor-pointer text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-3 pb-16">
              <div className="w-14 h-14 rounded-2xl bg-ink-50 dark:bg-ink-800 flex items-center justify-center mb-1">
                <Bell size={22} className="text-ink-300 dark:text-ink-600" />
              </div>
              <div className="text-sm font-semibold text-ink-400 dark:text-ink-500">Sin notificaciones</div>
              <div className="text-xs text-ink-300 dark:text-ink-600 leading-relaxed">
                Aquí aparecerán etapas completadas, fotos subidas, hitos de avance y alertas de inactividad.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-ink-50 dark:divide-ink-800/60">
              {notifs.map(n => {
                const cfg = TIPO_CONFIG[n.tipo] || { Icon: Bell, color: "text-ink-400", bg: "bg-ink-50 dark:bg-ink-800" };
                const { Icon } = cfg;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-4 border-0 cursor-pointer transition-colors flex items-start gap-3 ${
                      n.leida
                        ? "bg-white dark:bg-ink-900 hover:bg-ink-50 dark:hover:bg-ink-800/60"
                        : "bg-violet-50/50 dark:bg-violet-950/15 hover:bg-violet-50 dark:hover:bg-violet-950/25"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-ink dark:text-ink-50 leading-snug">{n.mensaje}</div>
                      <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-1 flex items-center gap-1.5">
                        <span className="truncate max-w-[140px]">{n.obraNombre}</span>
                        <span>·</span>
                        <span className="flex-shrink-0">{relTime(n.ts)}</span>
                      </div>
                    </div>
                    {!n.leida && (
                      <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
