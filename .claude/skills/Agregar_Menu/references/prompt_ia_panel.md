# 🎨 "Crear con IA" en el panel — receta del prompt de foto

El panel del dueño (`/<slug>/admin` → editar producto) tiene, junto a **📱 Del dispositivo**, un
botón **✨ Crear con IA** en la **foto del producto** y en cada **opción** (topping/salsa). Al
pulsarlo: arma un **prompt en inglés**, lo **copia al portapapeles** y abre **Gemini**
(`https://gemini.google.com/app`) en pestaña nueva. El dueño pega, genera, **descarga** y sube la
imagen con **📱 Del dispositivo**.

## Dónde vive
- **Receta (este documento).** Es la fuente de la fórmula del prompt.
- **Implementación runtime:** `src/utils/promptIA.js` → `construirPromptImagenIA({ nombre, descripcion, tipo, local })`.
- **Cableado en el panel:** `src/pages/Admin/AdminProductos.jsx` (EditorProducto + OpcionEditor).

> Si cambias la fórmula, edita **este doc Y `promptIA.js` juntos** para que no se desincronicen.

## La fórmula
El prompt es **foto-realista**, describe el ítem y **encaja con los colores del local** (su `tema`):

**Producto (plato/bebida):**
```
Photorealistic professional food photography of "<nombre>" — <descripcion>, freshly made,
appetizing and mouth-watering, natural soft lighting, shallow depth of field, high detail,
sharp focus, <MOOD>, centered on a clean serving surface, square composition,
no text, no watermark, no logo, no hands.
```

**Opción (topping/salsa/adición):** igual pero primer plano de un solo ingrediente:
```
Photorealistic professional close-up food photography of "<nombre>", a single fresh ingredient
or topping, appetizing, vibrant colors, soft natural lighting, shallow depth of field,
high detail, sharp focus, <MOOD>, centered, square composition, no text, no watermark, no logo, no hands.
```

### `<MOOD>` — de los colores del local (`tema`)
- Se mira la **luminancia de `tema.bg`**: si es oscuro → fondo dramático; si es claro → fondo limpio.
- Se traducen `tema.primary` y `tema.accent` a **nombre de color** por tono (hue): warm red, warm
  orange ember, golden yellow, fresh green, teal, blue, violet, magenta pink, o neutros (white/charcoal/grey).
- Resultado:
  - **Local oscuro:** `moody dark background with subtle <primary> and <accent> tones that match the brand palette`
  - **Local claro:** `clean bright background with subtle <primary> accents that match the brand palette`

Ejemplos reales:
- Juance (violeta oscuro): `moody dark background with subtle warm orange ember and violet tones…`
- Burger claro (naranja): `clean bright background with subtle warm orange ember accents…`

## Principios (para mantener la calidad)
- **Inglés** (mejor calidad en los modelos de imagen; el dueño solo lo pega).
- **Foto realista**, apetitosa, sin texto/logo/manos.
- **A tono con la marca**, sin forzar: el color va en el fondo/props, no tiñe la comida.
- **Cuadrada** (las tarjetas del menú son cuadradas).
