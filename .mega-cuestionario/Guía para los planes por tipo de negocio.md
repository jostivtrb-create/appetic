# Guía para los planes por tipo de negocio

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** reorganizar los planes de Appetic por tipo de negocio (Emprendedor · Comerciante · Empresario)
  y dejar la propuesta coherente con eso.
- **Inicio:** 2 de noviembre de 2026
- **Estado:** ✅ **Propuesta TERMINADA** — 2 de noviembre de 2026 · ⏸️ la app (planes + cuentas) espera a que los socios acepten (D16)
- **Proyecto:** `/home/zevenoficial07/Apps Zeven/Swiftfly Solutions/Appetic`
- **Viene de:** `Guía para los planes por tamaño de Appetic.md` (terminada) y del armador
  `planes/armador-de-planes.html`.

---

## 1. Objetivo

En sus palabras: *"quiero que el plan básico ya lleve contabilidad, el plan medio sea para tiendas
con domiciliario, y ya el plan full sea el que incluye meseros y comandas a cocina"* y *"los precios
no deben escalar tanto pero el primero tampoco puede ser tan barato"*. La razón de fondo: *"por si
algunos no tienen domicilio"*.

---

## 2. Decisiones CERRADAS

### Antes del cuestionario (acordadas en el chat, 2-nov-2026)

| # | Decisión | Por qué |
|---|----------|---------|
| **D1** | **Escalera de 3 planes:** lo que va en un plan va automáticamente en los más grandes. | Regla que él puso al pedir el armador. |
| **D2** | **Emprendedor** = menú + pedidos + contabilidad · **Comerciante** = + domiciliario · **Empresario** = + meseros y comandas a cocina. | Sus palabras (ver Objetivo). |
| **D3** | **$59.900 · $79.900 · $99.900** al mes. | Propuesta del agente, respondió «Sí». Saltos parejos de $20.000; el de entrada no queda «tan barato» porque ya trae contabilidad; el full baja de $129.000 a menos de $100.000. |
| **D4** | **Nombres: Plan Emprendedor · Plan Comerciante · Plan Empresario**, en ese orden. | Sus palabras: *"me gustaban más los nombres de antes… dejemos plan Emprendedor, plan Comerciante y plan Empresario en ese orden"*. Reemplaza a «Local · Domicilios · Restaurante», que había propuesto el agente. |
| **D5** | **2.º mes gratis en los tres planes**, hasta el 31-dic-2026. Paga 5 recibe 6 · paga 10 recibe 12. No se suman. | Propuesta aceptada: suaviza la subida del plan de entrada. |
| **D6** | **Plan Desarrollador aparte: $3.000.000, pago único, sin mensualidad;** servidor y mantenimiento por cuenta del cliente. | Decisiones del 2-nov-2026 en el chat. |
| **D7** | **«Meseros y pantallas sin límite» va en el Empresario.** | En el armador quedó en el plan medio, que no tiene meseros: prometía algo que ese plan no trae. |

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| **D8** | **El Emprendedor recibe pedidos para recoger por WhatsApp.** El Comerciante suma solo lo del domicilio (dirección, cobro del envío por distancia, domiciliario). | Respuesta a P1 (la recomendada). Sin WhatsApp el Emprendedor sería un menú por el que no se puede pedir. |
| **D9** | **Las cuentas del negocio se venden como si ya estuvieran y se programan rápido.** | Respuesta a P2. ⚠️ Riesgo asumido con el aviso delante: hoy no existen (S3); si un cliente las pide la primera semana no hay. Mismo camino que se tomó con mesero y cocina (D4 de la propuesta nueva). |
| **D10** | **La app respeta el plan sola:** según el plan del local, esconde lo que no le toca. | Respuesta a P3. Hay que programarlo: hoy no existe nada de planes en el código (S1). |
| **D11** | **Las ideas nuevas no salen en la propuesta.** Se quedan en el armador. | Respuesta a P4 (la recomendada). |
| **D12** | **El Emprendedor queda en $59.900**, sin plan «solo menú» ni precio de lanzamiento. | Respuesta a S1. |
| **D13** | **El Empresario trae domicilios aunque no los use.** La escalera no se rompe. | Respuesta a S2. |
| **D14** | **El PDF de la web se cambia cuando esté la propuesta nueva.** | Respuesta a S3. |

### De la ronda 2

| # | Decisión | Por qué |
|---|----------|---------|
| **D15** | **Orden: propuesta → planes en la app → cuentas del negocio.** | Respuesta a P1 (la recomendada). |
| **D16** | **Esta tanda es SOLO la propuesta.** Los planes en la app (D10) y las cuentas (D9) se programan **cuando los socios acepten** los planes. | Sus palabras: *"por ahora creamos la propuesta así, pero ya si los socios aceptan empezamos ahí sí a modificar la app"*. |
| **D17** | **Los locales montados hoy son de muestra:** nadie paga. Se quedan con todo (como Empresario) para mostrar la app y se van reemplazando por clientes reales. No se mencionan en la propuesta. | Observación a P2: *"ninguno de ellos me pagó, los tengo ahí como relleno… apenas tengamos clientes reales los vamos reemplazando"*. Coherente con D12 de la propuesta nueva. |
| **D18** | **Lo que no está en el plan, el dueño lo ve con candado:** «Disponible en el plan Comerciante». Sus clientes y su equipo no lo ven. | Respuesta a P3 (la recomendada). Aplica cuando se programe D10. |

---

## 3. Suposiciones del agente

