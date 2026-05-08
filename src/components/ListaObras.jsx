import { useState } from "react";
import { Building2, Plus, User, MapPin, Trash2, Menu, Search, X, AlertTriangle, FileCheck, Clock } from "lucide-react";
import AvanzaLogo from "./AvanzaLogo";
import { crearObra } from "../firebase";
import { ETAPAS_DEFAULT, RUBROS, TIPOS_PROYECTO, TEMPLATES } from "../constants/data";
import { Label, SheetHandle, ModalConfirm } from "./ui";

const HOY = new Date().toISOString().slice(0, 10);

function fmtFechaCorta(iso) {
  if (!iso) return null;
  const [, m, d] = iso.split("-");
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}`;
}

function computeObra(obra) {
  const etapas = obra.etapas || [];
  const rubrosConfig = obra.rubrosConfig || {};
  const obraInfo = obra.obraInfo || {};
  const rubrosActivos = obraInfo.rubros?.length
    ? obraInfo.rubros
    : obraInfo.rubro ? [obraInfo.rubro] : [];

  const allItems = etapas.flatMap(e => e.items || []);
  const total = allItems.length;
  const comp = allItems.filter(i => i.estado === "completado").length;
  const pct = total ? Math.round(comp / total * 100) : 0;

  const rubrosData = rubrosActivos.map(rid => {
    const rc = RUBROS.find(r => r.id === rid);
    const items = etapas.filter(e => e.rubro === rid || (!e.rubro && obraInfo.rubro === rid)).flatMap(e => e.items || []);
    const rComp = items.filter(i => i.estado === "completado").length;
    const rPct = items.length ? Math.round(rComp / items.length * 100) : 0;
    const cfg = rubrosConfig[rid] || {};
    const atrasado = !!(cfg.fechaEstimadaFin && cfg.fechaEstimadaFin < HOY && rPct < 100);
    return { rid, rc, pct: rPct, total: items.length, comp: rComp, atrasado, fechaFin: cfg.fechaEstimadaFin };
  });

  const atrasado = rubrosData.some(r => r.atrasado);
  const porFirmar = etapas.some(e => {
    const its = e.items || [];
    return its.length > 0 && its.every(i => i.estado === "completado") && !e.firma;
  });

  const ultimaActividad = allItems
    .filter(i => i.estado === "completado" && i.ultimoCambio?.timestamp)
    .sort((a, b) => b.ultimoCambio.timestamp - a.ultimoCambio.timestamp)[0] || null;

  return { pct, total, comp, rubrosData, atrasado, porFirmar, ultimaActividad };
}

function ActivityLabel({ ts }) {
  if (!ts) return <span className="text-[10px] text-ink-300 dark:text-ink-600">Sin actividad reciente</span>;
  const ms = Date.now() - ts;
  const h = Math.round(ms / 3600000);
  const d = Math.round(ms / 86400000);
  const label = d >= 2 ? `${d}d` : h >= 1 ? `${h}h` : "< 1h";
  return (
    <span className="text-[10px] text-ink-400 dark:text-ink-500 flex items-center gap-1">
      <Clock size={9} /> Última actividad hace {label}
    </span>
  );
}

function StoryCard({ obra, stats, onSelect, onEliminar }) {
  const { pct, total, comp, rubrosData, atrasado, porFirmar, ultimaActividad } = stats;
  const info = obra.obraInfo || {};

  const pctColor = atrasado
    ? "text-red-500 dark:text-red-400"
    : pct === 100
    ? "text-emerald-500 dark:text-emerald-400"
    : pct > 50
    ? "text-violet-600 dark:text-violet-400"
    : "text-ink dark:text-ink-50";
  const progColor = atrasado ? "#ef4444" : pct === 100 ? "#10b981" : "#7c5cc9";
  const headerBg = atrasado
    ? "bg-gradient-to-br from-red-500/[0.07] to-transparent"
    : pct === 100
    ? "bg-gradient-to-br from-emerald-500/[0.07] to-transparent"
    : "bg-gradient-to-br from-violet-600/[0.06] to-transparent";

  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 overflow-hidden hover:shadow-card hover:-translate-y-px transition-all duration-200">
      {/* Header zone */}
      <div className={`${headerBg} px-4 pt-4 pb-3 cursor-pointer`} onClick={() => onSelect(obra)}>
        {(atrasado || porFirmar) && (
          <div className="flex gap-1.5 mb-2.5 flex-wrap">
            {atrasado && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                <AlertTriangle size={9} /> ATRASADA
              </span>
            )}
            {porFirmar && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                <FileCheck size={9} /> FIRMA PENDIENTE
              </span>
            )}
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[15px] text-ink dark:text-ink-50 tracking-tight leading-snug">{info.nombre}</div>
            <div className="flex gap-3 mt-1 flex-wrap">
              {info.cliente && (
                <span className="flex items-center gap-1 text-[11px] text-ink-500 dark:text-ink-400">
                  <User size={10} /> {info.cliente}
                </span>
              )}
              {info.direccion && (
                <span className="flex items-center gap-1 text-[11px] text-ink-500 dark:text-ink-400">
                  <MapPin size={10} /> {info.direccion}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-[28px] font-black leading-none tracking-[-2px] ${pctColor}`}>{pct}%</div>
            <div className="text-[10px] text-ink-400 dark:text-ink-500 mt-0.5">{comp}/{total}</div>
          </div>
        </div>
        <div className="h-[3px] bg-ink-100 dark:bg-ink-800 rounded-full mt-3 overflow-hidden">
          <div className="h-full rounded-full transition-[width_.5s_ease]"
            style={{ width: `${pct}%`, background: progColor }} />
        </div>
      </div>

      {/* Rubros strip */}
      {rubrosData.length > 0 && (
        <div className="px-4 py-2.5 border-t border-ink-100 dark:border-ink-800 cursor-pointer" onClick={() => onSelect(obra)}>
          <div className="flex flex-col gap-1.5">
            {rubrosData.map(({ rid, rc, pct: rp, total: rt, comp: rc2, atrasado: ra, fechaFin }) => (
              <div key={rid} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: rc?.hex || "#7c5cc9" }} />
                <div className="text-[11px] font-semibold text-ink-600 dark:text-ink-300 w-[72px] flex-shrink-0 truncate">{rc?.label || rid}</div>
                <div className="flex-1 h-1 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-[width_.45s_ease]"
                    style={{ width: `${rp}%`, background: ra ? "#ef4444" : (rc?.hex || "#7c5cc9") }} />
                </div>
                <div className={`text-[10px] font-bold w-7 text-right flex-shrink-0 ${ra ? "text-red-500" : "text-ink-400 dark:text-ink-500"}`}>{rp}%</div>
                {fechaFin && (
                  <div className={`text-[10px] flex-shrink-0 w-12 text-right ${ra ? "text-red-400" : "text-ink-300 dark:text-ink-600"}`}>
                    {fmtFechaCorta(fechaFin)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between gap-2">
        <ActivityLabel ts={ultimaActividad?.ultimoCambio?.timestamp} />
        <button onClick={e => { e.stopPropagation(); onEliminar(obra); }}
          className="bg-transparent border-0 text-red-400 cursor-pointer text-xs font-semibold flex items-center gap-1.5 py-0.5 flex-shrink-0">
          <Trash2 size={11} /> Eliminar
        </button>
      </div>
    </div>
  );
}

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

  const q = busqueda.toLowerCase().trim();
  const filtradas = q
    ? obras.filter(o =>
        (o.obraInfo?.nombre    || "").toLowerCase().includes(q) ||
        (o.obraInfo?.cliente   || "").toLowerCase().includes(q) ||
        (o.obraInfo?.direccion || "").toLowerCase().includes(q)
      )
    : obras;

  const filtradas_stats = filtradas.map(o => ({ obra: o, stats: computeObra(o) }));
  const sorted = [...filtradas_stats].sort((a, b) => {
    if (a.stats.atrasado !== b.stats.atrasado) return a.stats.atrasado ? -1 : 1;
    if (a.stats.porFirmar !== b.stats.porFirmar) return a.stats.porFirmar ? -1 : 1;
    return 0;
  });

  const atrasadasCount = obras.filter(o => computeObra(o).atrasado).length;
  const firmaCount = obras.filter(o => computeObra(o).porFirmar).length;

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-700 px-5 md:px-8 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={onOpenSidebar}
            className="md:hidden bg-ink-50 dark:bg-ink-800 border-0 rounded-xl p-2 cursor-pointer text-ink-500 dark:text-ink-400 flex-shrink-0">
            <Menu size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <AvanzaLogo size={12} className="text-violet-600 dark:text-violet-400" />
              <Label className="logo-word">AVANZA</Label>
            </div>
            <div className="text-[26px] font-bold text-ink dark:text-ink-50 tracking-[-0.04em] leading-none">Mis Obras</div>
            <div className="text-sm text-ink-500 dark:text-ink-400 mt-1">{obras.length} proyecto{obras.length !== 1 ? "s" : ""} · {userNombre}</div>
          </div>
        </div>
      </div>

      {/* Alert ribbon */}
      {(atrasadasCount > 0 || firmaCount > 0) && (
        <div className="px-3.5 md:px-8 pt-3 flex gap-2 flex-wrap">
          {atrasadasCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
              <AlertTriangle size={12} /> {atrasadasCount} obra{atrasadasCount !== 1 ? "s" : ""} atrasada{atrasadasCount !== 1 ? "s" : ""}
            </div>
          )}
          {firmaCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <FileCheck size={12} /> {firmaCount} con firma pendiente
            </div>
          )}
        </div>
      )}

      {/* Search */}
      {obras.length > 0 && (
        <div className="px-3.5 md:px-8 pt-3 pb-1">
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

      {/* Grid */}
      <div className="px-3.5 md:px-8 pt-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:items-start">
        {obras.length === 0 && (
          <div className="text-center py-16 px-5">
            <Building2 size={44} className="text-ink-200 dark:text-ink-700 mx-auto mb-4" />
            <div className="font-bold text-base text-ink dark:text-ink-50 mb-1.5 tracking-tight">Sin obras todavía</div>
            <div className="text-sm text-ink-500 dark:text-ink-400">Creá la primera con el botón de abajo.</div>
          </div>
        )}

        {obras.length > 0 && sorted.length === 0 && (
          <div className="text-center py-12 px-5 col-span-3">
            <Search size={32} className="text-ink-200 dark:text-ink-700 mx-auto mb-3" />
            <div className="font-bold text-sm text-ink dark:text-ink-50 mb-1">Sin resultados</div>
            <div className="text-xs text-ink-400 dark:text-ink-500">Probá con otro nombre o cliente.</div>
          </div>
        )}

        {sorted.map(({ obra, stats }) => (
          <div key={obra.id} className="mb-2.5 md:mb-0">
            <StoryCard obra={obra} stats={stats} onSelect={onSelect} onEliminar={o => setConfirmEl(o)} />
          </div>
        ))}
      </div>

      {/* FAB */}
      <div className="fixed bottom-6 right-5">
        <button onClick={() => setModal(true)}
          className="bg-ink dark:bg-white text-white dark:text-ink font-bold text-sm rounded-2xl px-5 py-3.5 flex items-center gap-2 border-0 cursor-pointer shadow-fab hover:shadow-fab-hover hover:scale-105 active:scale-[.97] transition-all duration-150">
          <Plus size={16} /> Nueva obra
        </button>
      </div>

      {/* New obra modal */}
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
