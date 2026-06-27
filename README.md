# 🍔 Appetic

**El menú digital de tu barrio.** Cada negocio de comida tiene su menú con carrito; el cliente arma su pedido y le llega al WhatsApp del local. Bogotá.

- **Stack:** Vite + React + Firebase (Blaze) · PWA instalable · despliegue en Vercel.
- **Planeación completa:** ver [`PLANEACION.md`](PLANEACION.md) (40+ decisiones).
- **Resumen del proyecto:** ver [`RESUMEN-APPETIC.md`](RESUMEN-APPETIC.md).

## Desarrollo

```bash
npm install      # instalar dependencias
npm run dev      # servidor local
npm run build    # build de producción
```

Crea un archivo `.env` (ver `.env.example`) con las claves de Firebase.

## Arquitectura

- **Una sola app multi-local.** Cada local vive en su slug: `appetic.app/su-negocio`.
- **Tema por local:** variables CSS (`--local-*`) que cada negocio "pinta" sobre la base de marca.
- **Costos cuidados:** lecturas mínimas y sin listeners innecesarios (Firebase Blaze).

---
*Estudio ZEVEN · 2026*
