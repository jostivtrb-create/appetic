# Guía para los planes por tamaño de Appetic

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** rehacer la oferta de Appetic en planes por tamaño de negocio: uno sencillo para
  locales chicos y tráilers (el que jale las ventas), otro con mesas y cocina, y otro con
  contabilidad. **Solo la propuesta de venta; la app no se toca.**
- **Inicio:** 2 de noviembre de 2026
- **Estado:** 🟡 Ronda 2 entregada, esperando
- **Proyecto:** `appetic` (propuesta en `propuesta/`)
- **Depende de:** `Guía para los precios nuevos de Appetic.md` (P1–P10, 27-oct) y
  `Guía para la propuesta nueva de Appetic.md` (D1–D23, 25-oct). Siguen vigentes salvo lo que esta
  tarea cambie.

---

## 0. Lo que ya sé (investigado antes de preguntar)

- **El problema, en sus palabras:** *"saliendo a la calle me di cuenta que es muy difícil buscar en
  barrios populares restaurantes que cuenten con lo que necesita la app para ser razonable: que
  tengan domiciliario, que tengan sistema de mesas y cocina, etc."*
- **Oferta vigente** (`propuesta/propuesta-appetic.html`, página «La inversión»): Desarrollador
  $5.000.000 + $1.000.000/mes (ancla) · Empresario $189.000/mes (chatbot IA + conexión con caja,
  que NO existen en el código) · Emprendedor $99.000/mes («el que más eligen»). 2×1 en los tres
  hasta el 31-dic-2026. Sin montaje, sin comisión, mes a mes, se paga el día de la entrega.
  Toda la propuesta (8 páginas) está escrita para **restaurantes con salón**.
- **Lo que la app hace hoy** (commit del 29-oct «solo lo que la app hace hoy»): menú con fotos y
  QR, pedido al WhatsApp, panel del dueño, menú del día, buscador del barrio, mesero en su celular,
  pantalla de cocina, domicilios con cobro por distancia y panel del domiciliario, comandas con
  «ya se cobró», cuenta por mesa.
- **La contabilidad no existe** en el código.
- **Antecedentes de precio:** los locales viejos de $18.900 nunca pagaron (D12); un local dijo que
  no a Appetic gratis y a $50.000 (P10).
- **P8 (27-oct):** «nada de folleto ni cartilla, todo es la propuesta». Si esta tarea pide una
  pieza corta para la calle, choca con P8 → se pregunta en la ronda 1.

---

## 1. Objetivo

*"Crear un paquete sencillo que sirva para locales pequeños y tráilers de la calle, que sea el plan
que hale las ventas. Ya luego planes con cocina y sistema de mesas, y planes ya con contabilidad.
Fragmentar bien eso para que los planes tengan sentido. Hoy no vamos a tocar la app, solo la
propuesta de venta, que sea muy llamativa y a la vez muy bien distribuida."*

---

## 2. Decisiones CERRADAS

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| **R1** | **Cuatro planes: Desarrollador (ancla, arriba) + tres por tamaño: Entrada · Restaurante · Completo.** El **Empresario** de $189.000 (chatbot IA + conexión con caja) **deja de ser un plan**. | Respuesta a P1. Conserva el truco del plan carísimo. Lo que pasa con el chatbot va en la ronda 2. |
| **R2** | **El plan de Entrada lleva todo lo que hoy existe menos el salón:** menú con fotos y QR, pedido al WhatsApp, panel del dueño, menú del día, **domicilios con cobro por distancia y panel del domiciliario**, buscador del barrio, comandas con «ya se cobró», fotos con IA. | Respuesta a P2 (marcó todo). Lo que separa al Restaurante es el **salón**: mesero en su celular, pantalla de cocina, QR por mesa, cuenta por mesa. |
| **R3** | **Entrada: $39.900/mes.** | Respuesta a P3. Menos que una comida para dos; lejos del «no» a $50.000. |
| **R4** | **Restaurante (mesas + cocina): $79.000/mes**, ya no $99.000. | Respuesta a P4. ⚠️ Cambia **P4 del 27-oct** a propósito: el salto desde la Entrada tiene que ser chico. |
| **R5** | **La contabilidad se vende como si ya existiera**, igual que el mesero y la cocina. | Respuesta a P5. ⚠️ Mismo riesgo asumido que D4: si alguien compra el Completo, hay que programarla contra reloj. |
| **R6** | **Contabilidad = cierre de caja del día (efectivo, Nequi, tarjeta) + gastos y compras + pago de nómina + reporte mensual de ganancia.** Nada de DIAN, nada técnico, «muy personal». | Respuesta a P6 + observación: *"y registro de pagos de nóminas, es muy personal, nada de Dian ni nada técnico"*. |
| **R7** | **Una sola propuesta para todos, con los planes al final** (P8 sigue vigente: nada de folleto). **Pero se rehace mucho más VISUAL, con poquito texto o texto pequeño.** | Respuesta a P7 + observación: *"la propuesta ahorita es mucho texto y para alguien que está ocupado en su local es difícil… Necesito que sea mucho más visual!! Y el texto pequeño o muy poco"*. Esto convierte la tarea en un **rediseño completo**, no solo cambiar la página de precios. |
| **R8** | **Idea nueva: «Pantalla de menú» para televisor.** El local pone la app en un TV y esta va mostrando sola los productos con animaciones (como en KFC), sacados del menú que ya crearon; el dueño no hace nada. | Observación a P2. **No existe en el código.** En qué plan va, y si se vende como existente, se pregunta en la ronda 2. |
| **R9** | **Se aceptan las 5 sugerencias:** (a) el plan de entrada se vende como «la puerta», no como plan recortado: subir es activar, sin cambiar de app; (b) para tráilers el gancho es **la fila**; (c) habrá **precio por pago semestral o anual**; (d) se dice claro que la contabilidad **no es factura electrónica DIAN**; (e) se revisa qué pasa con el **2×1**. | Sugerencias S1–S5, todas 👍. Los detalles de (c) y (e) van en la ronda 2. |

