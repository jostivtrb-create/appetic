# Guía para Mesero y Comandas

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** dos pantallas nuevas por local — **Mesero** (toma comandas rápido) y **Comandas**
  (cocina) — más el link **«Mi pedido»** en los domicilios que llegan por WhatsApp.
- **Inicio:** 29 de octubre de 2026
- **Estado:** ✅ Pasos 1, 2 y 3 publicados · pendiente: QR por mesa (D3) y pruebas reales del usuario
- **Proyecto:** `Appetic/` (Vite/React + Firebase)

---

## 1. Objetivo

Lo que pidió el usuario (29-oct-2026), en sus palabras resumidas:

- **Mesero:** el mismo menú pero **más rápido y práctico** (no como el del comensal). Pide la orden
  con **comentario por ítem**, al final elige **número de mesa o un nombre**, o **para llevar**, y
  envía la comanda. Ve todos los pedidos en curso «de forma sencilla» y puede **corregir** uno
  mientras no esté tachado en cocina; el cambio se le avisa a cocina. Si ya se tachó: aviso
  «CUIDADO, este pedido ya se realizó, ve a cocina» con dos salidas — **confirmar que va a cocina**
  (deja hacer el cambio y la comanda se destacha con el cambio) o **cancelar el cambio**.
- **Admin:** botón **agregar mesero por correo**; ve sus meseros activos, los **desactiva o elimina**.
- **Comandas (cocina, celular/tablet):** grande, clara, pocos botones; **por orden de llegada**;
  un toque para expandir; **contador** desde que salió hasta que se entregó; **color + texto grande**
  que separa **para llevar** y **para mesa**; **tachar por ítem** (tandas) o **toda la comanda de un
  golpe**; si se tachan todos los ítems aparece **«confirmar que se entregó todo»** con
  **confirmación grande**.
- **Domicilios de la app:** el WhatsApp que llega al local trae un link **«Mi pedido»**. Si lo abre
  el **cliente** ve solo su resumen; si lo abre el **mesero o el admin** ve además **«Confirmar
  pedido»**, que (1) manda la comanda a cocina y (2) le avisa al cliente por WhatsApp que su orden
  fue hecha.
- **Ir por pasos y bien hecho, no a las carreras.**

---

## 2. Decisiones CERRADAS

### Heredadas de la propuesta (`Guía para la propuesta nueva de Appetic.md`, 25-oct-2026)

Se vendieron así; siguen vigentes salvo que esta tarea las cambie (la ronda 1 confirma D13 y D14).

| # | Decisión | Por qué |
|---|----------|---------|
| P-D9 | La comanda es **una pantalla** en la cocina, sin impresora térmica. | Lo que se vendió. |
| P-D10 | **Solo comanda a cocina.** Sin caja ni cuenta de la mesa. | Menos trabajo, suficiente para arrancar. |
| P-D13 | Pedido de mesa por dos vías: **QR de la mesa** **y** el mesero. | Ronda 1 (D3): el QR sigue, pero **en una etapa posterior**. |
| P-D14 | El pedido llega a la **pantalla de cocina y al WhatsApp** del local. | Ronda 1 (D4): **cambia** para el mesero — su comanda va solo a Comandas. Los pedidos de la app siguen llegando al WhatsApp. |
| P-D19 | **Meseros y pantallas sin límite** en el plan de $49.000. | Precio vendido. |

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| D1 | **Cocina es un rol más:** el admin agrega correos de «cocina», igual que los meseros. Cada tablet entra con su cuenta de Google. | P1. Lo más seguro; mismo mecanismo que meseros. |
| D2 | **Orden:** 1) Mesero toma pedido + Comandas · 2) Correcciones con «CUIDADO» · 3) Link «Mi pedido» de domicilios. Cada paso queda funcionando y probado antes del siguiente. | P2. Primero el corazón salón→cocina, luego lo delicado, luego WhatsApp. |
| D3 | **QR por mesa: sí, pero en una etapa posterior** (después del paso 3). | P3. No se saca de la propuesta; se pospone. |
| D4 | **La comanda del mesero va solo a Comandas**, no al WhatsApp del local. | P4. El WhatsApp del dueño no se llena con cada mesa. |
| D5 | **Un solo paso:** la cocina confirma «entregado» y el contador para ahí. **Además**: al mesero le llega el aviso de «listo» con un botón que **parpadea** si está en la pestaña Mesero (igual al admin); si está en otra parte de la app, le llega como **notificación**. | P5 + observación. |
| D6 | **Confirmación al cliente:** se abre WhatsApp con el mensaje escrito y el mesero/admin toca Enviar. Sin API paga. | P6. Gratis; igual que «Responder al cliente» de hoy. |
| D7 | **Los pedidos de la app para recoger también pasan por «Confirmar pedido»**, igual que los domicilios. Ningún pedido de la app entra a cocina sin confirmar. | P7. Evita pedidos de broma en cocina. |
| D8 | **Cocina suena y no se apaga:** sonido al llegar cada comanda + pantalla siempre encendida mientras esté abierta. | S1. |
| D9 | **El mesero puede cancelar una comanda completa**; cocina la ve «CANCELADA» en grande. | S2. |
| D10 | **Una sola pantalla de cocina** (comida y bebidas juntas) por ahora. | S3. |
| D11 | **Sin internet:** aviso claro «no se envió» + botón reintentar. No se envía sola después. | S4. Que el mesero nunca crea que llegó algo que no llegó. |

