# Guía para Editar el catálogo

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** que editar productos sea fácil y ordenado («que no se vea como un collage de configuración»), y que desde el panel de categorías se puedan agregar, editar, mover y eliminar categorías.
- **Inicio:** 2026-11-08
- **Estado:** 🔵 Construyendo
- **Proyecto:** Appetic (`src/pages/Admin/AdminProductos.jsx`, `Catalogo.css`, `AdminPage.jsx`)

---

## 1. Objetivo

Pedido del usuario (8-nov), justo después de rediseñar la lista del catálogo a dos columnas según su maqueta:
*«Ahora mejoremos la forma de editar para que sea fácil para los usuarios y se vea todo organizado. Si hay un panel de categorías, desde ahí editar las categorías, agregar nuevas, moverlas o eliminarlas… que no se vea como un collage de configuración.»*

---

## 2. Decisiones CERRADAS

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| D1 | **El editor de producto es un panel que se desliza desde la derecha** (en el celular, pantalla completa). | P1. El catálogo se sigue viendo detrás y no se pierde el sitio. |
| D2 | **Adentro va en PESTAÑAS.** | P2 (el usuario prefirió pestañas a tarjetas en una sola página). |
| D3 | **Panel de categorías con:** agregar, renombrar, cambiar el ícono (emoji), mover arrastrando y eliminar. | P3, todas marcadas. |
| D4 | **El dueño crea y edita TODO de las adiciones:** grupos, opciones, precios y reglas (obligatorio, cuántas). | P4. |
| D5 | **Orden de los productos dentro de la categoría: arrastrando las tarjetas.** | P5. |
| D6 | **Las categorías vacías ya NO se borran solas.** Se quita `podarCategoriasVacias`. | Sugerencia S1 de la ronda. |
| D7 | **Eliminar una categoría con productos pregunta:** moverlos a otra categoría o borrarlos. | Sugerencia S2. |
| D8 | **Se puede pausar una categoría entera** (esconderla sin borrar nada). | Sugerencia S3. El cómo (a mano o por horario) va en la ronda 2. |
| D9 | **Duplicar producto, desde el editor.** | Sugerencia S4. |
| D10 | **Avisa antes de cerrar el editor con cambios sin guardar.** | Sugerencia S5. |

### De la ronda 2

| # | Decisión | Por qué |
|---|----------|---------|
| D11 | **Biblioteca de ADICIONALES sueltos del local** (ej.: Jamón, Queso, Papas, Tocino), cada uno con su precio. En el editor de un producto, pestaña Adiciones: se escogen de la biblioteca; si no está, **se crea ahí mismo y queda en la biblioteca** con su precio; y **desde ahí mismo se le cambia el precio** (cambia en todos los productos que lo usan). | P1 + la observación del usuario, casi textual: «entro a editar mi salchipapas y me dice qué adicionales quieres poner… si no sale el que necesito lo puedo crear desde ahí pero ya queda en la biblioteca con su precio; también desde ahí lo puedo modificar». |
| D12 | **Pausar una categoría a mano y también por horario** (días y franja de horas). | P2. |

---

## 3. Suposiciones del agente

Lo que averigüé leyendo el código (8-nov) y no se pregunta:

