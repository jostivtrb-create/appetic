# Guía de diseño de pantallas del panel

> Cómo se hace una pantalla del panel de Appetic para que se sienta **ordenada, orgánica y fácil**.
> Sale del rediseño del **Catálogo** (8-nov-2026, guía «Editar el catálogo» y la maqueta del usuario),
> que al usuario le fascinó: *«me fascinó cómo quedó este panel… vamos a replicarlo en las demás
> páginas de la app»*. Toda pantalla nueva o que se rehaga sigue esto.

- **Inicio:** 2026-11-08
- **Estado:** 🔵 Replicando en Configuración (ver §7)

---

## 1. La idea en una línea

**Una pantalla = una tarea.** Arriba dice dónde estás y qué hay; a un lado lo que eliges o
configuras una vez; al otro lado (lo grande) donde trabajas; el detalle se abre aparte (panel o
ventana) y nunca se apila todo en una columna larga.

---

## 2. Las 8 reglas

### R1 · Usar todo el ancho (con aire parejo)
- El panel limita todo a 1120 px (`styles/desktop.css`); una pantalla rediseñada lo quita con la
  clase `admin--ancho` en `.admin` y márgenes de `clamp(24px, 2.6vw, 44px)`.
- **Nunca** una columna angosta flotando en el centro con medio monitor vacío. Eso fue lo primero
  que el usuario señaló («no me gusta todo ese espacio a los lados»).
- El ancho se aprovecha con **columnas**, no estirando campos: un input de precio no mide 1.200 px.

### R2 · Encabezado grande («hero»)
Siempre igual, en una tarjeta con degradé suave hacia naranja:
- **Miga**: `Configuración › Catálogo` (naranja, pequeña).
- **Ícono en baldosa** con degradé naranja + **título grande** (32 px en PC) + **subtítulo** de una línea que dice para qué sirve.
- **Resumen en pastillas**: los 2–4 números o estados que importan (`70 productos`, `21 categorías`, `3 agotados` en rojo).
- **Adorno a la derecha** (solo PC): algo propio del local (fotos de sus platos en círculos), nunca una imagen genérica.

### R3 · Barra de herramientas antes del contenido
La acción principal (botón naranja grande tipo píldora: «+ Nuevo producto») + buscador ancho + filtros
como **selects con cara de botón** (punto de color de estado, «Ordenar: …»). En el celular la acción
principal ocupa todo el ancho y los filtros van de a dos.

### R4 · Dos columnas: lado + trabajo
- **Izquierda (≈290 px, pegada al bajar —`sticky`)**: lo que se elige o se ve de un vistazo (lista de
  categorías, estado, ajustes cortos) en una tarjeta con su título, contador y una fila por ítem con
  foto/ícono, nombre y número a la derecha. Lo elegido: fondo naranja suave + raya naranja a la izquierda.
- **Derecha**: la tarjeta grande de trabajo, con encabezado «Productos de la categoría: **Pizzas**»
  (la parte variable en naranja), acciones de esa cosa a la derecha (✏️ Editar, 🗑, ↑↓) y contador.
- **En el celular**: la izquierda se vuelve una fila de pastillas que se desliza, encima del trabajo.

### R5 · Tarjetas, no formularios sueltos
- Cada cosa es una **tarjeta** blanca, borde suave, radio 18–24 px, sombra mínima; al pasar el
  mouse sube 2 px y la sombra crece.
- Las **cuadrículas** de tarjetas usan `repeat(auto-fill, minmax(300px, 1fr))`: 3 columnas en un
  monitor, 2 en tablet, 1 en celular, sin tocar nada.
- Cierra la cuadrícula una **tarjeta punteada «+ Agregar…»** que crea ahí mismo.
- Encabezado de tarjeta = **baldosa de ícono** (38 px, fondo naranja suave) + título en negrita 900.

### R6 · El detalle se abre aparte, organizado en pestañas
- Editar algo con muchos campos → **panel lateral desde la derecha** (pantalla completa en el
  celular) con **pestañas** (General · Precios · Adiciones · Dónde sale), cabecera con la foto y el
  nombre en vivo, y **pie fijo**: acciones secundarias a la izquierda (Borrar, Duplicar), Cancelar y
  el botón naranja a la derecha.
- Cosas cortas (crear categoría, confirmar) → **ventana** centrada en PC, desde abajo en el celular
  (`Ventana` de `CatalogoCategorias.jsx`).
- Dentro, **secciones en tarjetas** con su título; nada de 12 campos seguidos.

### R7 · Lenguaje de controles único
- **Interruptor** (switch naranja de 48×28) para sí/no, con título en negrita y una línea gris que explica la consecuencia.
- **Píldoras/chips** para estados: verde «● Disponible», rojo «● Agotado», naranja para avisos.
- **Plata**: campo con el `$` o `+$` pegado adentro.
- **Elegir de una lista** (íconos, días): cuadrícula de botones, no teclear a ciegas.
- **Botones**: naranja = la acción; borde = secundaria; rojo solo para borrar y siempre pregunta antes.
- **Arrastrar** con manija ⠿ (`useArrastre.js`, mouse y dedo).

