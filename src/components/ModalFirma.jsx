import { useState, useRef } from "react";
import { Loader2, FileCheck, Check } from "lucide-react";
import { enviarComprobante } from "../services/email";
import { Label, SheetHandle } from "./ui";
import { fmtMonto } from "../utils/helpers";

export default function ModalFirma({ etapa, obraInfo, onConfirm, onClose }) {
  const canvasRef               = useRef(null);
  const [firmante, setFirmante] = useState("");
  const [drawing,  setDrawing]  = useState(false);
  const [hasSig,   setHasSig]   = useState(false);
  const [sending,    setSending]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [emailError, setEmailError] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");

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

      await onConfirm({ firmante: firmante.trim(), firmaBase64, fecha, monto: montoFinal });

      let pdfUrl = "";
      try {
        const { generarComprobante } = await import("../services/pdf");
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
        const blob = pdf.output("blob");
        setPdfBlobUrl(URL.createObjectURL(blob));
      } catch (pdfErr) {
        console.error("PDF error:", pdfErr);
      }

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
        <div className="flex flex-col gap-2.5">
          {pdfBlobUrl && (
            <a href={pdfBlobUrl} download="comprobante.pdf" target="_blank" rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold text-sm text-center flex items-center justify-center gap-2 no-underline">
              Descargar comprobante
            </a>
          )}
          <button onClick={onClose}
            className="w-full py-3 rounded-xl bg-ink dark:bg-white text-white dark:text-ink font-bold text-sm border-0 cursor-pointer">
            Cerrar
          </button>
        </div>
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
