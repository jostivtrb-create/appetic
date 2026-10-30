# Guía para la Cuenta por mesa

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** que el admin lleve la cuenta de cada mesa (todo lo que pidió, en qué va) y la cobre; hoy, cuando la cocina entrega una comanda, se pierde y no se sabe cuánto cobrar.
- **Inicio:** 29 de octubre de 2026
- **Estado:** 🔵 Construyendo
- **Proyecto:** Appetic/

---

## 1. Objetivo

**No es llevar cuentas ni contabilidad: es control de la comanda.** Toda comanda (mesa, para llevar,
domicilio…) termina con un último paso, **«Pagado»**, que marca el admin (en caja, o cuando vuelve el
domiciliario con la plata). Mientras no esté pagada, el admin la ve en una lista de **por cobrar**,
agrupada por mesa, con el total — así nunca se pierde cuánto cobrar. El cliente del QR ve lo que lleva
su mesa y puede tocar «Pedir la cuenta».

---

## 2. Decisiones CERRADAS

### Antes de la ronda 1 (en el chat, 29-oct)

| # | Decisión | Por qué |
|---|----------|---------|
| D1 | Alcance: **cuenta por mesa**, sin cuadre de caja ni contabilidad | El cuadre sigue en el plan caro (D42 de la guía de Mesero y Comandas) |
| D2 | Va en **todos los planes** (Emprendedor incluido) | Decisión del usuario. ⚠️ Hay que cambiar la propuesta: decía «No es una caja registradora: la cuenta de la mesa y el cobro los sigues manejando tú» |
| D3 | **Reemplaza P-D10** de la guía de Mesero y Comandas («Solo comanda a cocina, sin caja ni cuenta de la mesa») | El usuario lo pidió explícitamente tras probarla: «una vez que se entrega se pierde y ya no se sabe cuánto cobrar» |

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| D4 | **Sin cuentas ni contabilidad**: solo un paso final **«Pagado»** en cada comanda | Obs. P1: «no quiero llevar cuentas, solo control de la comanda; solo falta poner pagado al final» |
| D5 | Aplica a **todas** las comandas, también **domicilios**: el admin marca pagado cuando vuelve el domiciliario | Obs. P1 |
| D6 | **Solo el admin** marca «Pagado» | P2 |
| D7 | **No se registra cómo pagó** (medio, propina, división, descuento: nada) | Obs. P3: «el admin solo pone que pagó el cliente», sin contabilidad. P4 sin responder → nada |
| D8 | Después de pagar **se cierra y nada más** (sin historial de pagadas) | P5 |
| D9 | Se ve como **lista** de lo que falta cobrar (sin cuadrícula de mesas) | S1 |
| D10 | Varios clientes del QR en la misma mesa = **una sola cuenta de la mesa**, con el nombre en cada pedido | S2 |
| D11 | El cliente del QR **ve lo que lleva su mesa y puede «Pedir la cuenta»** | S3 |
| D12 | **Aviso al admin** si quedan comandas sin cobrar de otro día | S4 |

**Descartado:** cuadrícula de mesas (S1), medios de pago, propina, descuento, dividir, abonos.

### De la ronda 2 (aclara y CAMBIA parte de la ronda 1)

| # | Decisión | Por qué |
|---|----------|---------|
| D13 | Una **pestaña del admin («Caja»)** donde ve cada comanda y **en qué parte del proceso va** | Obs. P1 |
| D14 | El botón **«Ya se cobró»** aparece **al finalizar** la comanda; al tocarlo **pasa al historial** | Obs. P1 — ⚠️ reemplaza D8 («nada más»): ahora SÍ hay historial de cobradas |
| D15 | Se cobra **cada comanda por separado** | P2 — deja sin efecto D10 (ya no se agrupa por mesa) |
| D16 | **El cliente NO pide la cuenta**: la comanda viaja cliente → mesero → cocina → cliente, y ahí la caja la marca cobrada | Obs. P3 — ⚠️ reemplaza D11 |

El usuario dudó de que lo estuviera entendiendo («no sé si me estás entendiendo»): la idea correcta es
**control del recorrido de cada comanda + un último paso «cobrada»**, no una cuenta de mesa.

---

## 3. Suposiciones del agente

