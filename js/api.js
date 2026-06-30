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
   Integración con openFDA API & Normalización
─────────────────────────────────────────────────────────── */
function getColorHex(category) {
  const colors = {
    diagnostico: '0A84FF',
    medicamentos: '30D158',
    curaciones: 'FF6B6B',
    proteccion: 'EAB308',
    laboratorio: 'A855F7',
    hospitalario: 'F97316',
  };
  return colors[category] || '0A84FF';
}

function normalizeFdaProduct(item, index) {
  const brandName = (item.openfda?.brand_name && item.openfda.brand_name[0]) || '';
  const genericName = (item.openfda?.generic_name && item.openfda.generic_name[0]) || '';
  let name = brandName || genericName || 'Producto médico';
  
  name = name.replace(/\s+/g, ' ').trim();
  
  const description = (item.purpose && item.purpose[0]) ||
                      (item.indications_and_usage && item.indications_and_usage[0]) ||
                      (item.description && item.description[0]) ||
                      (item.warnings && item.warnings[0]) ||
                      'Información clínica disponible en openFDA.';
                      
  const cleanDescription = description.replace(/\s+/g, ' ').trim();
  
  const categoryRules = [
    { id: 'diagnostico', keywords: ['diagnostic', 'monitor', 'meter', 'test', 'oximeter', 'thermometer', 'stethoscope', 'blood pressure', 'glucose'] },
    { id: 'medicamentos', keywords: ['tablet', 'capsule', 'oral', 'injection', 'solution', 'drug', 'medicine', 'antibiotic', 'analgesic', 'suspension', 'cream', 'ointment'] },
    { id: 'curaciones', keywords: ['bandage', 'dressing', 'gauze', 'wound', 'suture', 'tape', 'adhesive', 'sterile pad'] },
    { id: 'proteccion', keywords: ['glove', 'mask', 'respirator', 'gown', 'face shield', 'protective', 'nitrile', 'latex', 'ppe'] },
    { id: 'laboratorio', keywords: ['laboratory', 'tube', 'specimen', 'pipette', 'microscope', 'reagent', 'centrifuge', 'culture'] },
    { id: 'hospitalario', keywords: ['wheelchair', 'bed', 'hospital', 'stretcher', 'crutch', 'walker', 'infusion', 'surgical'] }
  ];
  
  const textToScan = `${name} ${cleanDescription}`.toLowerCase();
  let category = 'hospitalario';
  let maxScore = 0;
  for (const rule of categoryRules) {
    let score = 0;
    for (const keyword of rule.keywords) {
      if (textToScan.includes(keyword)) score++;
    }
    if (score > maxScore) {
      maxScore = score;
      category = rule.id;
    }
  }
  
  const id = (item.openfda?.product_ndc && item.openfda.product_ndc[0]) || item.id || `openfda-${index}`;
  let hash = 0;
  const hashString = `${name}-${id}`;
  for (let i = 0; i < hashString.length; i++) {
    hash = (hash << 5) - hash + hashString.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);
  
  const basePrices = { diagnostico: 42, medicamentos: 11, curaciones: 16, proteccion: 19, laboratorio: 28, hospitalario: 95 };
  const basePrice = basePrices[category] || 25;
  const variation = (hash % 1400) / 100;
  const price = Number((basePrice + variation).toFixed(2));
  
  const stock = hash % 7 === 0 ? 0 : 3 + (hash % 58);
  const rating = Number((3.8 + (hash % 13) / 10).toFixed(1));
  const manufacturer = (item.openfda?.manufacturer_name && item.openfda.manufacturer_name[0]) || 'No especificado';
  
  return {
    id,
    name,
    description: cleanDescription.length > 300 ? cleanDescription.slice(0, 297).trim() + '...' : cleanDescription,
    category,
    price,
    stock,
    rating,
    manufacturer,
    image: `https://placehold.co/500x500/${getColorHex(category)}/FFFFFF?text=${encodeURIComponent(CATEGORY_INFO[category]?.icon || '🏥')}`,
    apiSource: 'openfda-direct'
  };
}

async function fetchMedicalProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/products?limit=24');
    if (!response.ok) throw new Error('Backend error status');
    const data = await response.json();
    if (data && data.products && data.products.length > 0) {
      console.info(`✅ MediSupply: ${data.products.length} productos obtenidos del backend local.`);
      return data.products;
    }
    throw new Error('El backend no retornó productos válidos');
  } catch (error) {
    console.warn('⚠️ No se pudo conectar al backend local o falló. Intentando conectar directamente con openFDA API...', error);
    try {
      const fdaUrl = 'https://api.fda.gov/drug/label.json?search=openfda.brand_name:(medical+OR+health+OR+first+OR+care+OR+drug+OR+cream+OR+ointment)&limit=24';
      const fdaResponse = await fetch(fdaUrl);
      if (!fdaResponse.ok) throw new Error('API oficial de openFDA no responde');
      const fdaData = await fdaResponse.json();
      if (!fdaData.results || fdaData.results.length === 0) {
        throw new Error('La API de openFDA no retornó resultados');
      }
      
      const mapped = fdaData.results.map((item, index) => normalizeFdaProduct(item, index));
      console.info(`✅ MediSupply: ${mapped.length} productos cargados directamente desde la API de openFDA.`);
      return mapped;
    } catch (fdaError) {
      console.error('❌ Error crítico: no se pudo cargar ningún producto de openFDA ni del backend.', fdaError);
      const emergencyFallbacks = [
        { id: 'emergency-1', category: 'medicamentos', price: 9.99, stock: 50, name: 'Paracetamol (Acetaminophen) 500mg', description: 'Alivio temporal de dolores leves y fiebre. (Respaldo sin conexión)', image: 'https://placehold.co/500x500/30D158/FFFFFF?text=💊', rating: 4.5, manufacturer: 'MediSupply Labs' },
        { id: 'emergency-2', category: 'diagnostico', price: 34.50, stock: 12, name: 'Termómetro Digital Clínico', description: 'Lectura rápida de temperatura en 60 segundos. (Respaldo sin conexión)', image: 'https://placehold.co/500x500/0A84FF/FFFFFF?text=🩺', rating: 4.2, manufacturer: 'MediSupply Labs' },
        { id: 'emergency-3', category: 'curaciones', price: 4.99, stock: 80, name: 'Vendas de Gasa Estéril Pack x5', description: 'Vendas suaves de algodón para curaciones. (Respaldo sin conexión)', image: 'https://placehold.co/500x500/FF6B6B/FFFFFF?text=🩹', rating: 4.8, manufacturer: 'MediSupply Labs' }
      ];
      if (typeof showToast === 'function') {
        showToast('⚠️ Sin conexión. Cargando catálogo de emergencia.', 'error');
      }
      return emergencyFallbacks;
    }
  }
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