### De la ronda 3 (paso 2 · correcciones)

| # | Decisión | Por qué |
|---|----------|---------|
| D21 | **El «CUIDADO» sale solo al tocar un ítem YA tachado** (quitarlo o cambiarlo). Lo no tachado se corrige directo. | P1. |
| D22 | **El mesero puede:** quitar un plato · cambiar las opciones de un plato · cambiar o agregar el comentario · cambiar la mesa / nombre / para llevar. **No** cambia cantidades ni agrega platos a una comanda enviada (lo nuevo va como comanda nueva, D12). | P2 (lo que marcó). |
| D23 | **Cocina ve el cambio:** franja «CAMBIÓ» + sonido + lo cambiado resaltado y lo de antes tachado en gris («~~Res~~ → Pollo»). La franja se quita al tocar «Visto». | P3. |
| D24 | **«Ya voy a cocina» destacha solo los ítems que cambiaron.** | P4. |
| D25 | **Cualquier mesero del local y el admin pueden corregir, con registro** de quién y cuándo. | P6 + obs. |
| D26 | **Rastro visible** en cocina y en el mesero: quién la tomó y quién la cambió y cuándo. | S1 + obs. |
| D27 | **El contador sigue desde que llegó** y la comanda marca «cambió hace X min». | S2. |

### De la ronda 4 (paso 3 · «Mi pedido»)

| # | Decisión | Por qué |
|---|----------|---------|
| D28 | **«Mi pedido» REEMPLAZA a «Responder al cliente»** en el WhatsApp del pedido. Un solo link. | P1. |
| D29 | **El mesero ve «Pedidos de la app por confirmar»** en su pantalla, con aviso y sonido; cualquier mesero o el admin los confirma desde ahí (además del link). | P2. |
| D30 | **Cocina: DOMICILIO con su propio color; RECOGER se ve como PARA LLEVAR** (con la palabra RECOGER). | P3. |
| D31 | **El cliente, al reabrir «Mi pedido», ve el resumen + en qué va:** Recibido → En cocina → Listo / En camino (se actualiza solo). | P4. |
| D32 | **Rechazar un pedido** («No podemos atenderlo») con WhatsApp listo y mensaje amable; queda marcado rechazado. | S1. |
| D33 | **Avisar al cliente que su domicilio va en camino** (WhatsApp listo). | S2. Ver ronda 5: quién lo manda. |
| D34 | **Al corregir un pedido de la app, si cambia el total:** «el total cambió, avísale al cliente» con WhatsApp listo. | S3. |

### Pedido nuevo del usuario (29-oct-2026, con la ronda 4)

| # | Decisión | Por qué |
|---|----------|---------|
| D35 | **Panel de DOMICILIOS por local**, igual que meseros: el admin agrega domiciliarios por correo (activar/desactivar/eliminar). **Un solo panel** para todos, **sin asignar** domicilios a uno en particular. | Pedido explícito: «no nos compliquemos». |
| D36 | **Cada local maneja sus propios domiciliarios.** Se RETIRAN los domiciliarios globales de Appetic (lista del superadmin, `config/domiciliarios`), la página `/domiciliario` con búsqueda por código y la entrada «Repartos/Domiciliarios» del superadmin. | Pedido explícito: «ya no vamos a manejar nosotros los domiciliarios». |
| D37 | **Al confirmar un domicilio, aparece de una vez con toda su información en el panel de Domicilios** (sin código que buscar). | Pedido explícito. |

