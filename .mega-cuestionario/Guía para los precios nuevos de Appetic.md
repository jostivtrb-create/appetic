# Guía para los precios nuevos de Appetic

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** aplicar a la propuesta de Appetic lo que se decidió en la reunión de socios del 26 de
  octubre de 2026 (precio ancla «a la medida» + Plan Empresario + Plan Emprendedor, 2×1, impresora
  térmica como opción) para que **Jonathan la presente hoy en Buen Apetit**.
- **Inicio:** 27 de octubre de 2026
- **Estado:** ✅ **TERMINADA** — 27 de octubre de 2026 · propuesta regenerada, folleto jubilado, producción limpia
- **Proyecto:** `/home/zevenoficial07/Apps Zeven/Swiftfly Solutions/Appetic`
- **Depende de:** `Guía para la propuesta nueva de Appetic.md` (D1–D23, cerrada el 25-oct-2026) y
  `../.mega-cuestionario/Guía para lo del tablero de la reunión.md` (T1–T17). Todo sigue vigente
  salvo lo que esta tarea cambie. Fuente de los cambios: la transcripción en
  `../reuniones/2026-10-26 Reunion socios/transcripcion.txt` (minutos 54 a 62), **que no se da por
  buena sin confirmar** — por eso esta ronda.

---

## 0. Lo que ya sé (investigado antes de preguntar)

- La propuesta vigente es `propuesta/propuesta-appetic.html` → PDF de **8 páginas A4**. El precio
  de **$49.000** aparece en la **portada** (p1), en «Lo que Appetic NO es» (p6) y en «La inversión»
  (p8). El folleto de una hoja `propuesta/folleto-appetic.html` también dice $49.000 (dos veces).
  La cartilla está jubilada (T6) y no se toca.
- **La portada ya existe**: foto del salón generada en Gemini (`img/portada-salon.jpg`, D18),
  puesta el 25 de octubre. En la reunión se dijo «acá está para poner la portada, es lo que yo no
  la había creado»: no sé si se refería a otra cosa → se pregunta.
- Lo que se oyó en la grabación (min 54–62), tal cual, para confirmar o corregir:
  - **El ancla**: «el costo de desarrollo» a la medida = **$5.000.000** de inicio + **$2.000.000**
    al mes de mantenimiento (≈ $7.000.000). App con su nombre, servidor propio, código entregado,
    exclusividad. «No creo que paguen la plata por eso» — sirve para que los planes se vean baratos
    (el Roadster de Tesla).
  - **Plan Empresario**: todo lo que ya tiene la app **+ chatbot personalizado con IA** que le
    responde a los clientes, **dentro de la app** («para no aplicarnos con API», después se conecta
    a Meta/WhatsApp). Se dijo también «un API de integración». Precio: se barajó 150.000 → 190.000
    → quedó en **$189.000/mes**. Con 2×1.
  - **Plan Emprendedor**: todo, sin el chatbot ni el API. Se barajó 100.000 → 109.000 → quedó en
    **$99.000/mes** («para que le den menos de cien mil»). Con 2×1. Sin cláusula de permanencia:
    deja de pagar y se desactiva.
  - **2×1**: «paga el primer mes y el segundo es gratis». Los «15 días gratis» se descartaron
    («no lo contratan ni gratis»).
  - **Impresora térmica POS**: un socio pidió ponerla porque en pantalla «si salen nuevos pedidos
    las pierden»; la compra el local. Contradice **D9** («sin impresora térmica»).
  - **Formato**: se mantiene el documento largo («se ve más chévere así porque uno les va contando
    página por página»), no una o dos hojas. Johan lo termina hoy; Jonathan lo imprime y lo lleva.
- El chatbot **no existe en el código** (como tampoco el mesero ni la cocina, D4/S5). Si se vende
  como existente, aplica el mismo riesgo asumido en D4.
- Las pantallas de cocina y mesero están **dibujadas en HTML** dentro del documento (D23). Un
  chatbot se puede dibujar igual, sin Gemini.

---

## 1. Objetivo

En sus palabras: *"empecemos con los cambios en la propuesta de Appetic para que Jonathan la
presente hoy, pero no nos confiemos de la transcripción"*.

---