### R8 · Que se sienta vivo y seguro
- Lo que se apaga se ve **gris** (agotado, categoría pausada) y un **aviso amable** explica por qué y ofrece arreglarlo («▶️ Reanudar»).
- Estados vacíos con ícono grande + qué hacer («Esta categoría todavía no tiene productos»).
- Avisos al **salir sin guardar**, al **borrar**; nada se pierde por un toque fuera.
- Consejos que se cierran y no vuelven (`localStorage`), color lila suave.
- Animaciones cortas (0,2–0,3 s): el panel entra desde la derecha, las ventanas suben.

---

## 3. Paleta y medidas (las del catálogo)

| Cosa | Valor |
|---|---|
| Naranja de acción | `var(--brand-orange)` · fondo suave `var(--brand-orange-tint)` |
| Tarjeta | `var(--surface)`, borde `var(--border)`, radio 20–24 px, `var(--shadow-sm)` |
| Fondo de grupo/zona | `var(--surface-2)` |
| Título de página | 32 px / 900 (PC), 24 px (celular) |
| Título de tarjeta | 18–21 px / 900 |
| Texto de ayuda | 13–14 px, `var(--text-soft)` |
| Columna lateral | 290 px, `sticky; top: 96px` |
| Cortes | celular < 600 · tablet 600–1023 · PC ≥ 1024 |

---

## 4. Piezas reutilizables (ya existen)

- `pages/Admin/Catalogo.css` — `ck-hero`, `ck-barra`, `ck-filtro`, `ck-cuerpo`, `ck-cats`, `ck-prods`, `ck-prod`, `ck-nuevo`, `ck-chip`, `ck-switch`, `ck-aviso-pausa`, ventanas `cm-*`.
- `pages/Admin/EditorProducto.css` — panel lateral `ed-*` con pestañas, campos `ed-campo`, `ed-plata`, `ed-switch`.
- `pages/Admin/CatalogoCategorias.jsx` — `Ventana`.
- `pages/Admin/useArrastre.js` — arrastrar para ordenar.
- `pages/Admin/PanelPagina.jsx` + `PanelPagina.css` — **encabezado y estructura comunes** para las demás páginas (se crean al replicar; ver §7).

---

## 5. Cómo se rehace una pantalla (paso a paso)

1. **Capturar cómo está** (PC 1600 px con la barra lateral `?preview=1&super=1`, y celular 390 px) con `web/captura.mjs`.
2. **Separar** lo que se configura una vez (va al lado) de donde se trabaja (va grande).
3. **Hero** con miga, título, subtítulo y 2–4 pastillas de resumen.
4. Pasar cada bloque a **tarjeta** con baldosa de ícono; agrupar campos relacionados.
5. Lo largo o raro → **ventana o panel lateral**.
6. **No tocar la lógica** (qué guarda, cuándo, validaciones): solo el dónde y el cómo se ve.
7. Probar en PC, laptop (1366) y celular; compilar; publicar; anotar aquí en §7.

---

## 6. Lo que NO se hace

- Columnas de 860 px centradas con medio monitor vacío.
- Formularios de 12 campos seguidos sin agrupar («collage de configuración»).
- Botones que el usuario no pidió solo por copiar una maqueta: de la maqueta se copia el **orden**, no los botones.
- Clases CSS genéricas (`.ia`, `.on` sueltas): chocan con otras pantallas. Prefijo por pantalla (`ck-`, `ed-`, `md-`…).

---

## 7. Bitácora de pantallas

| Pantalla | Estado | Notas |
|---|---|---|
| Configuración → Catálogo | ✅ 8-nov | El modelo (`1bcc553`, `3dcfb13`, `417935c`). |
| Configuración → Menú del día | ✅ 8-nov | Primera con las piezas comunes `PanelPagina.jsx/.css` (PanelHero, PanelCuerpo, PanelLado, PanelTarjeta, PanelSwitch). Lado: Hoy · 7 días con «n/6 partes» · Precio y horario · Qué trae. El interruptor «Ofrecer» y «Se guarda solo» van en el hero. |
| Configuración → Negocio y horario | 🔵 siguiente | |
| Configuración → Cuentas y pagos | ⏳ | |
| Configuración → Apariencia | ⏳ | |
| Configuración → Impresora | ⏳ | |
| Configuración → Menú en Pantalla | ⏳ | |
| Configuración → Equipo | ⏳ | |
| Configuración → Mi plan | ⏳ | |

---

## 8. Cómo encender una pantalla rehecha

1. Agregar su id a `AJUSTES_ANCHOS` en `src/config/ajustes.js` (quita el título pequeño y le da todo el ancho).
2. La página pinta su propio `<PanelHero>` y usa `<PanelCuerpo lado={<PanelLado …/>}>` con `<PanelTarjeta>` adentro.
3. Las clases propias de la página llevan su prefijo (`cmd-` en Menú del día) y solo ajustan lo que las piezas comunes no traen.
