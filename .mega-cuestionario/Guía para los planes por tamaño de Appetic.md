# Guía para los planes por tamaño de Appetic

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** rehacer la oferta de Appetic en planes por tamaño de negocio: uno sencillo para
  locales chicos y tráilers (el que jale las ventas), otro con mesas y cocina, y otro con
  contabilidad. **Solo la propuesta de venta; la app no se toca.**
- **Inicio:** 2 de noviembre de 2026
- **Estado:** ✅ **TERMINADA** — 2 de noviembre de 2026 · propuesta de 5 páginas + tapa con las fotos de Gemini
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

### De la ronda 2

| # | Decisión | Por qué |
|---|----------|---------|
| **R10** | **Completo → «Total»: $129.000/mes.** Escalera: Básico $39.900 · Pro $79.000 · Total $129.000 · Desarrollador $5M + $1M/mes. | Respuesta a P1 y P6. |
| **R11** | **El chatbot con IA sale de la propuesta.** También sale la «conexión con tu sistema de caja» del viejo Empresario. | Respuesta a P2. Menos texto y menos promesas sin código. |
| **R12** | **La Pantalla de menú para TV va desde el Básico (en todos los planes)** y es el **gancho** de la portada / primera página. | Respuesta a P3 + S2. Un tráiler o local chico con un TV es quien más la luce. ⚠️ No existe en el código: mismo riesgo que R5. |
| **R13** | **Pago semestral: pagas 5 y te damos 6 · anual: pagas 10 y te damos 12.** | Respuesta a P4. |
| **R14** | **2×1 hasta el 31-dic-2026 en todos los planes MENOS el Básico** (Pro, Total y Desarrollador). | Observación a P5: *"en todos menos en el pequeño"*. |
| **R15** | **Nombres: Básico · Pro · Total** (+ Desarrollador, que conserva su nombre). | Respuesta a P6. |
| **R16** | **4 a 5 páginas, una idea por página.** | Respuesta a P7. Se hojea en un minuto mientras el dueño atiende. |
| **R17** | **Dominan las fotos de negocios del barrio hechas con IA** (tráiler, local, restaurante). | Respuesta a P8. |
| **R18** | **Las imágenes las genera el usuario en Gemini** con los prompts que dejo en `.prompts-imagenes/propuesta-planes.md`. | Respuesta a P9. Mejor calidad y gratis. |
| **R19** | **Abre con los tres negocios a la vez: «Hay un Appetic para tu negocio».** | Respuesta a P10. |
| **R20** | **Sí a:** página «¿Cuál es tu plan?» con los tres negocios · la TV como gancho arriba · **QR a la demo en vivo**. | S1, S2 y S3, todas 👍. |

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
- **S6** — **Imágenes provisionales.** Para poder armar y revisar el diseño sin esperar a Gemini,
  genero versiones provisionales con Pollinations (marca recortada) con los **mismos nombres de
  archivo** que las definitivas. Cuando lleguen las de Gemini se reemplazan y se regenera el PDF.
- **S7** — El **QR de la demo** apunta a `appetic.vercel.app/demo` (la demo guiada, `DEMO_SLUG`),
  no a `/pilotos` como la propuesta vieja. *(deducido de `src/config/demo.js` y la guía de la Demo)*
- **S8** — El plan resaltado es el **Básico** («Para empezar hoy»): es el que jala las ventas. El
  **Pro** lleva la etiqueta «Para restaurantes». *(deducido del objetivo)*
- **S9** — El pago semestral/anual aplica a **los cuatro planes** (en el Desarrollador, a la
  mensualidad), y **no se suma** con el 2×1. *(para que no haya dos descuentos encima)*
- **S10** — Lo que separa los planes, en una línea cada uno: **Básico** = vender sin fila y con
  domicilio · **Pro** = + el salón (mesero, cocina, QR por mesa, cuenta por mesa) · **Total** = +
  las cuentas (caja del día, gastos, nómina, ganancia del mes) · **Desarrollador** = todo, como app
  tuya. *(R2, R6)*
- **S11** — La **tapa impresa** (`tapa-appetic.html`) se actualiza al mensaje nuevo («Hay un
  Appetic para tu negocio») y pasa a la foto de los tres negocios. *(si no, la versión impresa
  seguiría diciendo «Restaurantes con salón»)*
- **S12** — La propuesta vieja de 8 páginas se **reemplaza** en el mismo archivo
  `propuesta-appetic.html`; queda en el historial de git. *(P8: una sola pieza)*
