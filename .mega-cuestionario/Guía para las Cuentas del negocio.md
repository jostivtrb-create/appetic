# Guía para las Cuentas del negocio

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** programar el punto 5 de la propuesta, «Tus cuentas, claras»: cierre de caja por medio
  de pago, gastos y compras, nómina y ganancia del día y del mes. Que quede bien conectado con
  comandas, mesero, cocina y domicilios, que sea intuitivo y que se sienta profesional. De paso,
  arreglar lo que esté mal hecho en esa zona del panel.
- **Inicio:** 2 de noviembre de 2026
- **Estado:** ✅ **Publicada** — 2 de noviembre de 2026 · reglas e índices desplegados, app en producción (commit `98f083c`)
- **Proyecto:** `/home/zevenoficial07/Apps Zeven/Swiftfly Solutions/Appetic`
- **Viene de:** `Guía para los planes por tipo de negocio.md` (D9: las cuentas se vendieron como si
  ya existieran) y `Guía para la Cuenta por mesa.md` (la Caja actual).

---

## 1. Objetivo

En sus palabras: *"arranquemos con las cuentas y con los errores que notaste… para ver qué más le
podemos meter como para que quede bien conectado e intuitivo y que quede como una app profesional"*.

Lo que promete la propuesta (pág. 6): ventas del menú, las mesas y los domicilios que entran solas;
cierre de caja en efectivo, Nequi y tarjeta; gastos y compras del día; pago de nómina; ganancia del
día y del mes, con comparación contra el mes anterior y una gráfica de los últimos meses. Aclara que
**no es facturación electrónica DIAN**.

---

## 2. Decisiones CERRADAS

### Antes del cuestionario (2-nov-2026, en el chat)

