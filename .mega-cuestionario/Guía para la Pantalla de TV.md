# Guía para la Pantalla de TV

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** Construir el punto 2 de la propuesta, «Tu menú en vivo, en tu TV», bien hecho y no como una pantalla genérica.
- **Inicio:** 2 de noviembre de 2026
- **Estado:** ✅ **Terminada** — 2 de noviembre de 2026 · Etapas A (`efcc2a6`), B (`a3a4897`) y C (`ec75ead`) publicadas, reglas desplegadas · falta solo «Reiniciar demo» (superadmin) para ver todo en la demo publicada
- **Proyecto:** `Appetic/` (Vite + React + Firebase, Vercel)

---

## 1. Objetivo

Lo que promete la propuesta (pág. 3), en los **tres planes**: una pantalla con todo el menú en tiempo
real y con los precios de hoy. Los platos pasan solos con foto y precio, sale del menú sin diseñar
nada, si cambias un precio cambia en el TV, y funciona en el televisor que ya tienen. El dibujo de la
propuesta muestra un carrusel: foto grande a la izquierda, la etiqueta «Plato del día», nombre,
descripción, precio en píldora, puntos de avance y el logo arriba a la derecha.

El usuario quiere algo **top**, que se sienta producto y no una pantalla para salir del paso.

---

## 2. Decisiones CERRADAS

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| D1 | **Formato híbrido:** el tablero de una categoría y, al lado, un plato grande que va rotando. Las categorías se van turnando. | P1. Da antojo e informa a la vez, y aguanta menús de 100 platos. |
| D2 | **Además del menú salen «Pedidos listos»** (llama el pedido cuando la cocina lo despacha) **y anuncios que escribe el dueño.** Sin QR para pedir ni lámina de datos del local. | P2. |
| D3 | **La pantalla tiene su propio panel en Configuración**, con **varias animaciones o estilos para escoger** (no una sola) y opciones como prender o apagar los pedidos listos. | Observación de P2: el usuario quiere que se sienta producto y que cada local lo ajuste. |
| D4 | **Salen todos los platos, y el dueño puede esconder platos o categorías del TV.** | P3. Funciona desde el primer día sin configurar nada. |
| D5 | **El Menú del día entra en esta tarea:** en el panel, en el menú del cliente y en el TV. | P4. Cierra otra promesa de la propuesta (los tres planes) y el dibujo del TV ya lo muestra. |
| D6 | **Tiene que andar en todos los aparatos:** navegador de Smart TV, Chromecast/Fire TV/TV Box, computador por HDMI y tablet o celular en la pared (vertical). | P5. El Smart TV barato es el mínimo: todo liviano y con modo vertical. |
| D7 | **Una sola configuración por local;** todos sus TV muestran lo mismo. | P6. Más simple. Se puede abrir después si un local grande lo pide. |
| D8 | **Platos sin foto:** salen solo en el tablero, nunca como plato grande. | S1. |
| D9 | **Plato agotado:** desaparece del TV. | S2. |
| D10 | **Local cerrado:** el TV sigue igual, sin letrero ni pantalla de cerrado. | S3. El usuario lo prefirió así frente a la recomendación. |
| D11 | **Marca «Hecho con Appetic»** pequeña y discreta en una esquina (el dueño no la quita). | S4. |
| D12 | **La demo tiene su TV** (`/demo/tv`) para que el vendedor la muestre en la visita. | S5. |
| D13 | **Un link fijo por local, que siempre funciona, sin códigos ni activaciones:** `appetic.vercel.app/<slug>/tv`. Se abre una vez en el TV, se deja de página de inicio o en favoritos, y listo. | S6: marcó «código o QR», pero en la observación explicó que lo que quiere es un link fijo por local sin activar nada. **Manda la observación.** El enlazado con código se descarta. |

### De la ronda 2

