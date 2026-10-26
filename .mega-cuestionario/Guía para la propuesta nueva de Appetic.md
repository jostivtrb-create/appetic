# Guía para la propuesta nueva de Appetic

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** rehacer la propuesta de Appetic con la estructura de la de Simó (que funcionó el 25 de
  octubre de 2026), sumando **sistema de mesero y cocina** (la comanda llega directo a la cocina,
  igual que los domicilios, diciendo si es **para mesa** o **para domicilio**) y con el precio en
  **$49.000 al mes**.
- **Inicio:** 25 de octubre de 2026
- **Estado:** ✅ **TERMINADO** — 25 de octubre de 2026 · propuesta + folleto · pendiente solo publicarlo en el sitio
- **Proyecto:** `/home/zevenoficial07/Apps Zeven/Swiftfly Solutions/Appetic`

---

## 1. Objetivo

En sus palabras: *"mejorar esta propuesta y hacerla un poco a la de Simo porque funciono muy bien
hoy"*, que la app *"tambien tenga un sistema de mesero y cocina que las comandas llegan directo a la
cocina al igual que los domicilios y diga si es para mesa o para cocina"*, y que *"el costo de la
app sean $49.000 al mes"*.

(La última frase dice "para mesa o para cocina"; por el contexto lo leo como **para mesa o para
domicilio** — es la etiqueta que la cocina necesita ver en la comanda. Queda anotado para
confirmarlo.)

---

## 2. Decisiones CERRADAS

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| **D1** | **Esta tanda es SOLO el documento.** El mesero y la cocina no se programan ahora. | Respuesta a P1. La app se hace en otra tanda, cuando haya un restaurante que la pida. |
| **D2** | **$49.000 al mes y nada más: se quita el montaje de $50.000.** | Respuesta a P2. Un solo número, mucho más fácil de vender que dos. |
| **D3** | **Se cobra desde el primer mes.** No hay mes incluido ni mes gratis. | Respuesta a S5. Sin montaje, el primer mes es el único ingreso de entrada. |
| **D4** | **La propuesta cuenta el mesero y la cocina como si ya estuvieran**, sin etiquetas de fase ni fechas. | Respuesta a P3. Vende más fuerte. ⚠️ Riesgo asumido y avisado: hoy no existe en el código (S5 de la ronda 1), así que un «sí» obliga a programarlo contra reloj. Él decidió con el aviso delante. |
| **D5** | **Público: restaurantes con mesas y salón.** El mesero y la cocina son el centro de la venta, no un extra. | Respuesta a P4. Justifica los $49.000 y reorienta el documento: primero el salón, después el domicilio. |
| **D6** | **Un solo documento: la propuesta reemplaza a la cartilla.** | Respuesta a P5. Una sola cosa que mantener y que ningún vendedor diga un número distinto. Implica que la propuesta tiene que **vender sola**, como hacía la cartilla. |
| **D7** | **Lleva capturas reales de la app, grandes y con pie de foto.** | Respuesta a P6, la única que marcó. Era justo lo que la propuesta vieja no tenía (4 páginas de texto). |
| **D8** | **Firma: Appetic arriba y «un producto de Swiftfly Solutions» abajo, con el logo de la empresa.** | Respuesta a P7 + su observación: *"Si usando el logo de la empresa de software"*. |
| **D9** | **La comanda es una pantalla en la cocina, y se dice claro.** Sin impresora térmica. | Respuesta a S2. Evita el malentendido del restaurante que espera papel. |
| **D10** | **Solo comanda a cocina. Sin caja ni cuenta de la mesa.** | Respuesta a S3. Mucho menos trabajo y suficiente para arrancar. |
| **D11** | **No se mencionan los requisitos del local** (wifi, tablet encendida en cocina). | Respuesta a S4. Decisión suya; se habla en la entrega, no en el documento. |
| **D12** | **Los locales viejos de $18.900 no se tocan ni se mencionan.** Se van saliendo solos. | Palabras suyas: *"esa gente nunca pagó, poco a poco los voy sacando; por ahora dejarlos para que vean locales en la app, igualmente no la usaban"*. Los $49.000 son EL precio, sin precios heredados que explicar. |

### De la ronda 2