### De la ronda 5 (panel de Domicilios)

| # | Decisión | Por qué |
|---|----------|---------|
| D38 | **El domiciliario marca «Voy en camino»** (abre WhatsApp: «tu pedido va en camino») **y «Entregado».** El cliente ve el paso en «Mi pedido». | P1. Resuelve D33: el aviso lo manda quien lo lleva. |
| D39 | **Al domiciliario le suena / le llega aviso cuando la cocina deja el domicilio LISTO** para salir (también con la app cerrada si activó los avisos). | P2. |
| D40 | **El admin ve el panel de Domicilios completo; el mesero no.** | P3. |
| D41 | **Sin «Lo llevo yo» por ahora**: cada local tiene un domiciliario por día. Se crea solo si un local lo pide. | S1: marcó «Sí» pero la observación dice «por ahora no» → se tomó la observación. |
| D42 | **Sin cuadre de efectivo**: va en el plan más caro con contabilidad. | S2. |

---

## 3. Suposiciones del agente

- **S1** — Hoy **no existe nada** de esto: no hay tiempo real (`onSnapshot` en ningún lado), el
  único estado de pedido es `'nuevo'`, las reglas prohíben `update` de pedidos y **el dueño no
  puede leer sus propios pedidos** (solo superadmin y domiciliarios). Todo eso hay que construirlo.
  *(verificado: `src/services/pedidos.js`, `firestore.rules:67-88`)*
- **S2** — Los pedidos se borran solos a los **2 días** (`ttl`). Para comandas del día alcanza.
  *(`pedidos.js:12,58`)*
- **S3** — Los ítems del pedido hoy guardan las opciones como **texto plano**; para que el mesero
  pueda **editar** un pedido hay que guardar también la selección estructurada (`seleccion`).
  *(`pedidos.js`, `CartContext.jsx`)*
- **S4** — El molde para «agregar por correo / quitar» ya existe: `DomiciliariosGlobal` en
  `Superadmin.jsx:79-155`. Los meseros serán **por local** (no globales como los domiciliarios).
- **S5** — Las secciones del panel ya son páginas (`/:slug/admin/:panel`) con la barra lateral;
  Mesero y Comandas entran ahí. Un mesero que no es dueño necesita que `usePuedePanel` lo deje
  ver la barra (hoy solo dueño/superadmin).
- **S7** — **Dónde se agregan los correos:** el botón «Agregar mesero» va en la página **Mesero** y
  «Agregar cocina» en la página **Comandas** (cada uno con su lista: activos, desactivar, eliminar).
  Desactivado = sigue en la lista en gris y se puede reactivar; eliminado = sale de la lista.
- **S8** — **Qué ve cada rol en la barra:** el mesero solo «Mesero»; la cocina solo «Comandas»; el
  admin todo. Un mismo correo puede tener los dos roles.
- **S9** — **El aviso de «listo»** le llega al mesero que mandó esa comanda y a los admins del local
  (no a todos los meseros).
- **S10** — **Cada envío es una comanda aparte.** Si la mesa 4 pide otra ronda, es una segunda
  comanda «MESA 4»; en la vista del mesero se agrupan por mesa.
- **S11** — **Cancelar** sigue la misma regla que corregir (D9 + paso 2): si cocina ya tachó algo,
  sale el «CUIDADO». En el paso 1 se construye la cancelación simple; el CUIDADO llega en el paso 2.
- **S12** — **Colores mesa/llevar con la marca (D16):** MESA usa el color principal del local y
  PARA LLEVAR su color de acento, siempre con la palabra en grande. Si los dos colores de un local
  se parecen demasiado (se mide el contraste), el de llevar cae a uno fijo bien distinto. La cocina
  es clara aunque el menú del local sea oscuro (Pilotos, Juance).
