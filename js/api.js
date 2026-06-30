/* ============================================================
   MEDISUPPLY — API & SHARED DATA
   Imágenes: Unsplash CDN — fotos médicas reales por producto
   Categorías: dinámicas (localStorage + defaults)
   Stock: incluido en cada producto
   ============================================================ */

/** Categorías base del sistema (nunca se eliminan) */
const DEFAULT_CATEGORY_INFO = {
  diagnostico:  { name: 'Diagnóstico',    icon: '🩺', color: '#0A84FF' },
  medicamentos: { name: 'Medicamentos',   icon: '💊', color: '#30D158' },
  curaciones:   { name: 'Curaciones',     icon: '🩹', color: '#FF6B6B' },
  proteccion:   { name: 'Protección EPP', icon: '🧤', color: '#FFD93D' },
  laboratorio:  { name: 'Laboratorio',    icon: '🔬', color: '#A855F7' },
  hospitalario: { name: 'Hospitalario',   icon: '🛏️', color: '#F97316' },
};

/** Carga categorías desde localStorage (fusiona con defaults) */
function loadCategories() {
  try {
    const stored = localStorage.getItem('medisupply-categories');
    const extra  = stored ? JSON.parse(stored) : {};
    return { ...DEFAULT_CATEGORY_INFO, ...extra };
  } catch {
    return { ...DEFAULT_CATEGORY_INFO };
  }
}

/** CATEGORY_INFO dinámico — actualizado por el Admin */
let CATEGORY_INFO = loadCategories();

/** Recarga categorías desde storage (llamar después de edits en Admin) */
function refreshCategories() {
  CATEGORY_INFO = loadCategories();
}

/* ───────────────────────────────────────────────────────────
   Imágenes médicas reales de Unsplash CDN (sin API key)
─────────────────────────────────────────────────────────── */
const PRODUCT_IMAGES = {
  1:  'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=500&q=80&fit=crop',
  2:  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&q=80&fit=crop',
  3:  'https://images.unsplash.com/photo-1631815589068-dc9eda750281?w=500&q=80&fit=crop',
  4:  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80&fit=crop',
  5:  'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500&q=80&fit=crop',
  6:  'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&q=80&fit=crop',
  7:  'https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&q=80&fit=crop',
  8:  'https://images.unsplash.com/photo-1576671081837-49000212a489?w=500&q=80&fit=crop',
  9:  'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&q=80&fit=crop',
  10: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&q=80&fit=crop',
  11: 'https://images.unsplash.com/photo-1612776572997-76cc42e058c3?w=500&q=80&fit=crop',
  12: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=500&q=80&fit=crop',
  13: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500&q=80&fit=crop',
  14: 'https://images.unsplash.com/photo-1588776814546-1ffbb172b93b?w=500&q=80&fit=crop',
  15: 'https://images.unsplash.com/photo-1583947582886-f1ec78aebe5b?w=500&q=80&fit=crop',
  16: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=500&q=80&fit=crop',
  17: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=500&q=80&fit=crop',
  18: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500&q=80&fit=crop',
  19: 'https://images.unsplash.com/photo-1619967750867-1e1a26f42df5?w=500&q=80&fit=crop',
  20: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&q=80&fit=crop',
};

/**
 * Catálogo de 20 insumos médicos con stock individual.
 * stock > 15 → En stock · stock 1-15 → Pocas unidades · stock 0 → Agotado
 */