| # | Decisión | Por qué |
|---|----------|---------|
| **D1** | **Se construyen las cuentas Y los planes en la app.** Deja sin efecto D16 de la guía de planes por tipo («esperar a los socios»). | Sus palabras: *"los socios dicen si los cobros están bien, pero los paneles sí o sí toca crearlos"*. Los socios solo opinan sobre los precios. |
| **D2** | **Orden: primero las cuentas**, después la pantalla del TV y de último los planes (esconder por plan). | Recomendación aceptada: las cuentas van en los tres planes y no existe nada. |
| **D3** | **Se arreglan los nombres cruzados del panel**: hoy la sección `caja` se llama «Comandas» y la `comandas` se llama «Cocina». | Error señalado en el análisis y aceptado. |
| **D4** | **El cobro guarda con qué se pagó.** Deja sin efecto D7 de la guía «Cuenta por mesa» («no se registra cómo pagó»). | Sin ese dato no hay cierre por efectivo, Nequi y tarjeta, que es lo que promete la propuesta. |
| **D5** | **`RESUMEN-APPETIC.md` borrado** y quitado del README. | Sus palabras: *"no creo que lo estemos usando"*. Contaba el modelo viejo (menú gratis, sin demos). |

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| **D6** | **Toda venta pasa por la app.** No hay totales sueltos ni ventas por fuera. Para eso se crea una **CAJA (punto de venta)**: una pantalla para armar pedidos, parecida a la del mesero pero **optimizada para PC**. | P1. Sus palabras: *"el tráiler debe registrar todo… necesitamos una CAJA desde la cual se puedan hacer pedidos… para que ya la app desde el plan EMPRENDEDOR sea por donde registran todas sus ventas y gastos"*. |
| **D7** | **Sin abrir ni cerrar caja: saldos que se van sumando, por cuenta de dinero.** Cada local tiene sus **cuentas de dinero** (Efectivo, Nequi, Bold, Daviplata, el banco…) y **puede crear las que quiera**. Cada venta suma a su cuenta. El dueño puede **sacar** (retiro) o **meter** plata en cualquier cuenta, y el saldo sigue desde ahí. Ej.: hay $200.000 en efectivo, saca $120.000 y quedan $80.000. | P2 (observación). Reemplaza las opciones de «base + cuadre» y «resumen automático». |
| **D8** | **Rol nuevo «Cajero»** en Equipo: cobra, usa la Caja y anota gastos. **No ve la ganancia.** Se pueden tener **varios cajeros**, como los meseros. | P3 + S4 (*"al igual que al mesero se pueden habilitar CAJAS"*). |
| **D9** | **Gastos: lista simple**, solo concepto y valor. Sin categorías ni fotos. | P4. |
| **D10** | **Nómina = pagos sueltos sobre una lista de trabajadores.** El dueño tiene a su gente en una lista. Al «Pagar nómina» escoge a la persona, el valor y **los días que cubre ese pago, en un calendario bonito y rápido**. Queda el registro de a quién se le pagó y qué días. No importa si es por horas, turnos o días: la app no calcula sueldos. | P5 (observación): *"en un sistema bien bonito y óptimo de calendario que no se sienta tedioso"*. |
| **D11** | **El cobro admite** medio de pago (D4), **pago dividido** en dos medios, **propina** y **descuento o cortesía**. | P6. |
| **D12** | **Dos secciones: «Caja»** (el día: vender, cobrar, gastos, saldos) **y «Cuentas»** (el mes: ganancia, nómina, gráfica; solo el dueño). | P7. |
| **D13** | **Si el local no usa pantalla de cocina, el pedido confirmado queda listo para cobrar de una.** | S1. Sin esto, el Emprendedor (sin cocina) nunca podría cobrar. |
| **D14** | **Lo que no se confirma en la app no cuenta.** No hay aviso de pedidos sin confirmar. | S2. |
| **D15** | **«Métricas» se funde dentro de «Cuentas».** Se ve el movimiento (visitas, pedidos, domicilios cuando aplique) y, aparte, lo que de verdad se vendió. El «Estimado» desaparece. | S3 (observación). |
| **D16** | **Domicilio en efectivo:** cuando el domiciliario llega, entrega la plata y el cajero o el dueño toca «Cobrar», como si el cliente estuviera en frente. | S4 (observación). No hace falta un cuadre aparte del domiciliario. |
| **D17** | **Botón para descargar el mes** (Excel o PDF). | S5. |
| **D18** | **Que salga bien a la primera**, profesional y sin errores. Me pidió ideas (P8). | P8: *"no quiero errores, quiero sacarlo a la primera bien óptimo"*. |

### De la ronda 2

| # | Decisión | Por qué |
|---|----------|---------|
| **D19** | **La Caja tiene «Cobrar ya» y «Mandar y cobrar después».** Cobrar ya: la venta se cobra al instante y va a cocina si el local la usa. Mandar: queda en por cobrar. | P1. |
| **D20** | **La mesa se cobra entera** (todas sus comandas, con una sola propina y un solo descuento), y se puede seguir cobrando comanda por comanda. | P2. Ajusta D15 de «Cuenta por mesa». |
| **D21** | **Una sola lista: las cuentas de dinero son los medios de pago.** Cada cuenta dice si el cliente la ve al pedir. Si el cliente pidió con Nequi, al cobrar ya sale Nequi marcado. | P3. Reemplaza `local.pagos` como fuente única. |
| **D22** | **El cajero solo usa la Caja** (vender, cobrar, gastos). **Cuentas es del dueño**: saldos, retiros, ingresos, mover plata, nómina, ganancia. El dueño ve las dos secciones. | P4: *"la pestaña Caja sea para vender, ya la de Cuentas la maneja el dueño"*. |
| **D23** | **Historial de ventas como el del POS de La Catrina** (Registro Infiniity): agrupado por día con el total del día, cada fila con hora · qué se vendió · quién · cómo pagó · total, y un detalle al tocarla. **Desde el detalle se puede cambiar el medio de pago o eliminar la venta**, y queda en un **filtro «Eliminadas» con quién lo hizo y por qué** (el motivo es obligatorio). | P5 + S2 (observación): *"el historial me fascina… que se pueda modificar el pago de esa venta… o eliminarla, pero que salga en un historial o con un filtro las ventas eliminadas junto al nombre de quien lo hizo y por qué"*. Mejora sobre La Catrina, que borra sin motivo y no muestra las anuladas. |
| **D24** | **Saldos: se arranca en cero y el dueño mete plata cuando quiera** (ingreso), igual que saca. No hay saldo inicial aparte. | S1 (observación). |
| **D25** | **Botón «Mover entre cuentas»**, que no cuenta como gasto ni como venta. | S2. |
| **D26** | **Sin comisión automática de Bold o datáfonos**: si el dueño quiere, la anota como gasto. | S3. |
| **D27** | **Ideas que entran:** calcular las vueltas en efectivo · atajos de teclado y buscador en la Caja del PC · platos más vendidos y horas pico · ticket promedio · resumen del día por WhatsApp. | P6. |
| **D28** | **Ideas que NO entran:** imprimir tirilla · ventas y propinas por mesero. | P6 (no marcadas). |

