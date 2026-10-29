# Guía para Mesero y Comandas

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** dos pantallas nuevas por local — **Mesero** (toma comandas rápido) y **Comandas**
  (cocina) — más el link **«Mi pedido»** en los domicilios que llegan por WhatsApp.
- **Inicio:** 29 de octubre de 2026
- **Estado:** 🔵 Construyendo el paso 1 (Mesero + Comandas)
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
- **S6** — El WhatsApp del local se arma en `src/utils/whatsapp.js` (`textoPedido`), que ya mete
  links (Maps, «Responder al cliente»). Ahí entra el link «Mi pedido».

---

## 4. Descartado (no volver a proponer)

---

## 5. Estado de las rondas

- **Ronda 1 — Visión general** ✅ respondida · `Cuestionario-1-Mesero-Comandas.html`
- **Ronda 2 — Paso 1 por dentro** ✅ respondida · `Cuestionario-2-Mesero-Comandas.html`
- **Ronda 3** ❌ no se hace para el paso 1: ya no queda nada que adivinar. Los pasos 2 y 3 tendrán su ronda corta al llegar.

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
- [ ] 1g · **Notificación con la app cerrada** (FCM + función de Vercel). Necesita la llave en
      Vercel (acción del usuario).
- [ ] 1h · Prueba completa en la vista previa (mesero → cocina → listo), desplegar reglas y app.

### Paso 2 — Correcciones con «CUIDADO» *(ronda corta antes)*
### Paso 3 — Link «Mi pedido» + «Confirmar pedido» *(ronda corta antes)*
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
