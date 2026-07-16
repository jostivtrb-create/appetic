---
name: Demos_Apps
description: Crea, para CUALQUIER negocio, el paquete de venta de una app demo de forma AUTÓNOMA — sin Claude Design. Con solo el LOGO, el MENÚ y el NÚMERO DE WHATSAPP del local, construye (1) la APP DEMO en un único archivo HTML (vanilla, autocontenido, instalable, con login Google/invitado, entrada separada cliente/administrador, menú por secciones y varias cartas, carrito, checkout que envía el pedido armado al WhatsApp del local, historial, panel admin y switch claro/oscuro), genera además sus IMÁGENES con IA (/Generar_Imagen) coherentes con el menú e incrustadas en base64 para enviarse por WhatsApp, y (2) una PROPUESTA en PDF muy estética que calca los colores y fuentes de la app. Úsala cuando el usuario diga "/Demos_Apps", "crea una demo de app para…", "hazme la app demo de este menú", "arma el paquete de venta de la app", "quiero vender una app a un cliente", "nueva demo", o cualquier variación de querer crear la demo (HTML) y/o la propuesta PDF de venta de una aplicación. Es GENÉRICA: restaurantes, postres, barberías, tiendas, servicios — alimentada con el logo y el menú del negocio.
---

# /Demos_Apps — Paquete de venta de una app demo (app HTML + propuesta PDF)

Tu trabajo es ayudar al usuario a **vender apps demo a clientes**, de forma **autónoma**. Ya **NO se usa
Claude Design**: tú mismo construyes la app. Por cada negocio produces **dos entregables**:

1. **La APP DEMO** — un **único archivo HTML** (vanilla, autocontenido, imágenes en base64) que el usuario
   reenvía por **WhatsApp** y el cliente navega como una app real.
2. **La PROPUESTA en PDF** — documento de venta hermoso que **calca los colores y fuentes de la app**, para
   cerrar la venta. App y propuesta se ven como una sola pieza.

El estándar de calidad es el de las apps que ya funcionaron: la **estructura de Loli Merengones** + el
**apartado visual de NOPALITOS**. La plantilla maestra ya fusiona ambas.

La skill es **genérica** y **autónoma**: con poco material (logo + menú + WhatsApp) entrega todo.
Cada app debe quedar **única**, salida de SU marca — misma estructura, pero personalizada al menú.

---

## Principio rector
- **Misma estructura siempre, contenido siempre distinto.** Todas arrancan en el menú, todas tienen
  carrito y admin… pero *cómo* se llena cada pantalla depende del menú (comida rápida ≠ postres con
  sabores/adiciones ≠ bebidas). Así cada una se siente viva y diferente.
- **Lo visual es lo que vende.** Respeta los tonos del local, muchas partículas en varias zonas (sin
  saturar), imágenes bonitas y coherentes. Si algo no se ve hermoso, ajústalo.
- **Autonomía:** solo dos interacciones (pedir material al inicio + confirmar precio). Nada más.

---

## Cómo se entrega
- La **app** se entrega como **archivo `App-<Negocio>.html`** (con `SendUserFile`). Es lo que se envía por WhatsApp.
- La **propuesta** se entrega como **`Propuesta-App-<Negocio>.pdf`** (+ su HTML fuente), con `SendUserFile`.
- Ambos quedan en la carpeta de trabajo del usuario.

---

## Flujo de trabajo

### Paso 1 — Pedir el material (única entrada obligatoria)
Lo PRIMERO: pide **🎨 Logo · 📋 Menú · 📱 WhatsApp del local** (ver `references/cuestionario.md`).
Si el menú ya trae el WhatsApp y el logo, no los vuelvas a pedir. Si el usuario indicó país/moneda/pagos
distintos, úsalos; si no, Colombia/COP por defecto. **No hagas más preguntas aquí.**