| # | Decisión | Por qué |
|---|----------|---------|
| D14 | **Pedidos listos:** interrumpen a pantalla completa unos segundos y luego quedan en una franja con los últimos. La franja solo existe mientras haya pedidos esperando. | P1. |
| D15 | **Se llaman:** los para llevar del mostrador (mesero o caja, a nombre de alguien) y los del QR de la mesa. **No** los de la app para recoger, **ni** los domicilios, **ni** los de mesa tomados por el mesero. | P2. |
| D16 | **Número de turno del día** (1, 2, 3… vuelve a 1 cada día) con el nombre debajo, **solo en locales que prendan los pedidos listos.** Si están apagados, nada cambia en caja ni en mesero. | P3 y su observación. |
| D17 | **Un solo diseño de pantalla; el dueño escoge la transición del plato grande** (no hay estilos completos). | P4. Se descartó lo recomendado. |
| D18 | **El panel solo suma «Ver cómo queda»** (vista previa del TV en el celular). Sin velocidad, sin orden propio de categorías, sin opción de descripciones ni de adiciones. | P5. |
| D19 | **Por el lugar grande pasan solo los «Nuestro fuerte» con foto y el Menú del día**, sin importar la categoría del tablero. | P6. |
| D20 | **Anuncios:** una lámina a pantalla completa que entra en la rotación unos segundos, **programable por días de la semana y una franja de horas** cada uno. | P7 y S2. |
| D21 | **El Menú del día es un almuerzo armado a precio fijo** (el «corrientazo»: sopa, principio, proteína a escoger, bebida…). No hay modo de «platos especiales». | P8. |
| D22 | **Se carga como semana tipo** (lunes ajiaco, martes sancocho…) que se repite sola, y se puede cambiar el mismo día. | P9. |
| D23 | **El Menú del día tiene su propia franja horaria** (ej. 11:30 a 3:00). Fuera de ella no se puede pedir y no sale en el TV. | S3. |

### De la ronda 3

| # | Decisión | Por qué |
|---|----------|---------|
| D24 | **Pedidos listos sin sonido:** solo el aviso grande en pantalla. Al prender el TV no hay que tocar nada. | P1. Resuelve el choque de la ronda 2: manda esta respuesta. |
| D25 | **Partes del corrientazo:** sopa, principio, proteína, acompañante, ensalada y jugo. El dueño apaga las que no da y puede agregar una más (ej. postre). | P2. |
| D26 | **Precio de mesa y precio para llevar** (el de llevar es opcional; si queda vacío, vale lo mismo). | P3. |
| D27 | **El cliente puede quitar una parte sin cambiar el precio, cambiar una parte por otra (los reemplazos que el dueño permita) y escoger dos principios.** | P4. |

---

## 3. Suposiciones del agente

- **S1** — **Va en todos los planes**, sin bloqueo por plan. *(propuesta pág. 7: está en el Emprendedor)*
- **S2** — **Costo en Firebase casi cero aunque el TV esté prendido todo el día:** un solo listener sobre
  el documento del local (`locales/{id}`); los productos se vuelven a leer **solo cuando sube
  `menuVersion`**, que ya sube cada vez que el dueño edita (`services/productos.js`). Prendido 12 h
  sin cambios son ~0 lecturas extra. *(deducido de: productos.js, LocalPage.jsx)*
- **S3** — **No pide sesión:** `locales` y `productos` ya se leen en público (`firestore.rules`: `allow read: if true`).
  El TV abre con un link y no hay que iniciar sesión en el control remoto.
- **S4** — **Usa la identidad del local:** colores de `tema` (`localThemeVars`), `logo`/`icono`, `banner` y
  los emojis de `categorias`. La piel propia (`tema.skin`) se respeta donde aplique.
- **S5** — **Agotados (`disponible === false`) y destacados («⭐ Nuestro fuerte», `destacado`)** ya
  existen en el producto y el TV los usa.
- **S6** — **Aguanta solo:** mantiene la pantalla encendida (Wake Lock), si se cae el internet sigue
  mostrando lo último que tenía y se repone sola, y recarga una vez al día de madrugada para tomar la
  versión nueva de la app. Mueve el contenido un poco cada cierto tiempo para no quemar el panel.
- **S7** — **Locales con menú externo** (La Gran Esquina) también funcionan, con el mismo cargador del
  menú (`getMenuExterno`).
- **S8** — El link del TV se entrega desde el panel del dueño, en **Difundir**, junto al link, el QR y el
  afiche, con un mini-instructivo para cada aparato (Smart TV, Chromecast, computador). El panel de
  la pantalla (D3) queda en **Configuración**.
- **S9** — **Horizontal y vertical sin que nadie elija:** la pantalla mira su tamaño y se acomoda (en
  vertical, el plato grande arriba y el tablero abajo). *(de D6)*
- **S10** — **Las comandas no se pueden leer sin sesión** (`firestore.rules`: `comandas` solo para el
  personal) y el TV no inicia sesión (D13). Para los pedidos listos, la cocina escribe un **resumen
  público mínimo** (`locales/{id}/pantalla/listos`: solo lo que se muestra y la hora, sin teléfonos,
  direcciones ni platos) y el TV escucha ese único documento. Es una lectura por pedido listo.