- **S1** — Hoy la app **no separa funciones por plan**: cada local solo tiene `suscripcion.activa`
  (sí/no) y `plan: 'piloto'`. *(deducida de: `src/services/locales.js`, `src/pages/Superadmin/Superadmin.jsx`, `src/dev/*.js`)*
- **S2** — El **pedido normal sale por WhatsApp** (recoger y domicilio); el pedido **desde la mesa**
  va directo a la cocina sin WhatsApp. *(deducida de: `src/pages/Checkout/Checkout.jsx`, `CheckoutMesa.jsx`)*
- **S3** — La **contabilidad** (cierre de caja, gastos, nómina, ganancia) **no está programada**.
  *(deducida de: el código + R5 de la guía de planes por tamaño)*
- **S4** — Lo que cambia en la propuesta: página de planes, índice «Cinco cosas…», los textos de las
  secciones que nombran planes, el pago por adelantado y la insignia. El armador se actualiza al
  nuevo reparto como referencia. *(deducida de: `propuesta/propuesta-appetic.html`)*
- **S5** — Qué esconde cada plan en la app *(deducida de: `PanelRail.jsx`, `config/roles.js`, `Checkout*.jsx`)*:
  - **Emprendedor:** ve Ver menú · Comandas · Difundir · Métricas · Configuración. El checkout solo
    ofrece **Recoger**. En Equipo no hay roles de mesero, cocina ni domiciliario. Sin QR por mesa.
  - **Comerciante:** + sección **Domicilios**, opción **Domicilio** en el checkout, rol
    **domiciliario** y afiche de domicilios.
  - **Empresario:** + **Mesero**, **Cocina**, roles **mesero** y **cocina**, **QR por mesa** y pedido
    desde la mesa.
- **S6** — El plan lo cambia **solo el superadmin**, en «Locales y planes». *(deducida de: `PanelRail.jsx`, que ya tiene esa sección)*

---

## 4. Descartado (no volver a proponer)

- Nombres «Local · Domicilios · Restaurante» → él prefiere Emprendedor · Comerciante · Empresario.
- Nombres «Básico · Pro · Total».
- Básico $39.900 / Pro $79.000 / Total $129.000 → se reemplaza por D3 porque el de entrada ahora
  trae contabilidad y el full asustaba.

---

## 5. Estado de las rondas

- **Ronda 1 — Lo grande** ✅ respondida
- **Ronda 2 — Los planes dentro de la app** ✅ respondida
- **Ronda 3** ❌ no se hace: ya no queda nada que adivinar para la propuesta. · `Cuestionario-2-Planes-en-la-app.html` · `Cuestionario-1-Planes-por-tipo-de-negocio.html`

---

## 6. Plan de construcción (propuesta)

- [x] Página de planes: nombres Emprendedor · Comerciante · Empresario, precios $59.900 · $79.900 ·
      $99.900, lo que trae cada uno (D2, D7, D8), foto y frase de cada tarjeta.
- [x] Pago por adelantado recalculado y **insignia «2.º mes gratis» en los tres** (D5).
- [x] Letra pequeña y plan Desarrollador («todo lo del Empresario»).
- [x] Revisar el resto de la propuesta: que ninguna página nombre Básico, Pro o Total.
- [x] Armador (`planes/armador-de-planes.html`): nombres, precios y reparto nuevos como punto de partida.
- [x] Regenerar PDF (propuesta, tapa, impresa) y revisarlo página por página.
- [x] Reemplazar el PDF de la web (`web/propuestas/propuesta-appetic.pdf`) (D14). Solo el archivo; publicar el sitio es otra decisión.

### Después, cuando los socios acepten (no en esta tanda)

- [ ] Planes en la app: campo `suscripcion.plan` = emprendedor | comerciante | empresario, selector
      en «Locales y planes», esconder según S5 y candado para el dueño (D18). Locales de muestra en Empresario (D17).
- [ ] Cuentas del negocio (cierre de caja, gastos, nómina, ganancia) — con su propio cuestionario.

## 7. Notas de construcción

- **2 de noviembre de 2026** — Página 7 rehecha: tarjetas Emprendedor ($59.900, «Para empezar hoy»,
  foto del tráiler) · Comerciante ($79.900, «Con domiciliario», foto del local) · Empresario
  ($99.900, «Para restaurantes»). Cada una dice qué secciones de la propuesta incluye (1, 2 y 5 ·
  1, 2, 3 y 5 · del 1 al 5). Insignia «2.º mes gratis» en las tres y pago por adelantado
  recalculado ($299.500/$599.000 · $399.500/$799.000 · $499.500/$999.000).
- *Sobre la marcha:* las fotos de las tarjetas bajan de 25 a 20 mm para que la letra pequeña no
  pise el pie de página. El Desarrollador dice «todo lo del Empresario».
- *Sobre la marcha:* el pedido al WhatsApp **no** sale como renglón propio en el Comerciante (D8):
  el Emprendedor lo lista como «Pedidos para recoger por WhatsApp» y el Comerciante suma «Pedidos a
  domicilio».
- Armador: arranca con los planes nuevos (clave de guardado `_v2`, para no cargar lo viejo).
- PDF de la web reemplazado en `web/propuestas/propuesta-appetic.pdf` (solo el archivo, sin publicar).
- Cuestionarios 1 y 2 borrados (respondidos). La guía se queda.
- **2 de noviembre de 2026** — **Un solo PDF:** `propuesta-appetic.pdf` sirve para WhatsApp y para
  imprimir. Se retiraron la tapa del folder (`tapa-appetic.*`) y `propuesta-impresa-appetic.pdf`,
  que repetían la portada. Al imprimir en impresora normal la portada sale con un borde blanco de
  pocos milímetros: decidió dejarlo así (sin marco crema).
