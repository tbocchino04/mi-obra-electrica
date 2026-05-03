import { useState, useEffect, useRef } from "react";
import {
  User, MapPin, MessageSquare, ImageIcon, Camera,
  Pencil, Check, X, ChevronDown, FileCheck, Loader2, Users, Sun, Moon, AlertCircle, Clock,
} from "lucide-react";
import { escucharObraPorSocioToken, guardarObra } from "../firebase";
import { ESTADO_CONFIG, RUBROS } from "../constants/data";
import { useTheme } from "../hooks/useTheme";
import { Spinner, Label, SheetHandle, Accordion } from "./ui";
import AvanzaLogo from "./AvanzaLogo";
import { pctEtapa, progressStroke } from "../utils/helpers";
import { compressImage, validateImage } from "../utils/imageUtils";

export default function VistaSocio({ token }) {
  const [obra,       setObra]       = useState(undefined);
  const [expandidas, setExpandidas] = useState({});
  const [modalItem,  setModalItem]  = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState(false);
  const [fotoUploading, setFotoUploading] = useState(false);
  const [fotoError,     setFotoError]     = useState("");
  const { dark, toggle: toggleDark } = useTheme();
  const fileRef = useRef(null);

  useEffect(() => escucharObraPorSocioToken(token, setObra), [token]);

  function fmtComentario(c) {
    if (!c) return "";
    return typeof c === "string" ? c : (c.texto || "");
  }
  function fmtComentarioMeta(c) {
    if (!c || typeof c === "string" || !c.timestamp) return null;
    const fecha = new Date(c.timestamp).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
    return `${fecha} · ${c.autor === "admin" ? "Admin" : "Socio"}`;
  }

  async function updateItemSocio(etapaId, itemId, changes) {
    if (!obra) return;
    const rId = Object.entries(obra.socioTokensByRubro || {}).find(([, t]) => t === token)?.[0] ?? null;
    const enriched = "estado" in changes
      ? { ...changes, ultimoCambio: { autor: "socio", rubroId: rId, timestamp: Date.now() } }
      : changes;
    const newEtapas = (obra.etapas || []).map(e =>
      e.id === etapaId
        ? { ...e, items: (e.items || []).map(i => i.id === itemId ? { ...i, ...enriched } : i) }
        : e
    );
    setSaving(true);
    try {
      await guardarObra(obra.id, { etapas: newEtapas });
      setSaveError(false);
      setModalItem(prev => prev ? { ...prev, item: { ...prev.item, ...enriched } } : null);
    } catch (err) {
      console.error("Error actualizando ítem socio:", err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  if (obra === undefined) return <Spinner />;
  if (!obra) return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-4xl mb-4">🔍</div>
        <div className="font-bold text-lg text-ink dark:text-ink-50 mb-2">Link inválido</div>
        <div className="text-sm text-ink-500 dark:text-ink-400">Este link de socio no existe o fue eliminado.</div>
      </div>
    </div>
  );

  const obraInfo = obra.obraInfo || {};
  const rubroId  = Object.entries(obra.socioTokensByRubro || {}).find(([, t]) => t === token)?.[0] ?? null;
  const rubroConfig = RUBROS.find(r => r.id === rubroId);
  const etapas  = rubroId
    ? (obra.etapas || []).filter(e => (e.rubro || obraInfo.rubro) === rubroId)
    : (obra.etapas || []);
  const total   = etapas.flatMap(e => e.items || []).length;
  const comp    = etapas.flatMap(e => e.items || []).filter(i => i.estado === "completado").length;
  const pct     = total ? Math.round(comp / total * 100) : 0;
  const pColor  = rubroConfig ? rubroConfig.hex : progressStroke(pct);

  return (
    <>
    {saveError && (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-500 text-white text-sm font-semibold flex items-center justify-center gap-3 py-3 px-4 shadow-lg">
        <AlertCircle size={14} className="flex-shrink-0" />
        No se pudo guardar. Revisá tu conexión.
        <button onClick={() => setSaveError(false)}
          className="underline cursor-pointer bg-transparent border-0 text-white text-sm font-bold">
          Cerrar
        </button>
      </div>
    )}
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink pb-16 md:pb-0 md:flex md:h-screen">

      <div className="bg-white dark:bg-ink-900 border-b md:border-b-0 md:border-r border-ink-200 dark:border-ink-700 px-5 pt-5 pb-4 md:w-80 lg:w-96 md:flex-shrink-0 md:h-full md:overflow-y-auto md:pb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full"
            style={rubroConfig
              ? { background: rubroConfig.hex + "22", color: rubroConfig.hex }
              : { background: "rgb(237 233 254)", color: "rgb(109 40 217)" }}>
            <Users size={10} /> {rubroConfig ? `SOCIO · ${rubroConfig.label.toUpperCase()}` : "SOCIO"}
          </div>
          <div className="flex items-center gap-1.5">
            {saving && <Loader2 size={13} className="animate-spin text-ink-400 dark:text-ink-500" />}
            <button onClick={toggleDark}
              className="border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 rounded-full p-1.5 text-ink-500 dark:text-ink-400 cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors">
              {dark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <AvanzaLogo size={12} className="text-violet-600 dark:text-violet-400" />
          <Label className="logo-word">AVANZA</Label>
        </div>
        <div className="text-[22px] font-bold text-ink dark:text-ink-50 tracking-[-0.04em] leading-snug mb-1">{obraInfo.nombre}</div>
        {obraInfo.cliente && (
          <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400 mb-0.5">
            <User size={11} /> {obraInfo.cliente}
          </div>
        )}
        {obraInfo.direccion && (
          <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
            <MapPin size={11} /> {obraInfo.direccion}
          </div>
        )}

        <div className="mt-4">
          <div className="flex justify-between items-baseline mb-1.5">
            <Label>{rubroConfig ? `Progreso · ${rubroConfig.label}` : "Progreso total"}</Label>
            <span className="text-[22px] font-bold tracking-[-0.04em]"
              style={{ color: pColor }}>{pct}%</span>
          </div>
          <div className="h-0.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-[width_.45s_ease]" style={{ width: `${pct}%`, background: pColor }} />
          </div>
          <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-1.5 text-right">{comp} de {total} tareas</div>
        </div>

        <div className="mt-5 pt-4 border-t border-ink-100 dark:border-ink-800">
          <div className="text-[11px] text-ink-400 dark:text-ink-500 leading-relaxed">
            Podés actualizar el estado de los ítems y agregar comentarios y fotos. Los cambios se guardan en tiempo real.
          </div>
        </div>
      </div>

      <div className="px-3.5 pt-3.5 md:flex-1 md:min-w-0 md:overflow-y-auto md:px-6 md:pt-5">
        {etapas.map(etapa => {
          const open    = !!expandidas[etapa.id];
          const ep      = pctEtapa(etapa);

          const eRubroC = RUBROS.find(r => r.id === (etapa.rubro || obraInfo.rubro));
          return (
            <div key={etapa.id}
              style={eRubroC ? { borderLeftColor: eRubroC.hex } : {}}
              className={`bg-white dark:bg-ink-900 rounded-2xl mb-2.5 border border-l-[3px] border-ink-200 dark:border-ink-700 overflow-hidden`}>
              <div onClick={() => setExpandidas(p => ({ ...p, [etapa.id]: !p[etapa.id] }))}
                className="flex items-center px-4 py-4 cursor-pointer select-none hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-[14px] text-ink dark:text-ink-50 tracking-tight">{etapa.nombre}</div>
                    {etapa.firma && <FileCheck size={12} className="text-emerald-500 flex-shrink-0" />}
                  </div>
                  <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-0.5">
                    {(etapa.items || []).filter(i => i.estado === "completado").length}/{(etapa.items || []).length} completados
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9">
                    <svg viewBox="0 0 38 38" className="-rotate-90 w-9 h-9">
                      <circle cx="19" cy="19" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-ink-100 dark:text-ink-800" />
                      <circle cx="19" cy="19" r="15" fill="none" strokeWidth="3" strokeLinecap="round"
                        stroke={progressStroke(ep)} strokeDasharray={`${ep * 0.942} 100`}
                        style={{ transition: "stroke-dasharray .4s ease" }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-ink dark:text-ink-50">{ep}%</div>
                  </div>
                  <ChevronDown size={17} className={`text-ink-400 dark:text-ink-500 transition-transform duration-250 ${open ? "rotate-180" : ""}`} />
                </div>
              </div>

              <Accordion open={open}>
                <div className="border-t border-ink-100 dark:border-ink-800 px-3 pb-3.5 pt-2">
                  {(etapa.items || []).map(item => {
                    const cfg  = ESTADO_CONFIG[item.estado] || ESTADO_CONFIG.pendiente;
                    const done = item.estado === "completado";
                    return (
                      <div key={item.id}
                        className={`flex items-center gap-2.5 py-2.5 px-2.5 rounded-xl mb-1.5 border border-l-2 transition-colors ${cfg.bg} ${cfg.bgDark} ${cfg.border}`}>
                        <div onClick={() => updateItemSocio(etapa.id, item.id, { estado: done ? "pendiente" : "completado" })}
                          className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150 cursor-pointer border-[1.5px] ${
                            done ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-600"
                          } ${done ? "check-anim" : ""}`}>
                          {done && <Check size={11} strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[13px] leading-snug ${done ? "line-through text-ink-400 dark:text-ink-500" : "text-ink dark:text-ink-100"}`}>
                            {item.tarea}
                          </div>
                          {item.ultimoCambio && (
                            <div className="flex items-center gap-1 text-[10px] text-ink-400 dark:text-ink-500 mt-0.5">
                              <Clock size={9} />
                              {item.ultimoCambio.autor === "admin"
                                ? "Admin"
                                : (RUBROS.find(r => r.id === item.ultimoCambio.rubroId)?.label ?? "Socio")} ·{" "}
                              {new Date(item.ultimoCambio.timestamp).toLocaleString("es-AR", {
                                timeZone: "America/Argentina/Buenos_Aires",
                                day: "2-digit", month: "2-digit",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </div>
                          )}
                          {item.comentario && (
                            <div className="flex items-start gap-1 text-[11px] text-ink-400 dark:text-ink-500 mt-0.5">
                              <MessageSquare size={10} className="mt-0.5 flex-shrink-0" />
                              <span>{fmtComentario(item.comentario)}</span>
                            </div>
                          )}
                          {item.foto && (
                            <div className="flex items-center gap-1 text-[11px] text-violet-500 mt-0.5">
                              <ImageIcon size={10} /> Foto adjunta
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 flex-shrink-0 ${cfg.color} ${cfg.bg} ${cfg.bgDark}`}>
                          {cfg.label}
                        </span>
                        <button onClick={() => setModalItem({ etapaId: etapa.id, item })}
                          className="bg-transparent border-0 cursor-pointer p-1.5 text-ink-400 dark:text-ink-500 flex-shrink-0 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700">
                          <Pencil size={13} />
                        </button>
                      </div>
                    );
                  })}
                  {etapa.firma && (
                    <div className="mt-2 flex items-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                      <FileCheck size={12} className="text-emerald-600 flex-shrink-0" />
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        Firmado por {etapa.firma.firmante} · {etapa.firma.fecha}
                      </div>
                    </div>
                  )}
                </div>
              </Accordion>
            </div>
          );
        })}
      </div>

      {modalItem && (
        <div className="fixed inset-0 bg-ink/60 flex items-end md:items-center md:justify-center z-[100]"
          onClick={e => { if (e.target === e.currentTarget) setModalItem(null); }}>
          <div className="bg-white dark:bg-ink-900 rounded-t-3xl md:rounded-3xl px-5 pt-5 pb-11 md:pb-6 w-full md:max-w-lg max-h-[90dvh] md:max-h-[85vh] overflow-y-auto border border-ink-200 dark:border-ink-700 border-b-0 md:border animate-[slideUp_.22s_ease-out_both]">
            <SheetHandle />
            <div className="flex justify-between items-start mb-5">
              <div className="font-bold text-base text-ink dark:text-ink-50 flex-1 leading-snug tracking-tight">{modalItem.item.tarea}</div>
              <button onClick={() => setModalItem(null)}
                className="bg-ink-50 dark:bg-ink-800 border-0 rounded-full w-8 h-8 cursor-pointer text-ink-400 ml-3 flex-shrink-0 flex items-center justify-center">
                <X size={14} />
              </button>
            </div>

            <div className="mb-5">
              <Label>Estado</Label>
              <div className="flex gap-2 flex-wrap mt-2.5">
                {Object.entries(ESTADO_CONFIG).map(([k, v]) => {
                  const active = modalItem.item.estado === k;
                  return (
                    <button key={k} onClick={() => updateItemSocio(modalItem.etapaId, modalItem.item.id, { estado: k })}
                      className={`px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                        active ? `${v.border} ${v.bg} ${v.bgDark} ${v.color}` : "border-ink-200 dark:border-ink-700 bg-transparent text-ink-400 dark:text-ink-500"
                      }`}>
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <Label>Comentario</Label>
              <textarea
                value={fmtComentario(modalItem.item.comentario)}
                onChange={e => setModalItem(prev => ({ ...prev, item: { ...prev.item, comentario: e.target.value } }))}
                onBlur={e => {
                  const texto = e.target.value.trim();
                  updateItemSocio(modalItem.etapaId, modalItem.item.id, {
                    comentario: texto ? { texto, timestamp: Date.now(), autor: "socio" } : null,
                  });
                }}
                placeholder="Nota u observación..."
                className="w-full px-3.5 py-3 rounded-xl border border-ink-200 dark:border-ink-700 text-sm resize-none min-h-[80px] bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-300 outline-none focus:border-violet-500 transition-colors mt-2 leading-relaxed" />
              {fmtComentarioMeta(modalItem.item.comentario) && (
                <div className="flex items-center gap-1 text-[10px] text-ink-400 dark:text-ink-500 mt-1">
                  <MessageSquare size={9} />
                  {fmtComentarioMeta(modalItem.item.comentario)}
                </div>
              )}
            </div>

            <div>
              <Label>Foto Evidencia</Label>
              <div className="mt-2">
                {modalItem.item.foto ? (
                  <div>
                    <img src={modalItem.item.foto} alt="evidencia" className="w-full rounded-2xl max-h-[220px] object-cover" />
                    <button onClick={() => { updateItemSocio(modalItem.etapaId, modalItem.item.id, { foto: null }); }}
                      className="mt-2.5 bg-red-50 dark:bg-red-950/40 text-red-500 border-0 rounded-lg px-4 py-2 cursor-pointer font-bold text-xs">
                      Eliminar foto
                    </button>
                  </div>
                ) : fotoUploading ? (
                  <div className="w-full py-6 border border-dashed border-violet-300 dark:border-violet-700 rounded-2xl bg-violet-50 dark:bg-violet-950/20 flex flex-col items-center gap-2">
                    <Loader2 size={24} className="text-violet-500 animate-spin" />
                    <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">Subiendo foto...</span>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current.click()}
                    className="w-full py-6 border border-dashed border-ink-200 dark:border-ink-700 rounded-2xl bg-ink-50 dark:bg-ink-800 text-ink-400 dark:text-ink-500 cursor-pointer flex flex-col items-center gap-2 hover:border-violet-400 transition-colors">
                    <Camera size={26} />
                    <span className="text-sm font-semibold">Subir foto de evidencia</span>
                    <span className="text-xs">Tocá para seleccionar</span>
                  </button>
                )}
              </div>
              {fotoError && (
                <div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <AlertCircle size={11} /> {fotoError}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={async e => {
                  const file = e.target.files[0]; if (!file) return;
                  e.target.value = "";
                  try { validateImage(file); } catch (err) {
                    setFotoError(err.message);
                    setTimeout(() => setFotoError(""), 5000);
                    return;
                  }
                  setFotoError("");
                  setFotoUploading(true);
                  try {
                    const dataUrl = await new Promise(res => {
                      const r = new FileReader();
                      r.onload = ev => res(ev.target.result);
                      r.readAsDataURL(file);
                    });
                    const compressed = await compressImage(dataUrl);
                    await updateItemSocio(modalItem.etapaId, modalItem.item.id, { foto: compressed });
                  } catch (err) {
                    console.error("Error subiendo foto socio:", err);
                    setFotoError("No se pudo subir la foto. Intentá de nuevo.");
                    setTimeout(() => setFotoError(""), 5000);
                  } finally {
                    setFotoUploading(false);
                  }
                }} />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