- **S13** — **Mesa «en proceso»** = tiene al menos una comanda sin entregar ni cancelar.
- **S14** — **Notificaciones con la app cerrada (D17) sin plan pago de Firebase:** Appetic no tiene
  Cloud Functions (exigen el plan Blaze). Se hace con una **función de Vercel** (`/api/…`, gratis en
  el plan actual) que manda la notificación con Firebase Cloud Messaging. **Requiere una acción del
  usuario:** pegar la llave de servicio de Firebase como variable secreta en Vercel (no por chat).
  En iPhone solo llega si la app está **instalada en la pantalla de inicio** (límite de Apple).
  Va como último sub-paso del paso 1, para que lo demás funcione antes.
- **S15** — **Historial:** las comandas se guardan en `locales/{id}/comandas` **sin borrado
  automático** por ahora (son livianas). El historial pide 20 a la vez.
- **S16** — **Los minutos del contador** se configuran en la página Comandas (solo admin).
  Por defecto: amarillo a los 10 min, rojo a los 20.
- **S17** — **Una comanda ENTREGADA no se corrige** (P5 «decide tú»): lo que haya que rehacer entra
  como comanda nueva; el historial queda limpio.
- **S18** — **La duda de P1 (van a la mitad y no han tachado):** el sistema solo sabe lo tachado. Por
  eso todo cambio exige que la cocina toque **«Visto»**; el mesero ve «⏳ Cocina aún no ha visto el
  cambio» → «✓ Cocina vio el cambio», y si pasa 1 minuto sin verlo, «Ve a avisarle a cocina».
- **S19** — **Cambiar la mesa** de una comanda que ya tiene algo tachado también pide el CUIDADO (lo
  ya hecho pudo salir para la mesa equivocada). **Quitar el último plato no se permite**: para eso
  está «Cancelar comanda».
- **S20** — **Se guarda sin pisar a la cocina:** la corrección se aplica sobre la comanda recién leída
  (transacción). Si mientras el mesero editaba la cocina tachó ese plato, sale el CUIDADO antes de guardar.
- **S21** — **Privacidad de «Mi pedido»:** hoy los pedidos NO se leen desde la app a propósito
  (teléfono y dirección del cliente). El link lleva un id imposible de adivinar; el CLIENTE lee un
  **resumen aparte sin teléfono ni dirección**; el mesero/admin (con sesión) lee el pedido completo
  (las reglas les abren la lectura de los pedidos de SU local). El pedido se crea con id propio
  para poder poner el link en el WhatsApp antes de enviarlo.
- **S22** — **Confirmar es una sola vez:** transacción; si dos lo tocan a la vez, entra una comanda y
  al otro le dice «ya lo confirmó Ana».
- **S23** — El detalle del domicilio reutiliza lo que ya mostraba el panel viejo
  (`Domiciliario.jsx`): dirección + mapa, llamar, WhatsApp al cliente, platos, totales, método de
  pago y «paga con $X (cambio $Y)».
- **S24** — **Estados del pedido de la app:** `nuevo` → (confirmar) `en-cocina` → (cocina entrega)
  `listo` → (domiciliario) `en-camino` → `entregado`; o `rechazado`. «Recoger» termina en `listo`
  («Listo para recoger»). El resumen público copia el estado para «Mi pedido».
- **S25** — **La comanda de un pedido de la app usa el MISMO id del pedido** (confirmar dos veces
  no puede crear dos comandas) y guarda `pedidoId`. Destino `domicilio` / `recoger` con el nombre del
  cliente. Al corregirla (paso 2) se actualizan también los platos y el total del pedido, para que el
  domiciliario cobre lo correcto.
- **S26** — **Tras confirmar**, en vez de abrir WhatsApp solo (los navegadores bloquean ventanas que
  no salen de un toque), queda un botón grande «💬 Avisar al cliente por WhatsApp». En el celular
  se intenta abrir directo.
- **S6** — El WhatsApp del local se arma en `src/utils/whatsapp.js` (`textoPedido`), que ya mete
  links (Maps, «Responder al cliente»). Ahí entra el link «Mi pedido».

---

## 4. Descartado (no volver a proponer)

---

## 5. Estado de las rondas

- **Ronda 1 — Visión general** ✅ respondida · `Cuestionario-1-Mesero-Comandas.html`
- **Ronda 2 — Paso 1 por dentro** ✅ respondida · `Cuestionario-2-Mesero-Comandas.html`
- **Ronda 3 — Paso 2: correcciones con «CUIDADO»** ✅ respondida · sin ronda extra: no queda nada que adivinar.
- **Ronda 4 — Paso 3: «Mi pedido»** ✅ respondida
- **Ronda 5 — Panel de Domicilios** ✅ respondida · no hay más rondas para el paso 3.

