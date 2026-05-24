import { useState, useEffect, useRef } from "react";
import {
  User, MapPin, Cloud, Loader2, FileCheck,
  ArrowLeft, Sun, Moon, Plus, X, ChevronDown,
  Share2, MoreHorizontal, FileDown, Users, Check,
  Camera, Trash2, AlertCircle, MessageSquare, Clock, Calendar,
} from "lucide-react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  guardarObra, escucharObra, escucharObras,
  crearObra, eliminarObra, onAuth, obtenerPerfil, enviarVerificacion, verificarEmailToken,
} from "./firebase";
import { RUBROS, TEMPLATES, ESTADO_CONFIG, TIPOS_PROYECTO } from "./constants/data";
import { useTheme } from "./hooks/useTheme";
import { Label, SheetHandle, Spinner, Accordion, ModalConfirm } from "./components/ui";
import { SortableItemList } from "./components/SortableItem";
import AuthScreen from "./components/AuthScreen";
import HomeView from "./components/HomeView";
import VistaCliente from "./components/VistaCliente";
import VistaPublica from "./components/VistaPublica";
import VistaSocio from "./components/VistaSocio";
import { pctEtapa, fmtMonto, progressColor, progressStroke } from "./utils/helpers";
import { compressImage, validateImage } from "./utils/imageUtils";
import AvanzaLogo from "./components/AvanzaLogo";
import { notificar } from "./services/notificaciones";
import NotifBanner from "./components/NotifBanner";

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
          <AvanzaLogo size={22} className="text-violet-600 dark:text-violet-400" />
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
          <AvanzaLogo size={22} className="text-violet-600 dark:text-violet-400" />
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
  const [fotoError,     setFotoError]     = useState("");
  const [saveError,     setSaveError]     = useState(false);
  const [confirmItem,   setConfirmItem]   = useState(null);
  const [copied,           setCopied]           = useState(false);
  const [copiedSocioRubro, setCopiedSocioRubro] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [rubroActivo,   setRubroActivo]   = useState(null);
  const [modalRubro,      setModalRubro]      = useState(false);
  const [rubrosConfig,    setRubrosConfig]    = useState({});
  const [modalFechasRubro, setModalFechasRubro] = useState(null);
  const [menuCompartir, setMenuCompartir] = useState(false);
  const [rubrosExpandidos, setRubrosExpandidos] = useState({});
  const [tabActiva,        setTabActiva]        = useState("resumen");
  const fileRef        = useRef();
  const saveTimer      = useRef();
  const unsubRef       = useRef();
  const justLoadedRef  = useRef(false);
  const hitosRef       = useRef(new Set());
  const inactividadRef = useRef(false);

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
    hitosRef.current = new Set();
    inactividadRef.current = false;
    if (!obraActiva) {
      setEtapas([]);
      setObraInfo({ nombre: "", cliente: "", direccion: "", clienteEmail: "", adminEmail: "" });
      setRubrosConfig({});
      return;
    }
    justLoadedRef.current = true;
    if (obraActiva.etapas)       setEtapas(obraActiva.etapas);
    if (obraActiva.obraInfo)     setObraInfo(obraActiva.obraInfo);
    if (obraActiva.rubrosConfig) setRubrosConfig(obraActiva.rubrosConfig);

    // Check inactividad al cargar
    if (user?.uid && obraActiva.etapas) {
      const lastTs = obraActiva.etapas
        .flatMap(e => e.items || [])
        .map(i => i.ultimoCambio?.timestamp || 0)
        .reduce((max, ts) => Math.max(max, ts), 0);
      if (lastTs > 0 && Date.now() - lastTs > 48 * 3600 * 1000) {
        inactividadRef.current = true;
        notificar(user.uid, {
          obraId: obraActiva.id,
          obraNombre: obraActiva.obraInfo?.nombre || "Obra",
          mensaje: "Sin actividad hace más de 48hs en esta obra",
        });
      }
    }

    unsubRef.current = escucharObra(obraActiva.id, data => {
      justLoadedRef.current = true;
      if (data?.etapas)       setEtapas(data.etapas);
      if (data?.obraInfo)     setObraInfo(data.obraInfo);
      if (data?.rubrosConfig) setRubrosConfig(data.rubrosConfig);
      setCloudStatus("Sincronizado");
    });
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [obraActiva?.id]);

  useEffect(() => {
    if (justLoadedRef.current) { justLoadedRef.current = false; return; }
    if (!obraActiva || !etapas.length) return;
    clearTimeout(saveTimer.current);
    setSaving(true);
    setCloudStatus("Guardando...");
    saveTimer.current = setTimeout(async () => {
      try {
        await guardarObra(obraActiva.id, { etapas, obraInfo });
        setCloudStatus("Guardado");
        setSaveError(false);
      } catch {
        setCloudStatus("Error al guardar");
        setSaveError(true);
      }
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
    const enriched = "estado" in changes
      ? { ...changes, ultimoCambio: { autor: "admin", timestamp: Date.now() } }
      : changes;

    const next = etapas.map(e => e.id !== etapaId ? e : {
      ...e, items: e.items.map(i => i.id !== itemId ? i : { ...i, ...enriched })
    });

    setEtapas(next);

    if (modalItem?.item?.id === itemId)
      setModalItem(prev => ({ ...prev, item: { ...prev.item, ...enriched } }));

    if (changes.estado === "completado" && user?.uid && obraActiva) {
      const obraNombre = obraInfo.nombre || "Obra";
      const etapa = next.find(e => e.id === etapaId);
      let enviada = false;

      if (etapa && etapa.items.every(i => i.estado === "completado")) {
        const key = `etapa_${etapaId}`;
        if (!hitosRef.current.has(key)) {
          hitosRef.current.add(key);
          notificar(user.uid, {
            obraId: obraActiva.id, obraNombre,
            mensaje: `Etapa "${etapa.nombre}" completada al 100%`,
          });
          enviada = true;
        }
      }

      const allItems = next.flatMap(e => e.items || []);
      const pctNew = allItems.length
        ? Math.round(allItems.filter(i => i.estado === "completado").length / allItems.length * 100)
        : 0;
      for (const hito of [25, 50, 75, 100]) {
        if (pctNew >= hito && !hitosRef.current.has(`hito_${hito}`)) {
          hitosRef.current.add(`hito_${hito}`);
          if (!enviada) {
            notificar(user.uid, {
              obraId: obraActiva.id, obraNombre,
              mensaje: hito === 100
                ? `¡La obra "${obraNombre}" está completada al 100%!`
                : `La obra "${obraNombre}" alcanzó el ${hito}% de avance`,
            });
            enviada = true;
          }
        }
      }
    }
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

  function fmtFecha(iso) {
    if (!iso) return null;
    const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    const [, m, d] = iso.split("-");
    return `${parseInt(d)} ${meses[parseInt(m) - 1]}`;
  }

  async function guardarFechasRubro(rubroId, cambios) {
    const cfg = { ...rubrosConfig, [rubroId]: { ...(rubrosConfig[rubroId] || {}), ...cambios } };
    setRubrosConfig(cfg);
    await guardarObra(obraActiva.id, { rubrosConfig: cfg });
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
    e.target.value = "";
    try {
      validateImage(file);
    } catch (err) {
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
      updateItem(etapaId, itemId, { foto: compressed });
      if (user?.uid && obraActiva) {
        const etapa = etapas.find(e => e.id === etapaId);
        const item  = etapa?.items.find(i => i.id === itemId);
        notificar(user.uid, {
          obraId: obraActiva.id,
          obraNombre: obraInfo.nombre || "Obra",
          mensaje: `Foto subida en "${item?.tarea || "tarea"}"`,
        });
      }
    } catch (err) {
      console.error("Error subiendo foto:", err);
      setFotoError("No se pudo subir la foto. Intentá de nuevo.");
      setTimeout(() => setFotoError(""), 5000);
    } finally {
      setFotoUploading(false);
    }
  }

  async function reintentarGuardado() {
    if (!obraActiva) return;
    setSaving(true); setSaveError(false);
    try {
      await guardarObra(obraActiva.id, { etapas, obraInfo });
      setCloudStatus("Guardado");
    } catch {
      setCloudStatus("Error al guardar");
      setSaveError(true);
    }
    setSaving(false);
  }

  if (!obraActiva) return (
    <HomeView
      obras={obras}
      uid={user.uid}
      userNombre={userProfile.nombre}
      onSelectObra={o => { setObraActiva(o); setExpandidas({}); setVistaCliente(false); }}
      onEliminar={async o => { await eliminarObra(o.id); }}
    />
  );

  if (vistaCliente) return (
    <VistaCliente etapas={etapas} obraInfo={obraInfo} onVolver={() => setVistaCliente(false)} rubrosConfig={rubrosConfig} />
  );

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
    return `${fecha} · ${c.autor === "socio" ? "Socio" : "Admin"}`;
  }

  const C = 502.655;
  const HOY = new Date().toISOString().slice(0, 10);

  const atrasadosCount = rubrosActivos.filter(rid => {
    const cfg = rubrosConfig[rid] || {};
    const its = etapas.filter(e => getRubroDeEtapa(e) === rid).flatMap(e => e.items || []);
    const rp = its.length ? Math.round(its.filter(i => i.estado === "completado").length / its.length * 100) : 0;
    return cfg.fechaEstimadaFin && cfg.fechaEstimadaFin < HOY && rp < 100;
  }).length;

  const porFirmarCount = etapas.filter(e => {
    const its = e.items || [];
    return its.length > 0 && its.every(i => i.estado === "completado") && !e.firma;
  }).length;

  const proxFin = rubrosActivos
    .map(rid => rubrosConfig[rid]?.fechaEstimadaFin)
    .filter(Boolean).filter(d => d >= HOY).sort()[0];
  const diasAlFin = proxFin ? Math.ceil((new Date(proxFin) - new Date(HOY)) / 86400000) : null;

  const ultimosCompletos = etapas.flatMap(e =>
    (e.items || [])
      .filter(i => i.estado === "completado" && i.ultimoCambio?.timestamp)
      .map(i => ({ tarea: i.tarea, etapa: e.nombre, ts: i.ultimoCambio.timestamp, rubro: e.rubro || obraInfo.rubro }))
  ).sort((a, b) => b.ts - a.ts).slice(0, 3);

  function relTime(ts) {
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hs = Math.floor(mins / 60);
    if (hs < 24) return `${hs}h`;
    return `${Math.floor(hs / 24)}d`;
  }

  function renderEtapaAccordion(etapa, isFlat = false) {
    const open = !!expandidas[etapa.id];
    const ep   = pctEtapa(etapa);
    const mf   = fmtMonto(etapa);
    const eRubroC = isFlat ? RUBROS.find(r => r.id === (etapa.rubro || obraInfo.rubro)) : null;
    return (
      <div key={etapa.id}
        style={eRubroC ? { borderLeftColor: eRubroC.hex } : {}}
        className={isFlat
          ? "bg-white dark:bg-ink-900 rounded-2xl mb-2.5 border border-l-[3px] border-ink-200 dark:border-ink-700 overflow-hidden"
          : "bg-ink-50 dark:bg-ink-800/50 rounded-xl mb-1.5 overflow-hidden border border-ink-100 dark:border-ink-800"}>
        <div onClick={() => setExpandidas(p => ({ ...p, [etapa.id]: !p[etapa.id] }))}
          className="flex items-center px-3 py-3 cursor-pointer select-none hover:bg-ink-100 dark:hover:bg-ink-700/50 transition-colors">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className={`font-bold text-ink dark:text-ink-50 tracking-tight ${isFlat ? "text-[14px]" : "text-[13px]"}`}>{etapa.nombre}</div>
              {etapa.firma && <FileCheck size={isFlat ? 12 : 11} className="text-emerald-500 flex-shrink-0" />}
            </div>
            <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-0.5">
              {etapa.items.filter(i => i.estado === "completado").length}/{etapa.items.length} completados
              {mf && <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-semibold">{mf}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`relative ${isFlat ? "w-9 h-9" : "w-8 h-8"}`}>
              <svg viewBox="0 0 38 38" className={`-rotate-90 ${isFlat ? "w-9 h-9" : "w-8 h-8"}`}>
                <circle cx="19" cy="19" r="15" fill="none" stroke="currentColor" strokeWidth="3"
                  className={isFlat ? "text-ink-100 dark:text-ink-800" : "text-ink-200 dark:text-ink-700"} />
                <circle cx="19" cy="19" r="15" fill="none" strokeWidth="3" strokeLinecap="round"
                  stroke={progressStroke(ep)}
                  strokeDasharray={`${ep * 0.942} 100`}
                  style={{ transition: "stroke-dasharray .4s ease" }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-ink dark:text-ink-50">{ep}%</div>
            </div>
            <ChevronDown size={isFlat ? 17 : 15} className={`text-ink-400 dark:text-ink-500 transition-transform duration-250 ${open ? "rotate-180" : ""}`} />
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
                <button onClick={() => addItem(etapa.id)} className="bg-ink dark:bg-white text-white dark:text-ink border-0 rounded-xl px-3.5 cursor-pointer font-bold"><Plus size={14} /></button>
                <button onClick={() => setNuevoItemEtapa(null)} className="bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl px-3 cursor-pointer text-ink-400"><X size={13} /></button>
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
                  <input type="number" value={etapa.monto || ""} onChange={e => updateEtapa(etapa.id, { monto: e.target.value })} placeholder="0"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 text-sm bg-white dark:bg-ink-800 text-ink dark:text-ink-50 outline-none focus:border-violet-500 transition-colors" />
                  <button onClick={() => updateEtapa(etapa.id, { moneda: (etapa.moneda || "ARS") === "USD" ? "ARS" : "USD" })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${(etapa.moneda || "ARS") === "USD" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "border-violet-400 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"}`}>
                    {(etapa.moneda || "ARS") === "USD" ? "USD" : "ARS"}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3">
              {etapa.firma && (
                <div className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <FileCheck size={15} className="text-emerald-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Conformidad firmada</div>
                    <div className="text-[11px] text-emerald-600/70 dark:text-emerald-500 truncate">{etapa.firma.firmante} · {etapa.firma.fecha}</div>
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
  }

  return (
    <>
    <NotifBanner uid={user?.uid} />
    {saveError && (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-500 text-white text-sm font-semibold flex items-center justify-center gap-3 py-3 px-4 shadow-lg">
        <AlertCircle size={14} className="flex-shrink-0" />
        No se pudo guardar. Revisá tu conexión.
        <button onClick={reintentarGuardado}
          className="underline cursor-pointer bg-transparent border-0 text-white text-sm font-bold">
          Reintentar
        </button>
      </div>
    )}
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink">

      {/* TopBar */}
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => setObraActiva(null)}
          className="bg-transparent border-0 text-ink-400 dark:text-ink-500 cursor-pointer flex items-center gap-1.5 text-xs font-semibold p-0">
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

                <button onClick={() => {
                  const token = obraActiva.clienteToken;
                  if (!token) return;
                  const url  = `${window.location.origin}${window.location.pathname}?c=${token}`;
                  const text = `Seguimiento de obra: *${obraInfo.nombre || ""}*\n${url}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                  setMenuCompartir(false);
                }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors border-0 bg-transparent cursor-pointer text-left">
                  <div className="w-7 h-7 rounded-xl bg-[#25d36620] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold leading-none text-ink dark:text-ink-50">Enviar por WhatsApp</div>
                    <div className="text-[10px] text-ink-400 dark:text-ink-500 mt-0.5">Link del cliente</div>
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

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: "200px" }}>
        {obraInfo.fotoCover
          ? <img src={obraInfo.fotoCover} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-violet-950" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-5">
          {obraInfo.tipo && (
            <div className="inline-flex self-start mb-2 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase">
              {TIPOS_PROYECTO.find(t => t.id === obraInfo.tipo)?.label || obraInfo.tipo}
            </div>
          )}
          <button onClick={() => setEditInfo(true)} className="text-left bg-transparent border-0 p-0 cursor-pointer">
            <div className="text-white font-bold text-[22px] tracking-tight leading-tight">
              {obraInfo.nombre || "Sin nombre"}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {obraInfo.cliente && (
                <div className="flex items-center gap-1 text-white/70 text-[12px]">
                  <User size={10} /> {obraInfo.cliente}
                </div>
              )}
              {obraInfo.direccion && (
                <div className="flex items-center gap-1 text-white/70 text-[12px]">
                  <MapPin size={10} /> {obraInfo.direccion}
                </div>
              )}
            </div>
          </button>
        </div>
        <div className="absolute top-4 right-5 text-right">
          <div className="text-[42px] font-bold text-white leading-none tracking-[-0.04em]"
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}>{pct}%</div>
          <div className="text-[11px] text-white/60 font-semibold mt-0.5">{completados}/{totalItems} ítems</div>
        </div>
      </div>

      {/* Edit info modal */}
      {editInfo && (
        <div className="fixed inset-0 bg-ink/60 flex items-end md:items-center md:justify-center z-[100]"
          onClick={e => { if (e.target === e.currentTarget) setEditInfo(false); }}>
          <div className="bg-white dark:bg-ink-900 rounded-t-3xl md:rounded-3xl px-5 pt-5 pb-11 md:pb-6 w-full md:max-w-sm border border-ink-200 dark:border-ink-700 border-b-0 md:border animate-[slideUp_.22s_ease-out_both]">
            <SheetHandle />
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-ink dark:text-ink-50 text-[15px]">Editar obra</div>
              <button onClick={() => setEditInfo(false)}
                className="bg-ink-50 dark:bg-ink-800 border-0 rounded-full w-8 h-8 cursor-pointer text-ink-400 flex items-center justify-center">
                <X size={14} />
              </button>
            </div>
            {[
              ["nombre",       "Nombre de obra"],
              ["cliente",      "Cliente"],
              ["direccion",    "Dirección"],
              ["clienteEmail", "Email del cliente"],
              ["adminEmail",   "Tu email (admin)"],
            ].map(([k, ph]) => (
              <input key={k} value={obraInfo[k] || ""} placeholder={ph}
                onChange={e => setObraInfo(p => ({ ...p, [k]: e.target.value }))}
                className="bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl text-ink dark:text-ink-50 w-full mb-2 px-3 py-2.5 outline-none block text-sm" />
            ))}
            <button onClick={() => setEditInfo(false)}
              className="mt-2 w-full bg-ink dark:bg-white text-white dark:text-ink border-0 rounded-xl py-3 font-bold cursor-pointer text-sm">
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-700 sticky top-[49px] z-[9]">
        <div className="flex overflow-x-auto scrollbar-hide">
          {[
            { id: "resumen",  label: "Resumen" },
            { id: "rubros",   label: "Rubros",   badge: rubrosActivos.length > 0 ? rubrosActivos.length : null },
            { id: "bitacora", label: "Bitácora", badge: ultimosCompletos.length > 0 ? ultimosCompletos.length : null },
            { id: "fotos",    label: "Fotos" },
          ].map(tab => (
            <button key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-[13px] font-semibold border-0 bg-transparent cursor-pointer whitespace-nowrap border-b-2 transition-colors -mb-px ${
                tabActiva === tab.id
                  ? "border-violet-500 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-ink-400 dark:text-ink-500 hover:text-ink dark:hover:text-ink-200"
              }`}>
              {tab.label}
              {tab.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tabActiva === tab.id
                    ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
                    : "bg-ink-100 dark:bg-ink-800 text-ink-400 dark:text-ink-500"
                }`}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Resumen */}
      {tabActiva === "resumen" && (
        <div className="px-4 pt-5 pb-24 max-w-5xl mx-auto">

          {(atrasadosCount > 0 || porFirmarCount > 0 || diasAlFin !== null) && (
            <div className="flex gap-2 flex-wrap mb-5">
              {atrasadosCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl px-3 py-2">
                  <AlertCircle size={11} className="text-red-500 flex-shrink-0" />
                  <span className="text-[12px] font-bold text-red-600 dark:text-red-400">{atrasadosCount} atrasado{atrasadosCount > 1 ? "s" : ""}</span>
                </div>
              )}
              {porFirmarCount > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl px-3 py-2">
                  <FileCheck size={11} className="text-amber-500 flex-shrink-0" />
                  <span className="text-[12px] font-bold text-amber-600 dark:text-amber-400">{porFirmarCount} por firmar</span>
                </div>
              )}
              {diasAlFin !== null && (
                <div className="flex items-center gap-1.5 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl px-3 py-2">
                  <Calendar size={11} className="text-ink-400 flex-shrink-0" />
                  <span className="text-[12px] font-semibold text-ink-600 dark:text-ink-300">
                    {diasAlFin === 0 ? "Vence hoy" : `${diasAlFin}d al vencimiento`}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="md:grid md:grid-cols-[1fr_300px] md:gap-4">

            {/* Left: Cómo va por rubro */}
            <div className="mb-4 md:mb-0">
              <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 overflow-hidden">
                <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-ink-100 dark:border-ink-800">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-ink-400 dark:text-ink-500">Cómo va por rubro</div>
                  {rubrosActivos.length < RUBROS.length && (
                    <button onClick={() => setModalRubro(true)}
                      className="flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-400 font-semibold bg-transparent border-0 cursor-pointer hover:opacity-70">
                      <Plus size={11} /> Agregar
                    </button>
                  )}
                </div>
                {rubrosActivos.length === 0 ? (
                  <div className="px-4 py-8 flex flex-col items-center gap-3">
                    <div className="text-sm text-ink-400 dark:text-ink-500">No hay rubros cargados</div>
                    <button onClick={() => setModalRubro(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-dashed border-ink-300 dark:border-ink-600 text-ink-400 dark:text-ink-500 cursor-pointer hover:border-violet-400 hover:text-violet-600 transition-colors text-sm font-semibold">
                      <Plus size={14} /> Agregar rubro
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-ink-100 dark:divide-ink-800">
                    {rubrosActivos.map(rid => {
                      const rc = RUBROS.find(r => r.id === rid);
                      const rubroEtapas = etapas.filter(e => getRubroDeEtapa(e) === rid);
                      const its = rubroEtapas.flatMap(e => e.items || []);
                      const cp = its.filter(i => i.estado === "completado").length;
                      const obs = its.filter(i => i.estado === "observacion").length;
                      const rp = its.length ? Math.round(cp / its.length * 100) : 0;
                      const cfg = rubrosConfig[rid] || {};
                      const fin = fmtFecha(cfg.fechaEstimadaFin);
                      const vencido = cfg.fechaEstimadaFin && cfg.fechaEstimadaFin < HOY && rp < 100;
                      const firmaCount = rubroEtapas.filter(e => e.firma).length;
                      const pColor = progressStroke(rp);
                      const inProgress = rubroEtapas.filter(e => { const ep = pctEtapa(e); return ep > 0 && ep < 100; });
                      const activeEtapa = inProgress[0] || rubroEtapas[rubroEtapas.length - 1];
                      return (
                        <div key={rid} className="px-4 py-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: (rc?.hex || "#8b5cf6") + "22" }}>
                              <div className="w-3 h-3 rounded-full" style={{ background: rc?.hex }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-[13px] text-ink dark:text-ink-50">{rc?.label}</span>
                                {obs > 0 && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-500">{obs} obs.</span>
                                )}
                                {firmaCount > 0 && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">{firmaCount} firma{firmaCount > 1 ? "s" : ""}</span>
                                )}
                              </div>
                              {fin && (
                                <div className={`text-[11px] mt-0.5 ${vencido ? "text-red-500 font-semibold" : "text-ink-400 dark:text-ink-500"}`}>
                                  Fin est. {fin}{vencido ? " · Atrasado" : ""}
                                </div>
                              )}
                              {activeEtapa && (
                                <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-0.5 truncate">{activeEtapa.nombre}</div>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className="text-[16px] font-bold leading-none" style={{ color: pColor }}>{rp}%</div>
                              <div className="text-[10px] text-ink-400 dark:text-ink-500 mt-0.5">{cp}/{its.length}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-[width_.4s_ease]" style={{ width: `${rp}%`, background: pColor }} />
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button onClick={() => setModalFechasRubro(rid)}
                                className="text-ink-300 dark:text-ink-600 hover:text-violet-500 bg-transparent border-0 cursor-pointer p-1 transition-colors">
                                <Calendar size={11} />
                              </button>
                              <button onClick={() => { setTabActiva("rubros"); setRubroActivo(rid); }}
                                className="text-[11px] text-violet-600 dark:text-violet-400 font-semibold bg-transparent border-0 cursor-pointer hover:opacity-70 px-1">
                                Ver →
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Pendientes + Resumen */}
            <div className="flex flex-col gap-4">
              {(porFirmarCount > 0 || atrasadosCount > 0) && (
                <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 overflow-hidden">
                  <div className="px-4 pt-4 pb-2 border-b border-ink-100 dark:border-ink-800">
                    <div className="text-[10px] font-bold tracking-widest uppercase text-ink-400 dark:text-ink-500">Pendientes</div>
                  </div>
                  <div className="divide-y divide-ink-100 dark:divide-ink-800">
                    {rubrosActivos.filter(rid => {
                      const cfg = rubrosConfig[rid] || {};
                      const its = etapas.filter(e => getRubroDeEtapa(e) === rid).flatMap(e => e.items || []);
                      const rp = its.length ? Math.round(its.filter(i => i.estado === "completado").length / its.length * 100) : 0;
                      return cfg.fechaEstimadaFin && cfg.fechaEstimadaFin < HOY && rp < 100;
                    }).map(rid => {
                      const rc = RUBROS.find(r => r.id === rid);
                      return (
                        <div key={rid} className="flex items-center gap-3 px-4 py-3">
                          <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold text-ink dark:text-ink-50">{rc?.label}</div>
                            <div className="text-[11px] text-red-500">Fecha vencida</div>
                          </div>
                          <button onClick={() => { setTabActiva("rubros"); setRubroActivo(rid); }}
                            className="text-[11px] text-violet-600 dark:text-violet-400 font-bold bg-transparent border-0 cursor-pointer">
                            Ver →
                          </button>
                        </div>
                      );
                    })}
                    {etapas.filter(e => {
                      const its = e.items || [];
                      return its.length > 0 && its.every(i => i.estado === "completado") && !e.firma;
                    }).slice(0, 3).map(e => (
                      <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                        <FileCheck size={13} className="text-amber-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-ink dark:text-ink-50 truncate">{e.nombre}</div>
                          <div className="text-[11px] text-amber-500 dark:text-amber-400">Por firmar</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 overflow-hidden">
                <div className="px-4 pt-4 pb-2 border-b border-ink-100 dark:border-ink-800">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-ink-400 dark:text-ink-500">Resumen</div>
                </div>
                <div className="divide-y divide-ink-100 dark:divide-ink-800">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="text-[12px] text-ink-400 dark:text-ink-500">Avance general</div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-[14px] font-bold" style={{ color: pColor }}>{pct}%</div>
                      <div className="text-[11px] text-ink-400 dark:text-ink-500">{completados}/{totalItems}</div>
                    </div>
                  </div>
                  {proxFin ? (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="text-[12px] text-ink-400 dark:text-ink-500">Fin estimado</div>
                      <div className="text-right">
                        <div className="text-[13px] font-bold text-ink dark:text-ink-50">{fmtFecha(proxFin)}</div>
                        {diasAlFin !== null && (
                          <div className={`text-[11px] ${diasAlFin <= 7 ? "text-red-500" : "text-ink-400 dark:text-ink-500"}`}>
                            {diasAlFin === 0 ? "Hoy" : `en ${diasAlFin}d`}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="text-[12px] text-ink-400 dark:text-ink-500">Fin estimado</div>
                      <button onClick={() => rubrosActivos[0] && setModalFechasRubro(rubrosActivos[0])}
                        className="text-[12px] text-violet-500 font-semibold bg-transparent border-0 cursor-pointer">
                        Configurar
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="text-[12px] text-ink-400 dark:text-ink-500">Última actividad</div>
                    <div className="text-[13px] font-bold text-ink dark:text-ink-50">
                      {ultimosCompletos[0] ? relTime(ultimosCompletos[0].ts) : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {ultimosCompletos.length > 0 && (
            <div className="mt-4 bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-ink-100 dark:border-ink-800">
                <div className="text-[10px] font-bold tracking-widest uppercase text-ink-400 dark:text-ink-500">Actividad reciente</div>
              </div>
              <div className="divide-y divide-ink-100 dark:divide-ink-800">
                {ultimosCompletos.map((item, i) => {
                  const rc = RUBROS.find(r => r.id === item.rubro);
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: (rc?.hex || "#8b5cf6") + "22" }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: rc?.hex || "#8b5cf6" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-ink dark:text-ink-50 truncate">{item.tarea}</div>
                        <div className="text-[11px] text-ink-400 dark:text-ink-500">{item.etapa}</div>
                      </div>
                      <div className="text-[11px] text-ink-400 dark:text-ink-500 flex-shrink-0">{relTime(item.ts)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Rubros */}
      {tabActiva === "rubros" && (
        <div className="md:flex md:items-start">
          {rubrosActivos.length > 0 && (
            <>
              <div className="md:hidden px-3.5 pt-3 pb-2 bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-700">
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
                  {rubrosActivos.map(rid => {
                    const rc = RUBROS.find(r => r.id === rid);
                    const its = etapas.filter(e => getRubroDeEtapa(e) === rid).flatMap(e => e.items || []);
                    const cp = its.filter(i => i.estado === "completado").length;
                    const rp = its.length ? Math.round(cp / its.length * 100) : 0;
                    const isActive = rubroActivo === rid;
                    const cfg = rubrosConfig[rid] || {};
                    const vencido = cfg.fechaEstimadaFin && cfg.fechaEstimadaFin < HOY && rp < 100;
                    const fin = fmtFecha(cfg.fechaEstimadaFin);
                    return (
                      <div key={rid} className="flex-shrink-0">
                        <button onClick={() => setRubroActivo(isActive ? null : rid)}
                          style={isActive ? { borderColor: rc?.hex, boxShadow: `0 0 0 1px ${rc?.hex}` } : {}}
                          className={`w-36 rounded-2xl border-2 p-3.5 text-left cursor-pointer transition-all bg-white dark:bg-ink-900 block ${isActive ? "" : "border-ink-200 dark:border-ink-700"}`}>
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: rc?.hex }} />
                            <span className="font-bold text-[12px] text-ink dark:text-ink-50 truncate">{rc?.label}</span>
                          </div>
                          <div className="h-1 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-[width_.4s_ease]" style={{ width: `${rp}%`, background: rc?.hex }} />
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[12px] font-bold" style={{ color: rc?.hex }}>{rp}%</span>
                            {fin && <span className={`text-[10px] ${vencido ? "text-red-500" : "text-ink-400 dark:text-ink-500"}`}>{fin}</span>}
                          </div>
                        </button>
                        <div className="flex gap-2 mt-1.5 px-1">
                          <button onClick={() => setModalFechasRubro(rid)}
                            className="text-ink-300 dark:text-ink-600 hover:text-violet-500 bg-transparent border-0 cursor-pointer p-0.5 transition-colors">
                            <Calendar size={11} />
                          </button>
                          <button onClick={() => removeRubro(rid)}
                            className="text-ink-300 dark:text-ink-600 hover:text-red-400 bg-transparent border-0 cursor-pointer p-0.5 transition-colors">
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {rubrosActivos.length < RUBROS.length && (
                    <button onClick={() => setModalRubro(true)}
                      className="flex-shrink-0 w-36 rounded-2xl border-2 border-dashed border-ink-300 dark:border-ink-600 flex flex-col items-center justify-center gap-1.5 text-ink-400 dark:text-ink-500 cursor-pointer hover:border-violet-400 hover:text-violet-600 transition-colors min-h-[90px]">
                      <Plus size={15} /><span className="text-[12px] font-semibold">Rubro</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="hidden md:block md:w-[268px] md:flex-shrink-0 md:sticky md:top-[97px] md:h-[calc(100dvh-97px)] md:overflow-y-auto md:border-r md:border-ink-200 md:dark:border-ink-700 md:bg-white md:dark:bg-ink-900">
                <div className="px-3 pt-4 pb-1">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-ink-400 dark:text-ink-500">Rubros</div>
                </div>
                <div className="px-3 pt-1 pb-6">
                  {rubrosActivos.map(rid => {
                    const rc = RUBROS.find(r => r.id === rid);
                    const its = etapas.filter(e => getRubroDeEtapa(e) === rid).flatMap(e => e.items || []);
                    const cp = its.filter(i => i.estado === "completado").length;
                    const rp = its.length ? Math.round(cp / its.length * 100) : 0;
                    const isActive = rubroActivo === rid;
                    const cfg = rubrosConfig[rid] || {};
                    const vencido = cfg.fechaEstimadaFin && cfg.fechaEstimadaFin < HOY && rp < 100;
                    const fin = fmtFecha(cfg.fechaEstimadaFin);
                    return (
                      <div key={rid}>
                        <button onClick={() => setRubroActivo(isActive ? null : rid)}
                          style={isActive ? { borderColor: rc?.hex } : {}}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all border text-left ${
                            isActive ? "bg-white dark:bg-ink-900" : "bg-transparent border-transparent hover:bg-ink-50 dark:hover:bg-ink-800"
                          }`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: rc?.hex }} />
                              <span className="font-bold text-[12px] text-ink dark:text-ink-50 truncate">{rc?.label}</span>
                              {vencido && <AlertCircle size={9} className="text-red-500 flex-shrink-0" />}
                            </div>
                            <div className="h-1 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden mt-1">
                              <div className="h-full rounded-full" style={{ width: `${rp}%`, background: rc?.hex }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {fin && <span className={`text-[10px] ${vencido ? "text-red-500" : "text-ink-400 dark:text-ink-500"}`}>{fin}</span>}
                            <span className="text-[12px] font-bold" style={{ color: rc?.hex }}>{rp}%</span>
                          </div>
                        </button>
                        <div className="flex gap-2 px-3 pb-0.5">
                          <button onClick={() => setModalFechasRubro(rid)}
                            className="text-ink-300 dark:text-ink-600 hover:text-violet-500 bg-transparent border-0 cursor-pointer p-0.5 transition-colors">
                            <Calendar size={10} />
                          </button>
                          <button onClick={() => removeRubro(rid)}
                            className="text-ink-300 dark:text-ink-600 hover:text-red-400 bg-transparent border-0 cursor-pointer p-0.5 transition-colors">
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {rubrosActivos.length < RUBROS.length && (
                    <button onClick={() => setModalRubro(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 mt-1 rounded-xl border-2 border-dashed border-ink-300 dark:border-ink-600 text-ink-400 dark:text-ink-500 cursor-pointer hover:border-violet-400 hover:text-violet-600 transition-colors">
                      <Plus size={12} /><span className="text-[11px] font-semibold">Agregar rubro</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex-1 min-w-0 px-3.5 pt-4 pb-24">
            {rubrosActivos.length === 0 && (
              <button onClick={() => setModalRubro(true)}
                className="w-full py-3.5 rounded-2xl border-2 border-dashed border-ink-300 dark:border-ink-600 text-ink-400 dark:text-ink-500 cursor-pointer hover:border-violet-400 hover:text-violet-600 transition-colors flex items-center justify-center gap-2 font-semibold text-sm">
                <Plus size={15} /> Agregar rubro
              </button>
            )}
            {rubroActivo === null && rubrosActivos.length > 0 ? (
              rubrosActivos.map(rid => {
                const rc = RUBROS.find(r => r.id === rid);
                const rubroEtapas = etapas.filter(e => getRubroDeEtapa(e) === rid);
                const its = rubroEtapas.flatMap(e => e.items || []);
                const cp = its.filter(i => i.estado === "completado").length;
                const rp = its.length ? Math.round(cp / its.length * 100) : 0;
                const isOpen = !!rubrosExpandidos[rid];
                return (
                  <div key={rid}
                    className="bg-white dark:bg-ink-900 rounded-2xl mb-2.5 border border-l-[3px] border-ink-200 dark:border-ink-700 overflow-hidden"
                    style={{ borderLeftColor: rc?.hex }}>
                    <div onClick={() => setRubrosExpandidos(p => ({ ...p, [rid]: !p[rid] }))}
                      className="flex items-center px-4 py-4 cursor-pointer select-none hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: rc?.hex }} />
                          <div className="font-bold text-[15px] text-ink dark:text-ink-50 tracking-tight">{rc?.label}</div>
                        </div>
                        <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-0.5">
                          {cp}/{its.length} completados · {rubroEtapas.length} etapas
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9">
                          <svg viewBox="0 0 38 38" className="-rotate-90 w-9 h-9">
                            <circle cx="19" cy="19" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-ink-100 dark:text-ink-800" />
                            <circle cx="19" cy="19" r="15" fill="none" strokeWidth="3" strokeLinecap="round"
                              stroke={progressStroke(rp)}
                              strokeDasharray={`${rp * 0.942} 100`}
                              style={{ transition: "stroke-dasharray .4s ease" }} />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-ink dark:text-ink-50">{rp}%</div>
                        </div>
                        <ChevronDown size={17} className={`text-ink-400 dark:text-ink-500 transition-transform duration-250 ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                    <Accordion open={isOpen}>
                      <div className="border-t border-ink-100 dark:border-ink-800 px-2 pb-2 pt-1">
                        {rubroEtapas.map(etapa => renderEtapaAccordion(etapa, false))}
                      </div>
                    </Accordion>
                  </div>
                );
              })
            ) : (
              etapasFiltradas.map(etapa => renderEtapaAccordion(etapa, true))
            )}
          </div>
        </div>
      )}

      {/* Tab: Bitácora */}
      {tabActiva === "bitacora" && (
        <div className="px-4 pt-5 pb-24 max-w-3xl mx-auto">
          {ultimosCompletos.length === 0 ? (
            <div className="text-center py-12 text-ink-400 dark:text-ink-500 text-sm">Aún no hay actividad registrada.</div>
          ) : (
            <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 overflow-hidden">
              <div className="divide-y divide-ink-100 dark:divide-ink-800">
                {etapas.flatMap(e =>
                  (e.items || [])
                    .filter(i => i.estado === "completado" && i.ultimoCambio?.timestamp)
                    .map(i => ({ tarea: i.tarea, etapa: e.nombre, ts: i.ultimoCambio.timestamp, rubro: e.rubro || obraInfo.rubro, foto: i.foto }))
                ).sort((a, b) => b.ts - a.ts).map((item, i) => {
                  const rc = RUBROS.find(r => r.id === item.rubro);
                  const fecha = new Date(item.ts).toLocaleString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                  });
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: (rc?.hex || "#8b5cf6") + "22" }}>
                        <div className="w-3 h-3 rounded-full" style={{ background: rc?.hex || "#8b5cf6" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-ink dark:text-ink-50">{item.tarea}</div>
                        <div className="text-[11px] text-ink-400 dark:text-ink-500">{item.etapa}</div>
                      </div>
                      {item.foto && (
                        <img src={item.foto} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="text-[10px] text-ink-400 dark:text-ink-500 flex-shrink-0 whitespace-nowrap">{fecha}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Fotos */}
      {tabActiva === "fotos" && (
        <div className="px-4 pt-5 pb-24 max-w-5xl mx-auto">
          {(() => {
            const fotos = etapas.flatMap(e =>
              (e.items || []).filter(i => i.foto).map(i => ({ foto: i.foto, tarea: i.tarea, etapa: e.nombre, rubro: e.rubro || obraInfo.rubro }))
            );
            if (fotos.length === 0) return (
              <div className="text-center py-12 text-ink-400 dark:text-ink-500 text-sm">No hay fotos cargadas aún.</div>
            );
            return (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {fotos.map((f, i) => {
                  const rc = RUBROS.find(r => r.id === f.rubro);
                  return (
                    <div key={i} className="rounded-2xl overflow-hidden border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900">
                      <img src={f.foto} alt={f.tarea} className="w-full aspect-square object-cover" />
                      <div className="px-2.5 py-2">
                        <div className="text-[11px] font-semibold text-ink dark:text-ink-50 truncate">{f.tarea}</div>
                        <div className="text-[10px] text-ink-400 dark:text-ink-500 truncate">{f.etapa}</div>
                        {rc && <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: rc.hex }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}



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
                  onClick={() => { addRubro(r.id); setModalRubro(false); setRubroActivo(r.id); setTabActiva("rubros"); }}
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
              {modalItem.item.ultimoCambio && (
                <div className="text-[10px] text-ink-400 dark:text-ink-500 mt-2 flex items-center gap-1">
                  <Clock size={9} />
                  Último cambio: {modalItem.item.ultimoCambio.autor === "admin"
                    ? "Admin"
                    : (RUBROS.find(r => r.id === modalItem.item.ultimoCambio.rubroId)?.label ?? "Socio")} ·{" "}
                  {new Date(modalItem.item.ultimoCambio.timestamp).toLocaleString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                    day: "2-digit", month: "2-digit", year: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              )}
            </div>

            <div className="mb-5">
              <Label>Comentario</Label>
              <textarea
                value={fmtComentario(modalItem.item.comentario)}
                onChange={e => updateItem(modalItem.etapaId, modalItem.item.id, {
                  comentario: e.target.value
                    ? { texto: e.target.value, timestamp: Date.now(), autor: "admin" }
                    : null,
                })}
                placeholder="Nota u observación..."
                className="w-full px-3.5 py-3 rounded-xl border border-ink-200 dark:border-ink-700 text-sm resize-none min-h-[80px] bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-300 outline-none focus:border-violet-500 transition-colors mt-2 leading-relaxed" />
              {fmtComentarioMeta(modalItem.item.comentario) && (
                <div className="flex items-center gap-1 text-[10px] text-ink-400 dark:text-ink-500 mt-1">
                  <MessageSquare size={9} />
                  {fmtComentarioMeta(modalItem.item.comentario)}
                </div>
              )}
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
              {fotoError && (
                <div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <AlertCircle size={11} /> {fotoError}
                </div>
              )}
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

      {modalFechasRubro && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/60 px-5"
          onClick={e => { if (e.target === e.currentTarget) setModalFechasRubro(null); }}>
          <div className="bg-white dark:bg-ink-900 rounded-2xl p-6 w-full max-w-xs border border-ink-200 dark:border-ink-700">
            <div className="flex items-center justify-between mb-5">
              <div className="font-bold text-ink dark:text-ink-50 text-[15px] flex items-center gap-2">
                <Calendar size={15} className="text-violet-600 dark:text-violet-400" />
                {RUBROS.find(r => r.id === modalFechasRubro)?.label || modalFechasRubro}
              </div>
              <button onClick={() => setModalFechasRubro(null)}
                className="text-ink-400 bg-transparent border-0 cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>
            {[
              ["fechaEstimadaFin", "Fecha estimada de fin"],
            ].map(([campo, label]) => (
              <div key={campo} className="mb-4">
                <div className="text-[10px] font-bold tracking-widest uppercase text-ink-400 dark:text-ink-500 mb-1.5">{label}</div>
                <input type="date"
                  value={rubrosConfig[modalFechasRubro]?.[campo] || ""}
                  onChange={e => guardarFechasRubro(modalFechasRubro, { [campo]: e.target.value || null })}
                  className="w-full px-3 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-50 outline-none focus:border-violet-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
    </>
  );
}