- **S11** — **Tablero que no cabe:** si una categoría tiene más platos de los que caben, se parte en
  páginas («Hamburguesas 1/2»). No se encoge la letra hasta volverla ilegible desde lejos.
- **S13** — **El diseño único es el de la propuesta, llevado a TV:** fondo oscuro con la foto grande y un
  degradado hacia el texto, la etiqueta («Nuestro fuerte», «Almuerzo de hoy»), el nombre grande en la
  letra de títulos, la descripción y el precio en una píldora del color del local. El logo va arriba y
  los puntos de avance abajo. Al lado (o debajo, en vertical), el tablero de la categoría con su emoji.
  Es lo que el cliente ya vio en el PDF que se le vendió. *(de D17 y del dibujo de la propuesta pág. 3)*
- **S14** — **Transiciones para escoger:** Desvanecer · Deslizar · Zoom lento sobre la foto · Cortina ·
  Voltear. Todas hechas con lo que un Smart TV barato mueve sin trabarse (opacidad y desplazamiento).
- **S15** — **Si no hay suficientes «Nuestro fuerte» con foto** (cero o uno), el lugar grande se rellena
  con platos con foto de la categoría que esté en el tablero, para que nunca quede vacío ni repita el
  mismo plato todo el día. *(de D19; un local recién montado no ha marcado ninguno)*
- **S16** — **Pedidos listos solo se pueden prender si el local usa cocina** (`usaCocina`). Sin cocina, las
  comandas nacen entregadas (D13 de Cuentas del negocio) y no hay un momento «listo» que llamar. El
  interruptor sale apagado con una explicación.
- **S17** — **Dónde ve el cliente su turno:** el mesero y la caja lo ven grande al mandar la comanda para
  decírselo, y el cliente del QR de la mesa lo ve en su pantalla después de pedir. *(de D16)*
- **S18** — **Semana tipo:** se programa cada parte del almuerzo por día, con «Copiar a toda la semana»
  para lo que no cambia. Una opción se puede agotar a mitad del día («se acabó el pescado») y desaparece
  del menú y del TV.
- **S19** — **En el menú del cliente** el almuerzo de hoy sale arriba, como tarjeta destacada, solo dentro
  de su franja. Se pide escogiendo en cada parte, reusando el modelo de los armables que ya existe
  (`armableSeleccion.js`, el que usa La Gran Esquina).
- **S20** — **Cobro del corrientazo** (P3 «decide tú»): además del precio de mesa y de llevar, cada
  proteína puede tener un **recargo opcional** (pescado + $4.000), que viene vacío. Es un campo que no
  estorba si no se usa y es muy común. **No** hay «solo sopa» ni «sin sopa» con precio propio: el
  usuario dijo que no hay tantas variables, y quitar la sopa ya está cubierto por D27.
- **S21** — **Qué precio aplica:** QR de la mesa y mesero «a la mesa» → precio de mesa. Pedidos por la app
  (recoger o domicilio) y mesero o caja «para llevar» → precio de llevar.
- **S22** — **El corrientazo es un plato «armado» que se genera solo cada día** desde la configuración,
  con un grupo de opciones por parte. Así reusa sin cambios el carrito, el checkout, el WhatsApp, las
  comandas, la caja y las cuentas. El asistente de opciones (`ProductWizard`) ya sabe hacer «no lo
  lleva» por grupo.
- **S23** — **Lo del TV y el Menú del día viven en el documento del local** (`local.pantalla`,
  `local.menuDelDia`, anuncios incluidos). El listener del TV ya lo escucha, así que un anuncio nuevo
  o un cambio del almuerzo llega al TV sin lecturas extra. Las imágenes de los anuncios van a Storage.
- **S12** — **Modo liviano automático:** si el aparato es lento (se miden los cuadros por segundo), se
  bajan las animaciones pesadas sin que el dueño haga nada.

---

## 4. Descartado (no volver a proponer)