### En el chat, durante la construcción (2-nov-2026)

| # | Decisión | Por qué |
|---|----------|---------|
| **D29** | **La Caja y el Mesero copian el ORDEN y la ESTÉTICA del POS de La Catrina** (Registro Infiniity), con los colores de Appetic y del local, no el café y dorado: cabecera con fichas de plata · pestañas (Vender · Ventas · Gastos; abajo en el celular, segmentadas arriba en PC) · fila de cuentas abiertas (⚡ Rápida, una ficha por mesa o pedido por cobrar con su color y total, ＋ Mesa) · cuadrícula de fichas de producto con contador y «−», ⭐ Frecuentes primero · ticket fijo a la derecha en PC con el gran «Cobrar $X» · barra abajo y hoja en el celular · historial con encabezados de día pegajosos. | Sus palabras: *"la estética de meseros y caja también sacarla de Catrina, me gusta mucho; obviamente los colores no, pero sí el orden y la estética"*. |
| **D30** | **Se quita la lista de «pedidos por confirmar» del panel** (Caja, Mesero y Domicilios). Cada local atiende sus pedidos en su WhatsApp. Si quiere, todavía puede confirmar uno desde el link que trae el mensaje (así el cliente lo sigue en «Mi pedido» y el domiciliario lo ve). | Sus palabras: *"no me gusta que esa lista salga ahí, quitemos lo de pedidos por confirmar de la app, que cada local esté pendiente de su WhatsApp y listo"*. Pilotos tenía 157 pedidos sin confirmar desde julio llenando la Caja. Refuerza D14: lo que no se registra en la Caja no cuenta como venta. |

---

## 3. Suposiciones del agente

- **S1** — **Lo que existe hoy en la zona de cobro:** la sección `caja` (`AdminCaja.jsx`, rótulo
  «Comandas») lista las comandas *por cobrar* (listas y en proceso) y las *cobradas*, con
  «Ya se cobró» y deshacer. Guarda `porCobrar`, `cobradaEn` y `cobradaPor`; **no guarda el medio de
  pago**. *(deducida de: `src/pages/Admin/AdminCaja.jsx`, `src/services/comandas.js`)*
- **S2** — **Las comandas no se borran solas; los pedidos de la app sí** (TTL de 2 días). Las
  cuentas tienen que apoyarse en las comandas (o en un registro propio), nunca en los pedidos.
  *(deducida de: `src/services/pedidos.js:27`)*
- **S3** — **El pedido de la app ya trae el medio de pago** que escogió el cliente (`metodoPago`,
  `metodoPagoNombre`, `efectivoCon`), de la lista `local.pagos` (efectivo · transferencia ·
  datáfono). Hoy no pasa a la comanda; se puede pasar y dejarlo preseleccionado al cobrar.
  *(deducida de: `pedidos.js:70`, `comandaDe()`, `src/dev/burgerDemo.js:56`)*
