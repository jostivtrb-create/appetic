# Guía para los Planes en la app

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** que la app respete los planes Emprendedor · Comerciante · Empresario, controle el pago de
  cada local y se apague de verdad cuando no pagan, como promete la propuesta.
- **Inicio:** 2 de noviembre de 2026
- **Estado:** ✅ **Terminada y publicada** — 2 de noviembre de 2026 (`aad6b96`)
- **Proyecto:** `/home/zevenoficial07/Apps Zeven/Swiftfly Solutions/Appetic`
- **Viene de:** `Guía para los planes por tipo de negocio.md` (qué trae cada plan, D1–D18). Los socios ya
  aceptaron los planes (2-nov-2026), así que se levanta la pausa de su D16.

---

## 1. Objetivo

Que cada plan reciba lo que paga, y que la promesa de la propuesta, *«Sin contratos: mes a mes. Dejas de
pagar y se apaga»*, sea verdad. En sus palabras: crear todo lo que dice la propuesta y, de paso, arreglar
lo que esté mal hecho en vez de ignorarlo por viejo.

---

## 2. Decisiones CERRADAS

### Heredadas de «planes por tipo de negocio» (no se vuelven a preguntar)

| # | Decisión | De |
|---|----------|----|
| H1 | Escalera: lo que trae un plan lo traen los más grandes. | D1 |
| H2 | Emprendedor = menú + pedidos para recoger por WhatsApp + TV + menú del día + caja y cuentas · Comerciante = + domicilios · Empresario = + mesero, cocina, QR y cuenta por mesa. | D2, D7, D8, D13 + propuesta |
| H3 | La app esconde lo que no trae el plan. | D10 |
| H4 | El dueño ve con candado «Disponible en el plan X»; sus clientes y su equipo no lo ven. | D18 |
| H5 | Los locales montados hoy son de muestra: plan Empresario, sin cobro. | D17 |
| H6 | El plan lo cambia solo el superadmin. | S6 |

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| D1 | **Fecha de «pagado hasta» que apaga sola.** Sin interruptor manual de «al día / suspendido». | R1, la recomendada. |
| D2 | **Al cortar se apaga todo:** el menú público queda «temporalmente fuera de servicio» y el panel del dueño solo muestra el aviso de pago. Al pagar vuelve todo como estaba; no se borra nada. | R2, la recomendada. |
| D3 | **Calendario del corte:** aviso al dueño **5 días antes** de la fecha → vence → **3 días de gracia** (con aviso) → **corte**. | R2 (obs.: *"que avise 5 días antes y deje 3 días de vencido y ahí sí corte"*) + R3. |
| D4 | **Historial de pagos en la app**, con lo cobrado por mes (las cuentas de Appetic). La fecha «pagado hasta» sale de los pagos registrados. | R4, la recomendada. |
| D5 | **«Mi plan» en la Configuración del dueño:** su plan, hasta cuándo está pago y botón «Subir de plan» → WhatsApp de ventas. | R5, la recomendada. |
| D6 | **El dueño decide en Configuración si sale en el buscador.** Si dice que no, quien entra por su link o su QR **no tiene salida al buscador**: se queda en el menú de ese local. Si dice que sí, todo normal. | R6, obs.: *"él decide desde configuración y si no quiere aparecer… no le sale la opción de entrar al buscador, es decir queda bloqueado"*. |
| D7 | **Si no paga, tampoco sale en el buscador**, decida lo que decida el dueño. | R6, obs.: *"y si no paga se bloquea también el salir en el buscador"*. |
| D8 | **El cajero va desde el Emprendedor.** | R7, la recomendada. |
| D9 | **Estado «En montaje»** antes del primer pago: funciona para el dueño y para ti, no sale en el buscador, no corre la fecha. | S1, la recomendada. |
| D10 | **La demo siempre muestra todo** (Empresario), sin selector de plan. | S2. |
| D11 | **El plan Desarrollador queda fuera de esta tarea.** | S4. |

### De la ronda 2

