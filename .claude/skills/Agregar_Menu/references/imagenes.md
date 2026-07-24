# 🖼️ Prompts de imágenes del local (la skill ESCRIBE los prompts — NO genera las imágenes)

> **Cambio de enfoque (importante):** la skill **ya NO genera las imágenes**. Su trabajo es
> **escribir prompts EXCELENTES** para que el **DUEÑO** las genere con IA (Gemini u otra) y las
> suba desde su panel. Así el local nace liviano, el dueño controla sus fotos y el flujo funciona
> en cualquier entorno (incluida la nube, donde no hay generador local).

Cada local lleva sus imágenes en **`public/locales/<slug>/`** (WebP livianos) y se referencian por
ruta en el archivo de datos (`foto`, `logo`, `banner`). Pero **la skill NO las crea**: deja todos
los `foto: ''` **vacíos** y entrega un archivo de **prompts** listos para pegar en la IA.

---

## Qué entrega la skill (el deliverable)
Un archivo **`public/locales/<slug>/PROMPTS.md`** (también se lo pasas al dueño) con:
- **1 prompt de `banner`** (horizontal),
- guía del **logo/icono** (casi siempre se usa el logo real del cliente — ver abajo),
- **1 prompt por producto** que valga foto, cada uno con **su nombre + el nombre de archivo sugerido**
  (`<id>.webp`),

todos **en inglés**, **coherentes con los colores del local** (`tema`) y con la **misma calidad que
los de Jasbury**. En el archivo de datos, **todos los `foto: ''` quedan vacíos**.

## Cómo las agrega el dueño (dos caminos, mismo resultado)
1. **Desde el panel** `/<slug>/admin` → editar producto → **✨ Crear con IA**: la app arma el prompt
   sola (misma fórmula, ver `prompt_ia_panel.md`), lo copia y abre **Gemini**. El dueño pega →
   genera → descarga → sube con **📱 Del dispositivo**. *(No cubre el banner.)*
2. **Con `PROMPTS.md`**: abre Gemini (o su IA de imágenes), pega cada prompt del archivo, genera,
   descarga y sube (productos con **📱 Del dispositivo**; banner con su opción de banner en el panel).

En ambos casos, después de subir, la imagen queda guardada en el local — **el dueño no toca código**.

---

## La fórmula del prompt (misma lógica de colores que el panel — `src/utils/promptIA.js`)
El prompt es **foto-realista**, describe el ítem **fiel al producto** y **encaja con los colores del
local**. El color va en el **fondo y los props**, NUNCA tiñe la comida.

### 1) El *mood* de fondo sale del `tema` (esto es lo que lo hace "verse bien")
- Mira la **luminancia de `tema.bg`**:
  - **`bg` claro** → `clean bright background with subtle <PRIMARY> [and <ACCENT>] accents that match the brand palette`
  - **`bg` oscuro** → `moody dark background with subtle <PRIMARY> and <ACCENT> tones that match the brand palette`
- Traduce `tema.primary` y `tema.accent` a **nombre de color** por tono (el mismo mapa que usa
  `promptIA.js`, para que el archivo y el panel coincidan):

  | Tono (hue) | Palabra en el prompt |
  |---|---|
  | rojo | `warm red` |
  | naranja | `warm orange ember` |
  | amarillo | `golden yellow` |
  | verde | `fresh green` |
  | turquesa | `teal` |
  | azul | `blue` |
  | violeta | `violet` |
  | rosa/magenta | `magenta pink` |
  | neutros | `clean white` / `deep charcoal` / `soft grey` |

### 2) Plantilla — PRODUCTO (plato / bebida / copa)
```
Photorealistic professional food photography of <DESCRIPCIÓN FIEL del plato con ingredientes
visibles, emplatado, porción y vajilla>, freshly made, appetizing and mouth-watering,
<SUPERFICIE/AMBIENTE — el MISMO en todo el local>, natural soft lighting, shallow depth of field,
high detail, sharp focus, <MOOD del tema>, centered on a clean serving surface, square composition,
no text, no watermark, no logo, no hands.
```