- **S13** — La pantalla de TV necesita un aparato con navegador (Smart TV, TV box o un portátil por
  HDMI). En la propuesta se dice «en el TV que ya tienes», sin detalles técnicos (como D11).

---

## 4. Descartado (no volver a proponer)

- 15 días gratis de prueba y precio único de $49.000 → ya descartados el 27-oct.
- **Plan Empresario / chatbot con IA / conexión con la caja** → fuera (R1, R11).
- **Dos piezas (una corta para la calle)** → se prefirió una sola propuesta, pero corta y visual (R7, R16).
- **Plan Emprendedor a $99.000** → reemplazado por Pro a $79.000 (R4).

---

## 5. Estado de las rondas

- **Ronda 1 — Visión general** ✅ respondida · `Cuestionario-1-Planes-por-tamano.html`
- **Ronda 2 — Precios finos, piezas nuevas y cómo se ve** ✅ respondida · `Cuestionario-2-Precios-y-visual.html`
- **Ronda 3** ❌ no se hace: con R1–R20 no queda nada que adivinar.

---

## 6. Incógnitas abiertas

**Ninguna.**

### Pendiente FUERA de esta tarea
- Si alguien compra el **Total**, hay que programar la contabilidad (R5); la **Pantalla de menú
  para TV** hay que programarla para cualquier plan (R12).
- Publicar el PDF en la landing de Swiftfly (pendiente heredado de P9).

---

## 7. Plan de implementación

**Las 5 páginas (una idea por página):**
1. **Portada** — foto de los tres negocios · «Hay un Appetic para tu negocio» · la TV como gancho.
2. **¿Cuál es tu plan?** — tráiler → Básico · local → Pro · restaurante → Total, con su foto y una línea.
3. **Desde el Básico** — la TV con el menú andando solo (dibujada en HTML) + la fila que desaparece
   + íconos de todo lo que trae.
4. **Creces sin cambiar de app** — Pro (mesero + cocina, dibujados) y Total (contabilidad dibujada,
   «no es DIAN») + QR a la demo en vivo.
5. **Los planes** — Desarrollador (ancla) · Básico · Pro · Total, 2×1 menos en el Básico,
   5×6 y 10×12, condiciones y WhatsApp.

- [x] 1 · Prompts de Gemini en `.prompts-imagenes/propuesta-planes.md` (5 imágenes, mismos nombres que las provisionales).
- [x] 2 · Imágenes provisionales en `propuesta/img/` (S6).
- [x] 3 · Reescribir `propuesta-appetic.html` en 5 páginas (QR nuevo a `/demo`).
- [x] 4 · Actualizar `tapa-appetic.html` (S11) y los comentarios de `generar.sh`.
- [x] 5 · Generar el PDF, revisar cada página en imagen (nada pisa el pie, nada se sale).
- [x] 6 · Subir a la rama y entregar el PDF.
- [x] 7 · Cuando lleguen las imágenes de Gemini: reemplazar, regenerar y cerrar (borrar los HTML de las rondas).

---

## 8. Bitácora

- **2 de noviembre de 2026** — Se abre la tarea. Leídas las guías del 25 y 27 de octubre y la
  página de planes vigente. Entregada la ronda 1: 7 preguntas y 5 sugerencias.
- **2 de noviembre de 2026** — Ronda 1 respondida (R1–R9). Dos cambios a propósito sobre lo del
  27-oct: el Empresario deja de ser plan (R1) y el plan con salón baja de $99.000 a $79.000 (R4).
  El giro grande es R7: la propuesta se rehace **visual y con poco texto**. Se pidió revisar la
  skill de imágenes: probada desde la nube (S5). Entregada la ronda 2.
- **2 de noviembre de 2026** — Ronda 2 respondida (R10–R20). Sin ronda 3. Arranca la
  construcción: 5 páginas, Básico $39.900 · Pro $79.000 · Total $129.000 · Desarrollador.
- **2 de noviembre de 2026** — Construido con imágenes **provisionales** (S6). Lo que hubo que
  resolver sobre la marcha:
  - El usuario recordó que las fotos las genera en Gemini (R18): se le mandaron los prompts de
    `.prompts-imagenes/propuesta-planes.md` y las provisionales quedan solo para ver el diseño.
  - `google-chrome --print-to-pdf` (lo que usa `generar.sh`) **se cuelga en el contenedor de la
    nube**. Aquí el PDF se generó con Playwright (`page.pdf`, `preferCSSPageSize`); en el PC
    `generar.sh` sigue sirviendo igual.
  - Choque de clases: `.plan` existía para las tarjetas de precios y se usó también para el nombre
    del plan en la página 2 → renombrado a `.pn`.
  - Primera versión: el precio se salía de la TV grande, la contabilidad pisaba su lista y sobraba
    un tercio de página abajo. Corregido (TV más chica de letra, arte de 112 mm, más aire).
  - La tapa decía «desde $39.900»: se quitó por P7 (portada sin precio).
  - QR de la demo regenerado a `appetic.vercel.app/demo` (S7).
