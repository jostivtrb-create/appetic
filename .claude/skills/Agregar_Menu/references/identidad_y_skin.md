# 🎭 Identidad a la MEDIDA de cada marca — adaptar, NO copiar

> ⚠️ **Lo importante primero (no te saltes esto).** El aprendizaje de **Pilotos** NO es "usa fondo
> negro con vino y dorado y letra stencil". Eso es lo que le fue bien **A ESA marca**. El aprendizaje
> real es: **lee la marca que te dieron y adáptale una estética a SU medida.** Cada local tiene su
> propia identidad; tu trabajo es **sacarla de SUS materiales** (logo + PDF + rubro) y construirla,
> **no** calcar la de otro local. Pilotos quedó dramático porque **Pilotos es dramático** — un café
> de barrio, una heladería o una taquería pedirían algo **completamente distinto**.

---

## 1) Saca el "ADN visual" de la marca (de SUS materiales, no de tu gusto ni de otro local)
Antes de tocar colores, **lee el logo y el PDF** y extrae:
- **Ánimo / vibra**: ¿cálida y casera? ¿fresca y juguetona? ¿elegante y premium? ¿oscura y
  cinematográfica? ¿retro? ¿minimal? ¿callejera y vibrante?
- **Paleta real**: los colores que YA usa la marca (no inventes una ajena).
- **Tipografía que insinúa**: ¿redondeada amable? ¿serif clásica? ¿condensada/stencil ruda?
  ¿manuscrita? — el estilo de letra del logo/PDF te lo dice.
- **Motivos / iconografía propios**: un jet, una vaca, una corona, hojas de café, olas… lo que la
  marca use como símbolo (mejor que emojis genéricos si la marca es seria).

**La estética se construye desde ESE ADN.** Dos locales nunca deben verse igual, y ninguno debe
verse como Pilotos "porque quedó bien". Quedó bien **para Pilotos**.

## 2) 🚫 Prohibido el "todo crema" — el color de la MARCA tiene que mandar
**Error repetido (oct-2026):** varios locales salieron casi iguales — fondo crema, degradado durazno
y solo los botones con el color de la marca. Eso NO es personalizar: entrecerrando los ojos no se
sabe de qué negocio es. El dueño lo nota y se siente plantilla.

Reglas, para TODA marca (también las "cálidas y caseras"):
- **`bg` sale del color de la marca, no de la crema por defecto.** Un tinte claro de SU color
  dominante o secundario (verde salvia si su logo es verde, rosado pálido si es rosa, azul hielo si
  es azul…). Crema SOLO si la marca de verdad es crema (su carta/fachada lo es Y no tiene otro
  color fuerte). Si dudas, NO es crema.
- **La cabecera (hero) lleva un color FUERTE de la marca**, no un degradado pálido hacia el fondo.
  Si el logo no contrasta sobre ese color, se pone en una **placa/letrero** (como Bon Appétit) o se
  usa una versión del logo recoloreada — nunca se baja el color del hero para que "se lea".
- **Reparte los colores del logo con un ROL cada uno** — no todo en `primary`:
  acción (botones/carrito) · muro de marca (hero, chip activo, títulos) · firma (precios — mira de
  qué color van los precios en SU carta) · fondo (tinte claro).
- **Tipografía**: si el logo/carta usa letra condensada, redonda, script… los títulos y nombres de
  plato la imitan (fuentes ya cargadas en `index.html`: Oswald, Barlow Condensed, Anton, Fredoka,
  Nunito, Saira Stencil; agregar una nueva es una línea).
- **Por eso, casi todo local lleva SKIN propio** (`tema.skin`), claro u oscuro. El `tema` de 5
  colores solo NO alcanza para lo anterior: el motor pinta el hero con `primarySoft → bg` y deja
  títulos, chips y precios genéricos.
- `navSolid: true` pinta la barra inferior/lateral con el `primary` sólido: úsalo cuando el color
  de acción sea fuerte (Jasbury rojo, Bon Appétit naranja).

**Ejemplo CLARO trabajado — `skin:'bon'` (Bon Appétit, `LocalSkinBon.css`):** logo naranja + verde
bosque + pizza roja; carta con precios en rojo. → hero muro verde bosque con el logo en placa
crema, fondo salvia (no crema), chips activos y títulos verdes en Oswald, precios rojo tomate,
botones y barra naranjas. Molde técnico para pieles claras; como siempre, NO para calcar.

**Prueba del entrecierre (antes de entregar):** mira la captura con los ojos entrecerrados al lado
de la de otro local. Si se parecen, falta marca.

