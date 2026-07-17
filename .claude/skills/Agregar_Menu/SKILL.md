---
name: Agregar_Menu
description: Crea un LOCAL nuevo (menú) dentro de la app Appetic, integrado igual que los que ya existen (Perros Criiollos, Sabor del Día, Burger). Cada local queda ÚNICO en su identidad — colores/tema, logo, banner, categorías, emojis y fotos generadas con IA — pero comparte EXACTAMENTE el mismo flujo que ya trae la app: menú, carrito, checkout que arma el pedido y lo manda al WhatsApp del local, historial, y su propio panel de administrador (para entregárselo al dueño de ese local). Adapta el menú DIGITAL al menú REAL del cliente (no al revés), eligiendo el modelo que haga que las opciones FUNCIONEN, y lo MEJORA en estética — debe verse mejor que la carta original, nunca peor. SIEMPRE pide primero el MENÚ y el LOGO del local (no arranca sin ellos, salvo demo explícita). Automatiza TODO el flujo: crea el archivo de datos en src/dev/, lo registra en la vista previa (?preview=1), crea su script de seed, genera e integra las imágenes (banner+logo+platos), verifica en el navegador, despliega a Vercel y explica al final las llaves de Firebase para dejarlo funcionando de verdad (seed + panel + WhatsApp). Úsala cuando el usuario diga "/Agregar_Menu", "agrega un menú nuevo", "crea un local nuevo en appetic", "quiero otro menú como los que ya tengo", "monta este negocio en la app", "nuevo restaurante/local para Appetic", o cualquier variación de crear un local/menú adicional dentro de Appetic.
---

# /Agregar_Menu — Nuevo local dentro de Appetic

Tu trabajo es **agregar un local (menú) nuevo** a la app **Appetic** (proyecto multi-local,
Vite/React + Firebase), integrado **exactamente como los que ya existen**. La app corre en la
carpeta `APPETIC` y ya tiene el motor completo (menú, carrito, checkout→WhatsApp, historial,
panel de admin, buscador). **Ese motor NO se reprograma**: un local nuevo es solo **datos +
identidad visual + imágenes**.

## Principio rector
- **Todo el flujo es idéntico** entre locales (pedir con carrito, checkout que manda el pedido al
  WhatsApp del local, y su propio panel `/admin` para el dueño — incluye la pestaña **📣 Difundir**
  con QR, afiche de domicilios, link y mensaje de bienvenida). Eso ya existe; **no lo toques**.
- **Lo ÚNICO que cambia es la IDENTIDAD** y debe ser **ÚNICA** por local: `slug`, `nombre`, la
  **paleta de colores** (`tema`), el **logo** y **banner**, las **categorías/emojis** y las
  **fotos**. Dos locales deben verse claramente distintos.
- **Adapta el menú DIGITAL al menú REAL del cliente — nunca al revés.** Representa fielmente lo que
  vende y **elige el modelo de producto que haga que las opciones FUNCIONEN** (no fuerces su menú en
  una estructura que se rompe o confunde; si una opción no funciona, cambia el MODELO, no el menú
  del cliente). Aprendizaje de Perros Criiollos.
- **Mejora la estética, no la empeores.** La versión digital debe verse **mejor** que la carta
  original: más clara, más apetitosa, más profesional. Fotos coherentes, paleta con gusto,
  descripciones que antojan. Ver **`references/menu_fiel_y_hermoso.md`**.
- **Identidad a la MEDIDA de cada marca — adaptar, NO copiar.** Saca la estética del **ADN de ESA
  marca** (su logo + PDF + rubro): su vibra, su paleta, su tipografía, su iconografía. Para muchas
  marcas basta elegir bien el `tema` (5 colores). Otras piden más profundidad (fondo oscuro,
  tipografía y títulos propios): el motor soporta un **skin por local** para eso. El skin `'jet'` de
  **Pilotos** es un **ejemplo trabajado y el molde técnico — NO un estilo para calcar**. Nunca
  impongas el look de otro local; cada uno se ve de SU negocio. Ver **`references/identidad_y_skin.md`**.