| # | Decisión | Por qué |
|---|----------|---------|
| D12 | **«En montaje» funciona completo (clientes pueden pedir) por 7 días;** si no se registra el pago, se corta solo. | R1, la recomendada. |
| D13 | **Local fuera del buscador = «solo este local»:** sin botón de buscar; Favoritos y Mis pedidos muestran solo ese local; si escribe la dirección de inicio a mano, vuelve al menú del local. | R2, la recomendada. |
| D14 | **Todo negocio donde el cliente haga un pedido le queda solo en Favoritos.** | R2, obs.: *"que cualquier negocio donde hagan un pedido automáticamente les quede en favoritos"*. |
| D15 | **Un local nuevo arranca SIN salir en el buscador;** el dueño lo prende. | R3. |
| D16 | **Subir de plan:** se activa ya y se cobra la diferencia de los días que faltan (la app la calcula). **Bajar:** queda programado y se aplica cuando se acaba lo pagado. | R4, la recomendada. |
| D18 | **Pilotos queda en Comerciante (cortesía)**: fue el primer cliente y se le vendió con domicilios, sin límite. El usuario le va a ofrecer más de Appetic. | Pedido explícito al publicar. |
| D17 | **Pago después del corte:** el mes nuevo cuenta **desde el día que paga**. Dentro de la gracia, cuenta desde la fecha vencida. | R5, la recomendada. |

---

## 3. Suposiciones del agente

- **S1** — Hoy `suscripcion.activa` **solo decide si el local sale en el buscador**
  (`services/locales.js:30`). Todos los locales reales tienen `activa: false, plan: 'piloto'`, y el menú y
  el panel funcionan igual. Por eso hoy «dejar de pagar» no apaga nada. *(deducida de: `services/locales.js`,
  `services/superadmin.js`, `src/dev/*.js`)*
- **S2** — 🔴 **Hueco de seguridad:** la regla de `locales/{id}` deja que el dueño actualice cualquier campo
  de su propio local, `suscripcion` incluida (solo la demo lo tiene bloqueado). El dueño podría ponerse en
  el buscador, y con planes podría subirse de plan él mismo. **Se arregla en esta tarea:** `suscripcion` (y
  lo que la reemplace) solo la escribe el superadmin. *(deducida de: `firestore.rules`, bloque `match /locales/{localId}`)*
- **S3** — El plan se hace cumplir en dos capas: la interfaz (secciones de `PanelRail.jsx` /
  `AdminPage.jsx`, opciones del checkout, roles de Equipo, QR por mesa) **y** `firestore.rules`
  (pedidos a domicilio, comandas, equipo según el plan). Si solo se esconden botones, se puede usar lo que
  no se pagó.
- **S4** — Qué se esconde por plan, según el código de hoy:
  - **Emprendedor:** Caja · Cuentas · Ver menú · Difundir · Configuración (Catálogo, Negocio, Cuentas y
    pagos, Apariencia, Equipo, Pantalla de TV, Menú del día). Checkout solo «Recoger».
  - **Comerciante:** + sección Domicilios, opción Domicilio en el checkout (envío por distancia), rol
    domiciliario y afiche de domicilios.
  - **Empresario:** + Mesero, Cocina, roles mesero y cocina, QR por mesa / cuenta por mesa
    (`local.mesas`, `utils/mesaQR.js`).
- **S5** — La «S3» de la guía anterior (las cuentas no existen) **ya no es cierta**: las cuentas del negocio
  están publicadas (`AdminCuentas.jsx`, commit `98f083c`).
- **S7** — **«Vencen esta semana» en el superadmin: sí**, con botón que abre WhatsApp con el recordatorio de
  cobro escrito para el dueño. Quedó sin responder (S3 de la ronda 1); lo decido porque es barato y es lo
  que hace útil al D3.
- **S8** — Con D6, el interruptor de buscador del superadmin **pasa al dueño**. El superadmin lo sigue
  pudiendo cambiar porque entra a cualquier local como dueño.
- **S9** — El aviso de los 5 días y de la gracia lo ve **solo el dueño** (y el superadmin). Equipo y clientes
  no ven nada hasta el corte.
- **S10** — Al cliente final el corte **no le dice que el local no pagó**: solo «temporalmente fuera de
  servicio». La pantalla de TV también se apaga.
- **S11** — Locales de muestra (H5) y la demo: Empresario **sin vencimiento** (estado «cortesía»); no
  aparecen en «vencen esta semana» ni en lo cobrado.
- **S12** — El 2.º mes gratis aplica al **primer pago** de un local que empiece antes del 31-dic-2026: paga 1
  mes y cubre 2. No se suma con el pago adelantado (paga 5 → 6, paga 10 → 12), como dice la propuesta.
