import { useState, useRef } from "react";
import {
  Package, ArrowLeft, Menu, Plus, X, Check, Loader2,
  FileDown, ChevronRight, Receipt, Trash2,
} from "lucide-react";
import { guardarObra } from "../firebase";
import { RUBROS } from "../constants/data";
import { Label, SheetHandle } from "./ui";
import { compressImage } from "../utils/imageUtils";

const UNIDADES = ["unidad", "m", "m²", "m³", "kg", "litro", "bolsa", "rollo", "hoja", "caja"];

const FORM_STOCK_DEFAULT = {
  material: "", cantidad: "", unidad: "unidad",
  precio: "", moneda: "ARS", proveedor: "",
  fecha: "", rubro: null, notas: "", factura: null,
};

function fmtPrecioStock(item) {
  if (!item.precio) return "";
  return `${item.moneda === "USD" ? "USD " : "$ "}${Number(item.precio).toLocaleString("es-AR")}`;
}

export default function VistaStock({ obras, onOpenSidebar }) {
  const [obraStockId, setObraStockId] = useState(null);
  const [modalOpen,   setModalOpen]   = useState(null);
  const [itemEdit,    setItemEdit]    = useState(null);
  const [filtroRubro, setFiltroRubro] = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState(null);
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const [form,        setForm]        = useState(FORM_STOCK_DEFAULT);
  const fileRef = useRef(null);

  const obraActiva    = obraStockId ? obras.find(o => o.id === obraStockId) : null;
  const stockAll      = obraActiva?.stock || [];
  const stockFiltrado = filtroRubro ? stockAll.filter(s => s.rubro === filtroRubro) : stockAll;
  const rubrosEnStock = RUBROS.filter(r => stockAll.some(s => s.rubro === r.id));

  function totales(items) {
    const ars = items.filter(s => (s.moneda || "ARS") === "ARS").reduce((a, s) => a + (Number(s.precio) || 0), 0);
    const usd = items.filter(s => s.moneda === "USD").reduce((a, s) => a + (Number(s.precio) || 0), 0);
    return { ars, usd };
  }

  function openNew() {
    setForm({ ...FORM_STOCK_DEFAULT, fecha: new Date().toISOString().split("T")[0] });
    setItemEdit(null);
    setSaveError(null);
    setModalOpen("new");
  }
  function openEdit(item) {
    setForm({ ...FORM_STOCK_DEFAULT, ...item });
    setItemEdit(item);
    setSaveError(null);
    setModalOpen("edit");
  }

  async function handleSave() {
    if (!form.material.trim() || !obraStockId) return;
    setSaveError(null);
    setSaving(true);
    try {
      const itemId = (modalOpen === "edit" && itemEdit) ? itemEdit.id : crypto.randomUUID();

      const formToSave = { ...form };
      const current    = obraActiva?.stock || [];
      const newStock   = (modalOpen === "edit" && itemEdit)
        ? current.map(s => s.id === itemEdit.id ? { ...s, ...formToSave } : s)
        : [...current, { ...formToSave, id: itemId, creadoEn: Date.now() }];

      const savePromise    = guardarObra(obraStockId, { stock: newStock });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado. Verificá tu conexión a internet.")), 12000)
      );
      await Promise.race([savePromise, timeoutPromise]);
      setModalOpen(null);
    } catch (err) {
      console.error("Error guardando stock:", err);
      setSaveError(err.message || "Error al guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!itemEdit || !obraStockId) return;
    setSaveError(null);
    const newStock = (obraActiva?.stock || []).filter(s => s.id !== itemEdit.id);
    setSaving(true);
    try {
      const savePromise    = guardarObra(obraStockId, { stock: newStock });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado.")), 12000)
      );
      await Promise.race([savePromise, timeoutPromise]);
      setModalOpen(null);
    } catch (err) {
      console.error("Error eliminando stock:", err);
      setSaveError(err.message || "Error al eliminar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  function handleFactura(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const compressed = await compressImage(ev.target.result);
      setForm(p => ({ ...p, factura: compressed }));
    };
    reader.readAsDataURL(file);
  }

  async function handlePDF() {
    if (!obraActiva) return;
    setPdfLoading(true);
    try {
      const { generarReporteStock } = await import("../services/pdf");
      const pdf = await generarReporteStock({
        obraInfo: obraActiva.obraInfo || {},
        stock: obraActiva.stock || [],
        rubros: RUBROS,
      });
      pdf.save(`Stock_${(obraActiva.obraInfo?.nombre || "Obra").replace(/\s+/g, "_")}.pdf`);
    } catch (err) { console.error(err); }
    setPdfLoading(false);
  }

  const obrasConStock  = obras.filter(o => (o.stock || []).length > 0);

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink pb-24">
      <input type="file" accept="image/*,application/pdf" ref={fileRef} className="hidden" onChange={handleFactura} />

      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-700 px-5 md:px-8 pt-7 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onOpenSidebar}
            className="md:hidden bg-ink-50 dark:bg-ink-800 border-0 rounded-xl p-2 cursor-pointer text-ink-500 dark:text-ink-400">
            <Menu size={18} />
          </button>
          {obraActiva ? (
            <button onClick={() => { setObraStockId(null); setFiltroRubro(null); }}
              className="bg-transparent border-0 text-ink-400 dark:text-ink-500 cursor-pointer flex items-center gap-1.5 text-sm font-medium p-0">
              <ArrowLeft size={14} /> Volver
            </button>
          ) : null}
        </div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Package size={16} className="text-violet-600 dark:text-violet-400" />
              <Label>STOCK DE OBRA</Label>
            </div>
            <div className="text-[22px] font-bold text-ink dark:text-ink-50 tracking-[-0.04em]">
              {obraActiva ? (obraActiva.obraInfo?.nombre || "Sin nombre") : "Stock de Obra"}
            </div>
            {!obraActiva && obras.length > 0 && (
              <div className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">
                Materiales por fuera del presupuesto
              </div>
            )}
          </div>
          {obraActiva && (
            <button onClick={handlePDF} disabled={pdfLoading}
              className="border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 rounded-full p-1.5 text-ink-500 dark:text-ink-400 cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors disabled:opacity-50 flex-shrink-0">
              {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            </button>
          )}
        </div>

        {obraActiva && stockAll.length > 0 && (() => {
          const { ars, usd } = totales(stockAll);
          return (
            <div className="mt-3 flex gap-3 flex-wrap">
              {ars > 0 && (
                <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 rounded-xl px-3 py-1.5">
                  <div className="text-[10px] font-bold text-violet-500 dark:text-violet-400 tracking-wider">TOTAL ARS</div>
                  <div className="text-[15px] font-bold text-violet-700 dark:text-violet-300 tracking-tight">$ {ars.toLocaleString("es-AR")}</div>
                </div>
              )}
              {usd > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl px-3 py-1.5">
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">TOTAL USD</div>
                  <div className="text-[15px] font-bold text-emerald-700 dark:text-emerald-300 tracking-tight">USD {usd.toLocaleString("es-AR")}</div>
                </div>
              )}
              <div className="bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl px-3 py-1.5">
                <div className="text-[10px] font-bold text-ink-400 dark:text-ink-500 tracking-wider">ITEMS</div>
                <div className="text-[15px] font-bold text-ink dark:text-ink-50 tracking-tight">{stockAll.length}</div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="px-3.5 md:px-8 pt-4">
        {!obraActiva && (
          <div>
            {obrasConStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package size={44} className="text-ink-200 dark:text-ink-700 mb-4" />
                <div className="font-bold text-base text-ink dark:text-ink-50 mb-1">Sin materiales cargados</div>
                <div className="text-sm text-ink-400 dark:text-ink-500">Abrí una obra y agregá materiales comprados fuera del presupuesto.</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {obrasConStock.map(obra => {
                  const { ars, usd } = totales(obra.stock || []);
                  const rubrosDots = RUBROS.filter(r => (obra.stock || []).some(s => s.rubro === r.id));
                  return (
                    <button key={obra.id} onClick={() => setObraStockId(obra.id)}
                      className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 p-5 text-left hover:shadow-card transition-shadow cursor-pointer w-full">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[18px] text-ink dark:text-ink-50 tracking-tight leading-snug truncate">
                            {obra.obraInfo?.nombre || "Sin nombre"}
                          </div>
                          {obra.obraInfo?.cliente && (
                            <div className="text-[13px] text-ink-400 dark:text-ink-500 mt-1">{obra.obraInfo.cliente}</div>
                          )}
                          {obra.obraInfo?.direccion && (
                            <div className="text-[12px] text-ink-300 dark:text-ink-600 mt-0.5">{obra.obraInfo.direccion}</div>
                          )}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {rubrosDots.map(r => (
                              <div key={r.id} className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.hex }} />
                            ))}
                            <span className="text-[12px] text-ink-400 dark:text-ink-500 font-medium">{(obra.stock || []).length} materiales</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                          {ars > 0 && <div className="text-[15px] font-bold text-violet-600 dark:text-violet-400">$ {ars.toLocaleString("es-AR")}</div>}
                          {usd > 0 && <div className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400">USD {usd.toLocaleString("es-AR")}</div>}
                          <ChevronRight size={16} className="text-ink-300 dark:text-ink-600 mt-1" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {obras.filter(o => !(o.stock || []).length).length > 0 && (
              <div className="mt-5">
                <Label>Otras obras</Label>
                <div className="flex flex-col gap-2 mt-2">
                  {obras.filter(o => !(o.stock || []).length).map(obra => (
                    <button key={obra.id} onClick={() => setObraStockId(obra.id)}
                      className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 px-5 py-4 text-left hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors cursor-pointer w-full flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[16px] font-bold text-ink-500 dark:text-ink-400 truncate">{obra.obraInfo?.nombre || "Sin nombre"}</div>
                        {obra.obraInfo?.cliente && <div className="text-[12px] text-ink-300 dark:text-ink-600 mt-0.5">{obra.obraInfo.cliente}</div>}
                      </div>
                      <span className="text-[12px] font-medium text-ink-300 dark:text-ink-600 flex-shrink-0 flex items-center gap-1">Agregar <ChevronRight size={13} /></span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {obraActiva && (
          <div>
            {rubrosEnStock.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 mb-3">
                <button onClick={() => setFiltroRubro(null)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                    !filtroRubro ? "bg-ink dark:bg-white text-white dark:text-ink border-transparent" : "bg-transparent border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400"
                  }`}>
                  Todos
                </button>
                {rubrosEnStock.map(r => {
                  const active = filtroRubro === r.id;
                  return (
                    <button key={r.id} onClick={() => setFiltroRubro(active ? null : r.id)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${active ? "border-transparent" : "border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400"}`}
                      style={active ? { background: r.hex, color: "white" } : {}}>
                      {r.label}
                    </button>
                  );
                })}
              </div>
            )}

            {stockFiltrado.length === 0 ? (
              <div className="text-center py-12">
                <Package size={36} className="text-ink-200 dark:text-ink-700 mx-auto mb-3" />
                <div className="text-sm font-semibold text-ink-400 dark:text-ink-500">Sin materiales cargados</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mb-4">
                {[...stockFiltrado].sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0)).map(item => {
                  const rc = RUBROS.find(r => r.id === item.rubro);
                  return (
                    <button key={item.id} onClick={() => openEdit(item)}
                      className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 p-4 text-left hover:shadow-card transition-shadow cursor-pointer w-full">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[14px] text-ink dark:text-ink-50 tracking-tight">{item.material}</div>
                          <div className="text-[12px] text-ink-400 dark:text-ink-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            {item.cantidad && <span>{item.cantidad} {item.unidad}</span>}
                            {item.cantidad && item.proveedor && <span>·</span>}
                            {item.proveedor && <span>{item.proveedor}</span>}
                            {item.fecha && <span>· {item.fecha.split("-").reverse().join("/").slice(0, 8)}</span>}
                          </div>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {rc && (
                              <span className="text-[10px] font-bold rounded-md px-1.5 py-0.5 border"
                                style={{ color: rc.hex, borderColor: rc.hex + "55", background: rc.hex + "12" }}>
                                {rc.label}
                              </span>
                            )}
                            {item.factura && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md px-1.5 py-0.5">
                                <Receipt size={9} /> Factura
                              </span>
                            )}
                            {item.notas && (
                              <span className="text-[10px] text-ink-400 dark:text-ink-500 truncate max-w-[160px]">{item.notas}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {item.precio && (
                            <div className="text-[14px] font-bold" style={{ color: item.moneda === "USD" ? "#059669" : "#7c5cc9" }}>
                              {fmtPrecioStock(item)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {obraActiva && (
        <button onClick={openNew}
          className="fixed bottom-6 right-6 z-50 bg-violet-600 hover:bg-violet-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-fab hover:shadow-fab-hover transition-all active:scale-95 border-0 cursor-pointer">
          <Plus size={22} />
        </button>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-ink/60 flex items-end md:items-center md:justify-center z-[100]"
          onClick={e => { if (e.target === e.currentTarget) { setModalOpen(null); setSaveError(null); } }}>
          <div className="bg-white dark:bg-ink-900 rounded-t-3xl md:rounded-3xl px-5 pt-5 pb-10 md:pb-6 w-full md:max-w-lg max-h-[92dvh] overflow-y-auto border border-ink-200 dark:border-ink-700 border-b-0 md:border animate-[slideUp_.22s_ease-out_both]">
            <SheetHandle />
            <div className="flex justify-between items-center mb-5">
              <div className="font-bold text-base text-ink dark:text-ink-50 tracking-tight">
                {modalOpen === "edit" ? "Editar material" : "Agregar material"}
              </div>
              <button onClick={() => { setModalOpen(null); setSaveError(null); }}
                className="bg-ink-50 dark:bg-ink-800 border-0 rounded-full w-8 h-8 cursor-pointer text-ink-400 flex items-center justify-center">
                <X size={14} />
              </button>
            </div>

            <div className="mb-4">
              <Label>Material *</Label>
              <input value={form.material} onChange={e => setForm(p => ({ ...p, material: e.target.value }))}
                placeholder="Ej: Cable 2.5mm², Cemento Portland..."
                className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-white dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-300 outline-none focus:border-violet-500 transition-colors" />
            </div>

            <div className="mb-4">
              <Label>Cantidad</Label>
              <div className="flex gap-2 mt-2">
                <input type="number" value={form.cantidad} onChange={e => setForm(p => ({ ...p, cantidad: e.target.value }))}
                  placeholder="0"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-white dark:bg-ink-800 text-ink dark:text-ink-50 outline-none focus:border-violet-500 transition-colors" />
                <select value={form.unidad} onChange={e => setForm(p => ({ ...p, unidad: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-white dark:bg-ink-800 text-ink dark:text-ink-50 outline-none focus:border-violet-500 transition-colors cursor-pointer">
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <Label>Precio</Label>
              <div className="flex gap-2 mt-2">
                <input type="number" value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))}
                  placeholder="0"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-white dark:bg-ink-800 text-ink dark:text-ink-50 outline-none focus:border-violet-500 transition-colors" />
                <button onClick={() => setForm(p => ({ ...p, moneda: p.moneda === "ARS" ? "USD" : "ARS" }))}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${
                    form.moneda === "USD"
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                      : "border-violet-400 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                  }`}>
                  {form.moneda}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <Label>Proveedor</Label>
              <input value={form.proveedor} onChange={e => setForm(p => ({ ...p, proveedor: e.target.value }))}
                placeholder="Nombre del proveedor o local"
                className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-white dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-300 outline-none focus:border-violet-500 transition-colors" />
            </div>

            <div className="mb-4">
              <Label>Fecha</Label>
              <input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-white dark:bg-ink-800 text-ink dark:text-ink-50 outline-none focus:border-violet-500 transition-colors" />
            </div>

            <div className="mb-4">
              <Label>Rubro</Label>
              <div className="flex gap-1.5 flex-wrap mt-2">
                <button onClick={() => setForm(p => ({ ...p, rubro: null }))}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all ${
                    !form.rubro ? "bg-ink dark:bg-white text-white dark:text-ink border-transparent" : "bg-transparent border-ink-200 dark:border-ink-700 text-ink-400 dark:text-ink-500"
                  }`}>
                  Sin rubro
                </button>
                {RUBROS.map(r => {
                  const active = form.rubro === r.id;
                  return (
                    <button key={r.id} onClick={() => setForm(p => ({ ...p, rubro: active ? null : r.id }))}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all ${
                        active ? "border-transparent" : "border-ink-200 dark:border-ink-700 text-ink-400 dark:text-ink-500"
                      }`}
                      style={active ? { background: r.hex, borderColor: r.hex, color: "white" } : {}}>
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <Label>Notas</Label>
              <textarea value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                placeholder="Observaciones opcionales..."
                rows={2}
                className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-white dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-300 outline-none focus:border-violet-500 transition-colors resize-none" />
            </div>

            <div className="mb-6">
              <Label>Factura / Recibo</Label>
              <div className="mt-2">
                {form.factura ? (
                  <div className="relative">
                    <img src={form.factura} alt="Factura" className="w-full max-h-48 object-contain rounded-xl border border-ink-200 dark:border-ink-700" />
                    <button onClick={() => setForm(p => ({ ...p, factura: null }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center border-0 cursor-pointer">
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-ink-200 dark:border-ink-700 text-ink-400 dark:text-ink-500 cursor-pointer flex flex-col items-center gap-1.5 hover:border-violet-400 dark:hover:border-violet-600 transition-colors bg-transparent">
                    <Receipt size={20} />
                    <span className="text-sm font-medium">Adjuntar factura o recibo</span>
                    <span className="text-[11px]">Foto o imagen</span>
                  </button>
                )}
              </div>
            </div>

            {saveError && (
              <div className="mb-4 px-3.5 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
                {saveError}
              </div>
            )}

            <button onClick={handleSave} disabled={saving || !form.material.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-sm border-0 cursor-pointer transition-all disabled:opacity-40 bg-violet-600 hover:bg-violet-700 text-white active:scale-[.98] flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? "Guardando..." : modalOpen === "edit" ? "Guardar cambios" : "Agregar material"}
            </button>

            {modalOpen === "edit" && (
              <button onClick={handleDelete} disabled={saving}
                className="w-full mt-3 py-2.5 rounded-xl font-semibold text-sm border border-red-200 dark:border-red-900 bg-transparent text-red-500 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40">
                <Trash2 size={13} /> Eliminar material
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