---

## 6. Incógnitas abiertas

1. Detalle de las correcciones con «CUIDADO» (paso 2). *(ronda corta al llegar)*
2. Detalle del link «Mi pedido» (paso 3). *(ronda corta al llegar)*

---

## 7. Plan de implementación

### Paso 1 — Mesero toma pedido + Comandas

- [x] 1a · **Datos y seguridad.** Roles en el local (`meseros`, `cocina` + inactivos). Colección
      `locales/{id}/comandas` (tipo mesa/llevar, mesa o nombre, ítems con comentario y tachado,
      estado activa/entregada/cancelada, horas, quién la mandó). Reglas de Firestore: leen y escriben
      solo admin, meseros y cocina de ESE local. Índices. Servicio con escucha en tiempo real.
- [x] 1b · **Equipo:** «Agregar mesero» (página Mesero) y «Agregar cocina» (página Comandas):
      correo, lista de activos, desactivar/reactivar, eliminar. Solo el admin.
- [x] 1c · **Entrar con cada rol:** el mesero ve solo «Mesero» en la barra y la cocina solo
      «Comandas»; el admin todo. (Extender `AdminContext` / `usePuedePanel` / `PanelRail`.)
- [x] 1d · **Pantalla Mesero:** menú compacto con buscador + hoja de opciones (las mismas del
      cliente), comentario por ítem, teclado de mesa / otro nombre / para llevar, aviso de mesa en
      proceso, enviar con «no se envió · reintentar», lista de comandas en curso agrupadas por mesa,
      cancelar comanda, botón que parpadea con el «listo».
- [x] 1e · **Pantalla Comandas:** fila por orden de llegada en tiempo real, cerrada/expandida,
      contador con colores (minutos del admin), tachar por ítem o toda, «confirmar entregado»
      grande, CANCELADA, sección Entregadas con Deshacer + historial por partes, sonido al llegar,
      pantalla siempre encendida, colores del local con MESA/LLEVAR en grande.
- [x] 1f · **Aviso «listo» dentro de la app** en cualquier pantalla (aviso arriba + sonido) para el
      mesero que la mandó y los admins.
- [x] 1g · **Notificación con la app cerrada** (llave en Vercel en base64; falta solo la prueba en un celular real del usuario) (FCM + función de Vercel). Necesita la llave en
      Vercel (acción del usuario).
- [x] 1h · Prueba completa en la vista previa (mesero → cocina → listo), desplegar reglas y app.

### Paso 2 — Correcciones con «CUIDADO»

- [x] 2a · **Datos:** `api.corregir()` en transacción (Firestore y demo). Por ítem: `cambio`
      { antes, en, por } y `quitado`. Por comanda: `destinoAntes`, `cambios[]` (rastro),
      `cambioPendiente` + `cambiadaEn`, totales recalculados sin lo quitado.
- [x] 2b · **Mesero:** «Corregir» en cada comanda de «En curso»: quitar / cambiar opciones (mismo
      modal, con lo elegido) / comentario / mesa. CUIDADO al tocar lo tachado (o la mesa con algo
      tachado) con «Ya voy a cocina» o «Cancelar el cambio». Estado «⏳ / ✓ cocina vio el cambio»
      y «Ve a avisarle» al minuto. Cancelar comanda con algo tachado también pasa por el CUIDADO.
- [x] 2c · **Cocina:** franja «CAMBIÓ» + sonido, antes/después, «QUITADO» en gris, «Visto»,
      «cambió hace X min», rastro (quién la tomó · quién la cambió).
- [x] 2d · Prueba de punta a punta en la vista previa y publicar.

### Paso 3 — «Mi pedido» + confirmar + panel de Domicilios

- [x] 3a · **Datos y reglas:** pedido con id propio (+ productoId y descripción por plato) y su
      **resumen público** `pedidosPublicos` (sin teléfono ni dirección, con TTL); el personal del
      local lee y mueve los pedidos de SU local; rol `domiciliario` en el equipo; índices.
- [x] 3b · **WhatsApp:** «Mi pedido» reemplaza «Responder al cliente».
- [x] 3c · **Página «Mi pedido»** `/p/:slug/:id`: cliente → resumen + en qué va (en vivo);
      mesero/admin → todo + «Confirmar pedido» / «No podemos atenderlo» + WhatsApp al cliente.