## 2. Decisiones CERRADAS

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| **P1** | **Tres planes con nombre: Plan Desarrollador · Plan Empresario · Plan Emprendedor.** La meta es que **todos compren el Emprendedor**; los otros dos existen para justificar su precio (ancla). | Respuesta a P1 y a S2, palabras suyas: *"la estrategia de ventas es que vean un plan mega caro, luego un plan carito y ya el de $99.000 sea el que todos compren"*. |
| **P2** | **Plan Desarrollador: $5.000.000 una vez + $1.000.000/mes** de mantenimiento (no $2.000.000 como se oyó). Es una **oferta real**: app con su nombre, servidor propio, código entregado. | Respuesta a P1 (observación) y P4. ⚠️ Corrige la cifra de la grabación. |
| **P3** | **Plan Empresario: $189.000/mes** = todo lo del Emprendedor + **chatbot con IA dentro de la app** que responde a los clientes + **conexión por API con el sistema de caja** del local. | Respuesta a P2. El chatbot se **vende como existente** aunque no esté en el código (igual que mesero y cocina, D4): *"es para exagerar y justificar los precios altos"*. |
| **P4** | **Plan Emprendedor: $99.000/mes**, todo lo que ya cuenta la propuesta. Es «el que más eligen». | Respuesta a P1. |
| **P5** | **2×1 en los tres planes, hasta el 31 de diciembre de 2026**: pagas el primer mes el día de la entrega y el segundo va gratis. En el Desarrollador aplica al mantenimiento mensual. | Respuesta a P3, palabras suyas: *"en todos los planes para que no se vea la trampa, todos tienen 2×1 por lo que queda de año"*. Mantiene D3/S7: ni un peso antes de la entrega. |
| **P6** | **Impresora térmica como opción**: «si quieres, la comanda también sale impresa; la impresora la pones tú». D9 pasa de «sin impresora» a «pantalla, y papel si quieres». | Respuesta a P5. |
| **P7** | **La portada queda igual, pero SIN precio.** El precio vive solo en la página 8. | Respuesta a P6 + S1. |
| **P8** | **El folleto se jubila. No hay folleto ni cartilla: todo es la propuesta.** | Respuesta a P7, palabras suyas: *"el folleto ya no va a ir, todo va a ser la propuesta, ni cartillas ni nada"*. ⚠️ **Anula T6** (un folleto por producto) y deja la decisión del 25 sin efecto para Appetic. Avisado en el chat. |
| **P9** | **Se borra de appetic.vercel.app el PDF viejo y su redirección.** Las propuestas van a vivir en la landing de Swiftfly (`switflysolutions.com/#proyectos`). | Respuesta a S4, palabras suyas: *"Borra eso!!"*. Cierra el cabo suelto de T17. Poner el PDF en la landing es tarea aparte. |
| **P10** | **Corrección de hechos:** a Buen Apetit **nunca** se le ofreció Appetic; el que dijo que no (gratis y a $50.000) fue **otro local**. | Respuesta a S3. Se corrige el resumen de la reunión del 26, que lo decía al revés. |

---

## 3. Suposiciones del agente

- **S1** — El contacto del cierre sigue siendo el WhatsApp **320 843 5143** aunque presente Jonathan:
  el documento es de Appetic, no del vendedor. *(deducido de la cartilla heredada y D20: lo del
  vendedor es interno)*
- **S2** — «Meseros y pantallas sin límite» (D19) aplica a **los dos planes**. *(nadie habló de
  limitar nada en la reunión)*
- **S3** — El chatbot se **dibuja en HTML** dentro del documento, como las pantallas de cocina y
  mesero (D23). *(coherente con «se hacen imagencitas»)*
- **S4** — La «conexión por API con la caja» del Empresario se escribe como «conectamos Appetic con
  tu sistema de caja», sin nombrar sistemas concretos ni prometer plazos. *(confirmada en P3)*
- **S5 (cuadre de los planes, pedido por él: "ayúdame a cuadrarlos bien, qué llevan y por qué")** —
  - **Desarrollador** = para quien quiere **su propia app**: Appetic completo con su marca como app
    propia, **servidor exclusivo**, **código entregado** (es suyo), cambios a la medida y soporte
    prioritario. Justifica los $5M porque es desarrollo entregado, y el $1M/mes porque es su
    servidor, sus copias y sus mejoras. Casi nadie lo va a pagar: por eso va **primero** y en grande.
  - **Empresario** = todo el Emprendedor + **chatbot con IA** (responde horarios, recomendaciones y
    dudas del menú) + **conexión con la caja** + **soporte prioritario**. Justifica los $90.000 de
    diferencia porque la IA cuesta por mensaje y la integración es trabajo a la medida.
  - **Emprendedor** = todo lo que la propuesta ya cuenta (menú, QR, mesero, cocina, domicilios,
    menú del día, fotos, panel, buscador, soporte). Lleva la etiqueta **«El que más eligen»** y es
    el que se resalta visualmente, para que sea la elección obvia.
- **S6** — El **chatbot se dibuja en HTML** dentro de la tarjeta del Empresario en la página 8 (una
  mini conversación), como las pantallas de cocina y mesero (D23). Sin Gemini.
- **S7** — La vigencia del 2×1 se escribe como **«hasta el 31 de diciembre de 2026»** (lo que queda
  de año). Si se renueva en enero, se cambia una línea.
- **S8** — En la portada, el bloque del precio se reemplaza por una línea sin cifras: «Primer mes
  2×1 hasta el 31 de diciembre · sin comisión · sin contratos».
- **S9** — El folleto **no se borra**: se le pone el aviso de jubilado dentro del HTML (como a la
  cartilla, S6 del tablero) y se saca de `generar.sh`. El PDF viejo del folleto se mueve a la
  papelera para que no se imprima por error.

---

## 4. Descartado (no volver a proponer)

- **15 días gratis de prueba** → se cayó en la reunión: «no lo contratan ni gratis». Entra el 2×1.
- **Un precio único de $49.000** → reemplazado por el ancla + dos planes.

