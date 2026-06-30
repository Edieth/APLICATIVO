const OPENFDA_DRUG_LABEL_URL = 'https://api.fda.gov/drug/label.json';
const OPENFDA_DEVICE_510K_URL = 'https://api.fda.gov/device/510k.json';
const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

const CATEGORY_RULES = [
  {
    id: 'diagnostico',
    keywords: [
      'diagnostic',
      'monitor',
      'meter',
      'test',
      'oximeter',
      'thermometer',
      'stethoscope',
      'blood pressure',
      'glucose',
    ],
  },
  {
    id: 'medicamentos',
    keywords: [
      'tablet',
      'capsule',
      'oral',
      'injection',
      'solution',
      'drug',
      'medicine',
      'antibiotic',
      'analgesic',
      'suspension',
    ],
  },
  {
    id: 'curaciones',
    keywords: [
      'bandage',
      'dressing',
      'gauze',
      'wound',
      'suture',
      'tape',
      'adhesive',
      'sterile pad',
    ],
  },
  {
    id: 'proteccion',
    keywords: [
      'glove',
      'mask',
      'respirator',
      'gown',
      'face shield',
      'protective',
      'nitrile',
      'latex',
      'ppe',
    ],
  },
  {
    id: 'laboratorio',
    keywords: [
      'laboratory',
      'tube',
      'specimen',
      'pipette',
      'microscope',
      'reagent',
      'centrifuge',
      'culture',
    ],
  },
  {
    id: 'hospitalario',
    keywords: [
      'wheelchair',
      'bed',
      'hospital',
      'stretcher',
      'crutch',
      'walker',
      'infusion',
      'surgical',
    ],
  },
];

const CATEGORY_BASE_PRICES = {
  diagnostico: 42,
  medicamentos: 11,
  curaciones: 16,
  proteccion: 19,
  laboratorio: 28,
  hospitalario: 95,
};

const CATEGORY_LABELS = {
  diagnostico: 'Diagnostico',
  medicamentos: 'Medicamentos',
  curaciones: 'Curaciones',
  proteccion: 'Proteccion EPP',
  laboratorio: 'Laboratorio',
  hospitalario: 'Hospitalario',
};

export async function buildProducts({ query = 'medical supplies', limit = 12, pexelsApiKey = '' }) {
  const safeLimit = clamp(Number(limit) || 12, 1, 24);
  const searchQuery = translateMedicalQuery(query);
  const [drugResults, deviceResults] = await Promise.allSettled([
    fetchOpenFdaDrugLabels(searchQuery, safeLimit),
    fetchOpenFdaDevices(searchQuery, safeLimit),
  ]);

  const rawProducts = [
    ...(drugResults.status === 'fulfilled' ? drugResults.value : []),
    ...(deviceResults.status === 'fulfilled' ? deviceResults.value : []),
  ];

  const uniqueProducts = dedupeByName(rawProducts).slice(0, safeLimit);

  return Promise.all(
    uniqueProducts.map(async (product, index) => normalizeProduct(product, index, pexelsApiKey))
  );
}

async function fetchOpenFdaDrugLabels(query, limit) {
  const search = [
    `openfda.brand_name:"${query}"`,
    `openfda.generic_name:"${query}"`,
    `purpose:"${query}"`,
    `indications_and_usage:"${query}"`,
  ].join('+OR+');

  const url = `${OPENFDA_DRUG_LABEL_URL}?search=${encodeURIComponent(search)}&limit=${limit}`;
  const data = await fetchJson(url);

  return (data.results || []).map((item) => ({
    sourceType: 'openfda-drug-label',
    name: firstText(item.openfda?.brand_name) || firstText(item.openfda?.generic_name) || 'Producto medico',
    description:
      firstText(item.purpose) ||
      firstText(item.indications_and_usage) ||
      firstText(item.description) ||
      firstText(item.warnings) ||
      'Informacion clinica disponible en OpenFDA.',
    manufacturer: firstText(item.openfda?.manufacturer_name),
    sourceId: firstText(item.openfda?.product_ndc) || item.id,
    rawText: [
      firstText(item.openfda?.brand_name),
      firstText(item.openfda?.generic_name),
      firstText(item.purpose),
      firstText(item.indications_and_usage),
    ].join(' '),
  }));
}

