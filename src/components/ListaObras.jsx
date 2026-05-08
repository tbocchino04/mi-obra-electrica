import { useState } from "react";
import { Building2, Plus, User, MapPin, Trash2, Menu, Search, X, FileCheck, Clock, Calendar, LayoutGrid, List } from "lucide-react";
import AvanzaLogo from "./AvanzaLogo";
import { crearObra } from "../firebase";
import { ETAPAS_DEFAULT, RUBROS, TIPOS_PROYECTO, TEMPLATES } from "../constants/data";
import { SheetHandle, ModalConfirm } from "./ui";

const HOY = new Date().toISOString().slice(0, 10);
const HACE7 = Date.now() - 7 * 24 * 3600 * 1000;

const DIAS_SEMANA = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function fmtFechaCorta(iso) {
  if (!iso) return null;
  const [, m, d] = iso.split("-");
  return `${parseInt(d)} ${MESES[parseInt(m) - 1]}`;
}

function fmtTimestamp(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  const hhmm = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
  if (diffDays === 0) return `hoy · ${hhmm}`;
  if (diffDays === 1) return `ayer · ${hhmm}`;
  return `hace ${diffDays} d`;
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
  const obsCount = allItems.filter(i => i.estado === "observacion").length;

  const rubrosData = rubrosActivos.map(rid => {
    const rc = RUBROS.find(r => r.id === rid);
    const etapasRubro = etapas.filter(e => e.rubro === rid || (!e.rubro && obraInfo.rubro === rid));
    const items = etapasRubro.flatMap(e => e.items || []);
    const rComp = items.filter(i => i.estado === "completado").length;
    const rPct = items.length ? Math.round(rComp / items.length * 100) : 0;
    const cfg = rubrosConfig[rid] || {};
    const atrasado = !!(cfg.fechaEstimadaFin && cfg.fechaEstimadaFin < HOY && rPct < 100);
    const etapaActual = etapasRubro.find(e =>
      (e.items || []).length > 0 && (e.items || []).some(i => i.estado !== "completado")
    );
    return { rid, rc, pct: rPct, total: items.length, comp: rComp, atrasado, fechaFin: cfg.fechaEstimadaFin, etapaActual };
  });

  const atrasado = rubrosData.some(r => r.atrasado);
  const porFirmar = etapas.some(e => {
    const its = e.items || [];
    return its.length > 0 && its.every(i => i.estado === "completado") && !e.firma;
  });
  const porFirmarCount = etapas.filter(e => {
    const its = e.items || [];
    return its.length > 0 && its.every(i => i.estado === "completado") && !e.firma;
  }).length;

  const ultimaActividad = allItems
    .filter(i => i.ultimoCambio?.timestamp)
    .sort((a, b) => b.ultimoCambio.timestamp - a.ultimoCambio.timestamp)[0] || null;

  const actividadSemana = etapas.flatMap(e =>
    (e.items || [])
      .filter(i => i.ultimoCambio?.timestamp > HACE7)
      .map(i => ({
        tarea: i.tarea,
        rubro: e.rubro || obraInfo.rubro,
        ts: i.ultimoCambio.timestamp,
        dias: Math.round((Date.now() - i.ultimoCambio.timestamp) / 86400000),
      }))
  ).sort((a, b) => b.ts - a.ts).slice(0, 3);

  const proxFin = rubrosActivos
    .map(rid => (rubrosConfig[rid] || {}).fechaEstimadaFin)
    .filter(Boolean).filter(d => d >= HOY).sort()[0];

  return { pct, total, comp, rubrosData, atrasado, porFirmar, porFirmarCount, ultimaActividad, obsCount, actividadSemana, proxFin };
}