- **Enlazar el TV con código o QR** → se prefirió un link fijo por local sin activación (D13).
- **QR para pedir en el TV** y **lámina de datos del local** (horario, Instagram) → no se marcaron en P2.
- **Letrero o pantalla de cerrado** → D10.
- **Una configuración por TV** → D7, por ahora.
- **Estilos completos de pantalla** → un solo diseño con transiciones (D17).
- **Velocidad, orden propio de categorías, descripciones y adiciones en el panel** → D18.
- **Menú del día como «platos especiales de hoy»** → solo corrientazo (D21).
- **Cargar el menú del día cada día desde cero** → semana tipo (D22).
- **Llamar en el TV los pedidos de la app para recoger y los domicilios** → D15.
- **Sonido al llamar un pedido** y el botón «Activar sonido» → D24.
- **Partes libres del corrientazo** → partes fijas que se apagan (D25).
- **Precio propio para «solo sopa» o «sin sopa»** → S20.

---

## 5. Estado de las rondas

- **Ronda 1 — Visión general** ✅ respondida · `Cuestionario-1-Pantalla-TV.html`
- **Ronda 2 — Cómo funciona por dentro** ✅ respondida · `Cuestionario-2-Pantalla-TV.html`
- **Ronda 3 — El corrientazo y un choque** ✅ respondida · `Cuestionario-3-Pantalla-TV.html`
- **Ronda 4** ❌ no se hace: ya no queda nada que adivinar.
- Los HTML de las tres rondas se borraron al cerrar (2-nov-2026).

---

## 6. Incógnitas abiertas

*(Ninguna. Lo que salga construyendo se anota en la bitácora.)*

---

## 7. Plan de implementación

Por etapas. Cada etapa deja algo que funciona y se puede mostrar sola.

### Etapa A · La pantalla de TV (menú + anuncios)
- [x] A1 · Datos: `local.pantalla = { transicion, categoriasOcultas[], pedidosListos, anuncios[] }` y `producto.ocultoTV`.
- [x] A2 · Lógica pura `utils/pantallaTV.js`: platos visibles (sin agotados ni ocultos), tablero paginado por categoría, cola del plato grande (Nuestro fuerte con foto → relleno con la categoría, S15), anuncios vigentes por día y hora (Bogotá). Con pruebas en `prueba-appetic.mjs`.
- [x] A3 · Servicio en vivo: un listener del local y relectura de productos solo si cambia `menuVersion` (S2); dev, `?preview=1` y demo también.
- [x] A4 · Ruta `/:slug/tv` y pantalla `PantallaTV`: diseño de la propuesta (S13), horizontal y vertical (S9), tablero + plato grande, 5 transiciones (S14), láminas de anuncios, logo, puntos, «Hecho con Appetic».
- [x] A5 · Que aguante sola (S6, S12): pantalla siempre encendida, sin internet sigue, recarga de madrugada, anti-quemado, modo liviano.
- [x] A6 · Panel **Configuración → 📺 Pantalla de TV**: transición con muestra, esconder categorías, anuncios (texto, imagen, días, horas), «Ver cómo queda». Y «Ocultar del TV» en cada plato.
- [x] A7 · **Difundir → 📺 Tu menú en el TV**: el link, copiar y cómo abrirlo en cada aparato.
- [x] A8 · Reglas de Storage para las imágenes de anuncios. Probar en la vista previa (PC, TV 1080p, vertical).

### Etapa B · Menú del día (corrientazo)
- [x] B1 · Datos `local.menuDelDia`: activo, franja, precio de mesa y de llevar, foto, partes (D25), reemplazos permitidos, semana tipo, cambio de hoy y agotados de hoy.
- [x] B2 · Lógica pura: el almuerzo de hoy (Bogotá) → plato armado con un grupo por parte (S22), precio según el destino (S21), recargo por proteína (S20). Con pruebas.
- [x] B3 · Panel: **Productos → 🍲 Menú del día**: partes, precios, franja, semana tipo con «Copiar a toda la semana», «Hoy» y agotar una opción.
- [x] B4 · Cliente: tarjeta destacada arriba dentro de la franja (S19), se pide con el asistente de opciones.
- [x] B5 · Mesero y caja: el almuerzo aparece y toma el precio por destino.
- [x] B6 · TV: «Almuerzo de hoy» en el plato grande dentro de la franja (D19, D23).

### Etapa C · Pedidos listos con turno
- [x] C1 · Turno del día (contador en transacción), solo con pedidos listos prendidos (D16), en las comandas para llevar del mostrador y en las del QR de la mesa.
- [x] C2 · Al despachar en cocina, resumen público `pantalla/listos` (S10). Reglas de Firestore.
- [x] C3 · El turno visible: mesero y caja al mandar, cliente del QR, la comanda en cocina (S17).
- [x] C4 · TV: interrupción a pantalla completa sin sonido y luego franja con los últimos (D14, D24).
- [x] C5 · Interruptor en el panel, solo si usa cocina (S16).