- El local nace de **un solo archivo de datos** (`src/dev/<file>.js`) que alimenta tanto la vista
  previa como el alta real en Firebase. Mismo patrón que `perrosCriollos.js` y `saborDelDia.js`.

## Referencias de la app (míralas si dudas del formato exacto)
- Ejemplos reales ya integrados: `src/dev/perrosCriollos.js`, `src/dev/saborDelDia.js`.
- Registro de vista previa: `src/preview.js`. Seeds: `scripts/seed-perros-criollos.mjs`, `scripts/seed-sabor-del-dia.mjs`.
- Motor (no editar): `src/pages/Local/*`, `src/components/Menu/*`, `src/utils/price.js`.
- Difundir (QR + afiche de domicilios + link + mensaje, automático por local): `src/pages/Admin/AdminDifundir.jsx`, `src/utils/compartir.js`. Ver **`references/difundir.md`**.

---

## Flujo de trabajo

### Paso 1 — Pedir el material (PUERTA DE ENTRADA obligatoria)
**Lo PRIMERO, SIEMPRE: pide el 📋 MENÚ y el 🎨 LOGO del local. No empieces a construir sin ellos.**
Pide también **📱 WhatsApp** y **correo del ADMIN** (si el menú ya los trae, no los repitas).

**🔑 Si NO te los dan, NO te bloquees ni dejes el local a medias: usa los valores por defecto y
sigue.** Ambos se cambian después desde la app, sin tocar código:

| Dato | Por defecto si no lo dan | Se cambia luego en |
|---|---|---|
| `ADMIN_EMAIL` | **`sinfiniity@gmail.com`** | Panel de **superadmin** (campo 👤 del local) — o re-corriendo el seed |
| `whatsapp`    | **`'573208435143'`** (320 843 5143) | Panel del local → ⚙️ Configuración → Datos del negocio |

- El **WhatsApp por defecto** deja el checkout **funcionando desde el minuto uno** (los pedidos
  llegan a ese número mientras el dueño pone el suyo). **Nunca lo dejes en `''`**: con vacío el
  cliente arma el pedido y el botón no tiene destino.
- ⚠️ Aun usando los defaults, **dilo claro al entregar**: con `sinfiniity@gmail.com` entra al panel
  **el usuario, no el cliente**, y los pedidos llegan al número por defecto, **no al del local**.
  Son provisionales, no el estado final.
- Si SÍ te dan los datos del dueño real, úsalos y olvídate de los defaults.
- El **menú** es la fuente de verdad de productos/precios/opciones; el **logo**, de la paleta y el
  estilo de marca. Sin esos dos, detente y pídelos.
- **Única excepción:** si el usuario dice explícitamente que es **demo** / "los nombres y el menú
  defínelos tú" → los inventas tú (coherentes y únicos) y sigues sin esperar material.
- Si el menú o el logo llegan como **PDF de imágenes**, `pdftotext` da vacío → renderiza a PNG
  (PyMuPDF, matriz 3×3) y **léelos con Read**. Si son imágenes, léelas con Read. Saca de ahí:
  productos, precios, secciones, eslogan, y los **colores de marca** del logo.

Con el material en mano, define la identidad:
- `slug` (minúsculas-con-guiones) y `nombre`. **Verifica que el slug NO exista ya** (revisa
  `src/preview.js` y `src/dev/*.js`) para no pisar otro local.
- **Saca el ADN visual de la marca** (de SU logo/PDF, no de otro local): vibra, paleta, tipografía,
  iconografía. Con eso decide: ¿basta el `tema` (5 colores, look claro — sirve para la mayoría) o la
  marca pide un **skin propio** (fondo oscuro, tipografía/títulos/iconografía a su medida)? Si pide
  skin, créalo **a la medida de ESA marca** (el `'jet'` de Pilotos es ejemplo, no plantilla). Con
  skin oscuro: `tema.hero:'logo'` + categorías **sin emoji**. Detalle en
  **`references/identidad_y_skin.md`**. **Adapta a la medida, no copies** el estilo de otro.