- **S4** — **Las comandas del mesero y del QR de mesa no traen medio de pago**: se escoge al cobrar.
  *(deducida de: `CheckoutMesa.jsx:14`)*
- **S5** — **«Métricas» cuenta otra cosa:** visitas, pedidos enviados al WhatsApp y un *«Estimado»*
  en plata que sale de pedidos **enviados**, no cobrados. *(deducida de: `AdminMetricas.jsx`,
  `services/stats.js`)*
- **S6** — **Las cuentas solo las ve quien administra** (los dos correos de `local.admins` y el
  superadmin). Meseros, cocina y domiciliarios no ven plata del negocio. *(deducida de:
  `config/roles.js`, la Caja actual es solo admin)*
- **S7** — **Los totales del mes se guardan en documentos resumen** (como `stats/d_YYYY-MM-DD`), no
  leyendo todas las comandas cada vez, para cuidar el costo de Firestore. *(deducida de:
  `services/stats.js`, «cuida costos D32»)*
- **S8** — **La vista previa (`?preview=1`) y la demo `/demo` traen cuentas de ejemplo** llenas,
  con el mismo motor demo en el navegador que usan comandas y pedidos. *(deducida de: los dos
  motores de `comandas.js` y `pedidos.js`)*
- **S9** — **Las comandas cobradas antes de esto no tienen medio de pago**: salen como «sin dato» y
  no se inventa nada. *(deducida de: D4 + el modelo actual)*
- **S10** — **Sigue sin ser facturación DIAN**: nada de factura electrónica, NIT ni impuestos.
  *(deducida de: la propuesta, pág. 6)*

- **S11** — **El «día» de las cuentas sigue el horario del local**, no la medianoche. Si abre a las
  18:00 y cierra a las 02:00, lo de la madrugada cuenta para la jornada anterior. Ya existe esa
  lógica en `utils/horario.js` (`diaVigente`). *(deducida de: el código; dicho en la intro de la ronda 2)*
- **S12** — **«¿El local usa pantalla de cocina?» es un interruptor en Configuración** (`local.usaCocina`).
  Si no está puesto cuenta como encendido: los locales de hoy son de muestra con todo (D17 de planes).
  Cuando existan los planes, el Emprendedor y el Comerciante lo tienen apagado. *(deducida de: D13;
  hoy no existe ningún dato que lo diga, y el cajero no puede leer Equipo para deducirlo)*
- **S13** — **Un gasto sale de una cuenta de dinero** (por defecto Efectivo), para que los saldos
  de D7 cuadren. Lo mismo un pago de nómina. *(deducida de: D7 + D9 + D10)*
- **S14** — **La lista de trabajadores de la nómina es aparte de Equipo**, porque Equipo exige
  correo y mucha gente que cobra sueldo no usa la app. Se puede escoger a alguien de Equipo para
  no escribirlo dos veces. *(deducida de: `services/equipo.js` + D10)*
- **S15** — **La propina entra a la cuenta de dinero donde se pagó, pero no se suma como venta ni
  como ganancia.** Se muestra aparte. *(deducida de: D11)*
- **S16** — **La Caja se diseña primero para PC**, pero funciona en tablet y celular, como el resto
  del panel. *(deducida de: D6 + `useEsEscritorio`)*

- **S17** — **El cajero puede cambiar el pago o eliminar ventas del día de hoy**, siempre con motivo
  y dejando su nombre. **El dueño puede hacerlo con cualquier día.** Los gastos se corrigen igual.
  *(deducida de: D22 + D23; el historial vive en la Caja, que es la pantalla del cajero)*
- **S18** — **Nada se borra de verdad.** Eliminar marca la venta (`eliminada: {por, motivo, en}`),
  devuelve la plata de su cuenta y la saca de los totales. *(deducida de: D23)*
