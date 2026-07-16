# Guía — Construir la app demo (HTML autónomo)

Tú **construyes la app tú mismo** a partir de `assets/plantilla_app_maestra.html`. Ya NO se usa
Claude Design. El resultado es **un solo archivo HTML** (vanilla, autocontenido, imágenes en base64)
listo para enviar por WhatsApp. La **estructura es FIJA**; lo único que cambia por negocio son
3 cosas: **fuentes, paleta y el objeto `DATA`** (menú + imágenes + partícula).

> Regla mental: *misma estructura siempre, pero cada pestaña se llena con el menú real del negocio,
> así cada app se siente única y viva — no un reskin.* El motor de render (JS) **no se toca**.

---

## Lo que la app YA trae hecho (fijo — no lo reconstruyas)
- **Gate de entrada**: "Entrar como cliente / como administrador" (separados, como pidió el usuario).
- **Login** cliente: Continuar con Google + Entrar como invitado (simulados).
- **Menú** con héroe, buscador, barra de secciones sticky, soporte de **varias cartas** (ej. Comidas/Postres).
- **Detalle en bottom-sheet** con opciones (único/múltiple: tamaños, sabores, adiciones) y cantidad.
- **Carrito** (editar/eliminar/cantidades/total) → **Checkout** (entrega, pago, notas).
- **Confirmar → abre WhatsApp del local con el pedido armado** + lo registra en el panel admin.
- **Éxito** con check dibujado + lluvia de partículas.
- **Pedidos** (historial + "volver a pedir").
- **Cuenta** con **switch claro/oscuro SOLO aquí** (no en todas las pantallas).
- **Panel admin** separado: pedidos en columnas (Nuevo/En preparación/Listo) + menú en vista lista de control.
- **Partículas** en gate, login, héroe y éxito; bottom nav, header glass, micro-interacciones, skeletons.

---

## Paso a paso

### 1. Copia la plantilla al proyecto
Copia `assets/plantilla_app_maestra.html` a la carpeta de trabajo del usuario como
`App-<Negocio>.html`. Trabaja sobre esa copia.

### 2. Extrae la identidad visual del MENÚ y el LOGO (fuente de verdad)
El usuario te pasó **menú + logo + WhatsApp**. De ahí sale TODO (no inventes si hay material):
- Si el menú o el logo es **PDF de imágenes**, `pdftotext` da vacío → renderiza a PNG con **PyMuPDF**
  (`fitz`, matrix 3×3) y léelo con Read. Saca: colores dominantes, secciones, productos, precios, eslogan, estilo.
- **Paleta** (⚠️ esto es lo que hace ÚNICA cada app — no caigas en crema/beige por defecto):
  - **El LOGO manda.** Saca sus **2–3 colores de marca dominantes** (los cromáticos reales: el rojo de
    un sello, el verde de una hoja, el azul de una ola…). El más fuerte = `--primary`; el segundo = `--accent`;
    el tercero = `--accent-2`. El degradado `--grad` se arma con dos de ellos → así el héroe/botones gritan la marca.
  - **Tinta TODO hacia esos colores**, no solo el primary: el fondo y las superficies llevan un tinte sutil
    del primary (un fondo cálido para una marca roja/dorada, frío para una azul, verdoso para una natural…).
    **Nunca** uses el mismo crema/beige para todos: dos negocios distintos deben verse claramente distintos.
  - El **menú** aporta matices/acentos secundarios, pero **el color base sale del logo**. Si el logo es
    oscuro/intenso (negro, vino, marino), no lo claves en un fondo pálido genérico: súbele el tinte de marca
    (fondo cálido tostado, surfaces tintadas) para que el conjunto se sienta de ESE negocio.
  - Construye clara y oscura: la **oscura** = fondos profundos tintados al primary + texto claro (su mejor
    versión cuando el logo ya es oscuro). Verifica contraste del texto sobre primary (`--primary-ink`).
- **Fuentes**: elige una pareja **display + body** que pegue con la marca (ver `estetica_demos.md`).
  Cárgalas en `[[FONT_LINK]]`.
- **Partícula**: elige el glyph temático del negocio para `DATA.particle`
  (`heart` postres/amor · `ember` asador/parrilla · `confetti` fiesta/heladería · `leaf` saludable/natural ·
  `bubble` bebidas/café frío · `steam` café/sopas · `sparkle`/`star` premium/belleza).
- Si NO hubiera ninguna pista (raro, porque siempre hay logo+menú), usa `paletas_rubro.md` como respaldo.