- **S1** — El editor de producto (`EditorProducto` en `AdminProductos.jsx`) es una hoja modal (`pm-sheet`) con, en una sola columna: foto (del dispositivo o «Crear con IA» → Gemini), nombre, descripción, categoría (select + «Crear categoría nueva…» con emoji), ⭐ Nuestro fuerte (uno por categoría), 📺 Mostrar en el Menú en Pantalla, precio único o «precios por tamaño» (variantes), y los grupos de opciones que ya traiga el producto (solo nombre y foto de cada opción; cuántas por tamaño). Al final «Borrar producto» y «Guardar».
- **S2** — Las categorías viven en `local.categorias` = `[{ id, nombre, emoji }]`; el orden del arreglo es el orden del menú. Hoy solo se crean desde el editor de un producto (`addCategoria`) y se reordenan con ↑↓ (`reordenarCategorias`). No hay renombrar, cambiar emoji ni eliminar.
- **S3** — `podarCategoriasVacias` (AdminPage) BORRA las categorías que se quedan sin productos cada vez que se mueve o borra un producto. Choca con un panel donde se crean categorías vacías → va como sugerencia en la ronda 1.
- **S4** — Los grupos de opciones (`gruposOpciones`: `{ id, nombre, subtitulo, emoji, tipo: 'unica'|'multiple', min, max, maxPorVariante?, opciones:[{ id, nombre, emoji, foto, precioExtra }] }`) van COPIADOS dentro de cada producto. Hoy el dueño no puede crear grupos, ni cambiar `precioExtra`, `min`/`max` ni `tipo`; solo nombre y foto de las opciones existentes. Los montamos nosotros con los scripts `seed-*.mjs`.
- **S5** — Los productos tienen `orden` (el menú lo respeta), pero no hay interfaz para cambiarlo.
- **S6** — Esconder una categoría del Menú en Pantalla ya existe aparte (Configuración → Menú en Pantalla); no se duplica aquí.
- **S7** — La receta del inventario (insumos por plato) vive en Inventario (`AdminInventario`), no en el editor.
- **S9** — Pestañas del editor (D2): **General** (foto, nombre, descripción, categoría, ⭐ fuerte) · **Precios** (precio único o por tamaños) · **Adiciones** (grupos y opciones) · **Dónde sale** (disponible, Menú en Pantalla). Duplicar y Borrar van en el pie del panel, junto a Guardar. *(decidido por mí: no cambia nada de fondo)*
- **S10** — El ícono de la categoría se elige de una cuadrícula de emojis de comida (con opción de escribir otro), no tecleándolo a ciegas. *(decidido por mí)*
- **S11** — Arrastrar (D3, D5) funciona con mouse y con el dedo, agarrando una manija ⠿; en el celular además quedan las flechas ↑↓ porque arrastrar en una lista que se desliza es torpe. *(decidido por mí)*
- **S12** — Pausar una categoría (D8) la saca del menú del cliente y del Menú en Pantalla; en la Caja y el Mesero no aparece, igual que un agotado (la Caja ya esconde los agotados). *(decidido por mí; el usuario lo desmiente si quiere)*
- **S13** — Modelo de la biblioteca (D11): `local.adiciones = [{ id, nombre, precio, emoji?, foto? }]` en el documento del local (los precios ya son públicos en el menú). En el producto, `gruposOpciones` SIGUE IGUAL (S8), y cada opción que viene de la biblioteca guarda además `ref: <id del adicional>` con nombre, precio y foto copiados. Así el menú, el TV y el servidor (`api/_lib/precios.js`) no cambian; al cambiar un adicional en la biblioteca, la app actualiza todos los productos que lo usan. *(decidido por mí)*
- **S14** — En la pestaña Adiciones cada producto tiene grupos (D4): por defecto uno, «Adiciones» (opcional, puede elegir varios); con «+ Otro grupo» se arma, por ejemplo, «Elige tu salsa» (obligatorio, elige 1). Las opciones de TODOS los grupos salen de la misma biblioteca. Las reglas (obligatorio, cuántas, cuántas por tamaño) son del grupo, no del adicional. *(decidido por mí: une D4 con D11)*
- **S15** — Los grupos que ya existen (montados por nosotros) se pasan a la biblioteca solos la primera vez: cada opción con el mismo nombre y el mismo precio queda como UN adicional. Si el mismo nombre tiene precios distintos en distintos productos, se crean dos con el mismo nombre (en la biblioteca se distinguen por el precio) para no cambiarle el precio a nadie ni mostrarle «Queso (2)» al cliente. *(decidido por mí)*
- **S16** — Horario de la categoría (D12): `categoria.pausada` (a mano) y `categoria.horario = { dias: ['lun',…], de: 'HH:MM', a: 'HH:MM' }`, hora de Colombia. Fuera del horario o pausada → no sale en el menú del cliente ni en el Menú en Pantalla, el servidor rechaza el pedido como si estuviera agotada, y en Caja/Mesero no aparece (ver S12). *(decidido por mí)*
- **S17** — En la demo las reglas no dejan borrar categorías (guía «Blindaje» D5): ahí Eliminar avisa «En la demo no se borran categorías». No se tocan las reglas.
- **S8** — El menú de la propuesta web y el TV leen los mismos campos: cualquier cambio de modelo debe mantener compatibles `gruposOpciones` y `categorias` tal como están.

