# 🔥🪵 Leñita Casera — Restaurante · Parrilla

Local integrado en Appetic igual que los demás. Link: **`/lenita-casera`**.
Material recibido: tres cartas del día (afiches) con la misma estructura en días distintos.

---

## ✅ Qué ya está hecho

- **Código del local** en `src/dev/lenitaCasera.js` (fuente única) + vista previa (`src/preview.js`)
  + script de alta (`scripts/seed-lenita-casera.mjs`).
- **7 productos en 3 categorías:** ⭐ Recomendado del día (1) · 🍛 Almuerzo casero (1) ·
  🔥 Especiales a la leña (5).
- **Piel propia `skin: 'lena'`** (`src/pages/Local/LocalSkinLena.css`), sacada de su logo: cabecera
  de tablones de madera oscura con resplandor de brasa, logo en su letrero, fondo papel kraft,
  títulos en letra de letrero (Alfa Slab One), precios y botones naranja llama.
- **Logo** recortado de su carta (el más limpio de los tres) y mejorado con IA:
  `public/locales/lenita-casera/logo.webp` (en placa) e `icono.webp` (tronco con llama).
- **Prompts de imágenes** (banner + 7 platos) en `public/locales/lenita-casera/PROMPTS.md`.
- Abierto 24 h para probar.

## ⏳ Pendiente (provisional hoy)

- **Precios de los especiales a la leña:** sus cartas NO los traen. Hoy: Leñita $22.000 · Leña
  $26.000 · Leñazo $30.000 · Bondiola $26.000 · Punta de anca $26.000 — **confirmar con el dueño**.
- **Confirmar** que Leñita / Leña / Leñazo se piden en churrasco, pechuga **o** cerdo (su carta
  dice «Especiales a la leña (Churrasco, Pechuga, Cerdo)»).
- **WhatsApp:** va el número por defecto (320 843 5143); los pedidos llegan ahí, **no al local**,
  hasta que el dueño ponga el suyo.
- **Correo administrador:** `sinfiniity@gmail.com` (provisional; entra nuestra cuenta, no la del dueño).
- **Fotos y banner:** las sube el dueño desde su panel.
- Sembrado con `suscripcion.activa: false`: no sale en el buscador del inicio hasta encenderlo.

---

## 🧩 Cómo se modeló la carta

| En la carta | En la app |
|---|---|
| «Almuerzo casero $15.000 \| $16.000 Llevar» con Entrada / Principio / Proteína / Bebida «elegir una» | Un producto con 4 grupos **elige 1** (obligatorios) + **¿Dónde lo comes?**: *Aquí* o *Para llevar* (+$1.000). |
| «Nuestro recomendado» que cambia cada día (Mondongo $20.000 local · $21.000 llevar; otros días bagre en salsa, bistec a caballo) | Un producto «Recomendado del día»: el dueño le cambia nombre, descripción y precio; mismo *¿Dónde lo comes?*. |
| «Especiales a la leña (Churrasco, Pechuga, Cerdo) — acompañado de sopa, fruta o huevo · papa a la francesa · jugo natural o limonada» | Leñita 150 g / Leña 200 g / Leñazo 250 g: eliges qué va a la leña, el acompañante y la bebida. Bondiola y Punta de anca (cerdo 200 g): acompañante y bebida. |

## 🗓️ El día a día del dueño (panel → 🍽️ Menú)

- **Almuerzo casero:** cada día cambia las opciones de Entrada, Principio, Proteína y Bebida.
- **Recomendado:** le pone el nombre, la descripción y el precio del plato de hoy (y su foto con
  ✨ Crear con IA). El día que no haya, lo marca **Agotado**.

---

## 👀 Probarlo (vista previa, sin base de datos)

`/lenita-casera?preview=1` — arma el menú desde el código, no recibe pedidos reales.

## 🌱 Dejarlo funcionando de verdad

1. Desplegar (sube el código a Vercel).
2. Sembrar en Firebase desde este PC: `node scripts/seed-lenita-casera.mjs`
3. Queda con `suscripcion.activa: false` hasta tener el WhatsApp real y los precios confirmados.
   Se enciende con el toggle del superadmin.

## 📲 Para el dueño

- **Panel:** `/lenita-casera/admin` (con el Gmail que tenga permiso).
- **WhatsApp:** ⚙️ Configuración → Datos del negocio. Ese número es también el de **domicilios**
  del afiche (📣 Difundir), que lo toma solo.
- **Fotos:** editar producto → **✨ Crear con IA** (abre Gemini con el prompt listo) o pegando los
  prompts de `PROMPTS.md`; las sube con **📱 Del dispositivo**. El banner, en el panel → Banner.
- **📣 Difundir:** su QR para imprimir, el afiche de domicilios (PDF, con su número), el link y un
  mensaje de bienvenida para reenviar por WhatsApp.