### 3. Reemplaza los TOKENS de cabecera (paleta + fuentes)
En `:root` y los `<meta theme-color>` reemplaza todos los `[[L_*]]` (claro), `[[D_*]]` (oscuro),
`[[FONT_*]]`, `[[THEME_COLOR_*]]`. Guía de cada token está comentada en el HTML. Reglas:
- `--primary-ink` = color de texto que va SOBRE el primary (blanco si el primary es oscuro/saturado).
- Sombras tintadas a la marca (`[[L_SHADOW]]` ej. `rgba(80,30,10,.30)`), nunca negro puro en claro.
- `--glass` = el surface con alpha (ej. `rgba(255,255,255,.72)` claro / `rgba(20,14,28,.7)` oscuro).
- El degradado `--grad` (primary→accent) se usa en héroe, botones y éxito: que se vea vivo.

### 4. Llena el objeto `DATA` con el menú real
Es el corazón de la personalización. Reemplaza los `[[..._JSON]]` con JSON válido:
- `cartas`: si el local tiene **una sola** carta → un elemento. Si maneja **dos o más**
  (comidas + postres, almuerzos + bebidas) → varias, y cada sección lleva su `cartaId`. Aparece el switch de cartas.
- `secciones`: `{id, cartaId, nombre, emoji, img}`. `img` = base64 de la cabecera o `""` (usa emoji).
- `productos`: `{id, seccionId, nombre, desc, precio (número), destacado, emoji, img, opciones:[]}`.
  - **Adapta `opciones` al tipo de negocio** (esto es lo que hace cada pestaña distinta):
    - Comida rápida: `Tamaño` (único), `Adiciones` (múltiple), `Términos`...
    - Postres: `Sabor` (único), `Toppings/Adiciones` (múltiple), `Tamaño/Porción`...
    - Bebidas/café: `Tamaño`, `Leche`, `Extras`...
    - Tienda/servicio: variantes, tallas, complementos...
  - `tipo:"unico"` = una sola opción (radio); `tipo:"multi"` = varias (checkbox). `extra` suma al precio.
  - Si un producto no tiene personalización, deja `opciones:[]`.
- `precio` siempre **número** (sin símbolo): el motor formatea con `DATA.simbolo`.
- `pagos`: por defecto `["Nequi","DaviPlata","Visa","Mastercard","Efectivo"]`; usa otro si el usuario lo pidió.
- `whatsapp`: **solo dígitos con indicativo** (Colombia `57` + número). Si el menú no trae número, la Skill ya lo pidió al inicio.
- `heroTitulo`/`heroSub`: frase corta y antojable; usa el eslogan si existe.

### 5. Imágenes en base64
Genera e incrusta las imágenes según `imagenes.md`. Cada imagen va como `data:image/webp;base64,...`
en su campo (`DATA.logo`, `DATA.hero`, `seccion.img`, `producto.img`). Si una no se generó, deja `""`
y el motor usa emoji/inicial — nunca queda roto.

### 6. Auto-revisión visual (OBLIGATORIO antes de entregar)
La app debe verse **hermosa y coherente**. Ábrela y míralа:
- Usa el **panel de preview** (Launch) que aparece al guardar el HTML, o renderiza con un screenshot.
- Recorre: gate → login → menú (con sus fotos) → detalle → carrito → checkout → éxito → admin → tema oscuro.
- Revisa que **las imágenes combinen** con la paleta y no desentonen. Si una imagen no pega o se ve mal
  integrada: **regénerala** (ajusta su prompt a la paleta) **o ajusta la app** (paleta/encuadre) para que armonice.
- Verifica que no haya `[[TOKENS]]` sin reemplazar, ni JSON roto (la consola no debe tirar errores).
- Comprueba contraste en claro Y oscuro, y que el botón de WhatsApp arme bien el texto del pedido.

### 7. Entrega
Entrega `App-<Negocio>.html` con `SendUserFile`. Es el archivo que el usuario reenvía por WhatsApp.

---

## Checklist antes de entregar la app
- [ ] Estructura intacta (gate, login, menú, sheet, carrito, checkout, éxito, pedidos, cuenta, admin).
- [ ] Paleta clara y oscura coherentes con el logo/menú; switch de tema funciona (solo en Cuenta).
- [ ] `DATA` con secciones, productos, precios y opciones REALES del menú (adaptadas al rubro).
- [ ] Varias cartas si el local las maneja.
- [ ] Logo cargado (base64) o inicial; héroe + cabeceras de sección con imagen.
- [ ] Partícula temática del negocio, visible en varias zonas sin saturar.
- [ ] WhatsApp del local correcto y el pedido llega armado.
- [ ] Sin `[[TOKENS]]` pendientes, sin errores en consola.
- [ ] Revisado a ojo en claro y oscuro; imágenes integradas y bonitas.
