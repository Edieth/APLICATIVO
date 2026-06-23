/* ============================================================
   MEDISUPPLY — API & SHARED DATA
   Imágenes: Unsplash CDN — fotos médicas reales por producto
   Datos: Catálogo propio de insumos médicos (nombres, precios,
          descripciones y categorías 100 % médicos)
   ============================================================ */

/** Category metadata */
const CATEGORY_INFO = {
  diagnostico:  { name: 'Diagnóstico',    icon: '🩺', color: '#0A84FF' },
  medicamentos: { name: 'Medicamentos',   icon: '💊', color: '#30D158' },
  curaciones:   { name: 'Curaciones',     icon: '🩹', color: '#FF6B6B' },
  proteccion:   { name: 'Protección EPP', icon: '🧤', color: '#FFD93D' },
  laboratorio:  { name: 'Laboratorio',    icon: '🔬', color: '#A855F7' },
  hospitalario: { name: 'Hospitalario',   icon: '🛏️', color: '#F97316' },
};

/**
 * Imágenes médicas reales de Unsplash (CDN público, sin API key).
 * Cada ID corresponde a una foto verificada y relevante para el producto.
 * Formato: https://images.unsplash.com/photo-{ID}?w=500&q=80&fit=crop
 */
const PRODUCT_IMAGES = {
  /* Diagnóstico */
  1:  'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=500&q=80&fit=crop',  // estetoscopio
  2:  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&q=80&fit=crop',  // tensiómetro brazo
  3:  'https://images.unsplash.com/photo-1631815589068-dc9eda750281?w=500&q=80&fit=crop',  // termómetro infrarrojo
  4:  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80&fit=crop',  // oxímetro de pulso

  /* Medicamentos */
  5:  'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500&q=80&fit=crop',  // tabletas paracetamol
  6:  'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&q=80&fit=crop',  // cápsulas antibiótico
  7:  'https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&q=80&fit=crop',  // tabletas ibuprofeno
  8:  'https://images.unsplash.com/photo-1576671081837-49000212a489?w=500&q=80&fit=crop',  // medicamento polvo

  /* Curaciones */
  9:  'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&q=80&fit=crop',  // gasas médicas
  10: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&q=80&fit=crop',  // jeringas desechables
  11: 'https://images.unsplash.com/photo-1612776572997-76cc42e058c3?w=500&q=80&fit=crop',  // apósito / vendaje
  12: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=500&q=80&fit=crop',  // cinta médica micropore

  /* Protección EPP */
  13: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500&q=80&fit=crop',  // guantes nitrilo
  14: 'https://images.unsplash.com/photo-1588776814546-1ffbb172b93b?w=500&q=80&fit=crop',  // mascarilla KN95
  15: 'https://images.unsplash.com/photo-1583947582886-f1ec78aebe5b?w=500&q=80&fit=crop',  // bata médica desechable

  /* Laboratorio */
  16: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=500&q=80&fit=crop',  // tubos de ensayo
  17: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=500&q=80&fit=crop',  // microscopio laboratorio
  18: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500&q=80&fit=crop',  // tiras reactivas glucosa

  /* Hospitalario */
  19: 'https://images.unsplash.com/photo-1619967750867-1e1a26f42df5?w=500&q=80&fit=crop',  // silla de ruedas
  20: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&q=80&fit=crop',  // muletas aluminio
};

/**
 * Medical products catalog — 20 productos médicos reales.
 * Las imágenes provienen de Unsplash CDN (API pública de imágenes).
 */