| # | Decisión | Por qué |
|---|----------|---------|
| **D13** | **El pedido de mesa entra por dos vías:** el cliente escanea el QR de su mesa y pide solo, **y** el mesero también puede tomarlo desde su celular. | Respuesta a P1. Cubre al cliente que no quiere usar el celular y al restaurante que no quiere soltar al mesero. |
| **D14** | **El pedido llega a las dos partes: a la pantalla de la cocina y al WhatsApp del local.** | Respuesta a P2. No se pierde nada si la tablet está apagada y el dueño conserva lo único que ya entiende. Salva el argumento más conocido de Appetic. |
| **D15** | **La cocina marca la comanda como «lista»** y se le avisa al mesero o al domiciliario. Nada más. | Respuesta a P3. Es el mínimo que hace útil la pantalla sin volverla un sistema de estados. |
| **D16** | **7 u 8 páginas A4**, como la de Simó. | Respuesta a P4. Se lee de corrido en una visita y se manda por WhatsApp sin que pese. |
| **D17** | *(respondió «decide tú»)* **De la cartilla se mudan:** las fotos de los platos hechas con IA, el pedido como llega al WhatsApp, el panel del dueño, el Kit de Bienvenida (en bloque, no en página propia), el menú del día, el buscador del barrio con su «tú decides si apareces», el «se instala sin pasar por la tienda» y los pasos de después del sí. **Se queda fuera** todo lo que era formación del vendedor. | Con 8 páginas y el salón como centro, eso es lo que cabe y lo que aporta. Queda como suposición S9. |
| **D18** | **Portada con foto generada en Gemini**: un salón de restaurante. | Respuesta a P6. Prompts entregados y guardados en `.prompts-imagenes/propuesta-portada.md`. |
| **D19** | **Meseros y pantallas SIN LÍMITE** en los $49.000. | Respuesta a P7. Es lo más fácil de decir y no hay nada que contar ni vigilar. |
| **D20** | **El vendedor se lleva el primer mes completo, pero eso NO va en el documento.** | Respuesta a S1 + su observación: *"pero eso lo manejamos interno"*. Tapa el hueco que dejaba quitar el montaje. |
| **D21** | **Mes a mes, sin mínimo de meses y sin cláusula de salida.** | Respuesta a S2, palabras suyas: *"no se puede quedar con el menú porque lo puede desactivar en cualquier momento; tampoco es tanto trabajo ponerlo, entonces no pasa nada"*. Se convierte en argumento de venta: «sin contratos». |
| **D22** | **Hay una página que responde «yo ya tengo sistema»** antes de que el dueño lo diga. | Respuesta a S3. Es la primera objeción de un restaurante que ya usa un POS. |
| **D23** | **Las pantallas de cocina y de mesero se dibujan en HTML con la cara de Appetic.** No se generan con IA ni se presentan como capturas. | Respuesta a S4. Gratis, inmediato y bajo control; el resto de las imágenes sí son capturas reales. |

### Heredado de la cartilla (tarea anterior, vigente salvo que lo desmienta)

- Sin comisión por pedido · «no somos Rappi» · el local entrega con su domiciliario.
- Se cobra **contra entrega**, con el menú ya funcionando.
- Contacto y soporte: **3208435143**.
- Identidad: naranja `#ED7D2B`/`#E0692A`, crema `#FFFBF4`, tinta `#2A211C`,
  *Playfair Display* + *Plus Jakarta Sans*.
- PDF A4 generado con Chrome headless (`--print-to-pdf`), fuentes e imágenes incrustadas.
- Aparecer en el buscador del barrio es **opcional**: el dueño decide.

---

## 3. Suposiciones del agente

- **S1** — La propuesta nueva se escribe en `propuesta/propuesta-appetic.html` y se regenera con
  `propuesta/generar.sh`, que ya está probado. *(deducida de: `propuesta/generar.sh`)*
- **S2** — Largo objetivo: **6 o 7 páginas A4**, como la de Simó (hoy la de Appetic tiene 4 y es
  casi todo texto). *(deducida de: `../SIMO/propuesta/simo-propuesta-completa.html`, 7 páginas)*
- **S3** — Se reusan las **capturas ya tomadas** en `cartilla/capturas/` (Jasbury y Pilotos: menú,
  producto, carrito, checkout y las 4 pestañas del panel). No hace falta volver a capturar salvo
  para pantallas nuevas. *(deducida de: `cartilla/capturas/`)*
- **S4** — "Para mesa o para domicilio" es la **etiqueta grande de la comanda** en la pantalla de
  cocina, no un ajuste del panel. *(deducida de su frase y de `src/services/pedidos.js`, que ya
  guarda `entrega: 'domicilio' | 'recoger'`)*
- **S5** — El mesero y la cocina **no existen hoy** en el código: están los pedidos en Firestore con
  código y estado, y el panel del domiciliario, pero no hay mesas, ni rol de mesero, ni pantalla de
  cocina. *(verificado en: `src/config/roles.js`, `src/services/pedidos.js`, `src/pages/`)*
