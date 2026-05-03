import { useRef, useEffect } from "react";
import { Trash2, Loader2 } from "lucide-react";
import gsap from "gsap";

export function Label({ children, className = "" }) {
  return (
    <span className={`text-[10px] font-bold tracking-[0.12em] uppercase text-ink-400 dark:text-ink-400 ${className}`}>
      {children}
    </span>
  );
}

export function SheetHandle() {
  return <div className="w-9 h-[3px] rounded-full bg-ink-200 dark:bg-ink-700 mx-auto mb-6" />;
}

export function Spinner() {
  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-violet-600 dark:text-violet-400" />
    </div>
  );
}

export function Accordion({ open, children }) {
  const ref = useRef(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const el = ref.current;
    if (open) {
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.28, ease: "power2.out" });
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.22, ease: "power2.in" });
    }
  }, [open]);
  return (
    <div ref={ref} className="overflow-hidden" style={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}>
      {children}
    </div>
  );
}

export function ModalConfirm({ mensaje, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-ink/70 flex items-center justify-center z-[300] p-6 animate-[fadeIn_.15s_ease-out_both]">
      <div className="bg-white dark:bg-ink-900 rounded-2xl p-8 w-full max-w-xs text-center border border-ink-200 dark:border-ink-700 animate-[slideUp_.2s_ease-out_both]">
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-5 text-red-500">
          <Trash2 size={20} />
        </div>
        <div className="font-bold text-[17px] text-ink dark:text-ink-50 mb-2 tracking-tight">Eliminar</div>
        <div className="text-sm text-ink-500 dark:text-ink-400 mb-7 leading-relaxed">{mensaje}</div>
        <div className="flex gap-2.5">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-100 font-semibold text-sm cursor-pointer border-0">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-ink text-white font-bold text-sm cursor-pointer border-0">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
