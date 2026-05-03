import { useState } from "react";
import { Building2, Plus, User, MapPin, Zap, Trash2, Menu, Search, X } from "lucide-react";
import { crearObra } from "../firebase";
import { ETAPAS_DEFAULT, RUBROS, TIPOS_PROYECTO, TEMPLATES } from "../constants/data";
import { Label, SheetHandle, ModalConfirm } from "./ui";
import { progressColor, progressStroke, statusBadge, cardAccent } from "../utils/helpers";

export default function ListaObras({ obras, onSelect, onEliminar, uid, userNombre, onOpenSidebar }) {
  const [nombre,       setNombre]       = useState("");
  const [cliente,      setCliente]      = useState("");
  const [direccion,    setDireccion]    = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [adminEmail,   setAdminEmail]   = useState("");
  const [tipo,         setTipo]         = useState("casa");
  const [rubro,        setRubro]        = useState("electrica");
  const [creando,      setCreando]      = useState(false);
  const [modal,        setModal]        = useState(false);
  const [confirmEl,    setConfirmEl]    = useState(null);
  const [busqueda,     setBusqueda]     = useState("");

  async function crear() {
    if (!nombre.trim()) return;
    setCreando(true);
    await crearObra({
      uid,
      clienteToken: crypto.randomUUID(),
      socioToken:   crypto.randomUUID(),
      obraInfo: {
        nombre: nombre.trim(), cliente: cliente.trim(), direccion: direccion.trim(),
        clienteEmail: clienteEmail.trim(), adminEmail: adminEmail.trim(),
        tipo, rubro, rubros: [rubro],
      },
      etapas: (TEMPLATES[rubro] || ETAPAS_DEFAULT).map(e => ({
        ...e, rubro,
        items: e.items.map(i => ({ ...i, estado: "pendiente", comentario: "", foto: null })),
      })),
    });
    setNombre(""); setCliente(""); setDireccion(""); setClienteEmail(""); setAdminEmail("");
    setTipo("casa"); setRubro("electrica");
    setModal(false); setCreando(false);
  }

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink pb-24 md:pb-8">
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-700 px-5 md:px-8 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={onOpenSidebar}
            className="md:hidden bg-ink-50 dark:bg-ink-800 border-0 rounded-xl p-2 cursor-pointer text-ink-500 dark:text-ink-400 flex-shrink-0">
            <Menu size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={12} className="text-violet-600 dark:text-violet-400" />
              <Label>GRUPO V&B</Label>
            </div>
            <div className="text-[26px] font-bold text-ink dark:text-ink-50 tracking-[-0.04em] leading-none">Mis Obras</div>
            <div className="text-sm text-ink-500 dark:text-ink-400 mt-1">{obras.length} proyecto{obras.length !== 1 ? "s" : ""} · {userNombre}</div>
          </div>
        </div>
      </div>

      {obras.length > 0 && (
        <div className="px-3.5 md:px-8 pt-4 pb-1">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 pointer-events-none" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por obra, cliente o dirección..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink dark:text-ink-50 placeholder-ink-400 outline-none focus:border-violet-500 transition-colors"
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 bg-transparent border-0 cursor-pointer p-0.5">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="px-3.5 md:px-8 pt-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:items-start">
        {obras.length === 0 && (
          <div className="text-center py-16 px-5">
            <Building2 size={44} className="text-ink-200 dark:text-ink-700 mx-auto mb-4" />
            <div className="font-bold text-base text-ink dark:text-ink-50 mb-1.5 tracking-tight">Sin obras todavía</div>
            <div className="text-sm text-ink-500 dark:text-ink-400">Creá la primera con el botón de abajo.</div>
          </div>
        )}

        {(() => {
          const q = busqueda.toLowerCase().trim();
          const filtradas = q
            ? obras.filter(o =>
                (o.obraInfo?.nombre    || "").toLowerCase().includes(q) ||
                (o.obraInfo?.cliente   || "").toLowerCase().includes(q) ||
                (o.obraInfo?.direccion || "").toLowerCase().includes(q)
              )
            : obras;
          if (obras.length > 0 && filtradas.length === 0) return (
            <div className="text-center py-12 px-5 col-span-3">
              <Search size={32} className="text-ink-200 dark:text-ink-700 mx-auto mb-3" />
              <div className="font-bold text-sm text-ink dark:text-ink-50 mb-1">Sin resultados</div>
              <div className="text-xs text-ink-400 dark:text-ink-500">Probá con otro nombre o cliente.</div>
            </div>
          );
          return filtradas.map(obra => {
          const total  = (obra.etapas || []).flatMap(e => e.items || []).length;
          const comp   = (obra.etapas || []).flatMap(e => e.items || []).filter(i => i.estado === "completado").length;
          const pct    = total ? Math.round(comp / total * 100) : 0;
          const badge  = statusBadge(pct);
          const accent = cardAccent(pct);
          const pColor = progressStroke(pct);

          return (
            <div key={obra.id}
              className={`bg-white dark:bg-ink-900 rounded-2xl mb-2.5 border border-ink-200 dark:border-ink-700 border-l-[3px] ${accent} overflow-hidden transition-all duration-200 hover:shadow-card hover:-translate-y-px`}>
              <div onClick={() => onSelect(obra)} className="px-4 py-4 cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-3.5">
                    <div className="font-bold text-[15px] text-ink dark:text-ink-50 tracking-tight mb-1">{obra.obraInfo?.nombre}</div>
                    {obra.obraInfo?.cliente && (
                      <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400 mb-0.5">
                        <User size={11} /> {obra.obraInfo.cliente}
                      </div>
                    )}
                    {obra.obraInfo?.direccion && (
                      <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                        <MapPin size={11} /> {obra.obraInfo.direccion}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      <span className={`inline-block text-[11px] font-bold rounded-md px-2 py-0.5 ${badge.cls}`}>
                        {badge.text}
                      </span>
                      {(obra.obraInfo?.rubros || (obra.obraInfo?.rubro ? [obra.obraInfo.rubro] : [])).map(rid => {
                        const rc = RUBROS.find(r => r.id === rid);
                        return rc ? (
                          <span key={rid} className={`inline-block text-[11px] font-semibold rounded-md px-2 py-0.5 ${rc.badge}`}>
                            {rc.label}
                          </span>
                        ) : null;
                      })}
                      {obra.obraInfo?.tipo && (
                        <span className="inline-block text-[11px] font-semibold rounded-md px-2 py-0.5 bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400">
                          {TIPOS_PROYECTO.find(t => t.id === obra.obraInfo.tipo)?.label || obra.obraInfo.tipo}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-[26px] font-bold tracking-[-0.04em] leading-none ${progressColor(pct)}`}>{pct}%</div>
                    <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-1">{comp}/{total}</div>
                  </div>
                </div>
                <div className="h-0.5 bg-ink-100 dark:bg-ink-800 rounded-full mt-3.5 overflow-hidden">
                  <div className="h-full rounded-full transition-[width_.5s_ease]" style={{ width: `${pct}%`, background: pColor }} />
                </div>
              </div>
              <div className="border-t border-ink-100 dark:border-ink-800 px-4 py-2 flex justify-end">
                <button onClick={() => setConfirmEl(obra)}
                  className="bg-transparent border-0 text-red-400 cursor-pointer text-xs font-semibold flex items-center gap-1.5 py-0.5">
                  <Trash2 size={12} /> Eliminar
                </button>
              </div>
            </div>
          );
        });
        })()}
      </div>

      <div className="fixed bottom-6 right-5">
        <button onClick={() => setModal(true)}
          className="bg-ink dark:bg-white text-white dark:text-ink font-bold text-sm rounded-2xl px-5 py-3.5 flex items-center gap-2 border-0 cursor-pointer shadow-fab hover:shadow-fab-hover hover:scale-105 active:scale-[.97] transition-all duration-150">
          <Plus size={16} /> Nueva obra
        </button>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-ink/55 flex items-end z-[100]"
          onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="bg-white dark:bg-ink-900 rounded-t-3xl px-5 pt-5 pb-11 w-full border border-ink-200 dark:border-ink-700 border-b-0 animate-[slideUp_.22s_ease-out_both]">
            <SheetHandle />
            <div className="flex justify-between items-center mb-5">
              <div className="font-bold text-lg text-ink dark:text-ink-50 tracking-tight">Nueva Obra</div>
              <button onClick={() => setModal(false)}
                className="bg-ink-50 dark:bg-ink-800 border-0 rounded-full w-8 h-8 cursor-pointer text-ink-400 flex items-center justify-center">
                <X size={14} />
              </button>
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-2 uppercase tracking-wider">Tipo de proyecto</div>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_PROYECTO.map(t => (
                  <button key={t.id} onClick={() => setTipo(t.id)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all ${
                      tipo === t.id
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-ink-50 dark:bg-ink-800 text-ink-600 dark:text-ink-300 border-ink-200 dark:border-ink-700 hover:border-violet-400"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-2 uppercase tracking-wider">Rubro</div>
              <div className="flex flex-col gap-2">
                {RUBROS.map(r => (
                  <button key={r.id} onClick={() => setRubro(r.id)}
                    className={`py-2.5 px-3.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all text-left ${
                      rubro === r.id
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-ink-50 dark:bg-ink-800 text-ink-600 dark:text-ink-300 border-ink-200 dark:border-ink-700 hover:border-violet-400"
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-2 uppercase tracking-wider">Datos</div>
            {[
              ["Nombre de la obra *", nombre,       setNombre,       "text"],
              ["Cliente",             cliente,      setCliente,      "text"],
              ["Dirección",           direccion,    setDireccion,    "text"],
              ["Email del cliente",   clienteEmail, setClienteEmail, "email"],
              ["Tu email (admin)",    adminEmail,   setAdminEmail,   "email"],
            ].map(([ph, val, set, type]) => (
              <input key={ph} value={val} onChange={e => set(e.target.value)} placeholder={ph} type={type}
                className="w-full px-3.5 py-3 rounded-xl border border-ink-200 dark:border-ink-700 text-sm mb-2.5 bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-400 outline-none focus:border-violet-500 transition-colors" />
            ))}
            <button onClick={crear} disabled={creando || !nombre.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-sm mt-1 cursor-pointer border-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-ink dark:bg-white text-white dark:text-ink">
              {creando ? "Creando..." : "Crear obra"}
            </button>
          </div>
        </div>
      )}

      {confirmEl && (
        <ModalConfirm
          mensaje={`Se eliminará "${confirmEl.obraInfo?.nombre}" permanentemente.`}
          onCancel={() => setConfirmEl(null)}
          onConfirm={async () => { await onEliminar(confirmEl); setConfirmEl(null); }} />
      )}
    </div>
  );
}