- **S6** — Como no hay pantalla de cocina que fotografiar (D4 + D1), las pantallas de **cocina y
  mesero se dibujan en HTML/CSS dentro del propio documento**, con la identidad de Appetic. No se
  presentan como «captura», se presentan como la pantalla. Las demás imágenes sí son capturas reales
  de `cartilla/capturas/`. *(decidido por mí: es gratis, instantáneo y no depende de Gemini)*
- **S7** — El primer mes **se cobra el día de la entrega**, con el menú ya funcionando. Así se
  conserva el argumento «no pagas nada hasta que lo tengas andando» sin regalar el mes. *(deducida
  de D3 + el cobro contra entrega heredado de la cartilla)*
- **S9** — Lo que se muda de la cartilla, al haber contestado «decide tú» en P5 (detalle en D17).
- **S10** — El **enlace y el QR de muestra apuntan a `appetic.vercel.app/pilotos`** y se usa como
  prueba social que **hay 7 locales montados y vivos** (El Monumento, Fruti Tentación, JUANCE,
  La Comarca, La Gran Esquina, Perros Criiollos, Pilotos). *(verificado el 25/10/2026 abriendo
  appetic.vercel.app: los 7 están publicados; Jasbury ya no)*
- **S11** — Las capturas se toman de `cartilla/capturas/`, **prefiriendo Pilotos** (sigue vivo) sobre
  Jasbury (ya no está publicado). Las fotos de platos del strip salen de
  `public/locales/sabor-del-dia/` por ser las que se parecen al público nuevo: restaurante de
  almuerzo con salón (ajiaco, bandeja paisa, sancocho, mojarra).
- **S12** — El documento se escribe en `propuesta/propuesta-appetic.html` (el viejo queda en el
  historial de git, commit `30fd644`), con las imágenes **externas** en `propuesta/img/` como hizo
  la de Simó, y las fuentes incrustadas desde `cartilla/fuentes.css`. El PDF sale con
  `propuesta/generar.sh`.
- **S8** — Las piezas de Simó que se calcan, al haber contestado «decide tú» en P6: rejilla de
  módulos (**sin** etiquetas de fase, por D4), «qué gana cada quien» (dueño · mesero · cocina ·
  cliente), «lo que Appetic NO es», informe mensual de ejemplo, cierre con el WhatsApp grande y el
  QR, y el tono de frases cortas. **Se descarta** la línea de tiempo por fases, que choca con D4.

---

## 4. Descartado (no volver a proponer)

- **Impresora térmica / quitar el WhatsApp** → D14: pantalla y WhatsApp conviven.
- **Mínimo de meses o cláusula de salida** → D21: mes a mes.
- **Estados completos de cocina** (recibida → en preparación → lista → entregada) → D15: solo «lista».
- **Cobrar por mesero o pantalla adicional** → D19: sin límite.
- **Decir en el documento cuánto gana el vendedor** → D20: es interno.
- **Generar con IA las pantallas de cocina y mesero** → D23: se dibujan en HTML.
- **Contar el mesero y la cocina por fases**, estilo Simó → chocaba con D4: se cuentan como si ya
  estuvieran.
- **Mantener el montaje de $50.000** → D2: todo al mensual.
- **Mes incluido / primer mes gratis** → D3: se cobra desde el primer mes.
- **Precio heredado para los locales viejos** → D12: no se mencionan.
- **Impresora térmica para la comanda** → D9: pantalla.
- **Caja y cuenta de la mesa** → D10: solo comanda.
- **Decir en el documento lo que el local tiene que poner** (wifi, tablet) → D11.
- **Dejar la cartilla de 18 páginas viva en paralelo** → D6: un solo documento.

---

## 5. Estado de las rondas

- **Ronda 1 — Visión general** ✅ respondida · `Cuestionario-1-Propuesta-Appetic.html`
- **Ronda 2 — Cómo funciona por dentro y qué va en el documento único** ✅ respondida ·
  `Cuestionario-2-Mesero-Cocina-y-Documento.html`
- **Ronda 3** ❌ no se hace: con D1–D23 no queda nada que adivinar.

---

## 6. Incógnitas abiertas

**Ninguna.** Las once de la ronda 1 se cerraron en D1–D12 y las nueve de la ronda 2 en D13–D23.
Lo único que falta es material, no decisiones:

- ✅ La **foto de portada** ya está puesta (`propuesta/img/portada-salon.jpg`).

### Añadido después, por la reunión del 25 de octubre

Ver `Swiftfly Solutions/.mega-cuestionario/Guía para lo del tablero de la reunión.md` (T5, T6):

- **T6 anula D6.** Ya no hay «un solo documento»: Appetic tiene **dos piezas** y **cero cartillas** —
  `propuesta/propuesta-appetic.html` (8 páginas A4) y `propuesta/folleto-appetic.html` (una hoja
  carta, lado y lado). La cartilla de `cartilla/` quedó **jubilada**, con un aviso dentro del HTML
  para que nadie la imprima. `propuesta/generar.sh` ahora arma los dos PDF.
