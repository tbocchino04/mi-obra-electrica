import { Building2, Package, Wallet, Sun, Moon, LogOut, Zap } from "lucide-react";
import { logout } from "../firebase";
import { useTheme } from "../hooks/useTheme";

export default function Sidebar({ open, onClose, activeView, onSetView }) {
  const { dark, toggle } = useTheme();
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
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-violet-600 dark:text-violet-400" />
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-violet-600 dark:text-violet-400">GRUPO V&B</span>
          </div>
          <div className="text-[24px] font-bold text-ink dark:text-ink-50 tracking-[-0.03em]">Mi Obra</div>
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