### 3) Plantilla — BANNER (hero horizontal)
```
Photorealistic wide banner food photography of <ambiente/rubro del local — mesa surtida o producto
estrella>, appetizing and inviting, <SUPERFICIE/AMBIENTE del local>, warm natural lighting,
<MOOD del tema>, horizontal cinematic composition, high detail, no text, no watermark, no logo,
no people.
```

### 4) Reglas para que TODOS combinen (coherencia de marca)
- Elige **UNA** superficie + luz y **repítela** en todas las fotos del local (como Jasbury: *warm
  rustic wooden table, warm natural light*). Es lo que hace que el menú se vea como **una sola marca**.
- **Fiel primero:** si el cliente mandó fotos reales de sus platos, **léelas con Read** y describe
  cada una tal cual (ingredientes, color, porción) para que la imagen se parezca a **su** producto.
- Si NO hay fotos, básate en la **estética del rubro + su paleta** (casero/rústico, gourmet/elegante,
  callejero/vibrante, café/artesanal…), coherente en todas.
- **Cuadrada** para productos (las tarjetas son cuadradas), **horizontal** para el banner.
- **Inglés siempre** (los modelos de imagen rinden mejor; el dueño solo pega).
- Termina siempre con `no text, no watermark, no logo, no hands` (evita que la IA escriba letras).

### 5) Ejemplo real (nivel esperado — tema de Jasbury: rojo `#FF3131` + dorado `#FFC42E`, bg crema claro)
Hamburguesa sencilla:
```
Photorealistic professional food photography of a juicy Colombian-style beef burger — grilled beef
patty, melted cheese, fresh lettuce, tomato, caramelized onion and crispy crushed potato stacked on
a soft bun, freshly made, appetizing and mouth-watering, on a warm rustic wooden table, natural soft
warm lighting, shallow depth of field, high detail, sharp focus, clean bright background with subtle
warm red and golden yellow accents that match the brand palette, centered on a clean serving surface,
square composition, no text, no watermark, no logo, no hands.
```

---

## El LOGO y el ICONO (casi siempre se usa el del cliente)
- **Usa el logo REAL del cliente** (no lo inventes). Si viene sobre **fondo sólido**, pásalo por
  **`/Quitar_Fondo_Mejorar_Calidad`** para dejarlo **transparente y liviano** (WebP con alfa) y que
  **flote** en el hero con `tema.hero:'logo'`. Ver `identidad_y_skin.md` §3.
- Solo si el cliente **pide** un logo/emblema generado, escribe un prompt aparte en `PROMPTS.md`
  (badge simple del rubro, **sin texto/letras** — Flux/Gemini escriben mal las letras).

## Estructura sugerida de `PROMPTS.md`
```
# 🎨 Prompts de imágenes — <Nombre del local>
Pega cada prompt en Gemini (o desde el panel: ✨ Crear con IA), genera, descarga y súbela.
Colores de marca: primary <hex> · accent <hex> · fondo <hex>.

## Banner (sube en el panel → Banner)
<prompt del banner>

## Productos (editar producto → 📱 Del dispositivo)
### <Nombre> — archivo: <id>.webp
<prompt>
...
```

## Verificar
No hay imágenes que revisar (las pone el dueño). Sí revisa que **todos los `foto: ''`** queden
vacíos y que **cada prompt** sea fiel al plato, coherente en estilo y a tono con la paleta. En el
navegador (Paso 6) cada tarjeta muestra el **placeholder de marca ("Cargando imagen…")** hasta que el
dueño suba las fotos — es lo esperado (el `<ImagenApp>` usa el placeholder cuando `foto` está vacío).
El **emoji** solo se ve en los **chips de categoría**, no en la tarjeta del producto.