- **T5 confirma D1 y D4**: el mesero y la pantalla de cocina **se programan cuando un restaurante
  diga que sí**, no antes.

### Lo que queda pendiente FUERA de esta tarea

- **Programar de verdad el mesero y la cocina** (D1 lo deja fuera, D4 lo vende como existente). Al
  primer «sí» de un restaurante hay que construir: mesas con QR, rol de mesero, pantalla de cocina
  con la etiqueta MESA/DOMICILIO, y el aviso de «lista». Lo que ya existe y sirve de base:
  `locales/{id}/pedidos` con `codigo`, `estado` y `entrega`, y el panel de `/domiciliario`.
- **Publicar el documento nuevo**: hoy `vercel.json` redirige `/propuesta-appetic.pdf` a
  `/cartilla-appetic.pdf`, y el botón del panel y `public/` sirven la cartilla. Si la propuesta la
  reemplaza (D6), hay que cambiar eso.

---

## 7. Plan de implementación

Documento de **8 páginas A4**, identidad Appetic, estructura de la de Simó.

- [x] 1 · Preparar `propuesta/img/`: logo de Appetic, logo de Swiftfly reducido, QR de WhatsApp
      generado con `qrcode`, capturas de `cartilla/capturas/` optimizadas y fotos de plato de
      `public/locales/sabor-del-dia/`.
- [x] 2 · **Página 1 · Portada** — foto del salón a sangre (hueco mientras llega), sello naranja,
      título, y el pie «Appetic · un producto de Swiftfly Solutions».
- [x] 3 · **Página 2 · El problema** — el salón de hoy: la comanda a grito, el papel que se pierde,
      el cliente esperando a que el mesero vuelva, el domicilio en otro lado.
- [x] 4 · **Página 3 · Qué es** — rejilla de módulos sin etiquetas de fase (D4) + se instala sin
      pasar por la tienda de apps.
- [x] 5 · **Página 4 · Cómo funciona** — la página grande: el recorrido del pedido y las pantallas
      de **cocina** (con la etiqueta MESA 4 / DOMICILIO) y de **mesero**, dibujadas en HTML (D23).
- [x] 6 · **Página 5 · Cómo se ve** — capturas reales grandes con pie de foto (D7) + el strip de
      fotos de platos + el pedido como llega al WhatsApp, dibujado como la burbuja de la cartilla.
- [x] 7 · **Página 6 · Qué gana cada quien** — dueño · mesero · cocina · cliente + «lo que Appetic
      NO es» (no somos Rappi, sin comisiones, no repartimos, no te quitamos el cliente).
- [x] 8 · **Página 7 · «Yo ya tengo sistema»** (D22) + el panel del dueño + informe mensual de
      ejemplo.
- [x] 9 · **Página 8 · Precio y cierre** — $49.000/mes, sin montaje, desde el primer mes, mes a mes
      sin contratos, meseros y pantallas sin límite + Kit de Bienvenida + próximos pasos + WhatsApp
      3208435143 grande y el QR.
- [x] 10 · Generar el PDF con `propuesta/generar.sh` y revisarlo página por página.
- [x] 11 · Cambiar la portada cuando llegue la foto de Gemini y regenerar.

---

## 8. Bitácora

- **25 de octubre de 2026** — Investigación previa antes de preguntar: leída la propuesta actual
  (4 páginas, sin capturas), la de Simó (7 páginas, rejilla de módulos con fases, capturas,
  "qué gana cada quien", "lo que no es", informe de ejemplo, cierre con WhatsApp + QR), la guía de
  la cartilla (modelo $50.000 + $18.900, D1–D23) y el código de la app. Hallazgo clave: los pedidos
  ya se guardan en Firestore con estado y tipo de entrega y ya hay panel de domiciliario, así que la
  cocina se apoya en algo que existe; mesero y mesas no existen. Entregada la ronda 1 con 7
  preguntas y 5 sugerencias.
- **25 de octubre de 2026** — Ronda 1 respondida (D1–D12). Dos choques detectados y avisados en el
  chat, sin pararme porque son decisión suya y no contradicen nada ya cerrado: **(a)** vender el
  mesero y la cocina como existentes (D4) mientras no se programan (D1); **(b)** quitar el montaje
  (D2) deja sin ingreso al vendedor puerta a puerta, que vivía íntegro de esos $50.000 (D2 de la
  cartilla) — va como pregunta en la ronda 2. Entregada la ronda 2 con 7 preguntas y 4 sugerencias.
