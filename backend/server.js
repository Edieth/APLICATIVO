import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildProducts } from './services/catalogService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

loadEnv(join(__dirname, '.env'));

const PORT = Number(process.env.PORT) || 3000;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.method === 'GET' && url.pathname === '/insumosmed') {
      sendJson(res, 200, {
        ok: true,
        service: 'medisupply-backend',
        message: 'API de insumos medicos activa',
        pexelsConfigured: Boolean(PEXELS_API_KEY),
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/products') {
      const query = url.searchParams.get('query') || 'medical supplies';
      const limit = url.searchParams.get('limit') || '12';
      const products = await buildProducts({
        query,
        limit,
        pexelsApiKey: PEXELS_API_KEY,
      });

      sendJson(res, 200, {
        query,
        count: products.length,
        products,
      });
      return;
    }

    sendJson(res, 404, {
      error: 'Ruta no encontrada',
      availableRoutes: ['/insumosmed', '/api/products?query=termometro&limit=12'],
    });
  } catch (error) {
    sendJson(res, 500, {
      error: 'No se pudo procesar la solicitud',
      detail: error.message,
    });
  }
});

server.listen(PORT, () => {
  console.info(`MediSupply backend escuchando en http://localhost:${PORT}`);
  console.info(`Pexels configurado: ${PEXELS_API_KEY ? 'si' : 'no'}`);
});

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload, null, 2));
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function loadEnv(path) {
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith('#')) return;

    const separatorIndex = cleanLine.indexOf('=');
    if (separatorIndex === -1) return;

    const key = cleanLine.slice(0, separatorIndex).trim();
    const value = cleanLine.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^["']|["']$/g, '');
    }
  });
}