- **2 de noviembre de 2026** — Llegaron las 5 fotos de Gemini y reemplazaron a las provisionales
  con los mismos nombres. Regenerados la propuesta (5 páginas) y la versión impresa (tapa + 5).
  Borrados los cuestionarios HTML de las rondas 1 y 2. **Tarea cerrada.**
- **2 de noviembre de 2026** — Ajuste pedido tras ver el PDF: *"las fotos de Pilotos me gustaban,
  la del local era buena para mostrar el menú digital; las fotos de cocina no se ven nada
  llamativas"*. Página 3: «Adiós a la fila» ahora son **tres celulares con capturas reales**
  (menú de Pilotos → producto → pedido al WhatsApp), que además llenan el hueco de abajo.
  Página 4: el mesero y la cocina **dibujados** se cambian por **capturas reales** recortadas
  (`img/mesero-recorte.jpg`, `img/cocina-recorte.jpg`). Esto corrige D23/S4 solo para el Pro; la
  TV y la contabilidad siguen dibujadas porque no existen en la app.
- **2 de noviembre de 2026** — En el Pro, las capturas del mesero y la cocina se cambian por dos
  fotos de Gemini (*"prefiero fotos del mesero pidiendo con la app y el mesero con una tablet
  viendo los pedidos"*): `img/pro-mesero-pide.jpg` y `img/pro-tablet-pedidos.jpg` (prompts 6 y 7).
  Se borran los recortes de capturas que ya no se usan. Las capturas de Pilotos de la página 3
  se quedan.
- **2 de noviembre de 2026** — **Cambio de orden pedido por el usuario:** *"primero que diga qué es
  Appetic… un sistema que vamos a instalar en tu negocio… y que vaya mostrando cada cosa que se
  puede hacer… y al final ya ahí sí los planes: si no necesitas esto, te acomodas a este plan"*.
  Esto **reemplaza R19** («abre con los tres negocios / ¿cuál es tu plan?» en la página 2): ahora
  la propuesta guía al cliente y los planes van al final. Siguen siendo 5 páginas (R16):
  1. Portada (sin cambios).
  2. **Qué es Appetic** («un sistema que instalamos en tu negocio») + índice de las 5 cosas que
     hace + **1 · Menú digital** (capturas de Pilotos y fotos de los platos).
  3. **2 · Menú en vivo en tu TV** + **3 · Domicilios y todo lo demás** (íconos).
  4. **4 · Meseros y cocina** (fotos de Gemini) + **5 · Tus cuentas**, ya **sin precios** + demo.
  5. **Los planes**: «Tómalo completo, o solo lo que necesitas». Cada plan lleva la foto de su
     negocio y dice qué números incluye: Básico = 1, 2 y 3 · Pro = del 1 al 4 · Total = del 1 al 5.
  La página «¿Cuál es tu Appetic?» desaparece: sus fotos pasaron a las tarjetas de los planes.
- **2 de noviembre de 2026** — Portada: el bloque de abajo deja de ser la TV (*"cambiar esto porque
  ya más abajo se explica; mejor profundizar brevemente en qué es Appetic"*). Ahora dice **qué es
  Appetic**: «El sistema de tu negocio de comida, en una sola app», una línea de lo que junta y
  cómo se instala, y 4 puntos (lo instalamos nosotros · sin descargar nada · sin comisión · te
  acompañamos). Para no repetirlo, la página 2 abre con «Cinco cosas que cambian en tu negocio».
  La TV ya no es gancho de portada (ajusta R12): vive en su sección 2.
- **2 de noviembre de 2026** — **Pendiente para la sesión local** (se pasa a trabajar en el PC):
  montar `domicilios.jpg` en la sección 3 y los mockups de la portada (prompts 8 y 9 en
  `.prompts-imagenes/propuesta-planes.md`, con el paso a paso). Las dos imágenes ya están
  generadas en `~/Descargas` del PC. Todo lo anterior quedó publicado en `main`. Los PDF no se
  versionan: regenerar con `bash propuesta/generar.sh tapa-appetic propuesta-appetic`.
