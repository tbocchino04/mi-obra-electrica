function items(prefix, list) {
  return list.map((tarea, i) => ({
    id: `${prefix}${i + 1}`, tarea, estado: "pendiente", comentario: "", foto: null,
  }));
}

// ── Tipos de proyecto ──────────────────────────────────────────────
export const TIPOS_PROYECTO = [
  { id: "casa",     label: "Casa" },
  { id: "edificio", label: "Edificio" },
  { id: "local",    label: "Local / Comercio" },
  { id: "reforma",  label: "Reforma" },
];

// ── Rubros ─────────────────────────────────────────────────────────
export const RUBROS = [
  { id: "electrica",     label: "Instalación Eléctrica" },
  { id: "sanitaria",     label: "Instalación Sanitaria" },
  { id: "civil",         label: "Obra Civil" },
  { id: "pintura",       label: "Pintura y Terminaciones" },
  { id: "climatizacion", label: "Climatización" },
];

// ── Templates por rubro ────────────────────────────────────────────
export const TEMPLATES = {

  electrica: [
    { id: "replanteo",    nombre: "1. Replanteo y Trazado", items: items("re", [
      "Relevamiento del plano eléctrico",
      "Marcado de recorridos de cañería",
      "Ubicación de tableros y cajas",
    ])},
    { id: "caneria",      nombre: "2. Cañería y Conductos", items: items("ca", [
      "Instalación de cañería corrugada / rígida",
      "Colocación de cajas de paso y derivación",
      "Fijación y verificación de recorridos",
    ])},
    { id: "conductores",  nombre: "3. Conductores", items: items("co", [
      "Pasaje de cables fase, neutro y tierra",
      "Identificación y etiquetado de conductores",
      "Verificación de secciones según plano",
    ])},
    { id: "tablero",      nombre: "4. Tablero Eléctrico", items: items("ta", [
      "Montaje de gabinete y tablero",
      "Instalación de termomagnéticas y disyuntores",
      "Conexión de circuitos al tablero",
      "Rotulado de circuitos",
    ])},
    { id: "bocas",        nombre: "5. Bocas y Artefactos", items: items("bo", [
      "Colocación de tomas e interruptores",
      "Instalación de luminarias",
      "Conexión de equipos especiales (AC, calefón, etc.)",
    ])},
    { id: "pruebas",      nombre: "6. Pruebas y Mediciones", items: items("pr", [
      "Medición de aislación de conductores",
      "Prueba de continuidad y puesta a tierra",
      "Verificación de disyuntores y diferencial",
      "Prueba de funcionamiento general",
    ])},
  ],

  sanitaria: [
    { id: "s_replanteo",  nombre: "1. Replanteo", items: items("sr", [
      "Marcado de puntos de agua fría y caliente",
      "Marcado de desagües y cotas de piso",
      "Verificación de pendientes",
      "Aprobación de plano",
    ])},
    { id: "s_desague",    nombre: "2. Desagüe Cloacal", items: items("sd", [
      "Apertura de zanjas y rozas",
      "Tendido de tuberías de desagüe",
      "Conexión a columnas o cloaca municipal",
      "Prueba de estanqueidad",
    ])},
    { id: "s_agua",       nombre: "3. Agua Fría y Caliente", items: items("sa", [
      "Tendido de cañerías",
      "Colocación de válvulas de corte",
      "Aislación térmica en cañerías calientes",
      "Prueba de presión hidráulica",
    ])},
    { id: "s_artefactos", nombre: "4. Artefactos Sanitarios", items: items("saf", [
      "Colocación de inodoros",
      "Colocación de lavabos y piletas",
      "Colocación de duchas y bañeras",
      "Conexiones y sellados finales",
    ])},
    { id: "s_prueba",     nombre: "5. Prueba General", items: items("sp", [
      "Prueba de funcionamiento completo",
      "Control de caudales y presiones",
      "Verificación de pérdidas",
      "Entrega de documentación",
    ])},
  ],

  civil: [
    { id: "oc_replanteo", nombre: "1. Replanteo y Nivelación", items: items("ocr", [
      "Nivelación del terreno",
      "Trazado de ejes y cuadrícula",
      "Verificación de linderos",
      "Aprobación municipal",
    ])},
    { id: "oc_fundacion", nombre: "2. Fundaciones", items: items("ocf", [
      "Excavación",
      "Armado de bases y vigas de fundación",
      "Hormigonado",
      "Curado del hormigón",
    ])},
    { id: "oc_estructura",nombre: "3. Estructura", items: items("oce", [
      "Armado y encofrado de columnas",
      "Armado y encofrado de vigas",
      "Hormigonado de losa",
      "Desencofrado y control de calidad",
    ])},
    { id: "oc_mamp",      nombre: "4. Mampostería", items: items("ocm", [
      "Construcción de muros",
      "Control de plomada y nivel",
      "Colocación de dinteles y jambas",
      "Revoque grueso",
    ])},
    { id: "oc_cubierta",  nombre: "5. Cubierta", items: items("occ", [
      "Estructura de techo",
      "Aislación hidrófuga",
      "Cubierta final",
      "Bajadas pluviales",
    ])},
    { id: "oc_term",      nombre: "6. Terminaciones", items: items("oct", [
      "Revoque fino interior",
      "Contrapisos y carpetas",
      "Inspección final municipal",
    ])},
  ],

  pintura: [
    { id: "p_prep",       nombre: "1. Preparación de Superficies", items: items("pp", [
      "Limpieza y desengrase",
      "Reparación de fisuras y agujeros",
      "Lijado general",
      "Imprimación",
    ])},
    { id: "p_techos",     nombre: "2. Techos Interiores", items: items("pt", [
      "Enduído de techos",
      "Primera mano",
      "Mano de terminación",
      "Inspección y aprobación",
    ])},
    { id: "p_paredes",    nombre: "3. Paredes Interiores", items: items("ppa", [
      "Enduído de paredes",
      "Primera mano",
      "Mano de terminación",
      "Pintura de zócalos y marcos",
    ])},
    { id: "p_exterior",   nombre: "4. Exterior y Fachada", items: items("pe", [
      "Preparación de fachada",
      "Aplicación de hidrófugo",
      "Pintura de terminación exterior",
      "Detalles de aberturas y carpinterías",
    ])},
    { id: "p_entrega",    nombre: "5. Retoques y Entrega", items: items("pre", [
      "Retoque de imperfecciones",
      "Limpieza de vidrios y pisos",
      "Inspección final",
      "Entrega con fotos de cierre",
    ])},
  ],

  climatizacion: [
    { id: "cl_relev",     nombre: "1. Relevamiento y Diseño", items: items("clr", [
      "Medición de ambientes",
      "Cálculo de carga térmica",
      "Selección de equipos",
      "Aprobación de propuesta",
    ])},
    { id: "cl_equipos",   nombre: "2. Instalación de Equipos", items: items("cle", [
      "Fijación de unidades interiores",
      "Fijación de unidades exteriores",
      "Nivelación y anclaje",
    ])},
    { id: "cl_cañerias",  nombre: "3. Cañerías de Refrigerante", items: items("clc", [
      "Tendido de cañerías de cobre",
      "Aislación térmica de cañerías",
      "Conexión a unidades",
      "Prueba de hermeticidad",
    ])},
    { id: "cl_condensado",nombre: "4. Desagüe de Condensados", items: items("cld", [
      "Tendido de cañería de condensados",
      "Conexión a desagüe general",
      "Verificación de pendientes y caudal",
    ])},
    { id: "cl_electrica", nombre: "5. Conexión Eléctrica", items: items("cle2", [
      "Cableado de alimentación",
      "Instalación de llaves de corte",
      "Conexión de mandos y controles remotos",
    ])},
    { id: "cl_puesta",    nombre: "6. Puesta en Marcha", items: items("clp", [
      "Carga de gas refrigerante",
      "Prueba de funcionamiento",
      "Regulación de temperaturas",
      "Entrega de manuales y garantías",
    ])},
  ],
};

