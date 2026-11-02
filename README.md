# 🍔 Appetic

**El sistema del negocio de comida en una sola app.** Menú con pedidos al WhatsApp, domicilios, meseros y cocina, y las cuentas del negocio. Bogotá. La propuesta comercial vigente está en [`propuesta/propuesta-appetic.html`](propuesta/propuesta-appetic.html).

- **Stack:** Vite + React + Firebase (Blaze) · PWA instalable · despliegue en Vercel.
- **Planeación completa:** ver [`PLANEACION.md`](PLANEACION.md) (40+ decisiones).

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
