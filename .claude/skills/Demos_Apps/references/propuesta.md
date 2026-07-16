# Guía — Propuesta PDF (estética y profesional)

La propuesta se genera desde **`assets/propuesta_plantilla.html`** (3 páginas A4, probada con Loli y
Shawarma). Adaptas **paleta + fuentes + contenido** y exportas a PDF con Edge headless. La estética debe
**calcar la app demo que tú construiste** (`App-<Negocio>.html`): misma paleta, mismas fuentes, misma
vibra (claro/oscuro), para que propuesta y app se vean **una sola pieza**. Sigue esto al pie de la letra.

---

## A. Sacar la estética (calcar TU app)
La fuente de verdad ahora es **el HTML de la app que tú generaste** (no Claude Design). Lee su `:root`
y su `[[FONT_LINK]]`:
- **Paleta**: `--bg`/`--bg-grad-*`, superficies, `--primary` y acentos, el degradado `--grad` del héroe →
  ese mismo va al **banner** y a la **tarjeta de precio** de la propuesta.
- **Fuentes**: la pareja **display + body** con su `<link>` de Google Fonts → úsala tal cual.
- **Vibra**: si la app quedó con acento oscuro, refleja sombras tintadas (no negras). Mapea a las
  variables `--c-*` y `--grad` de la plantilla de propuesta.
Puestas lado a lado, propuesta y app deben reconocerse como la misma marca.

## B. Adaptar la plantilla
1. Copia `assets/propuesta_plantilla.html` al proyecto como `Propuesta-App-<Negocio>.html`.
2. Reemplaza **la paleta** (`:root` → `--c-*` y `--grad`) y **las fuentes** (`@import`/`<link>` +
   familias) con las de **tu app**.
3. Reemplaza **todos los `[[TOKENS]]`** con contenido real (nombre, eslogan, intro, bullets, opciones,
   precio/condiciones, contacto, cierre). No dejes ningún `[[TOKEN]]`.
4. Mantén la estructura de 3 páginas (cada `.page` es `height:297mm; overflow:hidden`, footer absoluto).

## C. Exportar a PDF con Edge headless  ⚠️ trucos importantes
Ruta de Edge: `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe` o `C:/Program Files/Microsoft/Edge/Application/msedge.exe`
```bash
"<msedge>" --headless --disable-gpu --no-pdf-header-footer \
  --user-data-dir="C:/Users/<user>/_tmpprof_demo" \
  --print-to-pdf="C:/.../Propuesta-App-<Negocio>.pdf" \
  "file:///C:/.../Propuesta-App-<Negocio>.html"
```
Aprendido a la fuerza — respétalo:
- **NO uses `--headless=new`** (no escribió el archivo). Usa `--headless` a secas.
- **Rutas ABSOLUTAS** para `--print-to-pdf` y el `file:///` (relativa → "Access is denied").
- **`--user-data-dir` FUERA de OneDrive** (ej. `C:/Users/<user>/_tmpprof_demo`).
- **Edge cachea el `file://`**: si el PDF sale idéntico tras editar, usa un `--user-data-dir` **nuevo**.
- El error `fallback_task_provider`/`ERR_ABORTED` es **ruido**. Importa la línea `bytes written to file`.
- Da `sleep 3` antes de leer el PDF.

## D. Verificar SIEMPRE antes de entregar
Renderiza las páginas a PNG con PyMuPDF (matrix 1.7×1.7) y míralas:
- ¿El número de páginas es el esperado (normalmente **3**)? Si salen 4, algo se desbordó.
- ¿Alguna tarjeta queda cortada o pisa el footer?
- Si se desborda: **mueve una sección entera a la página siguiente** (más robusto que achicar sin fin).

## E. Cerrar
- Borra temporales: `_tmpprof_demo`, `_img_demo`, `_tmp_check`, `_tmp_menu`.
- Conserva: **`App-<Negocio>.html`**, **`Propuesta-App-<Negocio>.pdf`** y **`Propuesta-App-<Negocio>.html`**.
- Entrega la app (HTML) y la propuesta (PDF) con `SendUserFile`.

---

## Contenido estándar de la propuesta (refleja TODO lo que la app ya trae)
La propuesta debe vender exactamente lo que la demo muestra. Asegúrate de mencionar:
- **Página 1** — banner en degradado (eyebrow "Propuesta de Proyecto", título "Aplicación de Pedidos",
  subtítulo "para <Negocio>", pill de categorías) + intro + tarjeta "Para tus clientes" + tarjeta
  "Para el negocio · Panel de administración (separado del cliente)".
  - En "Para tus clientes" incluye: cuenta (Google + invitado), **menú por secciones** (y varias cartas si
    aplica), **personalización** (tamaños/sabores/adiciones), carrito, **el pedido se envía armado al
    WhatsApp del local**, historial con "volver a pedir", **modo claro y oscuro**.
- **Página 2** — "Instalación y experiencia" (PWA instalable Android/iPhone) + "Opciones que la app puede
  tener" (recepción por WhatsApp/panel/ambas, notificaciones, pago, domicilio, fotos Firebase vs ImgBB).
- **Página 3** — tarjeta de precio (valor, pago único, forma de pago, **tiempo 2 semanas**, **garantía
  6 meses**, sin mensualidades, entrega, **validez de la oferta**) + insignia `.promo` + "Crecimiento a
  futuro" (pills) + CTA "¿Le damos vida a la app de <Negocio>?" + cierre.
  - El CTA cierra con `[[PAGO_RESUMEN]]` (ej. "El pago único de $500.000 se hace a la entrega, con la app
    funcionando."). **Por defecto NO hay abono**: el cliente paga el total cuando la app está lista.

### Datos comerciales — confirmados en una sola pregunta (ver cuestionario.md, Momento 2)
Por defecto: **valor $500.000 · pago único a la entrega (SIN abono) · garantía 6 meses · validez 2 semanas**.
El usuario confirma o cambia en un solo paso antes de generar el PDF. Rellena:
- `[[VALOR]]` → 500.000 (o el confirmado).
- `[[FORMA_PAGO]]` → por defecto "Pago único de $500.000 a la entrega de la app" (sin abono).
- `[[PAGO_RESUMEN]]` → cierre del CTA, ej. "El pago único de $500.000 se hace a la entrega, con la app funcionando."
- `[[VALIDEZ]]` → "2 semanas desde la fecha de esta propuesta".
- `[[PROMO_NOTA]]` → "Precio promocional válido por 2 semanas. Después de esa fecha la cotización puede cambiar."
- Footer de cada página: "<Negocio> · Propuesta de App de Pedidos · <Mes Año>".