- **Lo que hay hoy (del código):** cada envío del mesero es una comanda aparte (`locales/{id}/comandas`),
  con `destino {tipo, mesa, nombre}`, `items[]` con `precio` por línea, `estado activa|entregada|cancelada`
  y `total`. No hay nada que agrupe las comandas de una mesa ni marca de «pagada».
- El total de la cuenta = suma de las comandas **no canceladas** de la mesa, sin los platos quitados en
  correcciones (los `quitado` ya no suman en `total`).
- Si el mesero corrige la mesa de una comanda (D-corrección), esa comanda pasa a la cuenta de la otra mesa.
- ~~Medios de pago~~ → descartado por D7.
- **Técnico:** cada comanda nueva nace con `porCobrar: true`; «Pagado» la pasa a `false` (+ `pagadaEn`, `pagadaPor`).
  Así la lista es una consulta barata (`porCobrar == true`) y no recorre el historial. Las comandas viejas
  (de antes de esto) no salen: arranca limpio. Una comanda **cancelada** sale de por cobrar.
- Se puede marcar pagado **en cualquier momento** (antes o después de que la cocina la entregue): el que
  paga al pedir (para llevar) también se marca.
- «Pagado» se puede **deshacer** unos segundos (aviso con «Deshacer»), por si fue un toque por error.
- El mesero **ve** cuánto lleva la mesa (para decírselo al cliente) pero no puede marcar pagado (D6).
- Los pedidos de la app (domicilio / recoger) también terminan en «Pagado» (D5): su comanda nace con `porCobrar`.

---

## 4. Incógnitas abiertas

Ninguna. Sin más rondas.

---

## 5. Estado de las rondas

| Ronda | Tema | Estado |
|---|---|---|
| 1 | Qué entra, quién cobra, cómo se paga, qué queda después | ✅ respondida |
| 2 | Dónde vive, cómo se marca, «Pedir la cuenta» | ✅ respondida — sin más rondas |

---

## 6. Plan paso a paso

- [x] 1. Datos: `porCobrar: true` al nacer toda comanda (mesero, QR, app al confirmar); «cobrar» → `porCobrar:false`,
      `cobradaEn`, `cobradaPor`; «deshacer» lo devuelve; cancelar la saca de por cobrar. Domicilio: la comanda guarda el `envio`.
- [x] 2. Reglas: solo el admin cambia lo de cobro (salvo que una cancelación la saque) + índice `porCobrar + creadaEn`.
- [x] 3. Pantalla **Caja** (sección nueva del admin en la barra): «Por cobrar» con la etapa de cada comanda
      (en cocina X/Y · lista · en camino / entregada) y «Ya se cobró» al finalizar; «Cobradas» = historial; deshacer.
      Finalizada = la cocina la entregó (y en domicilio, además, el domiciliario la entregó).
- [x] 4. Aviso si quedan comandas sin cobrar de otro día (D12).
- [ ] 5. Probar en vista previa → publicar (con permiso) → índice listo.
- [x] 6. Propuesta: quitar «No es una caja registradora…» y contar el paso «cobrada» (D2).

## 7. Bitácora

- **29-oct · Construido.** Sección **Caja** (solo admin) en la barra: «Por cobrar» en dos grupos —«Listas para
  cobrar» (terminaron) y «En proceso» (en cocina X de Y · listo esperando domiciliario · en camino)— y «Cobradas»
  (historial, con Deshacer). Toast de 8 s con Deshacer tras cobrar. Aviso amarillo si hay de días anteriores.
- Domicilio «terminado» = la cocina la entregó Y el pedido ya no está vivo (listo / en camino). Su total incluye el envío.
- Cobradas = consulta `orderBy(cobradaEn desc)` (deshacer BORRA el campo, así no queda null arriba).
- Índice nuevo: `comandas (porCobrar ASC, creadaEn ASC)`.
- Reinicio de la demo: sus comandas de ejemplo nacen con `porCobrar: true`.
- Propuesta: pág. 4 (nota de cobro), pág. 6 («No es una caja registradora» reescrito) y Plan Emprendedor (+ Caja). Regenerados los PDF.
- Probado en vista previa (PC y celular 375 px): etapas, cobrar, historial, deshacer, aviso de días anteriores.