const MEDICAL_PRODUCTS_DATA = [
  /* ──── Diagnóstico ──── */
  {
    id: 1, category: 'diagnostico', price: 185.99,
    name: 'Estetoscopio Duplex 3M Littmann Classic III',
    description: 'Estetoscopio de alta calidad con membrana de doble frecuencia para auscultar sonidos cardíacos y pulmonares con máxima claridad. Diafragma de 44 mm, tubo PVC de 69 cm. Incluye estuche de transporte y membrana de repuesto certificada.'
  },
  {
    id: 2, category: 'diagnostico', price: 62.50,
    name: 'Tensiómetro Digital de Brazo OMRON M3',
    description: 'Monitor de presión arterial automático con detector de arritmia integrado. Memoria para 60 mediciones, pantalla LCD grande con retroiluminación. Manguito universal talla M-L. Aprobado CE y validado clínicamente según protocolo ESH/ESC.'
  },
  {
    id: 3, category: 'diagnostico', price: 45.00,
    name: 'Termómetro Infrarrojo Sin Contacto Pro',
    description: 'Termómetro clínico sin contacto con respuesta en 1 segundo. Rango 32°C–43°C, alarma de fiebre con código de color tricolor (verde/naranja/rojo), retroiluminación LED y memoria de 30 lecturas. Apto para todas las edades.'
  },
  {
    id: 4, category: 'diagnostico', price: 28.75,
    name: 'Oxímetro de Pulso Portátil OLED',
    description: 'Medidor de saturación de oxígeno (SpO2) y frecuencia cardíaca de alta precisión con display OLED a color. Rotación de pantalla en 4 direcciones, alarma audible ajustable, batería AAA incluida. Ideal para uso clínico y domiciliario.'
  },
  /* ──── Medicamentos ──── */
  {
    id: 5, category: 'medicamentos', price: 8.99,
    name: 'Paracetamol 500 mg (100 tabletas)',
    description: 'Analgésico y antipirético de uso general. Indicado para el alivio de dolor leve a moderado (cefalea, odontalgias, mialgias) y reducción de fiebre. Tabletas recubiertas de 500 mg. Fabricado bajo estándar GMP certificado.'
  },
  {
    id: 6, category: 'medicamentos', price: 15.50,
    name: 'Amoxicilina 500 mg (30 cápsulas)',
    description: 'Antibiótico de amplio espectro del grupo de las penicilinas semisintéticas. Efectivo contra infecciones bacterianas del sistema respiratorio, urinario y tejidos blandos. Requiere prescripción médica. Certificado FDA e INVIMA.'
  },
  {
    id: 7, category: 'medicamentos', price: 10.25,
    name: 'Ibuprofeno 400 mg (50 tabletas)',
    description: 'Antiinflamatorio no esteroideo (AINE) con propiedades analgésicas, antipiréticas y antiinflamatorias de amplio espectro. Indicado para dolor muscular, articular, cefalea y procesos febriles. Recubierto para protección gástrica.'
  },
  {
    id: 8, category: 'medicamentos', price: 6.75,
    name: 'Sales de Rehidratación Oral OMS (6 sobres)',
    description: 'Sales de rehidratación oral formuladas según los estándares de la Organización Mundial de la Salud. Cada sobre contiene cloruro de sodio, cloruro de potasio, citrato trisódico y glucosa. Ideal para diarrea, vómito o ejercicio intenso.'
  },
  /* ──── Curaciones ──── */
  {
    id: 9, category: 'curaciones', price: 12.00,
    name: 'Gasas Estériles 10 × 10 cm (50 unidades)',
    description: 'Gasas de tejido abierto estéril en presentación individual hermética. Indicadas para cubrir y proteger heridas, úlceras y quemaduras. Material 100 % algodón de alta absorción, libres de látex y alérgenos. Esterilizadas por rayos gamma.'
  },
  {
    id: 10, category: 'curaciones', price: 18.50,
    name: 'Jeringas Desechables 5 ml con Aguja (100 u)',
    description: 'Jeringas estériles de un solo uso con aguja 21G × 1.5 pulgadas ensamblada. Émbolo de goma silicona de deslizamiento suave, graduación estampada a 0.2 ml, conexión luer-lock. Certificadas ISO 13485 y aprobadas CE.'
  },
  {
    id: 11, category: 'curaciones', price: 24.99,
    name: 'Apósito Hidrocoloide Avanzado 10 × 10 cm (5 u)',
    description: 'Apósito de curación avanzada para heridas crónicas de difícil cicatrización. Crea microambiente húmedo óptimo, absorbe exudado y protege de infección bacteriana externa. Compatible con heridas en fase de granulación y epitelización.'
  },
  {
    id: 12, category: 'curaciones', price: 4.50,
    name: 'Cinta Médica Micropore 2.5 cm × 9.1 m',
    description: 'Cinta adhesiva no tejida de papel microporo para fijación de vendajes, sondas y apósitos. Hipoalergénica, altamente transpirable, se retira sin dolor ni residuos adhesivos. Resistente a la humedad. Rollo de 9.1 metros.'
  },
  /* ──── Protección EPP ──── */
  {
    id: 13, category: 'proteccion', price: 22.00,
    name: 'Guantes de Nitrilo sin Polvo Talla M (100 u)',
    description: 'Guantes desechables de nitrilo de alta calidad, sin polvo, ambidextros. Resistencia química superior al látex natural. Yemas texturizadas para mayor agarre en superficies húmedas. Sin proteínas alergénicas. Certificados CE Cat III y ASTM D6319.'
  },
  {
    id: 14, category: 'proteccion', price: 15.99,
    name: 'Mascarillas KN95 de 5 Capas (20 unidades)',
    description: 'Mascarilla de protección respiratoria con eficiencia de filtración ≥ 95 % para partículas de 0.3 µm. 5 capas con membrana de fusión soplada, ajuste nasal moldeable de aluminio y elásticos ajustables. Certificada CE y EN149:2001+A1:2009.'
  },
  {
    id: 15, category: 'proteccion', price: 35.00,
    name: 'Batas Desechables SMS 40 g/m² (10 unidades)',
    description: 'Batas de protección de material SMS (Spunbond-Meltblown-Spunbond) de 40 g/m². Manga larga con elástico en puño, cierre de velcro en espalda, cuello redondo. Talla universal. Libres de látex. Nivel de barrera 2 según EN 13795.'
  },
  /* ──── Laboratorio ──── */
  {
    id: 16, category: 'laboratorio', price: 19.99,
    name: 'Tubos Cónicos de Polipropileno 15 ml (50 u)',
    description: 'Tubos de 15 ml de polipropileno grado médico con tapa de rosca de silicona hermética. Fondo cónico para máxima recuperación de muestra. Graduación estampada 1 ml. Autoclavables a 121 °C. Aptos para centrifugadora hasta 18 000 × g.'
  },
  {
    id: 17, category: 'laboratorio', price: 320.00,
    name: 'Microscopio Binocular LED 40–1000×',
    description: 'Microscopio óptico binocular de laboratorio con iluminación LED de 3 W regulable. Objetivos acromáticos planos 4×/10×/40×/100× (inmersión en aceite), oculares WF 10×. Cabezal binocular inclinado 30°, giratorio 360°. Incluye aceite de inmersión.'
  },
  {
    id: 18, category: 'laboratorio', price: 16.75,
    name: 'Tiras Reactivas para Glucosa (50 unidades)',
    description: 'Tiras reactivas para glucosa en sangre capilar y plasma venoso. Resultados en 5 segundos, rango 20–600 mg/dL (1.1–33.3 mmol/L). Compatibles con la mayoría de glucómetros estándar. Código QR para calibración automática. Sensores enzimáticos de alta precisión.'
  },
  /* ──── Hospitalario ──── */
  {
    id: 19, category: 'hospitalario', price: 285.00,
    name: 'Silla de Ruedas Estándar Plegable Acero',
    description: 'Silla de ruedas de acero inoxidable con estructura plegable (15.5 kg). Asiento de 46 cm con cojín acolchado lavable. Ruedas traseras macizas 24 " con frenos de palanca, ruedas delanteras 8 ". Reposapiés y apoyabrazos desmontables. Cap. 120 kg.'
  },
  {
    id: 20, category: 'hospitalario', price: 42.00,
    name: 'Muletas Axilares de Aluminio (Par)',
    description: 'Par de muletas axilares de aluminio anodizado ultraligero (0.9 kg c/u). Altura total ajustable 115–157 cm, empuñadura 71–96 cm. Grip ergonómico de goma antideslizante. Contera base ancha tipo trípode para mayor estabilidad en superficies irregulares.'
  },
];

