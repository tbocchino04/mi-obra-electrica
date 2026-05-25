import { useState, useEffect } from "react";
import { Building2, Package, Wallet, Sun, Moon, LogOut, Bell, BellOff } from "lucide-react";
import { logout } from "../firebase";
import { useTheme } from "../hooks/useTheme";
import AvanzaLogo from "./AvanzaLogo";
import { initFCM } from "../services/fcm";

function esPWA() {
  return window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

export default function Sidebar({ open, onClose, activeView, onSetView }) {
  const { dark, toggle } = useTheme();
  const [notifEstado, setNotifEstado] = useState(null); // null | "instalar" | "activar" | "listo"
  const [instrucciones, setInstrucciones] = useState(false);

  useEffect(() => {
    const tieneAPI = "Notification" in window;
    if (!tieneAPI) { setNotifEstado("instalar"); return; }
    const perm = Notification.permission;
    if (perm === "granted") { setNotifEstado("listo"); return; }
    if (!esPWA()) { setNotifEstado("instalar"); return; }
    if (perm !== "denied") setNotifEstado("activar");
  }, []);

  async function activarNotif() {
    await initFCM();
    setNotifEstado("listo");
  }

  const nav = [
    { key: "obras",      icon: Building2, label: "Mis Obras"      },
    { key: "stock",      icon: Package,   label: "Stock de Obra"  },
    { key: "financiero", icon: Wallet,    label: "Financiero"     },
  ];
  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 bg-ink/60 z-[80] transition-opacity duration-300 md:hidden ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} />
      <div className={`fixed top-0 left-0 h-screen w-64 bg-white dark:bg-ink-900 z-[90] flex flex-col border-r border-ink-200 dark:border-ink-700 transition-transform duration-300 ease-out md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 pt-10 pb-6 border-b border-ink-100 dark:border-ink-800">
          {dark
            ? <AvanzaLogo size={36} className="text-violet-400" />
            : <img src="/logo-app.png" alt="AVANZA" className="h-9 w-auto" />
          }
        </div>
        <nav className="flex-1 px-3 py-4">
          {nav.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => { onSetView(key); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-semibold border-0 cursor-pointer text-left transition-colors ${
                activeView === key
                  ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400"
                  : "bg-transparent text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800"
              }`}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-10 border-t border-ink-100 dark:border-ink-800 pt-4 flex flex-col gap-1">
          {notifEstado === "activar" && (
            <button onClick={activarNotif}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border-0 cursor-pointer text-left bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">
              <Bell size={17} /> Activar notificaciones
            </button>
          )}
          {notifEstado === "instalar" && (
            <>
              <button onClick={() => setInstrucciones(v => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border-0 cursor-pointer text-left bg-transparent text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
                <Bell size={17} /> Notificaciones
              </button>
              {instrucciones && (
                <div className="mx-2 mb-1 bg-ink-50 dark:bg-ink-800 rounded-xl p-3 text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed">
                  Para recibir alertas, instalá la app:<br />
                  <span className="text-violet-600 dark:text-violet-400 font-semibold">Compartir → Agregar a pantalla de inicio → abrir desde el ícono</span>
                </div>
              )}
            </>
          )}
          <button onClick={toggle}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border-0 cursor-pointer text-left bg-transparent text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
            {dark ? "Modo claro" : "Modo oscuro"}
          </button>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border-0 cursor-pointer text-left bg-transparent text-ink-500 dark:text-ink-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors">
            <LogOut size={17} /> Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}