### Paso 2 — Analizar el material y sacar la identidad
Lee el menú y el logo (si son PDF de imágenes, renderiza a PNG con **PyMuPDF** y léelos con Read —
`pdftotext` da vacío). Extrae: nombre, eslogan, secciones, productos, precios, **paleta** (del logo+menú),
**pareja de fuentes** y **partícula** del rubro. Detalle en `references/construccion_app.md` (paso 2) y
`references/estetica_demos.md`. Respaldo solo si no hay pistas: `references/paletas_rubro.md`.

### Paso 3 — Generar las imágenes (con /Generar_Imagen)
Genera **héroe + 1 cabecera por sección + los productos destacados** (no todos; tope ~15–25), en estilo
**coherente con el menú**, e **incrústalas en base64**. Sigue `references/imagenes.md` (incluye la
**auto-revisión**: lee cada imagen, y si no combina, regénerala o ajusta la app).

### Paso 4 — Construir la app HTML
Copia `assets/plantilla_app_maestra.html` a `App-<Negocio>.html` y rellénala: tokens de **paleta +
fuentes** y el objeto **`DATA`** (cartas, secciones, productos con sus opciones, pagos, partícula,
imágenes base64). El **motor de render no se toca**. Sigue `references/construccion_app.md` al pie de la
letra y **revísala a ojo** (panel de preview) en claro y oscuro antes de seguir.

### Paso 5 — Confirmar datos de la propuesta (única otra pregunta)
Una sola pregunta (ver `cuestionario.md`, Momento 2): *"La propuesta quedará así: valor $500.000, abono
$100.000, garantía 6 meses, validez 2 semanas. ¿La dejo así o cambias algún dato?"* Confirma o ajusta.

### Paso 6 — Generar la propuesta PDF
Sigue `references/propuesta.md`: copia `assets/propuesta_plantilla.html`, **calca paleta y fuentes de tu
app**, reemplaza todos los `[[TOKENS]]` (reflejando TODO lo que la app trae: admin separado, claro/oscuro,
carrito→WhatsApp, personalización), exporta a PDF con **Edge headless** (respeta los trucos) y
**verifica visualmente** las páginas con PyMuPDF (que sean 3 y nada se desborde).

### Paso 7 — Cierre
Limpia temporales (`_img_demo`, `_tmpprof_demo`, `_tmp_check`). Entrega **la app (HTML)** y **la
propuesta (PDF)** con `SendUserFile`, resume y ofrece ajustes.

---

## Reglas de oro
- **Dos entregables: la app (HTML autónomo) y la propuesta (PDF).** La app primero, la propuesta calca su estética.
- **Autónoma:** solo pides material al inicio y confirmas el precio una vez. Nada de interrogatorios.
- **Estructura fija, contenido a la medida del menú.** Adapta secciones, cartas y opciones (tamaños,
  sabores, adiciones) al tipo de negocio. Genérica de verdad (no asumas comida).
- **Lo visual manda:** tonos del local, muchas partículas, imágenes coherentes e incrustadas en base64.
  El pedido **siempre** llega armado al WhatsApp del local (impresiona al cliente) y al panel admin.
- **No inventes el catálogo:** sale del menú que te pasan. Si falta el número y el menú no lo trae, pídelo.
- **Revisa antes de entregar:** la app en claro y oscuro (imágenes integradas, sin `[[TOKENS]]`, sin errores
  de consola) y el PDF (3 páginas, nada desbordado). Deja la carpeta limpia: solo HTML de la app, PDF y su HTML.

---

## Archivos de la skill
- `assets/plantilla_app_maestra.html` — la app maestra (estructura fija + tokens + `DATA`). **Base de toda demo.**
- `assets/propuesta_plantilla.html` — la propuesta (3 páginas A4, tokens).
- `references/cuestionario.md` — los dos únicos momentos de interacción.
- `references/construccion_app.md` — cómo llenar la app desde el menú (paso a paso + checklist).
- `references/imagenes.md` — qué imágenes generar, estilo, base64 y auto-revisión.
- `references/estetica_demos.md` — el ADN visual (fuentes, paleta, partículas) de Loli/NOPALITOS.
- `references/paletas_rubro.md` — respaldo de paletas/fuentes por rubro (último recurso).
- `references/propuesta.md` — cómo armar y exportar el PDF calcando la app.