const MEDICAL_PRODUCTS_DATA = [
  /* ──── Diagnóstico ──── */
  { id: 1,  category: 'diagnostico',  price: 185.99, stock: 25,
    name: 'Estetoscopio Duplex 3M Littmann Classic III',
    description: 'Estetoscopio de alta calidad con membrana de doble frecuencia para auscultar sonidos cardíacos y pulmonares con máxima claridad. Diafragma de 44 mm, tubo PVC de 69 cm. Incluye estuche de transporte y membrana de repuesto certificada.' },
  { id: 2,  category: 'diagnostico',  price: 62.50,  stock: 18,
    name: 'Tensiómetro Digital de Brazo OMRON M3',
    description: 'Monitor de presión arterial automático con detector de arritmia integrado. Memoria para 60 mediciones, pantalla LCD grande con retroiluminación. Manguito universal talla M-L. Validado clínicamente según protocolo ESH/ESC.' },
  { id: 3,  category: 'diagnostico',  price: 45.00,  stock: 32,
    name: 'Termómetro Infrarrojo Sin Contacto Pro',
    description: 'Termómetro clínico sin contacto con respuesta en 1 segundo. Rango 32°C–43°C, alarma de fiebre con código de color tricolor, retroiluminación LED y memoria de 30 lecturas. Apto para todas las edades.' },
  { id: 4,  category: 'diagnostico',  price: 28.75,  stock: 4,
    name: 'Oxímetro de Pulso Portátil OLED',
    description: 'Medidor de saturación de oxígeno (SpO2) y frecuencia cardíaca de alta precisión con display OLED a color. Rotación en 4 direcciones, alarma audible, batería AAA incluida. Ideal para uso clínico y domiciliario.' },
  /* ──── Medicamentos ──── */
  { id: 5,  category: 'medicamentos', price: 8.99,   stock: 120,
    name: 'Paracetamol 500 mg (100 tabletas)',
    description: 'Analgésico y antipirético de uso general. Indicado para el alivio de dolor leve a moderado (cefalea, odontalgias, mialgias) y reducción de fiebre. Tabletas recubiertas de 500 mg. Fabricado bajo estándar GMP certificado.' },
  { id: 6,  category: 'medicamentos', price: 15.50,  stock: 0,
    name: 'Amoxicilina 500 mg (30 cápsulas)',
    description: 'Antibiótico de amplio espectro del grupo de las penicilinas semisintéticas. Efectivo contra infecciones bacterianas del sistema respiratorio, urinario y tejidos blandos. Requiere prescripción médica. Certificado FDA e INVIMA.' },
  { id: 7,  category: 'medicamentos', price: 10.25,  stock: 85,
    name: 'Ibuprofeno 400 mg (50 tabletas)',
    description: 'Antiinflamatorio no esteroideo (AINE) con propiedades analgésicas, antipiréticas y antiinflamatorias de amplio espectro. Indicado para dolor muscular, articular, cefalea y fiebre. Recubierto para protección gástrica.' },
  { id: 8,  category: 'medicamentos', price: 6.75,   stock: 67,
    name: 'Sales de Rehidratación Oral OMS (6 sobres)',
    description: 'Sales de rehidratación oral formuladas según los estándares de la OMS. Contiene cloruro de sodio, cloruro de potasio, citrato trisódico y glucosa. Ideal para diarrea, vómito o ejercicio intenso.' },
  /* ──── Curaciones ──── */
  { id: 9,  category: 'curaciones',   price: 12.00,  stock: 200,
    name: 'Gasas Estériles 10 × 10 cm (50 unidades)',
    description: 'Gasas de tejido abierto estéril en presentación individual hermética. Para cubrir y proteger heridas, úlceras y quemaduras. Material 100 % algodón de alta absorción, libres de látex. Esterilizadas por rayos gamma.' },
  { id: 10, category: 'curaciones',   price: 18.50,  stock: 3,
    name: 'Jeringas Desechables 5 ml con Aguja (100 u)',
    description: 'Jeringas estériles de un solo uso con aguja 21G × 1.5 pulgadas ensamblada. Émbolo de goma silicona, graduación estampada a 0.2 ml, conexión luer-lock. Certificadas ISO 13485 y aprobadas CE.' },
  { id: 11, category: 'curaciones',   price: 24.99,  stock: 15,
    name: 'Apósito Hidrocoloide Avanzado 10 × 10 cm (5 u)',
    description: 'Apósito de curación avanzada para heridas crónicas de difícil cicatrización. Crea microambiente húmedo óptimo, absorbe exudado y protege de infección bacteriana externa. Pack de 5 unidades.' },
  { id: 12, category: 'curaciones',   price: 4.50,   stock: 45,
    name: 'Cinta Médica Micropore 2.5 cm × 9.1 m',
    description: 'Cinta adhesiva no tejida de papel microporo para fijación de vendajes, sondas y apósitos. Hipoalergénica, transpirable, se retira sin dolor. Resistente a la humedad. Rollo de 9.1 metros.' },
  /* ──── Protección EPP ──── */
  { id: 13, category: 'proteccion',   price: 22.00,  stock: 52,
    name: 'Guantes de Nitrilo sin Polvo Talla M (100 u)',
    description: 'Guantes desechables de nitrilo de alta calidad, sin polvo, ambidextros. Resistencia química superior al látex. Yemas texturizadas para mayor agarre. Sin proteínas alergénicas. Certificados CE Cat III.' },
  { id: 14, category: 'proteccion',   price: 15.99,  stock: 0,
    name: 'Mascarillas KN95 de 5 Capas (20 unidades)',
    description: 'Mascarilla de protección respiratoria con eficiencia de filtración ≥ 95 % para partículas de 0.3 µm. 5 capas con capa de fusión soplada, ajuste nasal moldeable y elásticos ajustables. Certificada CE y EN149.' },
  { id: 15, category: 'proteccion',   price: 35.00,  stock: 30,
    name: 'Batas Desechables SMS 40 g/m² (10 unidades)',
    description: 'Batas de protección SMS (Spunbond-Meltblown-Spunbond) de 40 g/m². Manga larga con elástico en puño, cierre velcro en espalda. Talla universal. Libres de látex. Nivel barrera 2 según EN 13795.' },
  /* ──── Laboratorio ──── */
  { id: 16, category: 'laboratorio',  price: 19.99,  stock: 5,
    name: 'Tubos Cónicos de Polipropileno 15 ml (50 u)',
    description: 'Tubos de 15 ml de polipropileno grado médico con tapa de rosca de silicona hermética. Fondo cónico para máxima recuperación de muestra. Autoclavables a 121°C. Aptos para centrifugadora hasta 18 000 × g.' },
  { id: 17, category: 'laboratorio',  price: 320.00, stock: 7,
    name: 'Microscopio Binocular LED 40–1000×',
    description: 'Microscopio óptico binocular con iluminación LED de 3 W regulable. Objetivos acromáticos 4×/10×/40×/100× (inmersión en aceite), oculares WF 10×. Cabezal inclinado 30°, giratorio 360°. Incluye aceite de inmersión.' },
  { id: 18, category: 'laboratorio',  price: 16.75,  stock: 44,
    name: 'Tiras Reactivas para Glucosa (50 unidades)',
    description: 'Tiras reactivas para glucosa en sangre capilar y plasma venoso. Resultados en 5 segundos, rango 20–600 mg/dL. Compatibles con la mayoría de glucómetros. Código QR para calibración automática.' },
  /* ──── Hospitalario ──── */
  { id: 19, category: 'hospitalario', price: 285.00, stock: 4,
    name: 'Silla de Ruedas Estándar Plegable Acero',
    description: 'Silla de ruedas de acero inoxidable plegable (15.5 kg). Asiento de 46 cm con cojín lavable. Ruedas traseras macizas 24" con frenos, delanteras 8". Reposapiés y apoyabrazos desmontables. Cap. 120 kg.' },
  { id: 20, category: 'hospitalario', price: 42.00,  stock: 12,
    name: 'Muletas Axilares de Aluminio (Par)',
    description: 'Par de muletas axilares de aluminio anodizado ultraligero (0.9 kg c/u). Altura total ajustable 115–157 cm, empuñadura 71–96 cm. Grip ergonómico antideslizante. Contera base ancha tipo trípode.' },
];