// Retrocompatibilidad con obras creadas antes del sistema de rubros
export const ETAPAS_DEFAULT = TEMPLATES.electrica;

export const ESTADO_CONFIG = {
  pendiente:   { label: "Pendiente",   color: "text-ink-400",     bg: "bg-ink-50",       bgDark: "dark:bg-ink-800",  border: "border-ink-300",      dot: "bg-ink-300"  },
  progreso:    { label: "En progreso", color: "text-amber-600",   bg: "bg-amber-50",     bgDark: "dark:bg-amber-950",  border: "border-amber-300",    dot: "bg-amber-400" },
  completado:  { label: "Completado",  color: "text-emerald-600", bg: "bg-emerald-50",   bgDark: "dark:bg-emerald-950", border: "border-emerald-300",  dot: "bg-emerald-500" },
  observacion: { label: "Observación", color: "text-red-500",     bg: "bg-red-50",       bgDark: "dark:bg-red-950",  border: "border-red-300",      dot: "bg-red-400"  },
};

export const ROLES = {
  admin:  { label: "Administrador", desc: "Acceso total" },
  socio:  { label: "Socio",         desc: "Editar estados y comentarios" },
  cliente:{ label: "Cliente",       desc: "Solo lectura · vista de avance" },
};

export const PINES = { admin: "1234", socio: "5678" };