---

## 5. Estado de las rondas

- **Ronda 1 — Precios y alcance** ✅ respondida · `Cuestionario-1-Precios-Appetic.html`
- **Ronda 2** ❌ no se hace: con P1–P10 y S5 no queda nada que adivinar. Lo único delegado (qué lleva
  cada plan) quedó escrito en S5 para que lo corrija si no le cuadra.

---

## 6. Incógnitas abiertas

**Ninguna.** Las siete de la ronda 1 quedaron cerradas en P1–P10.

### Pendiente FUERA de esta tarea
- **Poner la propuesta de Appetic (PDF) en la landing** `switflysolutions.com/#proyectos` (P9). Toca
  la web de Swiftfly y el FTP de Hostinger: tarea aparte.
- Si algún restaurante firma el **Empresario**, hay que programar el chatbot y la conexión con la
  caja; si firma el **Desarrollador**, montar servidor propio y entregar código. Mismo riesgo que
  D4.

---

## 7. Plan de implementación

- [x] 1 · **Portada (p1)** — quitar el bloque «$49.000 / mes»; línea sin precio (S8).
- [x] 2 · **Qué es (p3)** — módulo «Pantalla de cocina» con «y en papel si quieres»; módulo nuevo
      «Chatbot con IA · Plan Empresario».
- [x] 3 · **Cómo funciona (p4)** — una línea de la impresora bajo la pantalla de cocina.
- [x] 4 · **Qué gana / NO es (p6)** — «pagas lo mismo: $49.000» → «tu plan, fijo».
- [x] 5 · **La inversión (p8)** — rehacer: tres planes (Desarrollador · Empresario con mini-chat ·
      Emprendedor resaltado), 2×1 hasta el 31-dic-2026, condiciones comunes, entrega y arranque.
- [x] 6 · Buscar cualquier «49» que quede en el HTML. Generar el PDF, medir las 8 páginas y revisar
      una por una.
- [x] 7 · **Jubilar el folleto**: aviso en el HTML, fuera de `generar.sh`, PDF a la papelera.
- [x] 8 · **Borrar en Appetic** la redirección de `vercel.json` y el PDF viejo de `public/`
      (P9) y publicar.
- [x] 9 · Corregir el resumen de la reunión del 26 (P10) y regenerar su PDF.
- [x] 10 · Cerrar: borrar el cuestionario HTML, marcar la guía como terminada.

---

## 8. Bitácora

- **27 de octubre de 2026** — Se abre la tarea después del resumen de la reunión del 26. Leída la
  propuesta vigente página por página (8 páginas; $49.000 en p1, p6 y p8), el folleto, la guía del
  25 (D1–D23) y los minutos 54–62 de la transcripción. Entregada la ronda 1 con 7 preguntas y 4
  sugerencias, todas para confirmar lo que la grabación deja ambiguo.
- **27 de octubre de 2026** — Ronda 1 respondida (P1–P10). Tres cosas que la grabación tenía
  distintas o incompletas y que justifican no haberle creído a ciegas: el mantenimiento del
  Desarrollador es **$1.000.000**, no dos; el 2×1 es **en los tres planes y hasta fin de año**; y
  **el que rechazó Appetic no fue Buen Apetit**. Dos choques avisados en el chat: el folleto se
  jubila (anula T6) y el PDF viejo de producción se borra (cierra T17). Él pidió que yo cuadrara
  qué lleva cada plan: queda en S5. **Sin ronda 2.** Arranca la construcción.
- **27 de octubre de 2026** — Construido. Lo que hubo que resolver sobre la marcha:
  - **Página 3**: el chatbot como módulo nuevo hacía una fila de más y la página se pasaba 12 mm.
    Se fusionó «Mesa o domicilio» dentro de «Pantalla de cocina» (el mensaje se conserva) y el
    chatbot ocupa esa celda. Celdas 2 mm más bajas y la banda final más apretada.
  - **Página 8**: con los tres planes no cabía «Lo que recibes el día de la entrega»; se movió al
    final de la página 7, que tenía 37 mm libres. Los tres planes van en una fila: Desarrollador
    oscuro (ancla), Empresario con una mini conversación dibujada en HTML, Emprendedor con borde
    naranja y la etiqueta «El que más eligen». Banda del 2×1 y seis condiciones en dos columnas.
  - **Portada**: sin precio; el bloque dice «2×1 primer mes · hasta el 31 de diciembre de 2026».
  - **Folleto**: aviso de jubilado dentro del HTML, fuera de `generar.sh`, PDF a la papelera. El
    aviso de la cartilla también se corrigió (ya no dice que hay folleto).
  - **Producción**: quitada la redirección de `vercel.json`, borrados `public/cartilla-appetic.pdf`
    y `cartilla-version.json`; el botón del superadmin ahora abre
    `switflysolutions.com/#proyectos`. Build OK. Publicado con push a `main`.
  - **Resumen de la reunión del 26**: corregida la línea de Buen Apetit (P10) y regenerado.
  - Verificadas las 8 páginas en imagen: ninguna pisa el pie. No queda ningún «49.000».
