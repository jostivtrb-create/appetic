# Guía para los planes por tamaño de Appetic

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** rehacer la oferta de Appetic en planes por tamaño de negocio: uno sencillo para
  locales chicos y tráilers (el que jale las ventas), otro con mesas y cocina, y otro con
  contabilidad. **Solo la propuesta de venta; la app no se toca.**
- **Inicio:** 2 de noviembre de 2026
- **Estado:** 🟡 Ronda 1 entregada, esperando
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

*(ninguna todavía)*

---

## 3. Suposiciones del agente

- **S1** — Se mantienen las condiciones comunes: sin comisión, mes a mes, se paga el día de la
  entrega, contacto 320 843 5143. *(heredado de P5, D21 y S1 del 27-oct)*
- **S2** — El formato sigue siendo HTML → PDF A4 con `propuesta/generar.sh` y la identidad de
  Appetic (naranja, crema, Playfair + Plus Jakarta). *(deducido de `propuesta/`)*

---

## 4. Descartado (no volver a proponer)

- 15 días gratis de prueba y precio único de $49.000 → ya descartados el 27-oct.

---

## 5. Estado de las rondas

- **Ronda 1 — Visión general** 🟡 entregada, esperando · `Cuestionario-1-Planes-por-tamano.html`

---

## 6. Incógnitas abiertas

1. Cuántos planes y qué pasa con Desarrollador y Empresario *(ronda 1)*
2. Qué lleva y cuánto vale el plan de entrada *(ronda 1)*
3. Precio del plan de restaurante *(ronda 1)*
4. Cómo se vende la contabilidad y qué incluye *(ronda 1)*
5. Una pieza o dos *(ronda 1)*

---

## 7. Plan de implementación

*(se escribe al cerrar las rondas)*

---

## 8. Bitácora

- **2 de noviembre de 2026** — Se abre la tarea. Leídas las guías del 25 y 27 de octubre y la
  página de planes vigente. Entregada la ronda 1: 7 preguntas y 5 sugerencias.