---

## 3. Suposiciones del agente

- **S1** — Se mantienen las condiciones comunes: sin comisión, mes a mes, se paga el día de la
  entrega, contacto 320 843 5143. *(heredado de P5, D21 y S1 del 27-oct)*
- **S2** — El formato sigue siendo HTML → PDF A4 con `propuesta/generar.sh` y la identidad de
  Appetic (naranja, crema, Playfair + Plus Jakarta). *(deducido de `propuesta/`)*
- **S3** — El Desarrollador pasa de «todo lo del Empresario» a **«todo lo del Completo»** y se
  queda en $5.000.000 + $1.000.000/mes. *(consecuencia de R1)*
- **S4** — La **Pantalla de menú para TV** y la **contabilidad** se dibujan en HTML con la cara de
  Appetic, como la cocina y el mesero (D23). *(coherente con D23)*
- **S5** — **Generar imágenes desde la nube:** la skill `Generar_Imagen` corre en PowerShell y no
  existe aquí, pero su motor es una URL de Pollinations que **sí responde desde este contenedor**
  (probado el 2-nov con `curl`: 768×512 en ~1 min). Ojo: la cola gratis devolvió un modelo de
  menor calidad (no Flux) y con **marca de agua «pollinations.ai»** aunque se pide `nologo`.

---

## 4. Descartado (no volver a proponer)

- 15 días gratis de prueba y precio único de $49.000 → ya descartados el 27-oct.

---

## 5. Estado de las rondas

- **Ronda 1 — Visión general** ✅ respondida · `Cuestionario-1-Planes-por-tamano.html`
- **Ronda 2 — Precios finos, piezas nuevas y cómo se ve** 🟡 entregada, esperando · `Cuestionario-2-Precios-y-visual.html`

---

## 6. Incógnitas abiertas

1. Precio del plan Completo *(ronda 2)*
2. Qué pasa con el chatbot IA *(ronda 2)*
3. En qué plan va la Pantalla de menú para TV *(ronda 2)*
4. Descuento semestral/anual y qué pasa con el 2×1 *(ronda 2)*
5. Nombres de los planes *(ronda 2)*
6. Cómo se ve la propuesta: largo, qué domina visualmente, con qué local abre *(ronda 2)*
7. De dónde salen las imágenes *(ronda 2)*

---

## 7. Plan de implementación

*(se escribe al cerrar las rondas)*

---

## 8. Bitácora

- **2 de noviembre de 2026** — Se abre la tarea. Leídas las guías del 25 y 27 de octubre y la
  página de planes vigente. Entregada la ronda 1: 7 preguntas y 5 sugerencias.
- **2 de noviembre de 2026** — Ronda 1 respondida (R1–R9). Dos cambios a propósito sobre lo del
  27-oct: el Empresario deja de ser plan (R1) y el plan con salón baja de $99.000 a $79.000 (R4).
  El giro grande es R7: la propuesta se rehace **visual y con poco texto**. Se pidió revisar la
  skill de imágenes: probada desde la nube (S5). Entregada la ronda 2.