function StoryCard({ obra, stats, onSelect, onEliminar }) {
  const { pct, rubrosData, atrasado, porFirmar, porFirmarCount, ultimaActividad, obsCount, actividadSemana, proxFin } = stats;
  const info = obra.obraInfo || {};
  const etapas = obra.etapas || [];

  const tipo = (info.tipo || "").toUpperCase();
  const diasAlFin = proxFin ? Math.ceil((new Date(proxFin) - new Date(HOY)) / 86400000) : null;
  const finLabel = proxFin ? fmtFechaCorta(proxFin) : null;
  const finUrgente = diasAlFin !== null && diasAlFin <= 18;

  const atrasadasCount = rubrosData.filter(r => r.atrasado).length;
  const tsLabel = fmtTimestamp(ultimaActividad?.ultimoCambio?.timestamp);

  // Gradient blobs based on rubro colors
  const blob1 = rubrosData[0]?.rc?.hex || "#7c5cc9";
  const blob2 = rubrosData[1]?.rc?.hex || blob1;

  return (
    <div className="bg-[#13111f] dark:bg-[#13111f] rounded-2xl overflow-hidden">
      {/* Photo/gradient header */}
      <div className="relative h-44 overflow-hidden cursor-pointer" onClick={() => onSelect(obra)}>
        {/* Color blobs */}
        <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full blur-3xl opacity-50 pointer-events-none"
          style={{ background: blob1 }} />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full blur-3xl opacity-35 pointer-events-none"
          style={{ background: blob2 }} />
        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#13111f] via-[#13111f]/40 to-transparent pointer-events-none" />

        {/* Tipo badge */}
        {tipo && (
          <div className="absolute top-3 left-3 bg-white/90 text-[#0d0b14] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
            {tipo}
          </div>
        )}

        {/* Status badge */}
        {atrasado && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
            <span className="text-[8px]">●</span> ATRASADA
          </div>
        )}
        {!atrasado && porFirmar && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-400 text-[#0d0b14] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
            <FileCheck size={9} /> FIRMA PENDIENTE
          </div>
        )}

        {/* Name + % */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-end justify-between">
          <div>
            <div className="text-white font-bold text-[20px] tracking-[-0.03em] leading-tight">{info.nombre}</div>
            {info.cliente && <div className="text-white/65 text-[12px] mt-0.5">{info.cliente}</div>}
          </div>
          <div className="text-white font-black leading-none tracking-[-2px]">
            <span className="text-[44px]">{pct}</span><span className="text-[18px] align-super font-bold tracking-normal">%</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] bg-white/10">
        <div className="h-full transition-[width_.5s_ease]"
          style={{ width: `${pct}%`, background: atrasado ? "#ef4444" : pct === 100 ? "#10b981" : "#7c5cc9" }} />
      </div>

      {/* Meta strip */}
      <div className="px-4 py-3 flex items-center gap-4 flex-wrap border-b border-white/[0.07] cursor-pointer" onClick={() => onSelect(obra)}>
        {info.direccion && (
          <span className="flex items-center gap-1.5 text-[11px] text-white/40">
            <MapPin size={10} /> {info.direccion}
          </span>
        )}
        {finLabel && (
          <span className="flex items-center gap-1.5 text-[11px] text-white/40">
            <Calendar size={10} />
            Fin {finLabel}
            {diasAlFin !== null && (
              <span className={`font-bold ${finUrgente ? "text-red-400" : "text-white/40"}`}>· en {diasAlFin}d</span>
            )}
          </span>
        )}
      </div>

      {/* Rubros table */}
      {rubrosData.length > 0 && (
        <div className="px-4 py-3 border-b border-white/[0.07] cursor-pointer" onClick={() => onSelect(obra)}>
          {rubrosData.map(({ rid, rc, pct: rp, atrasado: ra, etapaActual }) => (
            <div key={rid} className="flex items-center gap-2 mb-2 last:mb-0">
              <div className="flex items-center gap-1.5 w-[88px] flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: rc?.hex }} />
                <span className="text-[11px] font-semibold text-white/80 truncate">{rc?.label}</span>
              </div>
              <span className="text-[10px] text-white/35 flex-shrink-0 truncate max-w-[90px]">
                {etapaActual ? `· ${etapaActual.nombre}` : "· Completo"}
              </span>
              {ra && <span className="text-[10px] font-bold text-red-400 flex-shrink-0 ml-auto mr-1">● atrasada</span>}
              {!ra && <div className="flex-1" />}
              <div className="w-20 h-[3px] bg-white/10 rounded-full overflow-hidden flex-shrink-0">
                <div className="h-full rounded-full transition-[width_.45s_ease]"
                  style={{ width: `${rp}%`, background: ra ? "#ef4444" : rc?.hex }} />
              </div>
              <span className="text-[11px] font-bold w-8 text-right flex-shrink-0"
                style={{ color: ra ? "#ef4444" : rc?.hex }}>{rp}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Esta semana */}
      {actividadSemana.length > 0 && (
        <div className="px-4 py-3 border-b border-white/[0.07] cursor-pointer" onClick={() => onSelect(obra)}>
          <div className="text-[9px] font-black tracking-[0.15em] uppercase text-white/30 mb-2">Esta semana</div>
          {actividadSemana.map((act, i) => {
            const rc = RUBROS.find(r => r.id === act.rubro);
            const label = act.dias === 0 ? "HOY" : act.dias === 1 ? "AYER" : `${act.dias} DÍAS`;
            return (
              <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: rc?.hex || "#7c5cc9" }} />
                <span className="text-[10px] font-black text-white/35 w-10 flex-shrink-0">{label}</span>
                <span className="text-[11px] text-white/60 truncate">
                  {rc?.label}{act.tarea ? ` · ${act.tarea}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {atrasadasCount > 0 && (
            <span className="text-[11px] font-semibold text-red-400 flex items-center gap-1">
              <span className="text-[9px]">●</span> {atrasadasCount} atrasada{atrasadasCount > 1 ? "s" : ""}
            </span>
          )}
          {obsCount > 0 && (
            <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <span className="text-[9px]">●</span> {obsCount} obs.
            </span>
          )}
          {porFirmarCount > 0 && (
            <span className="text-[11px] font-semibold text-white/40 flex items-center gap-1">
              <FileCheck size={10} /> {porFirmarCount} firmar
            </span>
          )}
          {atrasadasCount === 0 && obsCount === 0 && porFirmarCount === 0 && (
            <span className="text-[11px] text-white/25 flex items-center gap-1">
              <Clock size={9} /> Sin alertas
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {tsLabel && <span className="text-[10px] text-white/30">{tsLabel}</span>}
          <button onClick={e => { e.stopPropagation(); onEliminar(obra); }}
            className="bg-transparent border-0 text-red-400/60 hover:text-red-400 cursor-pointer flex items-center gap-1 text-[11px] font-semibold transition-colors p-0">
            <Trash2 size={11} />
          </button>
        </div>
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
  const [vistaLista,   setVistaLista]   = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);

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

  const hoyDate = new Date();
  const hoyLabel = `${DIAS_SEMANA[hoyDate.getDay()]} ${hoyDate.getDate()} ${MESES[hoyDate.getMonth()]}`;

  const totalActualizaciones = obras.reduce((acc, o) =>
    acc + (o.etapas || []).flatMap(e => e.items || []).filter(i => i.ultimoCambio?.timestamp > HACE7).length, 0);

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
  const atrasadasNombres = obras.filter(o => computeObra(o).atrasado).map(o => o.obraInfo?.nombre).filter(Boolean);

  return (
    <div className="min-h-[100dvh] bg-[#0d0b14] pb-24">

      {/* Header */}
      <div className="px-5 md:px-8 pt-6 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <button onClick={onOpenSidebar} className="md:hidden bg-transparent border-0 cursor-pointer text-white/40 p-0 mr-1">
                <Menu size={16} />
              </button>
              <AvanzaLogo size={11} className="text-violet-400" />
              <span className="text-[10px] font-black tracking-[0.15em] uppercase text-violet-400">AVANZA</span>
            </div>
            <div className="text-[34px] md:text-[40px] font-black text-white tracking-[-0.04em] leading-none">
              Tus obras,<br className="sm:hidden" /><span className="sm:inline"> </span>esta semana
            </div>
            <div className="text-[13px] text-white/40 mt-2">
              {obras.length} obra{obras.length !== 1 ? "s" : ""}
              {totalActualizaciones > 0 && ` · ${totalActualizaciones} actualización${totalActualizaciones !== 1 ? "es" : ""}`}
              {" · "}{hoyLabel}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            <button onClick={() => setSearchOpen(v => !v)}
              className="border border-white/15 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl px-3 py-2 text-[12px] font-semibold cursor-pointer transition-colors flex items-center gap-1.5">
              <Search size={12} />
            </button>
            <button onClick={() => setVistaLista(v => !v)}
              className="border border-white/15 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl px-3 py-2 text-[12px] font-semibold cursor-pointer transition-colors flex items-center gap-1.5">
              {vistaLista ? <LayoutGrid size={13} /> : <List size={13} />}
              {vistaLista ? "Grid" : "Lista"}
            </button>
            <button onClick={() => setModal(true)}
              className="bg-white text-[#0d0b14] font-black text-[12px] rounded-xl px-3.5 py-2 flex items-center gap-1.5 border-0 cursor-pointer hover:bg-white/90 transition-colors">
              <Plus size={13} /> Nueva obra
            </button>
          </div>
        </div>

        {/* Search bar (expandible) */}
        {searchOpen && (
          <div className="relative mt-4">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              autoFocus
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por obra, cliente o dirección..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/60 transition-colors"
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 bg-transparent border-0 cursor-pointer p-0.5">
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* Alert strip */}
        {(atrasadasCount > 0 || firmaCount > 0) && (
          <div className="flex gap-2 flex-wrap mt-4">
            {atrasadasCount > 0 && (
              <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-full px-3.5 py-2 text-[12px] font-semibold text-red-400">
                <span className="text-[9px]">●</span>
                <span>{atrasadasCount} obra{atrasadasCount !== 1 ? "s" : ""} con rubros atrasados:</span>
                <span className="font-black text-red-300">{atrasadasNombres.join(" · ")}</span>
              </div>
            )}
            {firmaCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/25 rounded-full px-3.5 py-2 text-[12px] font-semibold text-amber-400">
                <FileCheck size={11} />
                {firmaCount} conformidad{firmaCount !== 1 ? "es" : ""} por firmar
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className={`px-5 md:px-8 ${vistaLista ? "flex flex-col gap-3" : "md:grid md:grid-cols-2 md:gap-4 md:items-start"}`}>
        {obras.length === 0 && (
          <div className="text-center py-20 px-5">
            <Building2 size={44} className="text-white/10 mx-auto mb-4" />
            <div className="font-bold text-base text-white/60 mb-1.5">Sin obras todavía</div>
            <div className="text-sm text-white/30">Creá la primera con el botón de arriba.</div>
          </div>
        )}

        {obras.length > 0 && sorted.length === 0 && (
          <div className="text-center py-12 px-5 col-span-2">
            <Search size={32} className="text-white/10 mx-auto mb-3" />
            <div className="font-bold text-sm text-white/60 mb-1">Sin resultados</div>
            <div className="text-xs text-white/30">Probá con otro nombre o cliente.</div>
          </div>
        )}

        {sorted.map(({ obra, stats }) => (
          <div key={obra.id} className="mb-3 md:mb-0">
            <StoryCard obra={obra} stats={stats} onSelect={onSelect} onEliminar={o => setConfirmEl(o)} />
          </div>
        ))}
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
