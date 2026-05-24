import { useState, useEffect } from "react";
import { Bell, X, Share, Download } from "lucide-react";
import { initFCM } from "../services/fcm";

function esPWA() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export default function NotifBanner({ uid }) {
  const [estado, setEstado] = useState(null); // null | "instalar" | "activar" | "listo"

  useEffect(() => {
    if (!uid) return;

    const perm = Notification.permission;
    if (perm === "granted") { setEstado("listo"); return; }

    if (!esPWA()) {
      // En Safari browser → mostrar instrucciones de instalación
      const yaVisto = sessionStorage.getItem("bannerInstalacion");
      if (!yaVisto) setEstado("instalar");
    } else {
      // Es PWA pero no tiene permiso → mostrar botón de activar
      if (perm !== "denied") setEstado("activar");
    }
  }, [uid]);

  async function activar() {
    await initFCM();
    setEstado("listo");
  }

  function cerrar() {
    sessionStorage.setItem("bannerInstalacion", "1");
    setEstado(null);
  }

  if (!estado || estado === "listo") return null;

  if (estado === "instalar") {
    return (
      <div className="fixed bottom-5 left-4 right-4 z-[200] md:left-auto md:right-5 md:w-80">
        <div className="bg-[#1a1730] border border-violet-800/60 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                <Bell size={15} className="text-violet-400" />
              </div>
              <span className="text-[13px] font-bold text-white">Activar notificaciones</span>
            </div>
            <button onClick={cerrar} className="bg-transparent border-0 cursor-pointer text-white/40 p-0 flex-shrink-0">
              <X size={15} />
            </button>
          </div>
          <p className="text-[12px] text-white/60 leading-relaxed mb-3">
            Para recibir alertas de tus obras en el iPhone, instalá la app en tu pantalla de inicio:
          </p>
          <div className="flex flex-col gap-1.5 text-[12px] text-white/70">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
              <span>Tocá el botón <Share size={12} className="inline mx-0.5 text-blue-400" /> Compartir en Safari</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
              <span>Seleccioná <strong className="text-white">"Agregar a pantalla de inicio"</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
              <span>Abrí la app desde el ícono instalado</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (estado === "activar") {
    return (
      <div className="fixed bottom-5 left-4 right-4 z-[200] md:left-auto md:right-5 md:w-80">
        <div className="bg-[#1a1730] border border-violet-800/60 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                <Bell size={15} className="text-violet-400" />
              </div>
              <span className="text-[13px] font-bold text-white">Activar notificaciones</span>
            </div>
            <button onClick={cerrar} className="bg-transparent border-0 cursor-pointer text-white/40 p-0 flex-shrink-0">
              <X size={15} />
            </button>
          </div>
          <p className="text-[12px] text-white/60 leading-relaxed mb-3">
            Recibí alertas cuando se completen etapas, se suban fotos o haya inactividad en tus obras.
          </p>
          <button
            onClick={activar}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-bold rounded-xl border-0 cursor-pointer transition-colors"
          >
            Activar ahora
          </button>
        </div>
      </div>
    );
  }

  return null;
}