- **S19** — **Fiado o deuda no entra** (La Catrina lo tiene, pero aquí nadie lo pidió y la propuesta no
  lo promete). *(deducida de: la propuesta + las respuestas)*

- **S20** — **Las cuentas de dinero son la lista `local.pagos` ampliada** (D21): cada una con
  `alCliente` (si sale en el checkout). Hoy esa lista **no se puede editar desde el panel** (solo con
  el seed): se crea **Configuración → Cuentas y pagos**. Los saldos **no** van en el documento del
  local, que es público: van en `locales/{id}/resumen/saldos`, privado. *(deducida de: `Checkout.jsx`,
  `AdminConfig.jsx`, `firestore.rules`)*
- **S21** — **El cajero también confirma los pedidos de WhatsApp** desde la Caja: en un tráiler sin
  mesero nadie más lo haría. *(deducida de: D6 + D8; hoy «Por confirmar» vive en la pantalla del mesero)*
- **S22** — **La descarga del mes es Excel (.csv que abre Excel) y PDF (página para imprimir o
  guardar)**, sin librerías nuevas. *(deducida de: D17)*
- **S23** — **Atajos de la Caja en PC:** escribir busca, Enter agrega el primero, F2 cobra,
  Esc limpia; se muestran en una línea de ayuda. *(deducida de: D27)*

---

## 4. Descartado (no volver a proponer)

- **Abrir con base y cerrar contando el efectivo** → D7: saldos continuos por cuenta, con retiros.
- **Cierre por turnos** → D7.
- **«Venta rápida» suelta o total escrito al cierre** → D6: la Caja (punto de venta) registra cada venta.
- **Categorías y fotos de factura en gastos** → D9.
- **Nómina con sueldo fijo y recordatorio, o calculada por turnos** → D10.
- **Aviso de pedidos sin confirmar** → D14.
- **Cuadre aparte del domiciliario** → D16.
- **Permisos extra del cajero** (ver saldos, retiros, descuentos aparte, nómina) → D22.
- **Saldo inicial al crear la cuenta** → D24.
- **Comisión automática de Bold/datáfono** → D26.
- **Imprimir tirilla · ventas y propinas por mesero** → D28.

---

## 5. Estado de las rondas

- **Ronda 1 — Lo grande de las cuentas** ✅ respondida
- **Ronda 2 — Cómo funcionan la Caja y las Cuentas** ✅ respondida
- **Ronda 3** ❌ no se hace: ya no queda nada que adivinar.

---

## 6. Plan de construcción

**Modelo de datos** (todo privado, bajo `locales/{id}/`):
- `ventas/{id}` → `{ jornada 'AAAA-MM-DD', en, por {email,nombre}, origen 'caja'|'comanda'|'mesa',
  comandaIds[], mesa?, items[{productoId,nombre,cantidad,precio}], subtotal, descuento {valor,
  cortesia, motivo}, total, propina, pagos[{cuenta, nombre, monto}], recibido?, estado 'ok'|'eliminada',
  eliminada? {por, motivo, en}, cambios[] }`
- `movimientos/{id}` → `{ tipo 'gasto'|'nomina'|'retiro'|'ingreso'|'traslado', jornada, en, por,
  cuenta, cuentaDestino?, monto, concepto, trabajadorId?, dias[]?, estado, eliminada? }`
- `trabajadores/{id}` → `{ nombre, activo, creadoEn }`
- `resumen/saldos` → `{ [cuentaId]: número }` · `resumen/d_AAAA-MM-DD` y `resumen/m_AAAA-MM` →
  `{ ventas, nVentas, descuentos, propinas, porCuenta{}, gastos, nomina, porPlato{}, porHora{} }`.
  Se mueven con `increment()` en el mismo lote que la venta o el movimiento (S7).
- Comanda: `+ ventaId` al cobrarse, `+ pagoSugerido` si viene de un pedido de la app.