- **S13** — Bajar de plan no borra nada: las secciones se esconden, los roles del equipo que el plan no trae
  dejan de funcionar (se reactivan al volver a subir) y el QR por mesa deja de recibir pedidos.
- **S14** — D14 sin sesión: hoy los favoritos solo existen con sesión de Google (`FavoritosContext.jsx`).
  Al pedir **con sesión** el local se agrega a su perfil; **sin sesión** queda guardado en el aparato y se
  suma a su perfil cuando inicie sesión. Nunca se quita solo.
- **S15** — La diferencia al subir = (precio mensual nuevo − precio mensual viejo) ÷ 30 × días que faltan,
  redondeada a la centena. El superadmin la puede corregir antes de guardar.
- **S16** — Los locales que hoy salen en el buscador (`suscripcion.activa: true`) siguen saliendo: se
  copian a `enBuscador`. D15 es solo para los nuevos.
- **S17** — El reloj del montaje arranca al **crear** el local (seed). Si el montaje se alarga, el
  superadmin pulsa «Montaje (7 días)» y vuelve a contar desde hoy.
- **S18** — La **bajada** de plan se aplica al registrar el próximo pago: el formulario del pago ya viene
  con el plan más chico. En los días de gracia sigue con el plan viejo.
- **S19** — El recordatorio de cobro va al **WhatsApp del local** (`local.whatsapp`), que en todos los
  locales de hoy es el del dueño.
- **S20** — «Solo este local» se recuerda en el aparato (`localStorage`), no solo en la visita: así la app
  instalada (que abre en «/») también vuelve al menú. Se suelta al entrar a un local que sí sale en el
  buscador, o si el local se apaga. Dueños, equipo y superadmin nunca quedan encerrados.
- **S6** — Los datos nunca se borran por bajar de plan o por vencerse: solo se esconden o se bloquean.

---

## 4. Descartado (no volver a proponer)

—

---

## 5. Estado de las rondas

- **Ronda 1 — Visión general (pago, apagado, buscador, «Mi plan», cajero)** ✅ respondida ·
  `Cuestionario-1-Planes-en-la-app.html`
- **Ronda 2 — Montaje, local sin buscador, cambios de plan, reactivación** ✅ respondida
- **Ronda 3** ❌ no se hace: ya no queda nada que adivinar. (Los HTML respondidos se borraron.)

---

## 6. Incógnitas abiertas

Ninguna.

---

## 7. Plan de implementación

**Modelo de datos** (en `locales/{id}`):
- `suscripcion = { plan, estado, montajeDesde, pagadoHasta, corteEn, bajarA }`
  - `plan`: emprendedor · comerciante · empresario
  - `estado`: montaje · activo · cortesia (muestras y demo, sin vencimiento)
  - `corteEn`: el momento exacto del corte (pagadoHasta + 3 días, o montajeDesde + 7 días). Lo usan
    las reglas para apagar sin depender de nadie.
  - `bajarA`: plan programado para cuando se acabe lo pagado (D16).
- `enBuscador` (bool, lo cambia el dueño) — reemplaza a `suscripcion.activa`.
- Colección **`pagos`** (solo superadmin): `{ localId, nombre, plan, tipo: pago|diferencia, promo, meses, monto, fecha, desde, hasta }`.

**Pasos**
- [x] 1 · `utils/plan.js`: planes, precios, qué trae cada uno, `estadoPago(local)` (montaje / al día / por vencer / gracia / cortado / cortesía) y el cálculo de `pagadoHasta`, promociones y diferencia.
- [x] 2 · Reglas: cerrar el hueco S2 (`suscripcion`, `admins`, `esDemo`, `prioridad`, `etiquetas` solo el superadmin); `pagos/` solo superadmin; plan y corte en pedidos, comandas, equipo y QR por mesa.
- [x] 3 · Superadmin: plan, estado y «pagado hasta» por local · registrar pago (promo y diferencia calculadas) · programar bajada · historial · cobrado por mes · «Vencen esta semana» con WhatsApp.
- [x] 4 · Panel del dueño: secciones según plan con candado (D18) · aviso 5 días antes y en gracia · panel cortado con solo el aviso de pago · «Mi plan» en Configuración · interruptor «Salir en el buscador».
- [x] 5 · Cliente: menú y TV «temporalmente fuera de servicio» al cortar · checkout sin Domicilio en Emprendedor · QR por mesa solo Empresario · roles del equipo según plan.
- [x] 6 · Buscador: solo `enBuscador` y al día · modo «solo este local» (D13) · favorito automático al pedir (D14).
- [x] 7 · Migración (`scripts/migrar-planes.mjs --aplicar`, respaldo en `scripts/.seed-backups/`) y la demo/seeds al formato nuevo.
- [x] 8a · Probado: vista previa (cada plan y estado, móvil y escritorio) y reglas en el emulador (25 de 25).
- [x] 8b · Publicado el 2-nov-2026: migración (11 locales) → reglas → app (`aad6b96`), verificado en el sitio.