async function fetchOpenFdaDevices(query, limit) {
  const search = [
    `device_name:"${query}"`,
    `applicant:"${query}"`,
    `statement_or_summary:"${query}"`,
  ].join('+OR+');

  const url = `${OPENFDA_DEVICE_510K_URL}?search=${encodeURIComponent(search)}&limit=${limit}`;
  const data = await fetchJson(url);

  return (data.results || []).map((item) => ({
    sourceType: 'openfda-device-510k',
    name: item.device_name || item.trade_name || 'Dispositivo medico',
    description:
      item.statement_or_summary ||
      item.decision_description ||
      item.medical_specialty_description ||
      'Informacion regulatoria disponible en OpenFDA.',
    manufacturer: item.applicant,
    sourceId: item.k_number,
    rawText: [
      item.device_name,
      item.trade_name,
      item.statement_or_summary,
      item.medical_specialty_description,
    ].join(' '),
  }));
}

async function normalizeProduct(product, index, pexelsApiKey) {
  const category = classifyCategory(product);
  const seed = hashText(`${product.name}-${product.sourceId || index}`);
  const image = await findPexelsImage(product.name, category, pexelsApiKey);

  return {
    id: product.sourceId || `openfda-${seed}`,
    name: cleanText(product.name),
    description: trimText(cleanText(product.description), 420),
    category,
    categoryLabel: CATEGORY_LABELS[category],
    image,
    price: calculatePrice(category, seed),
    stock: calculateStock(seed),
    rating: calculateRating(seed),
    manufacturer: cleanText(product.manufacturer || 'No especificado'),
    source: {
      openfda: product.sourceType,
      pexels: Boolean(image),
    },
  };
}

function classifyCategory(product) {
  const text = `${product.name} ${product.description} ${product.rawText}`.toLowerCase();
  const scores = CATEGORY_RULES.map((rule) => ({
    id: rule.id,
    score: rule.keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0),
  }));

  scores.sort((a, b) => b.score - a.score);
  return scores[0].score > 0 ? scores[0].id : 'hospitalario';
}

function translateMedicalQuery(query) {
  const normalized = cleanText(query)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const translations = [
    ['termometro', 'thermometer'],
    ['oximetro', 'oximeter'],
    ['tensiometro', 'blood pressure monitor'],
    ['estetoscopio', 'stethoscope'],
    ['guante', 'medical gloves'],
    ['guantes', 'medical gloves'],
    ['mascarilla', 'medical mask'],
    ['cubrebocas', 'medical mask'],
    ['gasa', 'gauze'],
    ['gasas', 'gauze'],
    ['venda', 'bandage'],
    ['vendas', 'bandage'],
    ['aposito', 'wound dressing'],
    ['apositos', 'wound dressing'],
    ['jeringa', 'syringe'],
    ['jeringas', 'syringe'],
    ['microscopio', 'microscope'],
    ['tubo', 'specimen tube'],
    ['tubos', 'specimen tube'],
    ['silla de ruedas', 'wheelchair'],
    ['muletas', 'crutches'],
    ['medicamento', 'drug'],
    ['medicamentos', 'drug'],
  ];

  const match = translations.find(([spanish]) => normalized.includes(spanish));
  return match ? match[1] : query;
}

async function findPexelsImage(name, category, apiKey) {
  if (!apiKey) return null;

  const categoryQuery = CATEGORY_LABELS[category] || 'medical supplies';
  const searchQuery = `${name} ${categoryQuery} medical`;
  const url = `${PEXELS_SEARCH_URL}?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=square`;
  const data = await fetchJson(url, {
    headers: {
      Authorization: apiKey,
    },
  });

  const photo = data.photos?.[0];
  if (!photo) return null;

  return {
    url: photo.src?.medium || photo.src?.large || photo.url,
    alt: photo.alt || name,
    photographer: photo.photographer,
    sourceUrl: photo.url,
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Error consultando API externa (${response.status}): ${body.slice(0, 180)}`);
  }

  return response.json();
}

function calculatePrice(category, seed) {
  const base = CATEGORY_BASE_PRICES[category] || 25;
  const variation = (seed % 1400) / 100;
  return Number((base + variation).toFixed(2));
}

function calculateStock(seed) {
  return seed % 7 === 0 ? 0 : 3 + (seed % 58);
}

function calculateRating(seed) {
  return Number((3.8 + (seed % 13) / 10).toFixed(1));
}

function dedupeByName(products) {
  const seen = new Set();
  return products.filter((product) => {
    const key = cleanText(product.name).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function firstText(value) {
  if (Array.isArray(value)) return value.find(Boolean) || '';
  return value || '';
}

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function trimText(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trim()}...`;
}

function hashText(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