### Etapa D · Demo y cierre
- [~] D1 · Burger Demo con pantalla, anuncios y menú del día de ejemplo; «Reiniciar demo» lo deja así; `/demo/tv`.
- [x] D2 · Desplegar reglas y app (con permiso) y probar en producción.
- [x] D3 · Cerrar la guía y borrar los HTML de las rondas.

---

## 8. Bitácora

- **2-nov-2026** — Se abre la tarea. Revisión: no existe ninguna ruta ni pantalla de TV en la app.
  Los locales reales van de ~8 a ~100 platos, así que un carrusel de uno en uno puede tardar más de
  10 minutos en dar la vuelta: eso pesa en la pregunta del formato.
- **2-nov-2026** — Ronda 1 respondida. Al revisar los pedidos listos salió que las comandas del mesero
  y la caja **no tienen código corto** (solo mesa o nombre) y que el código de los pedidos de la app
  es largo para cantarlo (`FT-7K2Q`). Por eso la ronda 2 pregunta con qué se llama al cliente.
- **2-nov-2026** — Ronda 2 respondida. Choque entre P1 («con sonido») y S1 («sin sonido»): no lo decido
  yo, va en la ronda 3. La forma del corrientazo se toma de La Gran Esquina (`menuLaGranEsquina.js`):
  sopa, principio (hasta 2), proteína, acompañante, ensalada y jugo, con reemplazos («mejor huevo») y
  precio de mesa distinto del de llevar.
- **2-nov-2026** — Ronda 3 respondida. No queda nada que adivinar: se escribe el plan y se arranca por la Etapa A.
- **2-nov-2026** — **Etapa A construida y probada en la vista previa** (Jasbury con fotos, Burger Demo sin fotos;
  1600×900, vertical 900×1600, panel en PC y celular). Archivos: `utils/pantallaTV.js` (lógica pura, 14
  pruebas en `prueba-appetic.mjs`), `services/pantallaTV.js` (en vivo), `pages/TV/PantallaTV.jsx/.css`
  (ruta `/:slug/tv` fuera del armazón de la app, en su propio archivo: 13 kB), `Admin/ConfigPantalla.jsx/.css`
  (Configuración → 📺 Pantalla de TV), tarjeta en Difundir, interruptor «Mostrar en la pantalla de TV» en
  cada plato, `subirImagenAnuncio` en `storage.js`. Se exportaron `minutosAhoraBogota`, `diaBogota` y
  `aMinutos` de `utils/horario.js`.
  - *Sobre la marcha:* sin «Nuestro fuerte» ni fotos, el tablero ocupa toda la pantalla en dos columnas.
    Con 2 o 3 tamaños se dicen todos los precios («Personal $19.000 · Familiar $65.000»). Las páginas se
    reparten parejo (11 platos → 6 + 5). Una foto que no carga sale sola de la cola del plato grande. Un
    logo que no carga se cambia por el nombre del local. «Pulsa OK o toca la pantalla para verla completa»
    sale los primeros 10 s. La vista previa del panel es la misma pantalla incrustada (`VistaTV`), con lo que
    hay sin guardar, y el plato grande pasa al doble de rápido para que se vea la transición.
  - *Problemas:* en dos columnas el tablero se salía de la pantalla (columnas `1fr` con texto sin cortar →
    `minmax(0, 1fr)`). El botón «Configurar la pantalla» de Difundir salía sin texto (un `color: inherit`
    pisaba el blanco). En las pruebas la foto grande se veía negra, pero era el panel del navegador oculto,
    que congela las animaciones; con las animaciones adelantadas se ve bien.
  - La Burger Demo ya trae `pantalla` con dos anuncios de ejemplo (adelanto de D1).
- **2-nov-2026** — **Etapa A publicada** (`efcc2a6`, push a `main`; verificado leyendo el bundle de
  appetic.vercel.app y abriendo `/demo/tv` con datos reales). Capturas HD del TV en `propuesta/img/tv/`.