- **Paleta ÚNICA** (`tema`): saca `primary`/`primaryStrong`/`primarySoft`/`accent` del **logo** del
  negocio, y un `bg` (fondo del "mundo") con un tinte de esa marca. `onPrimary` = texto sobre el
  primary (#fff si es oscuro). Que NO se parezca a los locales que ya existen.
- **Categorías** y los **productos** (categorías con emoji en look claro; **sin emoji** en skin
  oscuro). Aquí **modelas fiel al cliente**: para cada ítem
  elige el modelo que calza con cómo lo vende (precio fijo · `variantes` de tamaño · `gruposOpciones`
  `unica` "elige 1" · `multiple` "adiciones" · `modo:'pasos'` "arma tu X") para que **las opciones
  funcionen**. Enriquece descripciones flojas (sin inventar) y ordena para que se vea **mejor** que
  su carta. Guía de mapeo y estética: **`references/menu_fiel_y_hermoso.md`**.

### Paso 2 — Crear el archivo de datos `src/dev/<file>.js`
Copia `assets/plantilla_local.js` a `src/dev/<nombreCamelCase>.js` y rellénalo. Reemplaza los
`[[TOKENS]]`: `SLUG`, `ADMIN_EMAIL`, `[[CONST]]` (nombre en MAYÚSCULAS, ej. `SABOR`), tema,
categorías y productos reales. Detalle del esquema (LOCAL + PRODUCTO, variantes / gruposOpciones
`unica`|`multiple` / `modo:'pasos'`) está comentado en la plantilla. **Para locales de ALMUERZOS**
(menú del día): modela el plato como producto con grupos `Proteína/Principio/Jugo` tipo `unica`
`min:1,max:1`; el dueño cambia esas opciones a diario desde el panel (la sopa va en la descripción).

### Paso 3 — Registrar la vista previa en `src/preview.js`
Añade una rama dentro de `getPreviewLocal(slug)`:
```js
if (slug === '<slug>') {
  const { <CONST>_LOCAL, <CONST>_PRODUCTOS } = await import('./dev/<file>')
  return { local: <CONST>_LOCAL, productos: <CONST>_PRODUCTOS }
}
```

### Paso 4 — Crear el seed `scripts/seed-<slug>.mjs`
Copia `assets/plantilla_seed.mjs` a `scripts/seed-<slug>.mjs` y reemplaza `[[SLUG]]`, `[[NOMBRE]]`,
`[[FILE]]`, `[[CONST]]`.

### Paso 5 — Generar e integrar las imágenes (con `/Generar_Imagen`)
Genera **banner + fotos de productos** con la skill **`/Generar_Imagen`** (Pollinations,
gratis) — **NUNCA con Higgsfield ni otro servicio de pago**. Las deja en `public/locales/<slug>/`
como WebP livianos y luego cableas los `foto`. **Basa cada prompt en las FOTOS reales del menú si el
cliente las mandó** (léelas y descríbelas fiel, para que se parezcan a su producto); si no hay fotos,
básate en la **estética que quiere el local** (rubro + vibra + paleta), coherente en todas. Sigue
**`references/imagenes.md`**. Cada foto liviana, apetitosa y coherente con el tema.
- **El LOGO del cliente**: si viene sobre **fondo sólido** (típico en logos dramáticos sobre negro),
  NO lo uses en cuadro — pásalo por **`/Quitar_Fondo_Mejorar_Calidad`** para dejarlo **transparente
  y liviano** (WebP ~50–100 KB) y que **flote** en el hero (con `tema.hero:'logo'`). Si no, se ve
  como un "recuadro pegado". Ver `references/identidad_y_skin.md` §3.
- **Menú largo (>12 productos)**: el motor muestra un **buscador** solo (automático). No hay que
  hacer nada; genera fotos para el mayor número de productos posible (los que compartan tipo pueden
  reutilizar una foto).

### Paso 6 — Verificar en el navegador (?preview=1): que funcione Y se vea bien
Con el dev server (Claude Preview), abre **`/<slug>?preview=1`** y comprueba **las dos cosas**:
- **Que funcione:** **prueba las opciones de CADA producto** que las tenga — abre el modal,
  selecciona, confirma que el **precio suma** y que la **validación** de obligatorios funciona
  (los `unica min:1` exigen elegir). Ninguna opción rota o confusa. Si algo no funciona, corrige el
  **modelo** del producto (Paso 2), no el menú. Sin errores de consola.
- **Que se vea bien:** el tema (colores del local) se aplica, categorías ordenadas, tarjetas
  legibles, **imágenes cargan** (el `<img>` es `loading="lazy"`: fuérzalo a `eager` o haz scroll) y
  **combinan** con la paleta. Debe verse **mejor** que la carta original — si algo se ve pobre o
  desentona, mejóralo (foto, descripción, orden, color) antes de seguir.

### Paso 7 — Desplegar a Vercel
Usa la skill **`/despliegue_en_vercel`** (build + `git add` de SOLO los archivos del local +
commit + push a la rama de producción `main`). Así suben el código y las imágenes. **Deploy ANTES
del seed** (si no, las fotos dan 404 hasta publicar).

### Paso 8 — Firebase: dejarlo funcionando DE VERDAD (el cierre)
**Desplegar NO basta.** Hasta aquí el local solo existe en el código: no sale en `/superadmin`, ni
en el buscador, ni recibe pedidos, porque esas pantallas leen de **Firestore**. El **seed** es lo
que lo hace existir. (Si el usuario dice *"ya desplegué pero no lo veo en mi panel"* → es esto.)

Sigue **`references/firebase.md`**. Los cuatro puntos que NO puedes saltarte:
- **¿Puedes sembrar tú?** La llave `scripts/serviceAccount.json` está en `.gitignore` → **existe en
  el PC del usuario, NO en la nube**. Desde la nube deja todo listo y dile que corra
  `node scripts/seed-<slug>.mjs` en su PC. **Nunca pidas la llave por chat** (es un secreto).
- **Deploy ANTES del seed**, y comprueba con `curl` que las fotos ya dan **200** en producción.
- **`suscripcion.activa: false` mientras no haya WhatsApp** — con `true` el local sale en el
  buscador público y un cliente podría pedir sin que el pedido llegue a ningún lado. El usuario lo
  enciende con el toggle del panel.
- **Verifica leyendo Firestore de vuelta**, no te fíes del `✓` del script.

Ojo al re-correr el seed: solo protege `ubicacion`, `whatsapp` y `horario`. **`suscripcion.activa`
y `admins` se pisan** con lo que diga el archivo de datos.

Explícale al usuario este tramo al final, claro y en orden. **Al poner el WhatsApp**, recuérdale que
ese número es también el de **domicilios** del afiche (pestaña 📣 Difundir) y que el afiche lo toma
solo.

### Paso 9 — Contarle al dueño la pestaña 📣 Difundir (parte de la entrega)
Ya viene sola en su panel (motor). Solo **avísale que la tiene** y para qué sirve: su **QR** para
imprimir, el **afiche de domicilios** listo para PDF (con su número, que se actualiza solo), el
**link** para copiar y un **mensaje de bienvenida** para reenviar por WhatsApp. Detalle y por qué el
afiche hereda su identidad (tema+logo+whatsapp): **`references/difundir.md`**.

---

## Reglas de oro
- **Nunca arranques sin menú + logo.** Es la puerta de entrada: pídelos siempre primero (salvo demo
  explícita). El menú manda el contenido; el logo, la paleta.
- **WhatsApp y admin NO bloquean.** Si no te los dan, van los defaults (`573208435143` y
  `sinfiniity@gmail.com`) y se configuran luego desde la app. Avísalo al entregar (Paso 1).
- **Motor intacto.** Nunca reprogramas carrito/checkout/admin: salen del código existente. Solo
  agregas **datos + identidad + imágenes**.
- **Único de verdad.** Paleta, logo, banner, emojis y fotos propios del negocio. Si se parece a otro
  local, cámbialo.
- **Identidad a la medida — adaptar, no copiar.** Saca la estética del ADN de ESA marca; que se vea
  de SU negocio y distinta a los demás. Si pide profundidad, hazle un **skin propio** (el `'jet'` de
  Pilotos es ejemplo/molde, no plantilla para calcar). Logo **transparente** que flote (pásalo por
  `/Quitar_Fondo_Mejorar_Calidad`), no un recuadro pegado. Ver `references/identidad_y_skin.md`.
- **Fiel y más bonito.** Adapta el digital al menú REAL del cliente y que **las opciones funcionen**
  (elige el modelo correcto); y que se vea **mejor** que su carta, nunca peor. Nunca dejes opciones
  rotas ni imágenes/estética pobres.
- **Mismo patrón que los que ya hay.** Copia la estructura de `perrosCriollos.js`/`saborDelDia.js`;
  respeta los nombres de export (`SLUG`, `ADMIN_EMAIL`, `<CONST>_LOCAL`, `<CONST>_PRODUCTOS`).
- **Agrega solo lo del local** al git (dev file, preview, seed, `public/locales/<slug>/`, doc). NO
  incluyas otros archivos sueltos ni `.claude/`.
- **Orden final:** preview OK → deploy → seed en Firebase → WhatsApp. Verifica en cada paso.
- **Sin seed no existe.** Desplegar solo publica el código; el local aparece en el panel y recibe
  pedidos **cuando se siembra**. Y el seed necesita la llave, que **solo está en el PC del usuario**
  (no en la nube). Ver `references/firebase.md` §0.
- **Entrega:** deja una notita/guía (como `SABOR-DEL-DIA.md`) con el link, el admin y cómo cambia el
  menú, para dársela al dueño. Incluye que en su panel → **📣 Difundir** tiene el QR, el afiche de
  domicilios (PDF), el link y el mensaje de bienvenida (ver `references/difundir.md`).

## Archivos de la skill
- `assets/plantilla_local.js` — esqueleto del archivo de datos del local (esquema anotado). **Base de todo.**
- `assets/plantilla_seed.mjs` — esqueleto del script de alta en Firestore.
- `references/menu_fiel_y_hermoso.md` — adaptar el menú al cliente (modelo correcto por ítem) y mejorarlo en estética.
- `references/identidad_y_skin.md` — **identidad con profundidad**: leer la vibra, el skin oscuro (`skin:'jet'`), logo transparente que flota, tipografías/títulos de marca, el buscador. (Aprendizajes de Pilotos.)
- `references/imagenes.md` — generar e integrar banner/logo/fotos SIEMPRE con `/Generar_Imagen` (nunca Higgsfield); logo transparente con `/Quitar_Fondo_Mejorar_Calidad`.
- `references/firebase.md` — las llaves de Firebase y el cierre del flujo (seed, reglas, panel, WhatsApp).
- `references/difundir.md` — la pestaña **📣 Difundir** (QR, afiche de domicilios, link, mensaje): automática por local, hereda la identidad (tema+logo+whatsapp), y qué contarle al dueño en la entrega.
- `references/prompt_ia_panel.md` — el botón **✨ Crear con IA** del panel (foto de producto y de opciones): la receta del prompt (foto realista + colores del local) y dónde vive (`src/utils/promptIA.js`).