/* ─────────────────────────────────────────────────────────
   getFallbackImage — imagen de respaldo por categoría
───────────────────────────────────────────────────────── */
function getFallbackImage(product) {
  const colors = {
    diagnostico: '0A84FF', medicamentos: '30D158', curaciones: 'FF6B6B',
    proteccion: 'EAB308', laboratorio: 'A855F7', hospitalario: 'F97316',
  };
  const bg   = colors[product.category] || '0A84FF';
  const icon = encodeURIComponent(CATEGORY_INFO[product.category]?.icon || '🏥');
  return `https://placehold.co/500x500/${bg}/FFFFFF?text=${icon}`;
}

/* ─────────────────────────────────────────────────────────
   fetchMedicalProducts — asigna imágenes Unsplash a los productos
───────────────────────────────────────────────────────── */
async function fetchMedicalProducts() {
  const products = MEDICAL_PRODUCTS_DATA.map(p => ({
    ...p,
    image:     PRODUCT_IMAGES[p.id] || getFallbackImage(p),
    apiSource: 'unsplash',
  }));
  console.info(`✅ MediSupply: ${products.length} productos listos (imágenes Unsplash CDN)`);
  return products;
}

/* ─────────────────────────────────────────────────────────
   showToast  (utilidad global)
───────────────────────────────────────────────────────── */
function showToast(message, type = 'info', durationMs = 3200) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast     = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  const remove = () => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };
  const tid = setTimeout(remove, durationMs);
  toast.addEventListener('click', () => { clearTimeout(tid); remove(); });
}