- [x] 3d · **Mesero:** «Pedidos de la app por confirmar» con aviso y sonido.
- [x] 3e · **Cocina:** DOMICILIO con su color, RECOGER como para llevar; al entregar, el pedido
      pasa a `listo` y se avisa al domiciliario. Correcciones: sincronizan el pedido y avisan si
      cambió el total.
- [x] 3f · **Panel de Domicilios** (admin + domiciliario): en cocina / listo / en camino, detalle
      completo, «Voy en camino» (WhatsApp) y «Entregado»; equipo de domiciliarios; avisos.
- [x] 3g · **Retirar lo viejo:** domiciliarios globales, `/domiciliario`, búsqueda por código,
      entradas del superadmin, reglas y servicio.
- [x] 3h · Prueba de punta a punta y publicado (reglas + índices + app)

### Después — QR por mesa (D3)

---

## 8. Bitácora

- **29-oct-2026** — Investigación del código (pedidos, WhatsApp, roles, reglas, panel) y ronda 1.
- **29-oct-2026** — Ronda 1 respondida (D1–D11). Ronda 2 enfocada en el paso 1 (mesero + comandas); las preguntas de correcciones y de «Mi pedido» se dejan para cuando lleguemos a esos pasos.
- **29-oct-2026** — Ronda 2 respondida (D12–D20). Sin ronda 3. Plan del paso 1 escrito; arranca 1a.
- **29-oct-2026** — Construidos 1a–1f y probados de punta a punta en la vista previa (mesero en
  celular + cocina en tablet, en dos pestañas): pedido con opciones y comentario → teclado mesa 4 →
  aviso de «mesa en curso» → cocina recibe en orden → tacha por tandas → confirmación grande →
  el mesero ve «¡Pedido listo!» parpadeando; cancelar → cocina ve CANCELADA; Entregadas con
  Deshacer; ventana de equipo; aviso global del «listo» en otra pantalla. **Sin desplegar todavía.**
  - Archivos: `services/comandas.js`, `services/equipo.js`, `pages/Admin/AdminMesero.jsx`,
    `AdminComandas.jsx`, `AdminEquipo.jsx`, `comandaUtils.js` (+ CSS), `components/AvisoListo/`,
    cambios en `AdminContext`, `PanelRail`, `BottomNav`, `PanelMenuBoton`, `AdminPage`,
    `ProductModal` (modo `compacto`), `services/locales.js` (`getLocalById`), `App.jsx`,
    `firestore.rules`, `firestore.indexes.json`.
  - Decidido sobre la marcha: el equipo va en la subcolección **privada** `locales/{id}/equipo`
    (no en el doc del local, que es público); id de comanda generado ANTES de enviar y reusado en
    los reintentos (nunca queda repetida); tachar es por LÍNEA; el modal de opciones del mesero es
    el MISMO del cliente en modo compacto; motor DEMO de comandas (localStorage + BroadcastChannel)
    para probar en `?preview=1`; en DEV `?equipo=slug:mesero|cocina` simula al personal.
  - Pendiente del paso 1: **1g** (notificación con la app cerrada — necesita la llave de Firebase en
    Vercel y la clave de notificaciones web) y **1h** (subir reglas + índices y desplegar).
- **29-oct-2026** — Paso 1 PUBLICADO (reglas + índices + app). Agregado «¿Qué lleva?» (pedido del
  usuario): ⓘ en cada producto del mesero y en cada ítem de la comanda (aparte del botón de tachar);
  la comanda guarda la `descripcion` del plato al enviarse.
- **29-oct-2026** — 🐞 **Fuga entre locales** (la encontró el usuario): con acceso a varios locales,
  el pedido a medio armar de uno pasaba al otro al cambiar desde la barra (la pantalla no se
  reiniciaba y además guardaba el carrito viejo con la clave del local nuevo). Arreglo: `key={local.id}`
  en Mesero/Comandas, cada línea guarda `localId` y se cruza con el menú al abrir y al enviar.
  Quedó en producción una comanda de prueba en Jasbury (mesa 2) con 2 platos de otro local.
- **29-oct-2026** — «Sin conexión con la cocina» = la escucha falló mientras los índices se
  construían y no reintentaba. Ahora se reconecta sola (3 s → 30 s) y el aviso dice la causa.