---

## 4. Descartado (no volver a proponer)

---

## 5. Estado de las rondas

- **Ronda 1 — Visión general** ✅ respondida (8-nov) · `Cuestionario-1-Editar-catalogo.html`
- **Ronda 2 — Adiciones y pausa** ✅ respondida (8-nov) · `Cuestionario-2-Adiciones-y-pausa.html`
- **Ronda 3** ❌ no se hace: con D11–D12 ya no queda nada que adivinar.
  - Se sacó para la ronda 2: «¿las adiciones se comparten entre productos (biblioteca) o cada producto las suyas?» — depende de que el dueño las pueda crear (Ley 1).

---

## 6. Plan de construcción

- [x] 1 · Utilidades: `utils/categorias.js` (¿la categoría se vende ahora? pausa + horario) y `utils/adiciones.js` (biblioteca, pasar los grupos viejos, sincronizar los productos).
- [x] 2 · AdminPage: quitar `podarCategoriasVacias` (D6); renombrar, ícono, eliminar con mover/borrar productos (D7), pausar/horario (D12), ordenar categorías y productos; guardar la biblioteca y sincronizar.
- [x] 3 · Panel de categorías: «+ Nueva categoría», menú ⋯ por fila (Editar · Pausar · Eliminar), arrastrar con manija ⠿ (D3), ventana de categoría con nombre, cuadrícula de íconos y horario.
- [x] 4 · Arrastrar las tarjetas de producto para ordenarlas (D5).
- [x] 5 · Editor en panel lateral derecho con pestañas General · Precios · Adiciones · Dónde sale (D1, D2, S9); Duplicar (D9); aviso al salir sin guardar (D10).
- [x] 6 · Pestaña Adiciones con la biblioteca (D11, S13–S15).
- [x] 7 · Respetar la pausa y el horario en el menú del cliente, el Menú en Pantalla, Caja/Mesero y el servidor (S16).
- [ ] 8 · Probar en el navegador (PC y celular), compilar, publicar.

---

## 7. Bitácora

- **8-nov-2026 · construcción.**
  - Archivos nuevos: `utils/categorias.js` (pausa y horario), `utils/adiciones.js` (biblioteca, migración, sincronizar), `pages/Admin/useArrastre.js` (arrastrar con Pointer Events: mouse y dedo), `CatalogoCategorias.jsx` (ventanas de categoría), `EditorProducto.jsx/.css` (panel lateral con pestañas).
  - AdminPage: se quitó `podarCategoriasVacias`; nuevas `editarCategoria`, `eliminarCategoria`, `reordenarProductos`, `guardarAdicion`, `borrarAdicion`, y la migración automática a la biblioteca la primera vez que el dueño abre el catálogo.
  - Pausa/horario respetados en el menú del cliente (`LocalMenu`), Menú en Pantalla (`platosDelTV`), Caja/Mesero (`CajaVender`) y el servidor (`api/pedido.js` los marca agotados).
  - Problema: el botón «Crear con IA» usaba la clase `.ia`, que ya existe (aviso de clientes, `position: fixed`) y se pegaba abajo. Se renombró a `.ed-btn-ia`.
  - Probado en la vista previa: crear grupo, marcar de la biblioteca, crear adicional nuevo, guardar; crear categoría con ícono y horario (sale «fuera de su horario»); arrastrar categorías; eliminar moviendo productos; aviso al salir sin guardar; duplicar.