**Pasos**
- [x] 1. Servicios `cuentas.js` (ventas, movimientos, trabajadores, resumen; motor Firestore + motor demo) y utilidades (jornada, cuentas de dinero).
- [x] 2. Rol **cajero** (equipo, AdminContext, reglas) y **nombres del panel**: `caja` = Caja nueva, `cocina` (con redirección desde `/admin/comandas`), `cuentas` (reemplaza `metricas`, que redirige).
- [x] 3. **Configuración → Cuentas y pagos** (crear/editar cuentas, `alCliente`) + interruptor **usa cocina** (D13, S12).
- [x] 4. **Ventana de cobro**: medio, pago dividido, propina, descuento/cortesía, vueltas con billetes rápidos.
- [x] 5. **Caja estilo La Catrina (D29)**: Vender (fichas de cuentas abiertas = lo por cobrar, cuadrícula, ticket, Cobrar ya / Mandar, atajos, pedidos por confirmar arriba) · Ventas (historial, cambiar pago, eliminar con motivo, filtro Eliminadas) · Gastos.
- [x] 5b. **Mesero con la misma estética** (D29), conservando opciones, comentario, aviso de mesa en curso, reintento sin duplicar y «En curso».
- [x] 6. Sin cocina: comandas y pedidos confirmados nacen listos para cobrar (D13).
- [x] 7. **Cuentas** (dueño): Hoy (vendiste − gastaste − nómina = te quedó, resumen por WhatsApp) · Mes (ganancia, vs mes anterior, gráfica, ticket promedio, platos top, horas pico, movimiento de la app, descarga) · Saldos (meter, sacar, mover, movimientos) · Nómina (trabajadores + pagar con calendario).
- [x] 8. Reglas de Firestore + índices, y «Reiniciar demo» borra lo nuevo. Desplegadas el 2-nov-2026 a `appetic-17477`.
- [x] 9. Datos de ejemplo en vista previa y `/demo` (S8).
- [x] 10. Probado en la vista previa (PC y celular, dueño, cajero y mesero), reglas e índices desplegados y publicado en Vercel. **Falta:** probarlo con Firestore real en un local de muestra.

## 7. Notas de construcción

- **2 de noviembre de 2026 — Construido.**
  - **Servicios:** `services/cuentas.js` (ventas, movimientos, trabajadores y resúmenes con dos
    motores), `utils/jornada.js` (el día sigue el horario), `utils/cuentasDinero.js` (la lista
    única de cuentas/medios de pago) y `services/cuentasEjemplo.js` (datos de ejemplo).
  - **Panel:** «Caja» (`AdminCaja` + `CajaVender` · `CajaVentas` · `CajaGastos` + `Cobro`),
    «Cuentas» (`AdminCuentas` + `CuentasSaldos` · `CuentasNomina` + `exportarMes`),
    Configuración → «Cuentas y pagos» (`ConfigPagos`), rol cajero en Equipo. «Cocina» ahora es
    `/admin/cocina` (la vieja `/admin/comandas` redirige) y `/admin/metricas` va a Cuentas.
  - **Mesero:** su «Nuevo pedido» es ahora `CajaVender` en modo mesero (D29); se borraron
    `TomarPedido` y `HojaComanda`. «En curso» (corregir y cancelar) quedó igual.
  - **Borrado:** `AdminMetricas.jsx` (D15). En «Mi cuenta» la pestaña Métricas lleva a Cuentas.