- **29-oct-2026** — 1g construido: `ActivarAvisos` en Mesero, `public/firebase-messaging-sw.js`
  (alcance propio, config por URL), `services/notificaciones.js`, `api/notificar-listo.js` (Vercel),
  reglas de `dispositivos`. Problemas resueltos: (1) `vercel.json` reescribía /api al index.html →
  se excluyó; (2) **firebase-admin 14 no carga en Vercel** (`jwks-rsa` hace `require()` de `jose`,
  que es ESM, y Vercel no lo permite) → se fijó **firebase-admin 12.7.0** (+ `engines.node 22.x`);
  se diagnosticó haciendo que la función cargue firebase-admin dentro de la petición y devuelva el
  motivo. **Falta:** que el usuario ponga `FIREBASE_SERVICE_ACCOUNT` en Vercel y redespliegue.
- **29-oct-2026** — La primera llave pegada en Vercel llegó alterada (JSON multilínea); la función ahora acepta la llave en base64 de una línea (`scripts/serviceAccount.base64.txt`, ignorado por git). Verificado: la función arranca y rechaza sin sesión. Arranca la ronda 3 (paso 2).
- **29-oct-2026** — Ronda 3 respondida (D21–D27, S17–S20). Arranca el paso 2.
- **29-oct-2026** — Paso 2 construido y probado en la vista previa (mesa 5: cambiar opciones de un
  plato sin tachar → directo; quitar la pizza ya tachada → CUIDADO → «Ya voy a cocina» → guardar →
  cocina ve «CAMBIÓ» + antes/después + QUITADO → «Visto» → el mesero ve «✓ Cocina vio el cambio»).
  `aplicarCorreccion()` probada con 9 casos (incluye mesa con algo tachado, quitar el último plato,
  comanda ya entregada, sin cambios reales). Decidido sobre la marcha: tachar, tachar todo y
  entregar en la cocina también van en **transacción** (sin eso un tachado podía pisar una
  corrección guardada en el mismo segundo). Los modales de opciones aceptan `inicial` para abrir
  con lo ya elegido. El teclado de mesa pasó a `Teclado.jsx` (lo comparten tomar y corregir).
- **29-oct-2026** — Ronda 4 (paso 3) entregada.
- **29-oct-2026** — Ronda 4 respondida (D28–D34) + pedido nuevo: panel de Domicilios por local que reemplaza a los domiciliarios globales (D35–D37). Ronda 5 corta para el panel.
- **29-oct-2026** — Ronda 5 respondida (D38–D42). Plan del paso 3 escrito; arranca 3a.
- **29-oct-2026** — Paso 3 construido y probado en la vista previa: pedido a domicilio de la app →
  «Pedidos de la app por confirmar» en Mesero (amarillo) → vista completa → Confirmar → «Enviado a
  cocina» + «Avisar a Juan por WhatsApp» → cocina: DOMICILIO morado → entregado → panel Domicilios:
  «Listos para salir» con dirección, mapa, llamar, WhatsApp, platos, vueltas → «Voy en camino» (abre
  «tu pedido va en camino») → «Mi pedido» del cliente muestra «En camino», sin teléfono ni dirección.
  - Decidido sobre la marcha: la VISTA PREVIA ya no escribe pedidos en la base real (motor demo,
    antes ensuciaba Firestore); la nota del pedido va pegada al comentario del primer plato en la
    comanda; deshacer un «entregado» en cocina devuelve el pedido a «En cocina» solo si el
    domiciliario no ha salido; cancelar la comanda de un pedido de la app lo deja «rechazado».
  - Retirado: `src/pages/Domiciliario/`, `services/domiciliarios.js`, la sección del superadmin y
    sus entradas en la barra, `esDomiciliarioGlobal/puedeVerRepartos`, la búsqueda por código y la
    regla de `config/domiciliarios`. `/domiciliario` redirige a /cuenta. El doc
    `config/domiciliarios` queda en la base sin uso (no estorba).
  - El despliegue a producción lo frenó la protección automática de la sesión: se pide permiso.
- **29-oct-2026** — Paso 3 PUBLICADO con permiso del usuario (reglas + índices + app `86c6573`). Los índices de pedidos tardan en construirse; las listas de pedidos ahora se reconectan solas (`089cea0`).
