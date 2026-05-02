import { useState, useEffect, useRef } from "react";
import {
  Zap, User, MapPin, Cloud, Loader2, PenLine, FileCheck,
  ArrowLeft, Sun, Moon, Plus, X, ChevronDown,
  Share2, MoreHorizontal, FileDown, Users, Check,
  Camera, Trash2,
} from "lucide-react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  guardarObra, escucharObra, escucharObras,
  crearObra, eliminarObra, onAuth, obtenerPerfil, enviarVerificacion, verificarEmailToken,
} from "./firebase";
import { RUBROS, TEMPLATES, ESTADO_CONFIG } from "./constants/data";
import { useTheme } from "./hooks/useTheme";
import { Label, SheetHandle, Spinner, Accordion, ModalConfirm } from "./components/ui";
import { SortableItemList } from "./components/SortableItem";
import AuthScreen from "./components/AuthScreen";
import HomeView from "./components/HomeView";
import VistaCliente from "./components/VistaCliente";
import VistaPublica from "./components/VistaPublica";
import VistaSocio from "./components/VistaSocio";
import ModalFirma from "./components/ModalFirma";
import { pctEtapa, fmtMonto, progressColor, progressStroke } from "./utils/helpers";
import { compressImage } from "./utils/imageUtils";

const clienteToken = new URLSearchParams(window.location.search).get("c");
const socioToken   = new URLSearchParams(window.location.search).get("s");
const verifyToken  = new URLSearchParams(window.location.search).get("verify");

function PantallaConfirmarEmail() {
  const [estado, setEstado] = useState("verificando");
  const [error,  setError]  = useState("");
  const { dark, toggle } = useTheme();

  useEffect(() => {
    const unsub = onAuth(async user => {
      unsub();
      if (!user) {
        setError("Iniciá sesión en la app y hacé click en el link nuevamente.");
        setEstado("error");
        return;
      }
      try {
        await verificarEmailToken(verifyToken);
        setEstado("ok");
      } catch (err) {
        setError(err.message);
        setEstado("error");
      }
    });
    return unsub;
  }, []);

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink flex flex-col items-center justify-center px-5 py-6 gap-5">
      <div className="bg-white dark:bg-ink-900 rounded-3xl p-10 w-full max-w-sm border border-ink-200 dark:border-ink-700 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-100 dark:bg-violet-900/40 rounded-xl mb-5">
          <Zap size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        {estado === "verificando" && <>
          <div className="font-bold text-[20px] text-ink dark:text-ink-50 tracking-tight mb-2">Verificando...</div>
          <Loader2 size={20} className="animate-spin text-violet-500 mx-auto mt-2" />
        </>}
        {estado === "ok" && <>
          <div className="font-bold text-[20px] text-ink dark:text-ink-50 tracking-tight mb-2">Email verificado</div>
          <div className="text-sm text-ink-500 dark:text-ink-400 mb-6">Tu cuenta está activa. Podés ingresar.</div>
          <button onClick={() => window.location.href = "/"}
            className="w-full py-3 rounded-xl font-bold text-sm border-0 bg-ink dark:bg-white text-white dark:text-ink cursor-pointer">
            Ir a la app
          </button>
        </>}
        {estado === "error" && <>
          <div className="font-bold text-[20px] text-ink dark:text-ink-50 tracking-tight mb-2">Error</div>
          <div className="text-sm text-red-500 mb-6">{error}</div>
          <button onClick={() => window.location.href = "/"}
            className="w-full py-3 rounded-xl font-bold text-sm border-0 bg-ink dark:bg-white text-white dark:text-ink cursor-pointer">
            Volver a la app
          </button>
        </>}
      </div>
      <button onClick={toggle}
        className="flex items-center gap-2 text-sm text-ink-400 dark:text-ink-500 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 rounded-full px-4 py-2 cursor-pointer">
        {dark ? <Sun size={14} /> : <Moon size={14} />}
        {dark ? "Modo claro" : "Modo oscuro"}
      </button>
    </div>
  );
}