- *Sobre la marcha (decidido sin preguntar):*
  - Al **eliminar una venta que venía de comandas** se pregunta «¿la cuenta sigue pendiente?»:
    *sí, se cobró mal* → vuelven a por cobrar; *no, estaba repetida* → se quedan cerradas. Sin esto,
    eliminar una venta repetida dejaba una cuenta fantasma por cobrar.
  - **«Cobrar ya» con cocina** crea la comanda y la manda a cocina ya cobrada; a una mesa abierta
    se le puede agregar y cobrar todo de una (lo nuevo también llega a cocina, ya pago).
  - La **propina** solo puede cambiar de cuenta al «Cambiar el pago»; su valor no (si no, los
    totales del día dejarían de cuadrar).
  - **Frecuentes** se cuentan por dispositivo (localStorage), sin leer nada del servidor.
  - El **cajero** puede leer los resúmenes de día (`d_…`) para la cabecera «Hoy»; no los del
    mes ni los saldos.
  - El **checkout del cliente** ahora usa `cuentasCliente(local)`: si un local no tenía `pagos`,
    le sale «Efectivo» (antes no le salía nada).
  - `cop()` ahora escribe los negativos como «−$111.400» (antes «$-111.400»).
  - Ejemplo: nómina por **quincena** (15 y fin de mes); con nómina semanal el mes recién
    empezado salía en pérdida y la demo se veía mal.
- *Problemas y cómo se resolvieron:*
  - El ticket se dibujaba como componente interno (`<Ticket />`) → el campo «Nota para cocina»
    perdía el foco a cada letra. Se llama como función (`ticket()`).
  - La ventana de opciones arrastraba la elección del plato anterior → `key={abierto.id}`.
  - El detalle de una venta seguía diciendo «pagó con $50.000» después de cambiarla a Nequi →
    «pagó con» solo si hubo efectivo.
- **2-nov-2026 · Publicado.** Reglas + índices con `jostivtrb@gmail.com`; push a `main` y producción
  sirviendo el build nuevo a los 50 s. **Pendiente:** probar con un local real (Firestore de verdad).
  Quedan estilos viejos sin uso en `Mesero.css` (`.ms-pos*`, `.ms-hoja*` de la comanda) y `.am-*`
  de Métricas en `Admin.css`: se pueden limpiar.
- **Lo siguiente (D2):** la pantalla del menú en el TV y después los planes en la app.
- **2-nov-2026 · Después de publicar.**
  - Caja: una comanda de otro día atascada «en cocina» no se podía cobrar ni quitar → en el ticket
    de cada mesa ahora salen «Ya salió de cocina» y «Cancelar comanda». Colores de mesa sin café, ícono
    «i» dibujado (el «ⓘ» salía como cuadrito en Windows).
  - D30: se borró `PorConfirmar.jsx` y su uso en Caja, Mesero y Domicilios; el recorrido de la demo
    pierde el paso «Confirma un pedido de la app».
  - Problema encontrado y resuelto: el recorrido del mesero apuntaba a la pantalla vieja
    (`.ms-pos-menu`, `.ms-barra`) desde el cambio a La Catrina → ahora `.pv-grid` / `.pv-ticket`.
  - **Contadores por tipo de pedido** (el usuario aceptó activar el TTL «desde que no afecte a Pilotos
    en nada»): `stats` suma por día `domicilios` · `recoger` · `mesaQR`; los pedidos nuevos traen
    `enStats: true`; `scripts/contar-pedidos-por-tipo.mjs` pasó los 359 pedidos que existían (corte
    17:00 del 2-nov). Verificado: Pilotos 23 oct–2 nov = 27 domicilios + 2 recoger, igual que contando
    los pedidos a mano. Cuentas → Mes los muestra.
  - *Tropiezo:* el cambio de `enStats` iba en un comando que el sistema de permisos frenó y no se
    guardó; la app con contadores salió sin la marca. Se resolvió con el corte por fecha (no había
    entrado ningún pedido en esa hora) y publicando la marca enseguida.
  - ⚠️ **Pendiente — lo corre el usuario:** `firebase deploy --only firestore:indexes --project
    appetic-17477 --account jostivtrb@gmail.com --non-interactive` activa el TTL de `pedidos` y
    `pedidosPublicos` (ya está en `firestore.indexes.json`). El sistema de permisos lo frenó por ser un
    borrado masivo. Al activarse, Firebase borra en 1–3 días los pedidos de más de 2 días.

