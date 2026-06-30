# MediSupply Backend

Backend ligero para consultar OpenFDA, buscar imagenes en Pexels y normalizar productos medicos para el frontend.

## Configuracion

1. Copia `.env.example` como `.env`.
2. Agrega tu clave de Pexels:

```env
PORT=3000
PEXELS_API_KEY=tu_clave
```

OpenFDA se consulta sin API key.

## Ejecutar

```powershell
cd "C:\Users\Edieth\Documents\Metodologías Agiles\APLICATIVO\backend"
node server.js
```

## Endpoints

```text
GET http://localhost:3000/insumosmed
GET http://localhost:3000/api/products?query=termometro&limit=12
```

La respuesta incluye nombre, descripcion, categoria interna, precio, stock, calificacion e imagen relacionada si existe API key de Pexels.