Marcas oscuras/dramáticas (Pilotos `jet`, Juance) llevan además superficies oscuras — ver §3.

## 3) El mecanismo reusable: un SKIN por local (esto es lo que se reaprovecha, NO el estilo)
Lo que quedó en el motor y **sí** se reutiliza es el **mecanismo**, no la piel de Pilotos:
- En `LocalMenu.jsx`, si el `tema` trae `skin: '<x>'`, la página recibe la clase `.local-skin-<x>`.
- En un CSS propio, **todo scopeado a `.local-page.local-skin-<x>`**, se sobreescriben los tokens
  (`--surface`, `--text`, `--border`, fuentes…) y se estilizan títulos, precios, nav y modales.
  Como está scopeado, **no afecta a ningún otro local**.

`skin: 'jet'` (archivo `src/pages/Local/LocalSkinJet.css`) es **la instancia hecha para Pilotos**
(fondo negro/brasa, vino+dorado, Saira Stencil One + Oswald, títulos en caja vino con silueta de
jet). Sirve como **ejemplo trabajado** y como molde técnico — **no como estilo para calcar**.

**Para una marca nueva que pida profundidad:**
- Si su ADN se parece MUCHO a Pilotos (aviación/dark idéntico), podrías reutilizar `jet`. Raro.
- Lo normal: **crea un skin hermano a SU medida** — `.local-skin-<sumarca>` activado por
  `tema.skin:'<sumarca>'`, con **SUS** colores, **SU** tipografía y **SU** iconografía sacadas del
  paso 1. Mismo mecanismo, **piel distinta**. (Avisa antes de tocar `LocalMenu.jsx`, es compartido;
  el cambio es aditivo: una clase condicional más.)
- Y si su ADN es claro/cálido, **quizá no necesita skin** — bien elegido, el tema basta.

> Regla: el skin es para **expresar la marca**, no para imponer un estilo. Si te descubres poniendo
> vino+dorado+stencil en un local que no es de aviación, párate: estás **copiando**, no adaptando.

## 4) El LOGO: transparente y que FLOTE (esto SÍ es genérico)
Si el logo del cliente viene sobre **fondo sólido**, en el hero se ve como un "recuadro pegado".
Pásalo por **`/Quitar_Fondo_Mejorar_Calidad`** → **transparente, nítido y liviano** (WebP con alfa,
~50–100 KB) y úsalo con `tema.hero:'logo'` para que se vea **grande**. Para logos de líneas
metálicas/neón sobre negro, el método **alfa por luminancia** rinde mejor que el flood-fill.
**Verifica sobre claro Y oscuro.** Deja aire arriba para que el botón de favorito no lo tape.
(Aplica a cualquier marca, no solo a las oscuras.)

### Logo ANCHO → dale también un `icono` CUADRADO (aprendizaje de Pilotos)
Un logo **ancho** (tipo emblema con alas) se ve genial en el hero, pero el **cuadrito** de la lista
de inicio y del superadmin es **cuadrado con `object-fit:cover`** → **recorta los lados** y se ve
horrible (solo el centro). El motor soporta un campo **opcional `icono`** en el local (con fallback
a `logo`), que usan Home y Superadmin para el cuadrito. Cuando el logo NO sea aprox. cuadrado,
**genera un `icono.webp` cuadrado**: el logo completo centrado sobre un fondo cuadrado de la marca
(para una marca oscura, un badge negro tipo ícono de app queda perfecto y pesa poquísimo, ~8 KB).
Así el hero luce el logo ancho y el cuadrito muestra el logo entero sin recortar.
`local.logo` = ancho (hero) · `local.icono` = cuadrado (cuadritos).

## 5) El BUSCADOR (genérico, automático)
Para **menús largos**, el motor muestra solo un buscador cuando el local tiene **> 12 productos**
(filtra por nombre/descripción, oculta categorías, "Resultados · N"). No hay que hacer nada; se
adapta al skin del local. Menús cortos no lo muestran.

---

## Criterio final (pregúntatelo antes de entregar)
- ¿La estética salió del **ADN de ESTA marca** (su logo/PDF/rubro), o la copié de otro local?
- ¿Se ve **de ESE negocio** y **distinta** a los demás locales?
- ¿El **logo flota** limpio (transparente), grande, sin recuadro?
- ¿El fondo y la cabecera llevan el color de LA MARCA (no crema por defecto)? ¿Cada color del logo
  tiene su rol (acción · muro · precios · fondo)? ¿Pasa la prueba del entrecierre?
- ¿El skin expresa ESTA marca, sin calcar el de otro local?

Si algo es "no", ajústalo. **Adaptar a la medida, nunca calcar.**