function PantallaVerificacion({ onReenviar }) {
  const [enviado,  setEnviado]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const { dark, toggle } = useTheme();

  useEffect(() => { enviar(); }, []);

  async function enviar() {
    setLoading(true); setError("");
    try { await onReenviar(); setEnviado(true); }
    catch (err) { setError(err?.message || "Error al enviar el email. Intentá de nuevo."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink flex flex-col items-center justify-center px-5 py-6 gap-5">
      <div className="bg-white dark:bg-ink-900 rounded-3xl p-10 w-full max-w-sm border border-ink-200 dark:border-ink-700 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-100 dark:bg-violet-900/40 rounded-xl mb-5">
          <Zap size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div className="font-bold text-[20px] text-ink dark:text-ink-50 tracking-tight mb-2">Verificá tu email</div>
        <div className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed mb-6">
          {enviado
            ? "Te enviamos el link de confirmación. Revisá tu bandeja de entrada y hacé click en el link para continuar."
            : loading ? "Enviando email de verificación..." : "Preparando tu cuenta..."}
        </div>
        {error && (
          <div className="text-xs text-red-500 font-medium mb-4 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {(enviado || error) && (
          <button onClick={enviar} disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm border border-ink-200 dark:border-ink-700 bg-transparent text-ink dark:text-ink-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3">
            {loading && <Loader2 size={13} className="animate-spin" />}
            {loading ? "Enviando..." : "Reenviar email"}
          </button>
        )}
        <button onClick={() => window.location.reload()}
          className="w-full py-3 rounded-xl font-bold text-sm border-0 bg-ink dark:bg-white text-white dark:text-ink cursor-pointer">
          Ya verifiqué, continuar
        </button>
      </div>
      <button onClick={toggle}
        className="flex items-center gap-2 text-sm text-ink-400 dark:text-ink-500 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 rounded-full px-4 py-2 cursor-pointer">
        {dark ? <Sun size={14} /> : <Moon size={14} />}
        {dark ? "Modo claro" : "Modo oscuro"}
      </button>
    </div>
  );
}

export default function App() {
  if (clienteToken) return <VistaPublica token={clienteToken} />;
  if (socioToken)   return <VistaSocio   token={socioToken}   />;
  if (verifyToken)  return <PantallaConfirmarEmail />;

  const { dark, toggle: toggleDark } = useTheme();
  const [user,        setUser]        = useState(undefined);
  const [userProfile, setUserProfile] = useState(null);
  const [obras,       setObras]       = useState([]);
  const [obraActiva,  setObraActiva]  = useState(null);
  const [etapas,      setEtapas]      = useState([]);
  const [obraInfo,    setObraInfo]    = useState({ nombre: "", cliente: "", direccion: "", clienteEmail: "", adminEmail: "" });
  const [expandidas,  setExpandidas]  = useState({});
  const [modalItem,   setModalItem]   = useState(null);
  const [vistaCliente,  setVistaCliente]  = useState(false);
  const [editInfo,      setEditInfo]      = useState(false);
  const [nuevoItemEtapa, setNuevoItemEtapa] = useState(null);
  const [nuevoItemTexto, setNuevoItemTexto] = useState("");
  const [saving,        setSaving]        = useState(false);
  const [cloudStatus,   setCloudStatus]   = useState("");
  const [fotoUploading, setFotoUploading] = useState(false);
  const [confirmItem,   setConfirmItem]   = useState(null);
  const [copied,           setCopied]           = useState(false);
  const [copiedSocioRubro, setCopiedSocioRubro] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [rubroActivo,   setRubroActivo]   = useState(null);
  const [modalRubro,    setModalRubro]    = useState(false);
  const [menuCompartir, setMenuCompartir] = useState(false);
  const [modalFirmaEtapa, setModalFirmaEtapa] = useState(null);
  const fileRef   = useRef();
  const saveTimer = useRef();
  const unsubRef  = useRef();

  useEffect(() => {
    return onAuth(async u => {
      setUser(u);
      if (u) {
        const perfil = await obtenerPerfil(u.uid);
        setUserProfile(perfil);
      } else {
        setUserProfile(null);
        setObras([]);
        setObraActiva(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = escucharObras(user.uid, setObras);
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (unsubRef.current) unsubRef.current();
    if (!obraActiva) return;
    unsubRef.current = escucharObra(obraActiva.id, data => {
      if (data?.etapas)   setEtapas(data.etapas);
      if (data?.obraInfo) setObraInfo(data.obraInfo);
      setCloudStatus("Sincronizado");
    });
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [obraActiva?.id]);

  useEffect(() => {
    if (!obraActiva || !etapas.length) return;
    clearTimeout(saveTimer.current);
    setSaving(true);
    setCloudStatus("Guardando...");
    saveTimer.current = setTimeout(async () => {
      try {
        await guardarObra(obraActiva.id, { etapas, obraInfo });
        setCloudStatus("Guardado");
      } catch { setCloudStatus("Error"); }
      setSaving(false);
    }, 800);
  }, [etapas, obraInfo]);

  if (user === undefined) return <Spinner />;
  if (!user) return <AuthScreen />;
  if (!userProfile) return <Spinner />;
  if (!userProfile.emailVerified) return <PantallaVerificacion onReenviar={enviarVerificacion} />;

  const totalItems  = etapas.flatMap(e => e.items || []).length;
  const completados = etapas.flatMap(e => e.items || []).filter(i => i.estado === "completado").length;
  const pct         = totalItems ? Math.round(completados / totalItems * 100) : 0;
  const pColor      = progressStroke(pct);

  const rubrosActivos = obraInfo.rubros?.length
    ? obraInfo.rubros
    : (obraInfo.rubro ? [obraInfo.rubro] : []);

  function getRubroDeEtapa(e) { return e.rubro || obraInfo.rubro || null; }

  const etapasFiltradas = rubroActivo === null
    ? etapas
    : etapas.filter(e => getRubroDeEtapa(e) === rubroActivo);

  function updateItem(etapaId, itemId, changes) {
    setEtapas(prev => prev.map(e => e.id !== etapaId ? e : {
      ...e, items: e.items.map(i => i.id !== itemId ? i : { ...i, ...changes })
    }));
    if (modalItem?.item?.id === itemId) setModalItem(prev => ({ ...prev, item: { ...prev.item, ...changes } }));
  }

  function updateEtapa(etapaId, changes) {
    setEtapas(prev => prev.map(e => e.id !== etapaId ? e : { ...e, ...changes }));
  }

  async function copiarLink() {
    let token = obraActiva.clienteToken;
    if (!token) {
      token = crypto.randomUUID();
      await guardarObra(obraActiva.id, { clienteToken: token });
      setObraActiva(prev => ({ ...prev, clienteToken: token }));
    }
    const url = `${window.location.origin}${window.location.pathname}?c=${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function copiarLinkSocioRubro(rubroId) {
    let token;
    if (!rubroId) {
      token = obraActiva.socioToken;
      if (!token) {
        token = crypto.randomUUID();
        await guardarObra(obraActiva.id, { socioToken: token });
        setObraActiva(prev => ({ ...prev, socioToken: token }));
      }
    } else {
      const tokensByRubro = obraActiva.socioTokensByRubro || {};
      token = tokensByRubro[rubroId];
      if (!token) {
        token = crypto.randomUUID();
        const newTokensByRubro = { ...tokensByRubro, [rubroId]: token };
        const newTokensArray   = Object.values(newTokensByRubro);
        await guardarObra(obraActiva.id, { socioTokensByRubro: newTokensByRubro, socioTokensArray: newTokensArray });
        setObraActiva(prev => ({ ...prev, socioTokensByRubro: newTokensByRubro, socioTokensArray: newTokensArray }));
      }
    }
    const url = `${window.location.origin}${window.location.pathname}?s=${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedSocioRubro(rubroId ?? "general");
    setTimeout(() => setCopiedSocioRubro(null), 2500);
  }

  async function descargarReporte() {
    setReportLoading(true);
    try {
      const { generarReporteObra } = await import("./services/pdf");
      const pdf = await generarReporteObra({ etapas, obraInfo, rubros: RUBROS });
      const nombre = `Reporte_${obraInfo.nombre || "Obra"}`.replace(/\s+/g, "_");
      pdf.save(`${nombre}.pdf`);
    } catch (err) {
      console.error("Reporte error:", err);
    } finally {
      setReportLoading(false);
    }
  }

  function addItem(etapaId) {
    if (!nuevoItemTexto.trim()) return;
    const ni = { id: Date.now().toString(), tarea: nuevoItemTexto.trim(), estado: "pendiente", comentario: "", foto: null };
    setEtapas(prev => prev.map(e => e.id !== etapaId ? e : { ...e, items: [...e.items, ni] }));
    setNuevoItemTexto(""); setNuevoItemEtapa(null);
  }

  function reorderItems(etapaId, oldIndex, newIndex) {
    setEtapas(prev => prev.map(e =>
      e.id !== etapaId ? e : { ...e, items: arrayMove(e.items, oldIndex, newIndex) }
    ));
  }

  function deleteItem(etapaId, itemId) {
    setEtapas(prev => prev.map(e => e.id !== etapaId ? e : { ...e, items: e.items.filter(i => i.id !== itemId) }));
    setModalItem(null);
  }

  function addRubro(rubroId) {
    const nuevos = [...new Set([...rubrosActivos, rubroId])];
    setObraInfo(prev => ({ ...prev, rubros: nuevos }));
    if (TEMPLATES[rubroId]) {
      const ts = Date.now();
      const nuevasEtapas = TEMPLATES[rubroId].map((e, ei) => ({
        ...e,
        id: `${rubroId}_${ts}_${ei}`,
        rubro: rubroId,
        monto: "", moneda: "ARS", firma: null,
        items: e.items.map((i, ii) => ({
          ...i, id: `${rubroId}_${ts}_${ei}_${ii}`,
          estado: "pendiente", comentario: "", foto: null,
        })),
      }));
      setEtapas(prev => [...prev, ...nuevasEtapas]);
    }
  }

  function removeRubro(rubroId) {
    setObraInfo(prev => ({ ...prev, rubros: (prev.rubros || []).filter(r => r !== rubroId) }));
    setEtapas(prev => prev.filter(e => (e.rubro || obraInfo.rubro) !== rubroId));
    if (rubroActivo === rubroId) setRubroActivo(null);
  }

  async function handleFoto(e, etapaId, itemId) {
    const file = e.target.files[0]; if (!file) return;
    setFotoUploading(true);
    try {
      const dataUrl = await new Promise(res => {
        const r = new FileReader();
        r.onload = ev => res(ev.target.result);
        r.readAsDataURL(file);
      });
      const compressed = await compressImage(dataUrl);
      updateItem(etapaId, itemId, { foto: compressed });
    } catch (err) {
      console.error("Error subiendo foto:", err);
    } finally {
      setFotoUploading(false);
    }
  }

  if (!obraActiva) return (
    <HomeView
      obras={obras}
      uid={user.uid}
      userNombre={userProfile.nombre}
      onSelectObra={o => { setObraActiva(o); setExpandidas({}); setVistaCliente(false); }}
      onEliminar={async o => { await eliminarObra(o.id); }} />
  );

  if (vistaCliente) return (
    <VistaCliente etapas={etapas} obraInfo={obraInfo} onVolver={() => setVistaCliente(false)} />
  );

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink pb-16 md:pb-0 md:flex md:h-screen">

      {/* Panel izquierdo */}
      <div className="bg-white dark:bg-ink-900 border-b md:border-b-0 md:border-r border-ink-200 dark:border-ink-700 px-5 pt-5 pb-4 md:w-80 lg:w-96 md:flex-shrink-0 md:h-full md:overflow-y-auto md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setObraActiva(null)}
            className="bg-transparent border-0 text-ink-400 dark:text-ink-500 cursor-pointer flex items-center gap-1 text-xs font-medium p-0">
            <ArrowLeft size={13} /> Obras
          </button>
          <div className="flex gap-1.5 items-center">
            {cloudStatus && (
              <span className="text-[11px] text-ink-400 dark:text-ink-500 flex items-center gap-1 mr-1">
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Cloud size={11} />}
                {saving ? "" : cloudStatus}
              </span>
            )}
            <button onClick={() => setVistaCliente(true)}
              className="border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/30 rounded-full px-3 py-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-400 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors">
              Vista cliente
            </button>

            {menuCompartir && (
              <div className="fixed inset-0 z-[65]" onClick={() => setMenuCompartir(false)} />
            )}
            <div className="relative z-[70]">
              <button onClick={() => setMenuCompartir(v => !v)}
                className={`border rounded-full p-1.5 cursor-pointer transition-colors flex items-center justify-center ${
                  menuCompartir
                    ? "border-violet-400 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400"
                    : "border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-700"
                }`}>
                <MoreHorizontal size={13} />
              </button>

              {menuCompartir && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 shadow-modal overflow-hidden animate-[fadeIn_.15s_ease-out_both]">
                  {(() => {
                    const rc = RUBROS.find(r => r.id === rubroActivo);
                    const copiedKey = rubroActivo ?? "general";
                    const isCopied = copiedSocioRubro === copiedKey;
                    return (
                      <button
                        onClick={() => { copiarLinkSocioRubro(rubroActivo); setTimeout(() => setMenuCompartir(false), 1600); }}
                        className="w-full flex items-center gap-3 px-4 py-3 border-0 bg-transparent text-left transition-colors hover:bg-ink-50 dark:hover:bg-ink-800 cursor-pointer">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{ background: isCopied ? "rgb(237 233 254)" : (rc ? rc.hex + "28" : "#ede9fe") }}>
                          {isCopied
                            ? <Check size={12} className="text-violet-600 dark:text-violet-400" />
                            : <Users size={12} style={{ color: rc ? rc.hex : "#7c5cc9" }} />}
                        </div>
                        <div>
                          <div className={`text-[12px] font-semibold leading-none ${isCopied ? "text-violet-600 dark:text-violet-400" : "text-ink dark:text-ink-50"}`}>
                            {isCopied ? "¡Link copiado!" : rc ? `Socio · ${rc.label}` : "Socio · General"}
                          </div>
                          <div className="text-[10px] text-ink-400 dark:text-ink-500 mt-0.5">
                            {rc ? "Acceso solo a este rubro" : "Acceso completo a la obra"}
                          </div>
                        </div>
                      </button>
                    );
                  })()}

                  <div className="h-px bg-ink-100 dark:bg-ink-800 mx-3" />

                  <button onClick={() => { copiarLink(); setTimeout(() => setMenuCompartir(false), 1600); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors border-0 bg-transparent cursor-pointer text-left">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${copied ? "bg-emerald-100 dark:bg-emerald-950/50" : "bg-ink-100 dark:bg-ink-800"}`}>
                      {copied ? <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> : <Share2 size={12} className="text-ink-500 dark:text-ink-400" />}
                    </div>
                    <div>
                      <div className={`text-[12px] font-semibold leading-none ${copied ? "text-emerald-600 dark:text-emerald-400" : "text-ink dark:text-ink-50"}`}>
                        {copied ? "¡Link copiado!" : "Link para cliente"}
                      </div>
                      <div className="text-[10px] text-ink-400 dark:text-ink-500 mt-0.5">Solo lectura</div>
                    </div>
                  </button>

                  <div className="h-px bg-ink-100 dark:bg-ink-800 mx-3" />

                  <button onClick={() => { descargarReporte(); setMenuCompartir(false); }} disabled={reportLoading}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors border-0 bg-transparent cursor-pointer text-left disabled:opacity-50">
                    <div className="w-7 h-7 rounded-xl bg-ink-100 dark:bg-ink-800 flex items-center justify-center flex-shrink-0">
                      {reportLoading ? <Loader2 size={12} className="animate-spin text-ink-500 dark:text-ink-400" /> : <FileDown size={12} className="text-ink-500 dark:text-ink-400" />}
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold leading-none text-ink dark:text-ink-50">
                        {reportLoading ? "Generando PDF..." : "Descargar reporte"}
                      </div>
                      <div className="text-[10px] text-ink-400 dark:text-ink-500 mt-0.5">PDF completo de la obra</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <button onClick={toggleDark}
              className="border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 rounded-full p-1.5 text-ink-500 dark:text-ink-400 cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors">
              {dark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </div>

        {editInfo ? (
          <div>
            {[
              ["nombre",       "Nombre de obra"],
              ["cliente",      "Cliente"],
              ["direccion",    "Dirección"],
              ["clienteEmail", "Email del cliente"],
              ["adminEmail",   "Tu email (admin)"],
            ].map(([k, ph]) => (
              <input key={k} value={obraInfo[k] || ""} placeholder={ph}
                onChange={e => setObraInfo(p => ({ ...p, [k]: e.target.value }))}
                className={`bg-transparent border-0 border-b border-ink-200 dark:border-ink-700 text-ink dark:text-ink-50 w-full mb-2 py-1 outline-none block ${k === "nombre" ? "text-lg font-bold tracking-tight" : "text-sm"}`} />
            ))}
            <button onClick={() => setEditInfo(false)}
              className="mt-2 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-0 rounded-lg px-4 py-1.5 font-bold cursor-pointer text-xs">
              Guardar
            </button>
          </div>
        ) : (
          <div onClick={() => setEditInfo(true)} className="cursor-pointer">
            <div className="text-[22px] font-bold text-ink dark:text-ink-50 tracking-[-0.04em] leading-snug">{obraInfo.nombre}</div>
            <div className="flex gap-4 mt-1.5 flex-wrap">
              {obraInfo.cliente && (
                <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                  <User size={11} /> {obraInfo.cliente}
                </div>
              )}
              {obraInfo.direccion && (
                <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                  <MapPin size={11} /> {obraInfo.direccion}
                </div>
              )}
            </div>
            <div className="text-[10px] text-ink-400 dark:text-ink-600 mt-1.5 tracking-widest font-medium md:hidden">TOCA PARA EDITAR</div>
          </div>
        )}

        <div className="mt-4">
          <div className="flex justify-between items-baseline mb-1.5">
            <Label>Progreso total</Label>
            <span className={`text-[22px] font-bold tracking-[-0.04em] ${progressColor(pct)}`}>{pct}%</span>
          </div>
          <div className="h-0.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-[width_.45s_ease]" style={{ width: `${pct}%`, background: pColor }} />
          </div>
          <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-1.5 text-right">
            {completados} de {totalItems} tareas
          </div>
        </div>

        {rubrosActivos.length > 1 && (
          <div className="mt-4 pt-4 border-t border-ink-100 dark:border-ink-800">
            <Label>Por rubro</Label>
            <div className="mt-2.5 flex flex-col gap-3">
              {rubrosActivos.map(rid => {
                const rc  = RUBROS.find(r => r.id === rid);
                const lbl = rc?.label || rid;
                const its = etapas.filter(e => getRubroDeEtapa(e) === rid).flatMap(e => e.items || []);
                const cp  = its.filter(i => i.estado === "completado").length;
                const rp  = its.length ? Math.round(cp / its.length * 100) : 0;
                const isActive = rubroActivo === rid;
                return (
                  <button key={rid} onClick={() => setRubroActivo(isActive ? null : rid)}
                    className="text-left cursor-pointer bg-transparent border-0 p-0 w-full">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`text-[11px] font-semibold transition-colors ${isActive ? (rc?.text || "text-violet-600 dark:text-violet-400") : "text-ink-500 dark:text-ink-400"}`}>
                        {lbl}
                      </span>
                      <span className="text-[12px] font-bold" style={{ color: rc?.hex }}>{rp}%</span>
                    </div>
                    <div className="h-1 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-[width_.45s_ease]" style={{ width: `${rp}%`, background: rc?.hex || progressStroke(rp) }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Columna derecha */}
      <div className="md:flex-1 md:min-w-0 md:overflow-y-auto">

        {rubrosActivos.length > 0 && (
          <div className="px-3.5 md:px-6 pt-3.5 md:pt-5 pb-1">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <button onClick={() => setRubroActivo(null)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border cursor-pointer transition-colors ${
                  rubroActivo === null
                    ? "bg-ink dark:bg-ink-50 text-white dark:text-ink border-transparent"
                    : "bg-white dark:bg-ink-800 text-ink-500 dark:text-ink-400 border-ink-200 dark:border-ink-700 hover:border-ink-400"
                }`}>
                General
              </button>
              {rubrosActivos.map(rid => {
                const rc     = RUBROS.find(r => r.id === rid);
                const lbl    = rc?.label || rid;
                const active = rubroActivo === rid;
                return (
                  <div key={rid} className="flex-shrink-0 flex">
                    <button onClick={() => setRubroActivo(rid)}
                      style={active ? { background: rc?.hex, borderColor: rc?.hex, color: "white" } : {}}
                      className={`px-3.5 py-1.5 rounded-l-full text-[12px] font-semibold border-y border-l cursor-pointer transition-all ${
                        active
                          ? "border-transparent"
                          : `bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-700 ${rc?.text || "text-ink-500 dark:text-ink-400"} hover:border-current`
                      }`}>
                      {lbl}
                    </button>
                    <button onClick={() => removeRubro(rid)} title="Eliminar rubro"
                      style={active ? { background: rc?.hex, borderColor: rc?.hex, color: "rgba(255,255,255,0.7)" } : {}}
                      className={`px-2 py-1.5 rounded-r-full text-[11px] border-y border-r cursor-pointer transition-all ${
                        active
                          ? "border-transparent hover:opacity-80"
                          : "bg-white dark:bg-ink-800 text-ink-300 dark:text-ink-600 border-ink-200 dark:border-ink-700 hover:text-red-400 hover:border-red-300"
                      }`}>
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
              {rubrosActivos.length < RUBROS.length && (
                <button onClick={() => setModalRubro(true)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold border border-dashed border-ink-300 dark:border-ink-600 text-ink-400 dark:text-ink-500 cursor-pointer hover:border-violet-400 hover:text-violet-600 transition-colors flex items-center gap-1">
                  <Plus size={11} /> Rubro
                </button>
              )}
            </div>
          </div>
        )}

        <div className="px-3.5 pt-3 md:px-6 md:pt-4">
          {etapasFiltradas.map(etapa => {
            const open    = !!expandidas[etapa.id];
            const ep      = pctEtapa(etapa);
            const mf      = fmtMonto(etapa);
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
                      {etapa.items.filter(i => i.estado === "completado").length}/{etapa.items.length} completados
                      {mf && <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-semibold">{mf}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9">
                      <svg viewBox="0 0 38 38" className="-rotate-90 w-9 h-9">
                        <circle cx="19" cy="19" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-ink-100 dark:text-ink-800" />
                        <circle cx="19" cy="19" r="15" fill="none" strokeWidth="3" strokeLinecap="round"
                          stroke={progressStroke(ep)}
                          strokeDasharray={`${ep * 0.942} 100`}
                          style={{ transition: "stroke-dasharray .4s ease" }} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-ink dark:text-ink-50">{ep}%</div>
                    </div>
                    <ChevronDown size={17} className={`text-ink-400 dark:text-ink-500 transition-transform duration-250 ${open ? "rotate-180" : ""}`} />
                  </div>
                </div>

                <Accordion open={open}>
                  <div className="border-t border-ink-100 dark:border-ink-800 px-3 pb-3.5 pt-2">
                    <SortableItemList
                      etapaId={etapa.id}
                      items={etapa.items}
                      onReorder={reorderItems}
                      onToggle={(eId, itemId, done) => updateItem(eId, itemId, { estado: done ? "pendiente" : "completado" })}
                      onEdit={(eId, item) => setModalItem({ etapaId: eId, item })}
                    />

                    {nuevoItemEtapa === etapa.id ? (
                      <div className="flex gap-1.5 mt-2">
                        <input autoFocus value={nuevoItemTexto} onChange={e => setNuevoItemTexto(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") addItem(etapa.id); if (e.key === "Escape") setNuevoItemEtapa(null); }}
                          placeholder="Descripción del ítem..."
                          className="flex-1 px-3 py-2 rounded-xl border border-violet-400 dark:border-violet-600 text-sm bg-white dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-300 outline-none" />
                        <button onClick={() => addItem(etapa.id)}
                          className="bg-ink dark:bg-white text-white dark:text-ink border-0 rounded-xl px-3.5 cursor-pointer font-bold">
                          <Plus size={14} />
                        </button>
                        <button onClick={() => setNuevoItemEtapa(null)}
                          className="bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl px-3 cursor-pointer text-ink-400">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setNuevoItemEtapa(etapa.id); setNuevoItemTexto(""); }}
                        className="mt-2 w-full py-2.5 bg-transparent border border-dashed border-ink-200 dark:border-ink-700 rounded-xl text-ink-400 dark:text-ink-500 cursor-pointer text-sm font-medium flex items-center justify-center gap-1.5 hover:border-violet-400 dark:hover:border-violet-600 transition-colors">
                        <Plus size={13} /> Agregar ítem
                      </button>
                    )}

                    <div className="mt-3 pt-3 border-t border-ink-100 dark:border-ink-800">
                      <div className="flex items-center gap-2">
                        <Label>Monto etapa</Label>
                        <div className="flex gap-1.5 flex-1">
                          <input type="number" value={etapa.monto || ""} onChange={e => updateEtapa(etapa.id, { monto: e.target.value })}
                            placeholder="0"
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 text-sm bg-white dark:bg-ink-800 text-ink dark:text-ink-50 outline-none focus:border-violet-500 transition-colors" />
                          <button onClick={() => updateEtapa(etapa.id, { moneda: (etapa.moneda || "ARS") === "USD" ? "ARS" : "USD" })}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                              (etapa.moneda || "ARS") === "USD"
                                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                : "border-violet-400 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                            }`}>
                            {(etapa.moneda || "ARS") === "USD" ? "USD" : "ARS"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      {ep === 100 && !etapa.firma && (
                        <button onClick={() => setModalFirmaEtapa(etapa)}
                          className="w-full py-2.5 px-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors">
                          <PenLine size={13} /> Firmar conformidad del cliente
                        </button>
                      )}
                      {etapa.firma && (
                        <div className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                          <FileCheck size={15} className="text-emerald-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Conformidad firmada</div>
                            <div className="text-[11px] text-emerald-600/70 dark:text-emerald-500 truncate">
                              {etapa.firma.firmante} · {etapa.firma.fecha}
                            </div>
                            {etapa.firma.monto && etapa.firma.monto !== "No especificado" && (
                              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{etapa.firma.monto}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Accordion>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal agregar rubro */}
      {modalRubro && (
        <div className="fixed inset-0 bg-ink/60 flex items-end md:items-center md:justify-center z-[100]"
          onClick={e => { if (e.target === e.currentTarget) setModalRubro(false); }}>
          <div className="bg-white dark:bg-ink-900 rounded-t-3xl md:rounded-3xl px-5 pt-5 pb-11 md:pb-6 w-full md:max-w-sm border border-ink-200 dark:border-ink-700 border-b-0 md:border animate-[slideUp_.22s_ease-out_both]">
            <SheetHandle />
            <div className="flex justify-between items-center mb-5">
              <div className="font-bold text-base text-ink dark:text-ink-50">Agregar rubro</div>
              <button onClick={() => setModalRubro(false)}
                className="bg-ink-50 dark:bg-ink-800 border-0 rounded-full w-8 h-8 cursor-pointer text-ink-400 flex items-center justify-center">
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {RUBROS.filter(r => !rubrosActivos.includes(r.id)).map(r => (
                <button key={r.id}
                  onClick={() => { addRubro(r.id); setModalRubro(false); setRubroActivo(r.id); }}
                  className="w-full text-left px-4 py-3.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 cursor-pointer hover:border-current transition-all flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: r.hex }} />
                  <div>
                    <div className={`font-semibold text-sm ${r.text}`}>{r.label}</div>
                    <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-0.5">
                      {TEMPLATES[r.id]?.length || 0} etapas predefinidas
                    </div>
                  </div>
                </button>
              ))}
              {RUBROS.every(r => rubrosActivos.includes(r.id)) && (
                <div className="text-center py-6 text-sm text-ink-400 dark:text-ink-500">
                  Todos los rubros ya están agregados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal ítem */}
      {modalItem && (
        <div className="fixed inset-0 bg-ink/60 flex items-end md:items-center md:justify-center z-[100]"
          onClick={e => { if (e.target === e.currentTarget) setModalItem(null); }}>
          <div className="bg-white dark:bg-ink-900 rounded-t-3xl md:rounded-3xl px-5 pt-5 pb-11 md:pb-6 w-full md:max-w-lg md:w-full max-h-[90dvh] md:max-h-[85vh] overflow-y-auto border border-ink-200 dark:border-ink-700 border-b-0 md:border animate-[slideUp_.22s_ease-out_both]">
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
                    <button key={k} onClick={() => updateItem(modalItem.etapaId, modalItem.item.id, { estado: k })}
                      className={`px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-all duration-150 ${
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
              <textarea value={modalItem.item.comentario}
                onChange={e => updateItem(modalItem.etapaId, modalItem.item.id, { comentario: e.target.value })}
                placeholder="Nota u observación..."
                className="w-full px-3.5 py-3 rounded-xl border border-ink-200 dark:border-ink-700 text-sm resize-none min-h-[80px] bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-300 outline-none focus:border-violet-500 transition-colors mt-2 leading-relaxed" />
            </div>

            <div className="mb-6">
              <Label>Foto Evidencia</Label>
              <div className="mt-2">
                {modalItem.item.foto ? (
                  <div>
                    <img src={modalItem.item.foto} alt="evidencia" className="w-full rounded-2xl max-h-[220px] object-cover" />
                    <button onClick={() => { updateItem(modalItem.etapaId, modalItem.item.id, { foto: null }); }}
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
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => handleFoto(e, modalItem.etapaId, modalItem.item.id)} />
            </div>

            <button onClick={() => setConfirmItem({ etapaId: modalItem.etapaId, itemId: modalItem.item.id, tarea: modalItem.item.tarea })}
              className="w-full py-3.5 bg-transparent border border-red-100 dark:border-red-900/50 rounded-xl text-red-500 font-semibold cursor-pointer text-sm flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
              <Trash2 size={14} /> Eliminar ítem
            </button>
          </div>
        </div>
      )}

      {confirmItem && (
        <ModalConfirm
          mensaje={`Se eliminará "${confirmItem.tarea}" de esta etapa.`}
          onCancel={() => setConfirmItem(null)}
          onConfirm={() => { deleteItem(confirmItem.etapaId, confirmItem.itemId); setConfirmItem(null); }} />
      )}

      {modalFirmaEtapa && (
        <ModalFirma
          etapa={modalFirmaEtapa}
          obraInfo={obraInfo}
          onConfirm={async data => {
            updateEtapa(modalFirmaEtapa.id, { firma: { ...data, timestamp: Date.now() } });
          }}
          onClose={() => setModalFirmaEtapa(null)} />
      )}
    </div>
  );
}