/* ───────────────────────────────────────────
   getFallbackImage — respaldo por categoría
─────────────────────────────────────────── */
function getFallbackImage(product) {
  const colors = {
    diagnostico:  '0A84FF', medicamentos: '30D158',
    curaciones:   'FF6B6B', proteccion:   'EAB308',
    laboratorio:  'A855F7', hospitalario: 'F97316',
  };
  const bg   = colors[product.category] || '0A84FF';
  const icon = encodeURIComponent(CATEGORY_INFO[product.category]?.icon || '🏥');
  return `https://placehold.co/500x500/${bg}/FFFFFF?text=${icon}`;
}

/* ───────────────────────────────────────────
   fetchMedicalProducts
   Obtiene imágenes médicas de Unsplash CDN (API pública sin clave).
   Los datos de producto (nombre, precio, descripción, categoría)
   son 100 % propios del catálogo MediSupply.
─────────────────────────────────────────── */
async function fetchMedicalProducts() {
  // Verificar conectividad con Unsplash haciendo HEAD a una imagen
  const testUrl = PRODUCT_IMAGES[1];
  let unsplashOk = false;

  try {
    const r = await fetch(testUrl, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
    unsplashOk = r.ok || r.status === 200 || r.type === 'opaque';
  } catch {
    unsplashOk = false;
  }

  const products = MEDICAL_PRODUCTS_DATA.map(p => ({
    ...p,
    image:     PRODUCT_IMAGES[p.id] || getFallbackImage(p),
    apiSource: 'unsplash',
  }));

  if (unsplashOk) {
    console.info(`✅ MediSupply: ${products.length} productos cargados con imágenes de Unsplash CDN`);
  } else {
    console.warn('⚠️ Sin conexión a Unsplash — las imágenes cargarán al tener internet.');
  }

  return products;
}

/* ───────────────────────────────────────────
   showToast  (utilidad global)
─────────────────────────────────────────── */
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
