import { useState, useEffect, useRef } from "react";
import { guardarObra, escucharObra } from "./firebase";

const ETAPAS_DEFAULT = [
  { id: "replanteo", nombre: "1. Replanteo y Trazado", items: [
    { id: "r1", tarea: "Relevamiento del plano eléctrico", estado: "pendiente", comentario: "", foto: null },
    { id: "r2", tarea: "Marcado de recorridos de cañería", estado: "pendiente", comentario: "", foto: null },
    { id: "r3", tarea: "Ubicación de tableros y cajas", estado: "pendiente", comentario: "", foto: null },
  ]},
  { id: "caneria", nombre: "2. Cañería y Conductos", items: [
    { id: "c1", tarea: "Instalación de cañería corrugada/rígida", estado: "pendiente", comentario: "", foto: null },
    { id: "c2", tarea: "Colocación de cajas de paso y derivación", estado: "pendiente", comentario: "", foto: null },
    { id: "c3", tarea: "Fijación y verificación de recorridos", estado: "pendiente", comentario: "", foto: null },
  ]},
  { id: "conductores", nombre: "3. Conductores", items: [
    { id: "co1", tarea: "Pasaje de cables fase, neutro y tierra", estado: "pendiente", comentario: "", foto: null },
    { id: "co2", tarea: "Identificación y etiquetado de conductores", estado: "pendiente", comentario: "", foto: null },
    { id: "co3", tarea: "Verificación de secciones según plano", estado: "pendiente", comentario: "", foto: null },
  ]},
  { id: "tablero", nombre: "4. Tablero Eléctrico", items: [
    { id: "t1", tarea: "Montaje de gabinete/tablero", estado: "pendiente", comentario: "", foto: null },
    { id: "t2", tarea: "Instalación de termomagnéticas y disyuntores", estado: "pendiente", comentario: "", foto: null },
    { id: "t3", tarea: "Conexión de circuitos al tablero", estado: "pendiente", comentario: "", foto: null },
    { id: "t4", tarea: "Rotulado de circuitos", estado: "pendiente", comentario: "", foto: null },
  ]},
  { id: "bocas", nombre: "5. Bocas y Artefactos", items: [
    { id: "b1", tarea: "Colocación de tomas e interruptores", estado: "pendiente", comentario: "", foto: null },
    { id: "b2", tarea: "Instalación de luminarias", estado: "pendiente", comentario: "", foto: null },
    { id: "b3", tarea: "Conexión de equipos especiales (AC, calefón, etc.)", estado: "pendiente", comentario: "", foto: null },
  ]},
  { id: "pruebas", nombre: "6. Pruebas y Mediciones", items: [
    { id: "p1", tarea: "Medición de aislación de conductores", estado: "pendiente", comentario: "", foto: null },
    { id: "p2", tarea: "Prueba de continuidad y puesta a tierra", estado: "pendiente", comentario: "", foto: null },
    { id: "p3", tarea: "Verificación de disyuntores", estado: "pendiente", comentario: "", foto: null },
    { id: "p4", tarea: "Prueba de funcionamiento general", estado: "pendiente", comentario: "", foto: null },
  ]},
];

const ESTADO_CONFIG = {
  pendiente:   { label: "Pendiente",   color: "#6b7280", bg: "#f3f4f6" },
  progreso:    { label: "En progreso", color: "#d97706", bg: "#fef3c7" },
  completado:  { label: "Completado",  color: "#059669", bg: "#d1fae5" },
  observacion: { label: "Observación", color: "#dc2626", bg: "#fee2e2" },
};

const ROLES = {
  admin:  { label: "Administrador", icon: "🔧" },
  socio:  { label: "Socio",         icon: "👷" },
  cliente:{ label: "Cliente",       icon: "👤" },
};

const PINES = { admin: "1234", socio: "5678" };

