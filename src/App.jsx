import { useState, useEffect, useRef } from "react";
import {
  Zap, User, Wrench, MapPin, MessageSquare, ImageIcon,
  Camera, Trash2, Pencil, Check, ArrowLeft, Sun, Moon, Plus, X,
  Building2, ChevronDown, Cloud, Loader2, PenLine, FileCheck, LogOut, Share2, GripVertical,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import gsap from "gsap";
import {
  guardarObra, escucharObra, escucharObras, escucharObraPorToken,
  crearObra, eliminarObra, registrar, login, logout, onAuth, obtenerPerfil,
} from "./firebase";
import { ETAPAS_DEFAULT, ESTADO_CONFIG, RUBROS, TIPOS_PROYECTO, TEMPLATES } from "./constants/data";
import { useTheme } from "./hooks/useTheme";
import { enviarComprobante } from "./services/email";
import { generarComprobante } from "./services/pdf";

// ── Helpers ────────────────────────────────────────────────────────
function pctEtapa(etapa) {
  if (!etapa.items.length) return 0;
  return Math.round(etapa.items.filter(i => i.estado === "completado").length / etapa.items.length * 100);
}
function progressColor(pct) {
  return pct === 100 ? "text-emerald-600" : "text-violet-600";
}
function progressStroke(pct) {
  return pct === 100 ? "#059669" : "#7c5cc9";
}
function cardAccent(pct) {
  if (pct === 100) return "border-l-emerald-500";
  if (pct > 0)     return "border-l-violet-600";
  return "border-l-transparent";
}
function statusBadge(pct) {
  if (pct === 100) return { text: "Completado",  cls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" };
  if (pct === 0)   return { text: "Sin iniciar", cls: "text-ink-400   bg-ink-50    dark:bg-ink-800"    };
  return                   { text: "En curso",   cls: "text-violet-600 bg-violet-50 dark:bg-violet-900/30" };
}
function fmtMonto(etapa) {
  if (!etapa.monto) return null;
  return `${(etapa.moneda || "ARS") === "USD" ? "USD " : "$ "}${Number(etapa.monto).toLocaleString("es-AR")}`;
}
function traducirError(code) {
  const map = {
    "auth/user-not-found":      "Email no registrado",
    "auth/wrong-password":      "Contraseña incorrecta",
    "auth/email-already-in-use":"El email ya está registrado",
    "auth/weak-password":       "La contraseña debe tener al menos 6 caracteres",
    "auth/invalid-email":       "Email inválido",
    "auth/invalid-credential":  "Email o contraseña incorrectos",
  };
  return map[code] || "Error al ingresar. Intentá de nuevo.";
}

// ── Shared UI primitives ───────────────────────────────────────────
function Label({ children }) {
  return (
    <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-ink-400 dark:text-ink-400">
      {children}
    </span>
  );
}
function SheetHandle() {
  return <div className="w-9 h-[3px] rounded-full bg-ink-200 dark:bg-ink-700 mx-auto mb-6" />;
}
function Spinner() {
  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-violet-600 dark:text-violet-400" />
    </div>
  );
}

function Accordion({ open, children }) {
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

function ModalConfirm({ mensaje, onConfirm, onCancel }) {
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

// ── Vista Pública (link de cliente) ───────────────────────────────
function VistaPublica({ token }) {
  const [obra, setObra] = useState(undefined);

  useEffect(() => {
    return escucharObraPorToken(token, setObra);
  }, [token]);

  if (obra === undefined) return <Spinner />;
  if (!obra) return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-4xl mb-4">🔍</div>
        <div className="font-bold text-lg text-ink dark:text-ink-50 mb-2">Link inválido</div>
        <div className="text-sm text-ink-500 dark:text-ink-400">Este link de obra no existe o fue eliminado.</div>
      </div>
    </div>
  );

  return <VistaCliente etapas={obra.etapas || []} obraInfo={obra.obraInfo || {}} onVolver={null} esPublica obraId={obra.id} />;
}

// ── Auth Screen ────────────────────────────────────────────────────
function AuthScreen() {
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [nombre,   setNombre]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const { dark, toggle }        = useTheme();

  async function submit() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true); setError("");
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        if (!nombre.trim()) { setError("Ingresá tu nombre"); setLoading(false); return; }
        await registrar(email.trim(), password, nombre.trim());
      }
    } catch (err) {
      setError(traducirError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink flex flex-col items-center justify-center px-5 py-6 gap-5">
      <div className="bg-white dark:bg-ink-900 rounded-3xl p-10 w-full max-w-sm border border-ink-200 dark:border-ink-700 animate-[slideUp_.22s_ease-out_both]">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-11 h-11 bg-violet-100 dark:bg-violet-900/40 rounded-xl mb-4">
            <Zap size={19} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-violet-600 dark:text-violet-400 mb-1.5">GRUPO V&B</div>
          <div className="font-bold text-[22px] text-ink dark:text-ink-50 tracking-[-0.04em] leading-tight">
            {mode === "login" ? "Bienvenido" : "Crear cuenta"}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {mode === "register" && (
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre"
              className="w-full px-3.5 py-3 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-400 outline-none focus:border-violet-500 transition-colors" />
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
            className="w-full px-3.5 py-3 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-400 outline-none focus:border-violet-500 transition-colors" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña"
            onKeyDown={e => e.key === "Enter" && submit()}
            className="w-full px-3.5 py-3 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-400 outline-none focus:border-violet-500 transition-colors" />
        </div>

        {error && <div className="mt-3 text-sm text-red-500 text-center font-medium">{error}</div>}

        <button onClick={submit} disabled={loading || !email.trim() || !password.trim()}
          className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm border-0 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-ink dark:bg-white text-white dark:text-ink flex items-center justify-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? "Ingresando..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
        </button>

        <button onClick={() => { setMode(m => m === "login" ? "register" : "login"); setError(""); }}
          className="w-full mt-3 bg-transparent border-0 text-ink-400 dark:text-ink-500 cursor-pointer text-sm font-medium py-2">
          {mode === "login" ? "¿No tenés cuenta? Registrarte" : "¿Ya tenés cuenta? Ingresar"}
        </button>
      </div>

      <button onClick={toggle}
        className="flex items-center gap-2 text-sm font-medium text-ink-400 dark:text-ink-500 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 rounded-full px-4 py-2 cursor-pointer">
        {dark ? <Sun size={14} /> : <Moon size={14} />}
        {dark ? "Modo claro" : "Modo oscuro"}
      </button>
    </div>
  );
}

// ── Modal de Firma ─────────────────────────────────────────────────
function ModalFirma({ etapa, obraInfo, onConfirm, onClose }) {
  const canvasRef               = useRef(null);
  const [firmante, setFirmante] = useState("");
  const [drawing,  setDrawing]  = useState(false);
  const [hasSig,   setHasSig]   = useState(false);
  const [sending,    setSending]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [emailError, setEmailError] = useState("");

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top)  * scaleY,
    };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDraw(e) {
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    setDrawing(true); setHasSig(true);
  }
  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#0d0b14"; ctx.lineWidth = 2;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
  }
  function stopDraw() { setDrawing(false); }
  function clearCanvas() {
    const c = canvasRef.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setHasSig(false);
  }

  const montoFmt = fmtMonto(etapa);

  async function confirmar() {
    if (!firmante.trim() || !hasSig) return;
    setSending(true);
    try {
      const firmaBase64 = canvasRef.current.toDataURL("image/png");
      const fecha = new Date().toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires", dateStyle: "full", timeStyle: "short",
      });
      const montoFinal = montoFmt || "No especificado";

      // 1 — Guardar firma en Firestore
      await onConfirm({ firmante: firmante.trim(), firmaBase64, fecha, monto: montoFinal });

      // 2 — Generar PDF, descargar localmente y subir a file.io
      let pdfUrl = "";
      try {
        const pdf = await generarComprobante({
          obraNombre: obraInfo.nombre,
          etapaNombre: etapa.nombre,
          monto: montoFinal,
          firmante: firmante.trim(),
          fecha,
          firmaBase64,
          clienteNombre: obraInfo.cliente || "",
          direccion: obraInfo.direccion || "",
        });
        const nombreArchivo = `Comprobante_${obraInfo.nombre}_${etapa.nombre}`.replace(/\s+/g, "_");
        pdf.save(`${nombreArchivo}.pdf`);

        // Subir a file.io para incluir link en el mail
        const blob = pdf.output("blob");
        const form = new FormData();
        form.append("file", new File([blob], `${nombreArchivo}.pdf`, { type: "application/pdf" }));
        form.append("expires", "14d");
        const res = await fetch("https://file.io", { method: "POST", body: form });
        const data = await res.json();
        if (data.success && data.link) pdfUrl = data.link;
      } catch (pdfErr) {
        console.error("PDF error:", pdfErr);
      }

      // 3 — Enviar email con link al PDF
      try {
        await enviarComprobante({
          obraNombre: obraInfo.nombre, etapaNombre: etapa.nombre,
          monto: montoFinal, firmante: firmante.trim(), fecha,
          clienteEmail: obraInfo.clienteEmail, adminEmail: obraInfo.adminEmail,
          pdfUrl,
        });
      } catch (err) {
        console.error("Email error:", err);
        const msg = err?.text || err?.message || JSON.stringify(err);
        setEmailError(`Firma guardada. Error de email: ${msg}`);
      }

      setDone(true);
    } catch (err) {
      console.error("Firma error:", err);
    } finally {
      setSending(false);
    }
  }

  if (done) return (
    <div className="fixed inset-0 bg-ink/70 flex items-center justify-center z-[200] p-6 animate-[fadeIn_.15s_ease-out_both]">
      <div className="bg-white dark:bg-ink-900 rounded-2xl p-8 w-full max-w-xs text-center border border-ink-200 dark:border-ink-700 animate-[slideUp_.2s_ease-out_both]">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4">
          <FileCheck size={24} className="text-emerald-600" />
        </div>
        <div className="font-bold text-lg text-ink dark:text-ink-50 mb-1.5 tracking-tight">
          {emailError ? "Firma registrada" : "Comprobante enviado"}
        </div>
        <div className="text-sm text-ink-500 dark:text-ink-400 mb-6 leading-relaxed">
          {emailError
            ? emailError
            : "La conformidad fue registrada y el comprobante enviado por email a ambos."}
        </div>
        <button onClick={onClose}
          className="w-full py-3 rounded-xl bg-ink dark:bg-white text-white dark:text-ink font-bold text-sm border-0 cursor-pointer">
          Cerrar
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-ink/70 flex items-end z-[200]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-ink-900 rounded-t-3xl px-5 pt-5 pb-11 w-full max-h-[95dvh] overflow-y-auto animate-[slideUp_.22s_ease-out_both]">
        <SheetHandle />
        <div className="text-center mb-5">
          <div className="font-bold text-lg text-ink dark:text-ink-50 tracking-tight">Conformidad de Etapa</div>
          <div className="text-sm text-ink-500 dark:text-ink-400 mt-1">{etapa.nombre}</div>
          {montoFmt && (
            <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-xl px-5 py-2.5 font-bold text-xl">
              {montoFmt}
            </div>
          )}
        </div>

        <div className="mb-4">
          <Label>Nombre del firmante</Label>
          <input value={firmante} onChange={e => setFirmante(e.target.value)} placeholder="Nombre completo..."
            className="w-full mt-2 px-3.5 py-3 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-300 outline-none focus:border-violet-500 transition-colors" />
        </div>

        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <Label>Firma digital</Label>
            {hasSig && (
              <button onClick={clearCanvas} className="text-xs text-red-400 border-0 bg-transparent cursor-pointer font-semibold">
                Borrar firma
              </button>
            )}
          </div>
          <canvas ref={canvasRef} width={600} height={200}
            className="w-full rounded-2xl border-2 border-dashed border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 touch-none"
            style={{ cursor: "crosshair" }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
          {!hasSig && <p className="text-center text-xs text-ink-400 dark:text-ink-500 mt-2 pointer-events-none">Firmá con el dedo o el mouse</p>}
        </div>

        {/* Destinatarios */}
        <div className={`mb-4 px-3 py-2.5 rounded-xl text-xs ${
          (obraInfo.clienteEmail || obraInfo.adminEmail)
            ? "bg-ink-50 dark:bg-ink-800 text-ink-500 dark:text-ink-400"
            : "bg-red-50 dark:bg-red-950/30 text-red-500"
        }`}>
          {(obraInfo.clienteEmail || obraInfo.adminEmail) ? (
            <>
              <span className="font-semibold">Comprobante para:</span>{" "}
              {[obraInfo.clienteEmail, obraInfo.adminEmail].filter(Boolean).join(" · ")}
            </>
          ) : (
            "⚠ No hay emails configurados en la obra. Editá el header para agregarlos."
          )}
        </div>

        <button onClick={confirmar} disabled={!firmante.trim() || !hasSig || sending}
          className="w-full py-3.5 rounded-xl font-bold text-sm border-0 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[.98] flex items-center justify-center gap-2">
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {sending ? "Enviando comprobante..." : "Confirmar y enviar comprobante"}
        </button>
        <button onClick={onClose} className="w-full mt-3 py-2.5 bg-transparent border-0 text-ink-400 dark:text-ink-500 cursor-pointer text-sm font-medium">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Sortable item (drag & drop) ────────────────────────────────────
function SortableItem({ etapaId, item, onToggle, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const cfg  = ESTADO_CONFIG[item.estado];
  const done = item.estado === "completado";
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto",
  };
  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-2.5 py-2.5 px-2.5 rounded-xl mb-1.5 border border-l-2 transition-colors ${cfg.bg} ${cfg.bgDark} ${cfg.border}`}>
      <div {...attributes} {...listeners}
        className="cursor-grab active:cursor-grabbing text-ink-300 dark:text-ink-600 flex-shrink-0 touch-none">
        <GripVertical size={15} />
      </div>
      <div onClick={() => onToggle(etapaId, item.id, done)}
        className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150 cursor-pointer border-[1.5px] ${
          done ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-600"
        } ${done ? "check-anim" : ""}`}>
        {done && <Check size={11} strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] leading-snug ${done ? "line-through text-ink-400 dark:text-ink-500" : "text-ink dark:text-ink-100"}`}>
          {item.tarea}
        </div>
        {item.comentario && (
          <div className="flex items-center gap-1 text-[11px] text-ink-400 dark:text-ink-500 mt-0.5">
            <MessageSquare size={10} /> {item.comentario}
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
      <button onClick={() => onEdit(etapaId, item)}
        className="bg-transparent border-0 cursor-pointer p-1.5 text-ink-400 dark:text-ink-500 flex-shrink-0 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700">
        <Pencil size={13} />
      </button>
    </div>
  );
}

function SortableItemList({ etapaId, items, onReorder, onToggle, onEdit }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 5 } }),
  );
  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    onReorder(etapaId, oldIndex, newIndex);
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableItem key={item.id} etapaId={etapaId} item={item} onToggle={onToggle} onEdit={onEdit} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

// ── Lista de Obras ─────────────────────────────────────────────────
function ListaObras({ obras, onSelect, onEliminar, uid, userNombre }) {
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
  const { dark, toggle }               = useTheme();

  async function crear() {
    if (!nombre.trim()) return;
    setCreando(true);
    await crearObra({
      uid,
      clienteToken: crypto.randomUUID(),
      obraInfo: {
        nombre: nombre.trim(), cliente: cliente.trim(), direccion: direccion.trim(),
        clienteEmail: clienteEmail.trim(), adminEmail: adminEmail.trim(),
        tipo, rubro,
      },
      etapas: TEMPLATES[rubro] || ETAPAS_DEFAULT,
    });
    setNombre(""); setCliente(""); setDireccion(""); setClienteEmail(""); setAdminEmail("");
    setTipo("casa"); setRubro("electrica");
    setModal(false); setCreando(false);
  }

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink pb-24">
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-700 px-5 pt-7 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap size={13} className="text-violet-600 dark:text-violet-400" />
              <Label>GRUPO V&B</Label>
            </div>
            <div className="text-[30px] font-bold text-ink dark:text-ink-50 tracking-[-0.04em] leading-none">Mis Obras</div>
            <div className="text-sm text-ink-500 dark:text-ink-400 mt-1.5">{obras.length} proyecto{obras.length !== 1 ? "s" : ""} · {userNombre}</div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={toggle}
              className="bg-ink-50 dark:bg-ink-800 border-0 rounded-full p-2 text-ink-400 dark:text-ink-500 cursor-pointer">
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={logout}
              className="bg-ink-50 dark:bg-ink-800 border-0 rounded-full p-2 text-ink-400 dark:text-ink-500 cursor-pointer">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-3.5 pt-4">
        {obras.length === 0 && (
          <div className="text-center py-16 px-5">
            <Building2 size={44} className="text-ink-200 dark:text-ink-700 mx-auto mb-4" />
            <div className="font-bold text-base text-ink dark:text-ink-50 mb-1.5 tracking-tight">Sin obras todavía</div>
            <div className="text-sm text-ink-500 dark:text-ink-400">Creá la primera con el botón de abajo.</div>
          </div>
        )}

        {obras.map(obra => {
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
                      {obra.obraInfo?.rubro && (
                        <span className="inline-block text-[11px] font-semibold rounded-md px-2 py-0.5 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400">
                          {RUBROS.find(r => r.id === obra.obraInfo.rubro)?.label || obra.obraInfo.rubro}
                        </span>
                      )}
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
        })}
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
            <div className="font-bold text-lg text-ink dark:text-ink-50 mb-5 tracking-tight">Nueva Obra</div>

            {/* Tipo de proyecto */}
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

            {/* Rubro */}
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

            {/* Datos de la obra */}
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

// ── Vista Cliente ──────────────────────────────────────────────────
function VistaCliente({ etapas, obraInfo, onVolver, esPublica = false, obraId = null }) {
  const [modalFirma, setModalFirma] = useState(null);
  const total  = etapas.flatMap(e => e.items).length;
  const comp   = etapas.flatMap(e => e.items).filter(i => i.estado === "completado").length;
  const pct    = total ? Math.round(comp / total * 100) : 0;
  const pColor = progressStroke(pct);

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink">
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-700 px-5 pt-6 pb-5">
        {!esPublica && (
          <button onClick={onVolver}
            className="bg-transparent border-0 text-ink-400 dark:text-ink-500 cursor-pointer text-sm font-medium flex items-center gap-1.5 mb-5 p-0">
            <ArrowLeft size={14} /> Volver
          </button>
        )}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap size={13} className="text-violet-600 dark:text-violet-400" />
              <Label>GRUPO V&B · CLIENTE</Label>
            </div>
            <div className="text-[22px] font-bold text-ink dark:text-ink-50 tracking-[-0.04em] leading-snug">{obraInfo.nombre}</div>
            {obraInfo.cliente && (
              <div className="flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400 mt-1.5">
                <User size={13} /> {obraInfo.cliente}
              </div>
            )}
            {obraInfo.direccion && (
              <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400 mt-1">
                <MapPin size={12} /> {obraInfo.direccion}
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-[40px] font-bold tracking-[-0.05em] leading-none ${progressColor(pct)}`}>{pct}%</div>
            <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-1">completado</div>
          </div>
        </div>
        <div className="h-0.5 bg-ink-100 dark:bg-ink-800 rounded-full mt-4 overflow-hidden">
          <div className="h-full rounded-full transition-[width_.6s_ease]" style={{ width: `${pct}%`, background: pColor }} />
        </div>
      </div>

      <div className="px-3.5 pt-4">
        <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 p-5 mb-3.5">
          <Label>Avance por etapa</Label>
          <div className="mt-4 flex flex-col gap-4">
            {etapas.map(etapa => {
              const ep  = pctEtapa(etapa);
              const obs = etapa.items.filter(i => i.estado === "observacion").length;
              const mf  = fmtMonto(etapa);
              return (
                <div key={etapa.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div>
                      <span className="text-sm font-semibold text-ink dark:text-ink-100">{etapa.nombre}</span>
                      {mf && <span className="ml-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{mf}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {obs > 0 && <span className="text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-950/40 rounded-md px-1.5 py-0.5">{obs} obs.</span>}
                      {etapa.firma && <FileCheck size={13} className="text-emerald-600" />}
                      <span className={`text-sm font-bold ${progressColor(ep)}`}>{ep}%</span>
                    </div>
                  </div>
                  <div className="h-0.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-[width_.5s_ease]" style={{ width: `${ep}%`, background: progressStroke(ep) }} />
                  </div>
                  {esPublica && ep === 100 && !etapa.firma && (
                    <button onClick={() => setModalFirma(etapa)}
                      className="mt-2.5 w-full py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors">
                      <PenLine size={11} /> Firmar conformidad de pago
                    </button>
                  )}
                  {etapa.firma && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <FileCheck size={11} /> Firmado por {etapa.firma.firmante}
                      {etapa.firma.monto && etapa.firma.monto !== "No especificado" && ` · ${etapa.firma.monto}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {Object.entries(ESTADO_CONFIG).map(([k, v]) => {
            const cnt = etapas.flatMap(e => e.items).filter(i => i.estado === k).length;
            return (
              <div key={k} className={`bg-white dark:bg-ink-900 rounded-xl p-4 border border-ink-200 dark:border-ink-700 border-t-2 ${v.border}`}>
                <div className={`text-[28px] font-bold tracking-[-0.04em] leading-none ${v.color}`}>{cnt}</div>
                <div className="text-xs text-ink-500 dark:text-ink-400 mt-1 font-medium">{v.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {modalFirma && (
        <ModalFirma
          etapa={modalFirma}
          obraInfo={obraInfo}
          onConfirm={async data => {
            const newEtapas = etapas.map(e =>
              e.id === modalFirma.id ? { ...e, firma: { ...data, timestamp: Date.now() } } : e
            );
            await guardarObra(obraId, { etapas: newEtapas });
          }}
          onClose={() => setModalFirma(null)} />
      )}
    </div>
  );
}

// ── App Principal ──────────────────────────────────────────────────
const clienteToken = new URLSearchParams(window.location.search).get("c");

export default function App() {
  if (clienteToken) return <VistaPublica token={clienteToken} />;
  const { dark, toggle: toggleDark }  = useTheme();
  const [user,        setUser]        = useState(undefined);
  const [userProfile, setUserProfile] = useState(null);
  const [obras,       setObras]       = useState([]);
  const [obraActiva,  setObraActiva]  = useState(null);
  const [etapas,      setEtapas]      = useState([]);
  const [obraInfo,    setObraInfo]    = useState({ nombre: "", cliente: "", direccion: "", clienteEmail: "", adminEmail: "" });
  const [expandidas,  setExpandidas]  = useState({});
  const [modalItem,   setModalItem]   = useState(null);
  const [vistaCliente, setVistaCliente] = useState(false);
  const [editInfo,    setEditInfo]    = useState(false);
  const [nuevoItemEtapa, setNuevoItemEtapa] = useState(null);
  const [nuevoItemTexto, setNuevoItemTexto] = useState("");
  const [saving,      setSaving]      = useState(false);
  const [cloudStatus, setCloudStatus] = useState("");
  const [confirmItem, setConfirmItem] = useState(null);
  const [copied,      setCopied]      = useState(false);
  const fileRef   = useRef();
  const saveTimer = useRef();
  const unsubRef  = useRef();

  // Auth listener
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

  // Obras listener (scoped to user)
  useEffect(() => {
    if (!user) return;
    const unsub = escucharObras(user.uid, setObras);
    return () => unsub();
  }, [user?.uid]);

  // Obra activa listener
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

  // Auto-save
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

  // Loading state while checking auth
  if (user === undefined) return <Spinner />;
  if (!user) return <AuthScreen />;
  if (!userProfile) return <Spinner />;

  const canEdit  = true;
  const canAdmin = true;

  const totalItems  = etapas.flatMap(e => e.items).length;
  const completados = etapas.flatMap(e => e.items).filter(i => i.estado === "completado").length;
  const pct         = totalItems ? Math.round(completados / totalItems * 100) : 0;
  const pColor      = progressStroke(pct);

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

  function handleFoto(e, etapaId, itemId) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => updateItem(etapaId, itemId, { foto: ev.target.result });
    r.readAsDataURL(file);
  }

  if (!obraActiva) return (
    <ListaObras
      obras={obras}
      onSelect={o => { setObraActiva(o); setExpandidas({}); setVistaCliente(false); }}
      onEliminar={async o => { await eliminarObra(o.id); }}
      uid={user.uid}
      userNombre={userProfile.nombre} />
  );

  if (vistaCliente) return (
    <VistaCliente etapas={etapas} obraInfo={obraInfo} onVolver={() => setVistaCliente(false)} />
  );

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink pb-16">

      {/* Header */}
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-700 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setObraActiva(null)}
              className="bg-transparent border-0 text-ink-400 dark:text-ink-500 cursor-pointer flex items-center gap-1 text-xs font-medium p-0">
              <ArrowLeft size={13} /> Obras
            </button>
          </div>
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
            <button onClick={copiarLink}
              className={`border rounded-full px-3 py-1.5 text-[11px] font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                copied
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                  : "border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-700"
              }`}>
              {copied ? <Check size={11} /> : <Share2 size={11} />}
              {copied ? "¡Copiado!" : "Link cliente"}
            </button>
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
            <div className="text-[10px] text-ink-400 dark:text-ink-600 mt-1.5 tracking-widest font-medium">TOCA PARA EDITAR</div>
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
      </div>

      {/* Etapas */}
      <div className="px-3.5 pt-3.5">
        {etapas.map(etapa => {
          const open = !!expandidas[etapa.id];
          const ep   = pctEtapa(etapa);
          const mf   = fmtMonto(etapa);

          return (
            <div key={etapa.id} className={`bg-white dark:bg-ink-900 rounded-2xl mb-2.5 border border-l-[3px] border-ink-200 dark:border-ink-700 overflow-hidden ${cardAccent(ep)}`}>
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

                  {/* Monto por etapa */}
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

                  {/* Firma / Conformidad */}
                  <div className="mt-3">
                    {ep === 100 && !etapa.firma && (
                      <div className="w-full py-2.5 px-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm font-semibold flex items-center justify-center gap-2">
                        <PenLine size={13} /> Pendiente de firma del cliente
                      </div>
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

      {/* Modal ítem */}
      {modalItem && (
        <div className="fixed inset-0 bg-ink/60 flex items-end z-[100]"
          onClick={e => { if (e.target === e.currentTarget) setModalItem(null); }}>
          <div className="bg-white dark:bg-ink-900 rounded-t-3xl px-5 pt-5 pb-11 w-full max-h-[90dvh] overflow-y-auto border border-ink-200 dark:border-ink-700 border-b-0 animate-[slideUp_.22s_ease-out_both]">
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
                    <button onClick={() => updateItem(modalItem.etapaId, modalItem.item.id, { foto: null })}
                      className="mt-2.5 bg-red-50 dark:bg-red-950/40 text-red-500 border-0 rounded-lg px-4 py-2 cursor-pointer font-bold text-xs">
                      Eliminar foto
                    </button>
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

    </div>
  );
}
