# 🍔🍨 El Monumento — Frutería-Heladería & Comidas Rápidas

Local integrado en Appetic igual que los demás. Lo especial: **son dos negocios en uno** —
frutería/heladería por un lado y comidas rápidas por el otro—, y la carta impresa trae **una fila
"COMBO" debajo de cada hamburguesa y cada perro**. Eso se resolvió sin llenar el menú de filas
repetidas (ver abajo).

---

## ✅ Qué ya está hecho

- **Código del local** en `src/dev/elMonumento.js` (fuente única) + registrado en la vista previa
  (`src/preview.js`) y con su script de alta (`scripts/seed-el-monumento.mjs`).
- **62 productos** en **12 categorías**, sacados de las 14 fotos de la carta:
  - 🍔 Hamburguesas (9) · 🌭 Perros Calientes (8) · 🍟 Salchipapas · 🥪 Sándwiches (4)
  - 🌯 Burritos y Más (5) · 🍖 Platos Fuertes (2) · 🥞 Crepes
  - 🍉 Ensaladas de Fruta · 🍦 Helados (9) · 🍨 Postres (15) · 🧃 Jugos Naturales · 🍱 Combos (6)
- **Estética propia sacada de su letrero de la calle:** verde brillante `#3FA62E` que degrada a
  verde-limón `#B7E04A`, acento naranja `#F2891C` (el script de "El Monumento") sobre un "mundo"
  crema verde-limón. Distinta a Fruti Tentación (que es azul sobre amarillo).
- **Prompts de imágenes** (incluido el del **LOGO**) en `public/locales/el-monumento/PROMPTS.md`.
- Abierto 24 h para probar. **Correo administrador:** `sinfiniity@gmail.com` (provisional).

---

## 🧩 Cómo se modeló la carta (y por qué)

| En la carta impresa | En la app |
|---|---|
| Cada hamburguesa/perro con su fila **COMBO (papa francesa + gaseosa)** | **Un** producto con el grupo **"Presentación"**: *Sola* o *En combo*, que suma la diferencia exacta de la carta. Ej: Sencilla $5.200 → en combo $10.000. |
| 11 filas de salchipapas | **Un** producto "Salchipapa" y eliges la tuya (Sencilla $6.500 … Pollo-Carne-Cerdo-Chorizo $18.500). |
| 5 filas de crepes / 10 tamaños de ensalada de fruta | **Un** producto con sus opciones de tamaño/relleno. |
| Tabla "Jugos en agua $5.000 / en leche $6.000" × 11 frutas | **Un** producto "Jugo Natural": eliges **fruta** (11) y **preparación** (*en agua* / *en leche* +$1.000). |

Así el menú queda corto y claro en el celular, pero con los **mismos precios** de su carta.

---

## 👀 Probarlo YA (vista previa, sin base de datos)

```
https://TU-DOMINIO/el-monumento?preview=1
```

En local (DEV): `http://localhost:5199/el-monumento?preview=1`

> Carga el menú **desde el código**: sirve para revisar diseño y opciones. En este modo no se
> reciben pedidos reales.

---

## ⚠️ Precios por confirmar con el dueño

La carta está **escrita a mano sobre etiquetas**, con reflejos del plástico. Estos quedaron
**dudosos** — conviene que el dueño los confirme (se cambian en 10 segundos desde el panel, sin
tocar código):

| Producto | Precio que quedó | Por qué la duda |
|---|---|---|
| Hamburguesa Sencilla | $5.200 | El primer dígito podía ser 5 u 8. |
| Sándwich Sencillo | $2.500 | Se lee "$2500" pero es muy bajo frente al resto. |
| Combo de la Doble Queso | +$1.500 | Los demás combos suman $3.500–$4.000. |
| Minnie / Copa Payasito | $5.000 | Reflejo justo encima del número. |
| Super + Pollo | $8.500 | Se puso igual a Super+Carne y Super+Cerdo. |

**No quedaron en el menú** (aparecen tachados o marcados "NO" en la carta): Hamburguesa Junior,
Hamburguesa con Pechuga de Pollo, Perro Sencillo, Sándwich de Cerdo, Costillas BBQ, Lasaña,
Chuleta de Cerdo y Postre de Durazno. Si vuelven a venderlos, se agregan desde el panel.

---

## ✅ El LOGO — ya está montado

Generado con IA a partir del prompt de `PROMPTS.md` y montado en la app:

- `public/locales/el-monumento/logo.webp` — emblema circular **transparente**, 720×688 (98 KB).
  Protagoniza el encabezado del menú (`hero: 'logo'`), flotando sobre el degradado verde-limón.
- `public/locales/el-monumento/icono.webp` — cuadrado 256×256 (24 KB) para el buscador de locales.

> El JPEG que devuelve Gemini trae el **damero de "transparencia" quemado en los píxeles** (JPEG no
> guarda alfa). Se le quitó con flood-fill por conectividad desde los bordes, que respeta los
> blancos encerrados del diseño (el helado, la crema y los contornos blancos del texto).

## 🖼️ Las fotos (las hace el dueño con IA)

Todo está en **`public/locales/el-monumento/PROMPTS.md`**:

- **🏞️ El banner** (la foto grande de su tarjeta en el inicio) y **~30 fotos de platos**.

**Cómo subirlas:** panel → editar producto → **✨ Crear con IA** (abre Gemini con el prompt listo)
o **📱 Del dispositivo**. El banner va en panel → sección Banner.

Mientras no haya fotos, cada tarjeta se ve con su **emoji** y el encabezado con el **degradado
verde** de la marca — se ve bien igual.

---

## 🚀 Para dejarlo funcionando de verdad

1. **Desplegar** (sube el código y los prompts).
2. **Sembrar en Firebase** — en el PC que tenga `scripts/serviceAccount.json`:
   ```bash
   node scripts/seed-el-monumento.mjs
   ```
   Sin esto el local **no existe** en el panel ni en el buscador, aunque el código esté publicado.
3. **Poner el WhatsApp real** del local: panel `/el-monumento/admin` → ⚙️ Configuración → Datos del
   negocio. Ese mismo número es el de **domicilios** del afiche.
4. **Activar la suscripción** desde `/superadmin` para que salga en el buscador del inicio.
   Está en `activa: false` a propósito: si saliera ahora, un cliente pediría y el pedido llegaría al
   número por defecto (320 843 5143), **no al del local**.
5. **Cambiar el correo del admin** por el Gmail real del dueño (en `/superadmin`, campo 👤).

---

## 📣 Cuéntale al dueño la pestaña Difundir

En su panel tiene **📣 Difundir**, ya lista y con su identidad:

- Su **código QR** para imprimir y pegar en el local.
- Un **afiche de domicilios** listo para PDF, con su número (se actualiza solo cuando lo cambie).
- **📢 Publicidad para tus redes** — un botón que arma el prompt (con su nombre, su número y
  sus colores) y abre Gemini para generar una imagen épica anunciando que **ya hace domicilios**,
  lista para Instagram, Facebook o el estado de WhatsApp.
- El **link** de su menú para copiar y pegar.
- Un **mensaje de bienvenida** para reenviar por WhatsApp a sus clientes.