// ─── Selector de Rol ─────────────────────────────────────────────
function RoleSelector({ onSelect }) {
  const [step, setStep] = useState("roles");
  const [rolePending, setRolePending] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function selectRole(r) {
    if (r === "cliente") { onSelect("cliente"); return; }
    setRolePending(r); setStep("pin"); setPin(""); setError("");
  }

  function checkPin(p) {
    if (p === PINES[rolePending]) onSelect(rolePending);
    else { setError("PIN incorrecto"); setPin(""); }
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1e3a5f,#2563eb)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"32px 24px", width:"100%", maxWidth:360, boxShadow:"0 20px 60px rgba(0,0,0,.25)" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:40 }}>⚡</div>
          <div style={{ fontWeight:800, fontSize:20, color:"#1e293b", marginTop:8 }}>Planificador de Obra</div>
          <div style={{ color:"#64748b", fontSize:14, marginTop:4 }}>
            {step === "roles" ? "¿Con qué rol ingresás?" : `PIN de ${ROLES[rolePending].label}`}
          </div>
        </div>

        {step === "roles" ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {Object.entries(ROLES).map(([k, v]) => (
              <button key={k} onClick={() => selectRole(k)}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", borderRadius:14, border:"2px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", textAlign:"left" }}>
                <span style={{ fontSize:28 }}>{v.icon}</span>
                <div>
                  <div style={{ fontWeight:700, color:"#1e293b", fontSize:15 }}>{v.label}</div>
                  <div style={{ fontSize:12, color:"#94a3b8" }}>
                    {k==="admin" ? "Acceso total" : k==="socio" ? "Editar estados y comentarios" : "Solo lectura · vista de avance"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:8 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:48, height:56, borderRadius:12, border:`2px solid ${pin.length>i?"#2563eb":"#e2e8f0"}`, background:pin.length>i?"#eff6ff":"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700 }}>
                  {pin.length>i ? "●" : ""}
                </div>
              ))}
            </div>
            {error && <div style={{ color:"#dc2626", textAlign:"center", fontSize:13, marginBottom:8 }}>{error}</div>}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginTop:16 }}>
              {[1,2,3,4,5,6,7,8,9,"←",0,"✓"].map((n, i) => (
                <button key={i} onClick={() => {
                  if (n==="←") { setPin(p=>p.slice(0,-1)); setError(""); }
                  else if (n==="✓") checkPin(pin);
                  else if (pin.length < 4) {
                    const np = pin + n;
                    setPin(np);
                    if (np.length === 4) setTimeout(() => checkPin(np), 200);
                  }
                }}
                  style={{ padding:"14px", borderRadius:12, border:"2px solid #e2e8f0", background:n==="✓"?"#2563eb":"#f8fafc", color:n==="✓"?"#fff":"#1e293b", fontWeight:700, fontSize:18, cursor:"pointer" }}>
                  {n}
                </button>
              ))}
            </div>
            <button onClick={() => { setStep("roles"); setError(""); }} style={{ marginTop:16, width:"100%", background:"none", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:13 }}>← Volver</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Vista Cliente ────────────────────────────────────────────────
function VistaCliente({ etapas, obraInfo, onLogout }) {
  const total = etapas.flatMap(e=>e.items).length;
  const comp  = etapas.flatMap(e=>e.items).filter(i=>i.estado==="completado").length;
  const pct   = total ? Math.round(comp/total*100) : 0;

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", background:"#f8fafc", minHeight:"100vh" }}>
      <div style={{ background:"linear-gradient(135deg,#064e3b,#059669)", color:"#fff", padding:"24px 20px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:10, opacity:.7, letterSpacing:1, textTransform:"uppercase" }}>👤 Vista Cliente</div>
            <div style={{ fontSize:22, fontWeight:800, marginTop:4 }}>{obraInfo.nombre}</div>
            {obraInfo.cliente && <div style={{ fontSize:13, opacity:.85 }}>Cliente: {obraInfo.cliente}</div>}
            {obraInfo.direccion && <div style={{ fontSize:12, opacity:.7 }}>{obraInfo.direccion}</div>}
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:42, fontWeight:800, lineHeight:1 }}>{pct}%</div>
            <div style={{ fontSize:11, opacity:.8 }}>completado</div>
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,.2)", borderRadius:99, height:10, marginTop:16 }}>
          <div style={{ background:"#fff", width:`${pct}%`, height:"100%", borderRadius:99, transition:"width .5s" }} />
        </div>
      </div>

      <div style={{ padding:"16px 12px" }}>
        <div style={{ background:"#fff", borderRadius:16, padding:"16px 18px", marginBottom:12, boxShadow:"0 1px 4px rgba(0,0,0,.08)" }}>
          <div style={{ fontWeight:700, color:"#1e293b", marginBottom:14, fontSize:15 }}>Avance por etapa</div>
          {etapas.map(etapa => {
            const ep = !etapa.items.length ? 0 : Math.round(etapa.items.filter(i=>i.estado==="completado").length/etapa.items.length*100);
            const obs = etapa.items.filter(i=>i.estado==="observacion").length;
            return (
              <div key={etapa.id} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                  <span style={{ fontSize:14, color:"#1e293b", fontWeight:600 }}>{etapa.nombre}</span>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    {obs>0 && <span style={{ fontSize:11, background:"#fee2e2", color:"#dc2626", borderRadius:99, padding:"1px 8px", fontWeight:600 }}>{obs} obs.</span>}
                    <span style={{ fontSize:13, fontWeight:700, color:ep===100?"#059669":"#64748b" }}>{ep}%</span>
                  </div>
                </div>
                <div style={{ background:"#f1f5f9", borderRadius:99, height:8 }}>
                  <div style={{ background:ep===100?"#10b981":"#2563eb", width:`${ep}%`, height:"100%", borderRadius:99, transition:"width .4s" }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {Object.entries(ESTADO_CONFIG).map(([k,v]) => {
            const cnt = etapas.flatMap(e=>e.items).filter(i=>i.estado===k).length;
            return (
              <div key={k} style={{ background:"#fff", borderRadius:12, padding:"12px 14px", boxShadow:"0 1px 3px rgba(0,0,0,.07)", borderLeft:`4px solid ${v.color}` }}>
                <div style={{ fontSize:22, fontWeight:800, color:v.color }}>{cnt}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{v.label}</div>
              </div>
            );
          })}
        </div>
        <button onClick={onLogout} style={{ width:"100%", padding:12, background:"#f1f5f9", border:"none", borderRadius:10, color:"#64748b", cursor:"pointer", fontSize:13 }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ─── App Principal ────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState(null);
  const [etapas, setEtapas] = useState(ETAPAS_DEFAULT);
  const [obraInfo, setObraInfo] = useState({ nombre:"Obra Eléctrica", cliente:"", direccion:"" });
  const [expandidas, setExpandidas] = useState({ replanteo:true });
  const [modalItem, setModalItem] = useState(null);
  const [editInfo, setEditInfo] = useState(false);
  const [nuevoItemEtapa, setNuevoItemEtapa] = useState(null);
  const [nuevoItemTexto, setNuevoItemTexto] = useState("");
  const [saving, setSaving] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("Cargando...");
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef();
  const saveTimer = useRef();

  // Escuchar cambios en tiempo real desde Firebase
  useEffect(() => {
    const unsub = escucharObra((data) => {
      if (data?.etapas) setEtapas(data.etapas);
      if (data?.obraInfo) setObraInfo(data.obraInfo);
      setCloudStatus("✅ Sincronizado");
      setLoaded(true);
    });
    setTimeout(() => setLoaded(true), 3000); // fallback si no hay datos aún
    return () => unsub(); // limpia el listener al cerrar
  }, []);

  // Guardar en Firebase con debounce
  useEffect(() => {
    if (!loaded || !role || role === "cliente") return;
    clearTimeout(saveTimer.current);
    setSaving(true);
    setCloudStatus("Guardando...");
    saveTimer.current = setTimeout(async () => {
      try {
        await guardarObra({ etapas, obraInfo });
        setCloudStatus("✅ Guardado");
      } catch { setCloudStatus("⚠️ Error al guardar"); }
      setSaving(false);
    }, 800);
  }, [etapas, obraInfo, loaded, role]);

  const totalItems = etapas.flatMap(e=>e.items).length;
  const completados = etapas.flatMap(e=>e.items).filter(i=>i.estado==="completado").length;
  const pct = totalItems ? Math.round(completados/totalItems*100) : 0;
  const canEdit = role==="admin" || role==="socio";
  const canAdmin = role==="admin";

  function updateItem(etapaId, itemId, changes) {
    if (!canEdit) return;
    setEtapas(prev => prev.map(e => e.id!==etapaId ? e : {
      ...e, items: e.items.map(i => i.id!==itemId ? i : { ...i, ...changes })
    }));
    if (modalItem?.item?.id===itemId)
      setModalItem(prev => ({ ...prev, item: { ...prev.item, ...changes } }));
  }

  function addItem(etapaId) {
    if (!canAdmin || !nuevoItemTexto.trim()) return;
    const ni = { id: Date.now().toString(), tarea:nuevoItemTexto.trim(), estado:"pendiente", comentario:"", foto:null };
    setEtapas(prev => prev.map(e => e.id!==etapaId ? e : { ...e, items:[...e.items,ni] }));
    setNuevoItemTexto(""); setNuevoItemEtapa(null);
  }

  function deleteItem(etapaId, itemId) {
    if (!canAdmin) return;
    setEtapas(prev => prev.map(e => e.id!==etapaId ? e : { ...e, items:e.items.filter(i=>i.id!==itemId) }));
    setModalItem(null);
  }

  function handleFoto(e, etapaId, itemId) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => updateItem(etapaId, itemId, { foto:ev.target.result });
    r.readAsDataURL(file);
  }

  const pctEtapa = e => !e.items.length ? 0 : Math.round(e.items.filter(i=>i.estado==="completado").length/e.items.length*100);

  if (!role) return <RoleSelector onSelect={setRole} />;
  if (!loaded) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"system-ui",color:"#64748b",flexDirection:"column",gap:12 }}>
      <div style={{ fontSize:36 }}>⚡</div><div>Cargando...</div>
    </div>
  );
  if (role==="cliente") return <VistaCliente etapas={etapas} obraInfo={obraInfo} onLogout={()=>setRole(null)} />;

  const rv = ROLES[role];

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", background:"#f8fafc", minHeight:"100vh", paddingBottom:60 }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1e3a5f,#2563eb)", color:"#fff", padding:"18px 16px 14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:10, opacity:.7, letterSpacing:1, textTransform:"uppercase" }}>{rv.icon} {rv.label}</span>
              <button onClick={()=>setRole(null)} style={{ fontSize:10, background:"rgba(255,255,255,.15)", border:"none", color:"#fff", borderRadius:99, padding:"2px 8px", cursor:"pointer" }}>Cambiar</button>
            </div>
            {editInfo && canAdmin ? (
              <div style={{ marginTop:6 }}>
                {[["nombre","Nombre de obra",18],["cliente","Cliente",13],["direccion","Dirección",13]].map(([k,ph,fs])=>(
                  <input key={k} value={obraInfo[k]} placeholder={ph} onChange={e=>setObraInfo(p=>({...p,[k]:e.target.value}))}
                    style={{ fontSize:fs, fontWeight:k==="nombre"?700:400, background:"rgba(255,255,255,.15)", border:"none", color:"#fff", borderRadius:6, padding:"3px 8px", width:"100%", marginTop:k==="nombre"?4:3, display:"block", boxSizing:"border-box" }} />
                ))}
                <button onClick={()=>setEditInfo(false)} style={{ marginTop:8, background:"#fff", color:"#1e3a5f", border:"none", borderRadius:6, padding:"5px 16px", fontWeight:700, cursor:"pointer", fontSize:13 }}>Guardar</button>
              </div>
            ) : (
              <div onClick={()=>canAdmin&&setEditInfo(true)} style={{ cursor:canAdmin?"pointer":"default", marginTop:4 }}>
                <div style={{ fontSize:20, fontWeight:700 }}>{obraInfo.nombre}</div>
                {obraInfo.cliente && <div style={{ fontSize:13, opacity:.85 }}>👤 {obraInfo.cliente}</div>}
                {obraInfo.direccion && <div style={{ fontSize:12, opacity:.7 }}>📍 {obraInfo.direccion}</div>}
                {canAdmin && <div style={{ fontSize:10, opacity:.5, marginTop:2 }}>✏️ Toca para editar</div>}
              </div>
            )}
          </div>
          <div style={{ textAlign:"center", minWidth:64 }}>
            <div style={{ fontSize:38, fontWeight:800, lineHeight:1 }}>{pct}%</div>
            <div style={{ fontSize:11, opacity:.8 }}>{completados}/{totalItems}</div>
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,.2)", borderRadius:99, height:8, marginTop:12 }}>
          <div style={{ background:pct===100?"#10b981":"#60a5fa", width:`${pct}%`, height:"100%", borderRadius:99, transition:"width .4s" }} />
        </div>
        <div style={{ marginTop:6, fontSize:11, opacity:.65, textAlign:"right" }}>{saving?"⏳ Guardando...":cloudStatus}</div>
      </div>

      {/* Etapas */}
      <div style={{ padding:"14px 12px 0" }}>
        {etapas.map(etapa => {
          const open = !!expandidas[etapa.id];
          const ep = pctEtapa(etapa);
          return (
            <div key={etapa.id} style={{ background:"#fff", borderRadius:14, marginBottom:12, boxShadow:"0 1px 4px rgba(0,0,0,.08)", overflow:"hidden" }}>
              <div onClick={()=>setExpandidas(p=>({...p,[etapa.id]:!p[etapa.id]}))}
                style={{ display:"flex", alignItems:"center", padding:"14px 16px", cursor:"pointer", userSelect:"none" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>{etapa.nombre}</div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{etapa.items.filter(i=>i.estado==="completado").length}/{etapa.items.length} completados</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ position:"relative", width:38, height:38 }}>
                    <svg viewBox="0 0 38 38" style={{ transform:"rotate(-90deg)", width:38, height:38 }}>
                      <circle cx="19" cy="19" r="15" fill="none" stroke="#e2e8f0" strokeWidth="4"/>
                      <circle cx="19" cy="19" r="15" fill="none" stroke={ep===100?"#10b981":"#2563eb"} strokeWidth="4"
                        strokeDasharray={`${ep*.942} 100`} strokeLinecap="round"/>
                    </svg>
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#1e293b" }}>{ep}%</div>
                  </div>
                  <span style={{ fontSize:18, color:"#94a3b8" }}>{open?"▲":"▼"}</span>
                </div>
              </div>

              {open && (
                <div style={{ borderTop:"1px solid #f1f5f9", padding:"8px 12px 12px" }}>
                  {etapa.items.map(item => {
                    const cfg = ESTADO_CONFIG[item.estado];
                    return (
                      <div key={item.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 8px", borderRadius:10, marginBottom:4, background:"#fafafa", border:"1px solid #f1f5f9" }}>
                        <div onClick={()=>canEdit&&updateItem(etapa.id,item.id,{estado:item.estado==="completado"?"pendiente":"completado"})}
                          style={{ width:24, height:24, borderRadius:6, border:`2px solid ${item.estado==="completado"?"#059669":"#cbd5e1"}`, background:item.estado==="completado"?"#059669":"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:canEdit?"pointer":"default", flexShrink:0 }}>
                          {item.estado==="completado"&&<span style={{color:"#fff",fontSize:14}}>✓</span>}
                        </div>
                        <div style={{ flex:1, fontSize:14, color:item.estado==="completado"?"#94a3b8":"#1e293b", textDecoration:item.estado==="completado"?"line-through":"none" }}>
                          {item.tarea}
                          {item.comentario&&<div style={{fontSize:11,color:"#64748b",marginTop:2}}>💬 {item.comentario}</div>}
                          {item.foto&&<div style={{fontSize:11,color:"#2563eb",marginTop:2}}>📷 Foto adjunta</div>}
                        </div>
                        <span style={{ fontSize:10, fontWeight:600, color:cfg.color, background:cfg.bg, borderRadius:99, padding:"2px 8px", whiteSpace:"nowrap" }}>{cfg.label}</span>
                        {canEdit&&<button onClick={()=>setModalItem({etapaId:etapa.id,item})}
                          style={{background:"none",border:"none",cursor:"pointer",fontSize:18,padding:2,color:"#94a3b8"}}>⋯</button>}
                      </div>
                    );
                  })}
                  {canAdmin && (
                    nuevoItemEtapa===etapa.id ? (
                      <div style={{ display:"flex", gap:6, marginTop:8 }}>
                        <input autoFocus value={nuevoItemTexto} onChange={e=>setNuevoItemTexto(e.target.value)}
                          onKeyDown={e=>{if(e.key==="Enter")addItem(etapa.id);if(e.key==="Escape")setNuevoItemEtapa(null);}}
                          placeholder="Descripción del ítem..." style={{ flex:1, padding:"8px 10px", borderRadius:8, border:"1.5px solid #2563eb", fontSize:13 }} />
                        <button onClick={()=>addItem(etapa.id)} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"0 14px",cursor:"pointer",fontWeight:700}}>+</button>
                        <button onClick={()=>setNuevoItemEtapa(null)} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"0 12px",cursor:"pointer"}}>✕</button>
                      </div>
                    ) : (
                      <button onClick={()=>{setNuevoItemEtapa(etapa.id);setNuevoItemTexto("");}}
                        style={{marginTop:8,width:"100%",padding:"8px",background:"none",border:"1.5px dashed #cbd5e1",borderRadius:8,color:"#94a3b8",cursor:"pointer",fontSize:13}}>
                        + Agregar ítem
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalItem && canEdit && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"flex-end",zIndex:100}}
          onClick={e=>{if(e.target===e.currentTarget)setModalItem(null);}}>
          <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"24px 20px 36px",width:"100%",maxHeight:"88vh",overflowY:"auto",boxSizing:"border-box"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:16,color:"#1e293b",flex:1}}>{modalItem.item.tarea}</div>
              <button onClick={()=>setModalItem(null)} style={{background:"#f1f5f9",border:"none",borderRadius:99,width:32,height:32,cursor:"pointer",fontSize:16}}>✕</button>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:600,color:"#64748b",marginBottom:8}}>ESTADO</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Object.entries(ESTADO_CONFIG).map(([k,v])=>(
                  <button key={k} onClick={()=>updateItem(modalItem.etapaId,modalItem.item.id,{estado:k})}
                    style={{padding:"6px 14px",borderRadius:99,border:`2px solid ${modalItem.item.estado===k?v.color:"#e2e8f0"}`,background:modalItem.item.estado===k?v.bg:"#fff",color:modalItem.item.estado===k?v.color:"#64748b",fontWeight:600,fontSize:13,cursor:"pointer"}}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:600,color:"#64748b",marginBottom:6}}>COMENTARIO / OBSERVACIÓN</div>
              <textarea value={modalItem.item.comentario}
                onChange={e=>updateItem(modalItem.etapaId,modalItem.item.id,{comentario:e.target.value})}
                placeholder="Agregar nota u observación..."
                style={{width:"100%",padding:"10px",borderRadius:10,border:"1.5px solid #e2e8f0",fontSize:14,resize:"vertical",minHeight:80,boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:600,color:"#64748b",marginBottom:6}}>FOTO EVIDENCIA</div>
              {modalItem.item.foto ? (
                <div>
                  <img src={modalItem.item.foto} alt="evidencia" style={{width:"100%",borderRadius:10,maxHeight:200,objectFit:"cover"}}/>
                  <button onClick={()=>updateItem(modalItem.etapaId,modalItem.item.id,{foto:null})}
                    style={{marginTop:8,background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontWeight:600}}>
                    Eliminar foto
                  </button>
                </div>
              ) : (
                <button onClick={()=>fileRef.current.click()}
                  style={{width:"100%",padding:"14px",border:"2px dashed #cbd5e1",borderRadius:10,background:"#f8fafc",color:"#64748b",cursor:"pointer",fontSize:14}}>
                  📷 Subir foto
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}}
                onChange={e=>handleFoto(e,modalItem.etapaId,modalItem.item.id)}/>
            </div>
            {canAdmin && (
              <button onClick={()=>deleteItem(modalItem.etapaId,modalItem.item.id)}
                style={{width:"100%",padding:"12px",background:"#fff",border:"2px solid #fee2e2",borderRadius:10,color:"#dc2626",fontWeight:700,cursor:"pointer",fontSize:14}}>
                🗑️ Eliminar ítem
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}