---

## 8. Bitácora

- **2 de noviembre de 2026** — Se abre la guía. Investigado: `firestore.rules`, `config/roles.js`,
  `PanelRail.jsx`, `Superadmin.jsx`, `services/superadmin.js`, `services/locales.js` y la guía de planes.
  Aparece el hueco S2.
- **2 de noviembre de 2026** — Construido todo el plan (pasos 1 a 8a). Notas:
  - *Sobre la marcha:* el hueco S2 era más grande: el dueño también podía ponerse `prioridad` (el
    «Recomendado» del inicio), cambiar sus `etiquetas` y hasta los `admins`. Ahora todo eso es solo del superadmin.
  - *Sobre la marcha:* los seeds pisaban `suscripcion` al re-sembrar (con `merge` el plan volvía a
    `'piloto'`). `suscripcion` y `enBuscador` pasan a `CAMPOS_DEL_DUENO` en todos los seeds y en la
    plantilla de /Agregar_Menu, que además ahora crea los locales en montaje con su reloj.
  - *Sobre la marcha:* «Cocina» depende del plan en un solo sitio (`usaCocina` en `services/comandas.js`):
    sin Empresario las comandas nacen listas para cobrar. El interruptor del dueño se guarda aparte, así
    que si sube de plan vuelve como lo tenía.
  - *Sobre la marcha:* el QR por mesa se apaga en `mesaActual()` (`utils/mesaQR.js`), así el cliente con
    QR viejo pide como siempre por WhatsApp.
  - *Sobre la marcha:* en «solo este local» la barra cambia «Buscar» por «Mis pedidos» (si solo se
    quitaba, el botón del pedido dejaba de quedar al centro).
  - *Sobre la marcha:* el inicio no muestra precio de domicilio de locales sin domicilio en su plan, y el
    mensaje de bienvenida de Difundir no promete domicilios.
  - *Sobre la marcha:* el corazón de favoritos funciona sin sesión (en el aparato) y se suma a la cuenta al
    iniciar sesión (D14).
  - *Sobre la marcha:* el superadmin se llama ahora «Locales y planes» (como en la barra). `/superadmin?super=1`
    en DEV lo muestra con datos inventados (`superSimulado.js`) para revisarlo sin sesión.
  - Simulación en DEV para revisar cualquier pantalla: `?plan=emprendedor&pago=gracia`
    (pago: montaje · al-dia · por-vencer · gracia · cortado; `=0` lo quita).
  - Reglas probadas en el emulador con 25 casos (pedidos, domicilio, QR, equipo, corte, pago, hueco S2): todos bien.
- **2 de noviembre de 2026** — Publicado. Migración aplicada a los 11 locales (todos Empresario en
  cortesía; Pilotos pasado a Comerciante por D18 — no usaba mesas, meseros ni cocina, no pierde nada).
  Reglas a `appetic-17477` con `jostivtrb@gmail.com`. App en Vercel; el buscador de producción muestra
  los 7 locales que ya salían.
- **2 de noviembre de 2026** — Pedido del usuario: «todos en Emprendedor, solo Pilotos en Comerciante».
  Pasados a Emprendedor (cortesía): bon-appetit, el-monumento, fruti-tentacion, jasbury, juance,
  la-comarca, sabor-del-dia (ninguno usaba domicilios, mesas ni equipo en los últimos 30 días).
  La demo sigue en Empresario (D10). ⏳ **Pendiente de confirmar:** la-gran-esquina (12 domicilios en
  30 días) y perros-criollos (2) siguen en Empresario: con Emprendedor sus clientes pierden el
  domicilio. Se dejaron así porque el usuario apagó el PC antes de responder.