- **2-nov-2026** — **Etapa B construida y probada en la vista previa** (Burger Demo con un «Almuerzo
  ejecutivo» de ejemplo para toda la semana). Archivos: `utils/menuDelDia.js` (lógica pura, 18 pruebas),
  `utils/useMinuto.js` (`useMinuto` y `useConMenuDelDia`), `Admin/ConfigMenuDelDia.jsx/.css`
  (Configuración → 🍲 Menú del día: estado de hoy, «Hoy» con agotar y «Cambiar solo hoy», semana tipo
  con «Copiar a toda la semana», precio y horario, foto, partes con reemplazos), `subirFotoMenuDelDia`.
  El almuerzo entra con `useConMenuDelDia` en `LocalMenu` (llevar o mesa), `AdminCaja` y `AdminMesero`
  (los dos precios como tamaños) y el TV (página propia en el tablero + lugar grande si tiene foto).
  - *Sobre la marcha:* lo que trae una sola opción llega ya marcado (`preelegida`, nuevo en
    `ProductWizard`), y el cliente solo sigue o toca «Sin…»/«No lleva». Las tarjetas del almuerzo
    muestran un emoji grande en vez del «Cargando imagen» (`sinFotos`, solo en esos grupos, para no
    cambiar otros locales). La etiqueta de la tarjeta dice «🍲 Almuerzo de hoy». En el TV, la categoría
    «Menú del día» es una página propia: nombre y precios en grande y cada parte con sus opciones.
    El panel se guarda solo (0,9 s después de escribir; agotar e interruptores al instante). La
    proteína es la única parte con recargo. La demo lleva franja 00:00–00:00 para que siempre se vea.
  - *Falsas alarmas al probar:* el paso «mesa o para llevar» de la caja y el TV en blanco parecían
    errores, pero eran el panel del navegador oculto (congela animaciones) y un aviso que borré a mano
    en la prueba. No se cambió nada por eso.
  - *Pendiente conocido:* si la franja termina con el almuerzo ya en el carrito, el cliente todavía lo
    puede mandar. Se deja así: el local lo ve en el WhatsApp y decide.
- **2-nov-2026** — **Etapa B publicada** (`a3a4897`; verificado por un texto que solo existe en esta versión).
- **2-nov-2026** — **Etapa C construida y probada** (vista previa + Chrome del computador con clics reales).
  Archivos: `utils/turnos.js` (lógica pura, 14 pruebas), `services/comandas.js` (`tomarTurno` en
  transacción, `turno` en la comanda, `escucharListos`, y `entregar`/`deshacer` escriben o quitan en
  `pantalla/listos`; los dos motores, Firestore y demo), `CajaVender` (diálogo grande «Dile al cliente
  su turno»), `CheckoutMesa` («Tu turno» en la pantalla de éxito), `AdminComandas` (insignia «T14»),
  `PantallaTV` (`useListos`: llamado a pantalla completa 7 s de a uno, sin sonido, y franja «LISTOS»
  abajo con lo de los últimos 12 min), `ConfigPantalla` (interruptor; bloqueado y explicado sin cocina),
  `firestore.rules` (`pantalla/turno` lo sube cualquiera de a uno o vuelve a 1 al cambiar el día;
  `pantalla/listos` solo el personal, máx. 8, sin datos personales), «Reiniciar demo» vacía `pantalla`.
  La Burger Demo trae `pedidosListos: true`.
  - *Sobre la marcha:* si el envío se reintenta, la comanda conserva su turno (se recuerda por id).
    Al abrir el TV no se vuelven a llamar los pedidos que ya estaban listos; solo los que salen
    después. Si dos salen a la vez, se llaman en fila. La franja se va sola a los 12 minutos.
  - *A tener en cuenta:* la cocina tiene un botón «Empezar turno» (el turno de trabajo) y ahora
    también existe el turno del pedido. No se cambió el texto; si confunde, se renombra.
- **2-nov-2026** — **Etapa C publicada**: reglas de `pantalla/` desplegadas a `appetic-17477` (antes que el
  código: solo agregan permisos) y app en `ec75ead` (verificado en el bundle). En producción, `pantalla/listos`
  y `pantalla/turno` se leen sin sesión (404 = permitido, aún sin documento) y `comandas` sigue cerrada (403).
- **2-nov-2026** — **Cierre.** Burger Demo ya trae en el código pantalla, anuncios, menú del día y pedidos
  listos; en producción aparecen cuando el superadmin pulse «Reiniciar demo» (D1 queda en manos del usuario).
  Se borraron los HTML de las rondas. Ideas que quedaron fuera y se pueden retomar: una configuración por TV
  (D7), sonido opcional al llamar (D24), renombrar «Empezar turno» de la cocina si confunde con el turno del pedido.
