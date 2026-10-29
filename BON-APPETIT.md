# 🍕🔥 Bon Appétit — Pizza y parrilla

Local integrado en Appetic igual que los demás. Calle 70 # 50-15 Sur, Sierra Morena · WhatsApp
320 475 3619. Su carta impresa dice «boon appetit» y trae el wordmark viejo «La Mies»; el nombre
correcto es **Bon Appétit**.

---

## ✅ Qué ya está hecho

- **Código del local** en `src/dev/bonAppetit.js` (fuente única) + registrado en la vista previa
  (`src/preview.js`) y con su script de alta (`scripts/seed-bon-appetit.mjs`).
- **70 productos** en **9 categorías**, sacados de las 9 páginas de su carta:
  🍕 Pizzas (13) · 🍔 Hamburguesas (15) · 🌭 Perros (7) · 🍟 Salchipapas (9) · 🍌 Patacones (3) ·
  🌯 Mazorcada y Burrito (2) · 🍽️ Platos Fuertes (12) · 🥩 Tablas y Parrilla (7) · 🧃 Jugos y Limonadas (2)
- **Estética sacada de su carta:** naranja `#EC7A0E` (los títulos), acento verde bosque `#2F6B4A`
  (el wordmark) sobre crema pergamino `#F7EDD8` (el fondo de la carta).
- **WhatsApp real** del local (el de la carta): los pedidos le llegan directo.
- **Prompts de imágenes** (banner, logo opcional y los 70 productos) en
  `public/locales/bon-appetit/PROMPTS.md`.
- Abierto 24 h para probar. **Correo administrador:** `sinfiniity@gmail.com` (provisional).

## ⏳ Pendiente

- **Logo:** aún no hay. La app muestra la inicial «B». Cuando llegue → `public/locales/bon-appetit/logo.webp`
  (transparente) y `logo:` en el archivo de datos.
- **Fotos y banner:** las sube el dueño desde su panel.
- **Gmail del dueño** para el panel (hoy entra `sinfiniity@gmail.com`).
- **Confirmar con el dueño** el cobro de la pizza mitad y mitad (ver abajo).

---

## 🧩 Cómo se modeló la carta

| En la carta impresa | En la app |
|---|---|
| Hamburguesas y perros «SOLA $X · CON PAPAS $Y» | Grupo **Presentación** (elige 1): *Sola* o *Con papas*, que suma la diferencia exacta. |
| Ranchera: «proteína de su elección (res, pollo, cerdo; apanado +$3.000)» | Elige 1 proteína; el apanado suma $3.000. |
| Doble / Tres Carnes: «2 / 3 proteínas de elección» | Un grupo por proteína (se puede repetir, p. ej. res + res). |
| Perros «(cebolla opcional)» | Elige *con* o *sin cebolla*, para que la cocina lo vea en el pedido. |
| Tres listas de «ADICCIONES» distintas | Cada sección lleva SU lista: hamburguesas/perros (7), salchipapas/mazorcada/burrito/alitas (9), patacones (4). |
| Pizzas «rueda de 4 porciones · máximo 2 sabores mitad y mitad» | Cada pizza ofrece «¿Mitad y mitad?» con el otro sabor. **Se cobra la mitad más cara** (si la otra es más cara, suma la diferencia). ⚠️ Confirmar con el dueño. |
| Platos fuertes «papa a la francesa o criolla … ensalada o guacamole» | Elige papa y elige ensalada o guacamole (obligatorios). |
| Jugos «en agua $5.000 / en leche $6.500» × 6 frutas | **Un** producto: eliges preparación y fruta. Limonadas: un producto con sus 4 tipos. |
| Alitas BBQ aparece dos veces en la carta | Una sola vez, en Tablas y Parrilla. |

---

## 👀 Probarlo (vista previa, sin base de datos)

`/bon-appetit?preview=1` — arma el menú desde el código, no recibe pedidos reales.

## 🌱 Dejarlo funcionando de verdad

1. Desplegar (sube el código a Vercel).
2. Sembrar en Firebase desde este PC: `node scripts/seed-bon-appetit.mjs`
3. Queda con `suscripcion.activa: false` (no sale en el buscador del inicio) hasta que el dueño
   revise su menú y suba logo/fotos. Se enciende con el toggle del panel.

## 📲 Para el dueño

- **Panel:** `/bon-appetit/admin` (con el Gmail que tenga permiso).
- **Fotos:** editar producto → **✨ Crear con IA** (abre Gemini con el prompt listo) o pegando los
  prompts de `PROMPTS.md`; las sube con **📱 Del dispositivo**.
- **📣 Difundir:** su QR para imprimir, el afiche de domicilios (PDF, con su número), el link y un
  mensaje de bienvenida para reenviar por WhatsApp.
