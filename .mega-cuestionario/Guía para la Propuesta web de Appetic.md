# Guía para la Propuesta web de Appetic

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** pasar la propuesta de Appetic a una página del sitio de Swiftfly Solutions,
  interactuable, con animaciones, optimizada en PC y celular, a la altura del inicio.
- **Inicio:** 3 de noviembre de 2026
- **Estado:** ✅ Retoques de la ronda 3 construidos y publicados (4-nov-2026) · pendiente solo los nombres definitivos de los vendedores (S13)
- **Proyecto:** repo `appetic` (fuente: `propuesta/propuesta-appetic.html`) · sitio `switflysolutions.com` (Hostinger)

---

## 1. Objetivo

En sus palabras: *"pasar la propuesta de Appetic a la página de Swiftfly Solutions, pero que sea
interactuable y con animaciones, optimizada en PC y optimizada en celular, que esté a la altura del
inicio"*.

---

## 2. Decisiones CERRADAS

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| **D1** | **Página larga con scroll animado + modo presentación** (diapositivas a pantalla completa). | Respuesta a P1: «las dos». Link para WhatsApp y modo visita en tablet. |
| **D2** | **Interactivos:** viaje del pedido animado · celular con menú y carrito simulado · TV en vivo · cuentas animadas · selector de planes (mensual/6/12) · pase de abordar animado en portada. | Respuesta a P3. Quedó fuera solo la demo real incrustada. |
| **D3** | **Vive en `switflysolutions.com/appetic/`** y el botón del inicio pasa de «Descargar PDF» a «Ver la propuesta». | Respuesta a P4. |
| **D4** | **La subo yo por FTP** cuando abra el acceso de red a `ftp.switflysolutions.com`. | Respuesta a P5. |
| **D5** | **Mismo contenido del PDF**, con ejemplos gráficos y animación muy pulida «como el inicio, para que se vea que somos buenos desarrolladores». | Respuesta a P6. |
| **D6** | **Botón «Solicitar cotización formal»**: lo llenan los vendedores con los datos del local que visitan (Swiftfly manda la propuesta y contacta al cliente) y también el cliente curioso que llega al link. | Respuesta a P6, palabras suyas. Detalle en ronda 2. |
| **D7** | Vista previa para WhatsApp (og) **sí** · botón Descargar PDF **sí** · link con saludo por cliente **no** · la promo del 2.º mes **no** se apaga sola. | Sugerencias S2–S5. |

### De la ronda 2 (4 de noviembre de 2026)

| # | Decisión | Por qué |
|---|----------|---------|
| **D8** | **Las solicitudes se GUARDAN en una base de datos dentro de Appetic** (Firestore del proyecto `appetic-17477`), no van por correo ni solo por WhatsApp. Se consultan desde el panel del superadmin de la app. | Obs. a P1: *«Toca crear una base de datos dentro de la app porque también necesito que los vendedores tomen foto del lugar y pongan la ubicación, así sabemos que sí están cumpliendo con las zonas de venta»*. P5 (correo) quedó en blanco → sin correo. |
| **D9** | **Un solo formulario** que empieza con «Soy vendedor de Swiftfly / Soy dueño de un negocio». Al vendedor se le pide más; al dueño, lo corto. | P2. |
| **D10** | **El vendedor escoge su nombre de una lista fija.** | P3. Los nombres los pasa el usuario (incógnita 1); mientras, la lista es una constante fácil de editar. |
| **D11** | **Datos del local:** nombre del local · nombre del dueño · celular/WhatsApp · ciudad y barrio · tipo de negocio (tráiler / local / restaurante) · **plan que le interesó** · **notas libres de la visita**. Nada más (no domiciliario/mesas, redes, hora, ni frío/tibio/caliente). | P4: marcó solo «Notas libres» y anotó «qué plan le interesó» (que ya iba). |
| **D12** | **Solo para el vendedor:** foto del lugar (fachada) · ubicación GPS tomada en el momento · foto de la carta y del logo (adjuntos). | Obs. a P1 (control de zonas de venta) + S3 «sí». |
| **D13** | **Funciona sin señal:** la solicitud (con sus fotos) se guarda en el celular y se envía sola cuando vuelve la conexión. | S2 «sí». |
| **D14** | **Anti-spam:** campo oculto para robots + validación del lado del servidor. | S4 «sí». |

### De la ronda 3 (4 de noviembre de 2026, tras ver la página en vivo)

| # | Decisión | Por qué |
|---|----------|---------|
| **D15** | **Vendedor:** se escoge con **botones** con los nombres (no desplegable) y **no se le piden ciudad ni barrio**; foto del lugar obligatoria. Al dueño sí se le piden ciudad y barrio. | Puntos 1 y 7 del usuario. |
| **D16** | El **«Desliza»** de la portada **no sale en celular** (tapaba el logo del talón). | Punto 3. |
| **D17** | **Pase de abordar:** la **golondrina completa** (la del inicio) **quieta** sobre la línea punteada. Nada de logo recortado volando. | P1. Punto 2: «recorta el pájaro, no se ve profesional». |
| **D18** | **Sección 4:** el «viaje del pedido» se queda arriba; las dos tarjetas con capturas se **reemplazan por un celular del mesero y una tablet de cocina simulados**, como el celular del menú. | P2. |
| **D19** | Mesero y cocina **cada uno por su lado**, con su propia demostración automática (no conectados entre sí). | P3. |
| **D20** | **TV: réplica fiel del TV real de la app** (fondo negro, plato grande a la izquierda con nombre y precios, tablero de la categoría a la derecha, fichas de categorías abajo, categorías que se turnan), con los platos de ejemplo y el control de «cambiar precio». | P4. Punto 5: «el mismo que tenemos en la app». |
| **D21** | **Ubicación del vendedor obligatoria:** sin ubicación no se envía. | P5. Es el control de zonas. |
| **D22** | **«Solo registrar la visita»:** el vendedor puede registrar una visita sin cotización (foto + ubicación + nota, sin datos del dueño) **con el motivo**: el dueño no estaba · estaban ocupados · no se dejó hablar · no le interesó · otro (con texto). | S1 «sí» + observación suya: así saben qué pasó y lo más común. |
| **D23** | **Recorrido del día:** en el superadmin, por vendedor, un botón «Recorrido» que abre Google Maps con todos sus puntos del día (visitas y cotizaciones), con selector de fecha. | S2 «sí». |
| **D24** | **El modo presentación se reemplaza por un recorrido automático:** la página se recorre sola, parada por parada (con paradas intermedias en secciones altas), mientras los interactivos se demuestran; **cualquier toque, rueda o tecla la detiene** y «Continuar» sigue desde donde esté la persona. Botón «Recorrido» en la barra; `#recorrido` lo arranca solo. **Sustituye a D1** (diapositivas). | Mensaje del usuario al ver las diapositivas en celular: «se ve cortado y feo, prefiero un recorrido automático sin tocar la pantalla, que se pare sola al tocarla y se pueda continuar desde donde uno esté». |
| **D26** | **El recorrido tiene voz y subtítulo karaoke:** un guion corto por sección (10 clips, 3 minutos, 1,2 MB) grabado con una voz neuronal colombiana (`es-CO-SalomeNeural`, edge-tts, gratis) y el subtítulo con cada palabra encendiéndose al ritmo de la voz. Botón para silenciar (se recuerda). Al tocar la pantalla la voz se calla con el recorrido y «Continuar» la retoma donde iba. | Pregunta del usuario: «le falta que se vaya resaltando el texto para ir leyendo, ¿es muy difícil meter una voz?» → «hazlo de una, te autorizo». Elegí voz pregrabada (igual en todos los aparatos) sobre la del navegador (robótica y distinta en cada uno). |
| **D27** | **Cocina en celular:** la tablet se vuelve vertical (600 px de alto, una comanda debajo de otra, enteras) y en todas partes caben **dos comandas** completas, no tres cortadas. | Mensaje del usuario con captura: «la cocina está horrible». |
| **D28** | **Música de fondo suave** durante el recorrido (bucle sintetizado aquí, `voz/fondo.mp3`, 24 s, 186 KB, sin derechos de terceros): suena solo mientras el recorrido anda, baja cuando habla la voz y se detiene con la pausa o al salir. El botón de silencio apaga voz y música. **Nada suena al entrar a la página** (se quitó el arranque por `#recorrido`). | «Que la voz solo suene cuando está la presentación» (había oído mi prueba automática por los parlantes) y «pon musiquita de ascensor detrás muy suave para que no se sienta tan vacío». |
| **D29** | **La carta del local: varias fotos o un PDF** (hasta 6 archivos desde la página, PDF ≤ 3 MB; el servidor admite 8 por solicitud). Cada archivo va en su propia petición a `/api/solicitud-archivo` después de crear la solicitud (Vercel acepta ~4,5 MB por petición), con reanudación si se corta la señal. | «Que para el menú puedan subir PDF o tomar varias fotos». Foto del lugar y ubicación siguen obligatorias (ya lo eran, D21). |
| **D30** | **El recorrido solo se pausa con el botón «Pausar»**; tocar, desplazar o jugar con los interactivos no lo detiene (Esc lo termina). Al terminar cada parada y al pulsar «Continuar», mira en qué parte de la página está la persona y sigue desde ahí, con la voz de esa sección. **Sustituye la parte de D24** que decía que cualquier toque lo detenía. | «Que ya no se salga presionando en cualquier lado, sino un botón de pausar, y que continuar mire en qué pestaña estás y siga hablando desde ahí». |
| **D31** | **Subtítulo de dos líneas**, fondo más transparente, y el texto **va subiendo solo** a medida que la voz avanza (la línea de la palabra actual es la de abajo). | «El texto tapa la pantalla; que se vaya bajando a medida». |
| **D32** | **La pantalla se desliza despacio y sin parar** durante cada sección (del inicio al final de la sección a lo largo de toda su narración, con aceleración suave) y entra a la siguiente con un deslizamiento corto, sin saltos. Ya no hay «paradas» con tiempo fijo: el reloj es la voz. Si la persona mueve la página por su cuenta, se le deja (la voz sigue) y al terminar la sección se continúa desde donde esté. | «Que la pantalla no se quede quieta mientras va hablando, que se vaya deslizando suave para que no se sienta el cambio de golpe». |
| **D33** | **Sello redondo «2.º mes gratis»** arriba a la derecha de cada plan, con el texto ajustado para que no toque el aro (66 px, «2.º MES» a .5rem y «Gratis» a .8rem, sin espaciado). Se probó una píldora blanca y el usuario prefirió el sello. | «En celular la insignia se ve horrible» → «me gustaba más la insignia, pero ajustado el texto». |
| **D25** | **Sin zoom en celular** (`maximum-scale=1, user-scalable=no`) en el inicio y en la propuesta, y `html{overflow-x:hidden}` + `main{overflow-x:clip}` en el inicio. | El usuario vio que al hacer zoom la página se desplazaba de lado y se descuadraba. |

---

## 3. Suposiciones del agente

- **S1** — El contenido sale de `propuesta/propuesta-appetic.html` (7 páginas, versión «planes por
  tipo de negocio»: Emprendedor $59.900 · Comerciante $79.900 · Empresario $99.900 · Desarrollador
  $3.000.000, 2.º mes gratis hasta 31-dic-2026, adelantado 6 → paga 5 y 12 → paga 10).
  *(leído del HTML)*
- **S2** — El sitio es HTML estático en un solo archivo con CSS/JS en línea: tokens `--bg:#061330`,
  `--cyan:#1FC4F5`, `--blue:#1F5BFF`, Montserrat + Inter, revelado `.rv` al hacer scroll, intro
  con video, nav fija con menú hamburguesa. Appetic aparece en «Proyectos» con `--acc:#FF7A3D` y un
  botón a `propuestas/propuesta-appetic.pdf`. *(descargado de switflysolutions.com el 3-nov)*
- **S3** — La página nueva sigue ese mismo estilo de construcción (HTML+CSS+JS vanilla, sin
  frameworks), para que viva en el mismo hosting sin build.
- **S4** — Público principal: el dueño del negocio que recibe el link por WhatsApp → se diseña
  primero para celular. *(la propuesta ya se reparte por WhatsApp)*
- **S5** — Las imágenes de `propuesta/img/` (≈9 MB) se pasan a WebP y tamaño web para que cargue
  rápido con datos.
- **S7** — *(respondió en blanco P2)* **Cara visual: azul noche de Swiftfly con acentos naranja de
  Appetic**, igual que el bloque de Appetic en «Proyectos» del inicio. Decidido por mí: es lo que
  hace que se sienta parte del mismo sitio.
- **S6** — Contacto: WhatsApp 320 843 5143, con mensaje precargado.
- **S8** — *(ronda 2)* **Cómo llega la solicitud a Firestore:** la página de Hostinger es estática, así
  que el formulario hace `POST` a una función nueva del Vercel de Appetic (`api/solicitud.js`, con
  `firebase-admin` como `api/demo.js` y `api/pedido.js`) que valida, guarda en la colección
  `solicitudes/` y sube las fotos a Storage (`solicitudes/<id>/…`). Con CORS para
  `https://switflysolutions.com`. Así ninguna regla de Firestore queda abierta al público.
- **S9** — *(ronda 2)* **Dónde se ven:** una sección nueva «Solicitudes» en el panel del superadmin
  (`jostivtrb@gmail.com`, `src/config/roles.js`), con estado **nueva → contactada → cerrada**, el mapa
  de la ubicación (link a Google Maps) y las fotos. Al dueño del local no se le muestra nada de esto.
- **S10** — *(ronda 2)* **Sin señal** = las solicitudes pendientes se guardan en IndexedDB del celular
  (fotos incluidas, como blobs) y un reintento al volver `online` las manda; la página avisa «se
  enviará cuando tengas señal». No hace falta service worker.
- **S11** — *(ronda 2)* **Fotos:** se reducen en el navegador antes de subir (máx. 1600 px, JPEG/WebP)
  para que pesen poco con datos. GPS con `geolocation` de alta precisión; si el vendedor no da permiso,
  se guarda la solicitud igual pero marcada «sin ubicación».
- **S13** — *(construcción)* **Lista de vendedores (D10):** mientras el usuario no pase los nombres,
  la constante `VENDEDORES` de `web/appetic/app.js` trae a los tres socios (Jonathan Miranda, Stiven
  Patiño, Alejandro Rojas). Se editan ahí.
- **S14** — *(construcción)* **Vista previa local:** `web/appetic/app.js` manda el formulario a
  `http://localhost:5199/api/solicitud` cuando la página se abre desde localhost (Appetic en
  `npm run dev`) y a `appetic.vercel.app` en producción.
- **S15** — *(construcción)* **Capturas fiables:** `web/captura.mjs` (Chrome headless por CDP), porque el
  panel del navegador de la app congela las animaciones cuando está oculto.
- **S16** — *(ronda 3)* Las **visitas sin interés** se guardan en la misma colección `solicitudes/` con
  `registro: 'visita'` y `estado: 'visita'` (no pasan por nueva → contactada → cerrada); en el panel
  tienen su propio filtro «Visitas» y su chip con el motivo. Celular, dueño, tipo y plan no se piden.
- **S17** — *(ronda 3)* El **recorrido** se arma con `https://www.google.com/maps/dir/lat,lng/lat,lng/…`
  en orden de hora (Google acepta ~10 puntos por link; si hay más se parte en tramos).
- **S18** — *(ronda 3)* Los simuladores del mesero y la cocina **copian las pantallas reales** de la demo
  (capturas en `web/appetic/.capturas/app-mesero.png` y `app-cocina.png`): fichas de mesa, buscador,
  categorías, cuadrícula de productos y ticket abajo con «Enviar a cocina» en el mesero; «En fila /
  Entregadas», tarjetas MESA 4 #1 con contador y «1/3 ✓», tachar por toque y «Confirmar entregado»
  en la cocina. Interactivos: tocar productos arma la comanda; tocar líneas las tacha.
- **S19** — *(voz)* El guion vive en `web/appetic/voz/guion.txt` (una línea por sección: `id|texto`); se
  regenera con `~/.claude/tools/edge-tts-venv/bin/python3 web/appetic/voz/generar.py`, que deja los
  `.mp3` y `guion.json` (texto + tiempo de cada palabra). Si cambia un texto, se regenera esa línea.
  Los precios van en letras («cincuenta y nueve mil novecientos») para que la voz los lea bien.
- **S20** — *(voz)* Los celulares solo dejan sonar audio tras un toque: el botón «Recorrido» desbloquea
  el `<audio>` dentro del clic. Si se entra por `#recorrido` sin tocar, el subtítulo corre con un
  reloj propio y la voz arranca al primer toque en «Continuar».
- **S12** — *(ronda 2)* **El dueño curioso** no sube fotos ni ubicación: solo D11 y «quiero que me
  contacten». Su solicitud llega igual al panel, con `origen: 'dueño'`.

---

## 4. Descartado (no volver a proponer)

- **Demo real incrustada en un celular** → no se marcó en P3; el celular es simulado.
- **Link con saludo por cliente (`?para=`)** → S2: no.
- **Apagar la promo sola el 31-dic** → S3: no.
- **Enviar la solicitud por correo** → P5 en blanco y P1 pide base de datos; no se hace correo.
- **Datos extra del local** (domiciliario/mesas, qué usa hoy, redes, hora de llamada, frío/tibio/caliente)
  → P4 no los marcó.

---

## 5. Estado de las rondas

- **Ronda 1 — Visión general** ✅ respondida · `Cuestionario-1-Propuesta-Web-Appetic.html`
- **Ronda 2 — La cotización formal** ✅ respondida (4-nov) · `Cuestionario-2-Cotizacion-Formal.html`
- **Ronda 3 — Retoques tras verla en vivo** ✅ respondida (4-nov) · `Cuestionario-3-Retoques-En-Vivo.html` (retirado).
  Nació de 7 puntos del usuario al ver la página publicada (ver bitácora).

---

## 6. Incógnitas abiertas

1. **Nombres de los vendedores** para la lista fija (D10). Mientras no lleguen, la lista va como
   constante `VENDEDORES` al inicio del JS de la página, con un marcador para rellenar.

---

## 7. Plan de implementación

Carpeta de la web: `../web/` (fuera de este repo; `web/subir.sh` sube por FTP). La página nueva vive en
`web/appetic/`. Lo del formulario del lado del servidor y el panel viven en este repo (rama
`ccr-20747b3e-4xpkim`).

### A · Página `web/appetic/index.html` (HTML+CSS+JS vanilla, mobile-first, S2/S3/S7)
- [x] Cabecera/nav del inicio (golondrina, «Volver al inicio», botón WhatsApp) y tokens del inicio
      con `--acc:#FF7A3D` (naranja Appetic) para acentos.
- [x] Portada: «Tu negocio de comida, listo para despegar» + **pase de abordar animado** (D2).
- [x] Qué es Appetic + 4 pilares (revelado `.rv` como el inicio).
- [x] Las 5 cosas, una sección por cada una, con sus interactivos (D2):
  - [ ] 1 Menú: **celular simulado con menú y carrito** (tocas platos, se arma el pedido, sale el
        mensaje de WhatsApp).
  - [ ] 2 TV: **TV en vivo** que rota platos sola.
  - [ ] 3 Domicilios: foto + badge de envío que cambia con la distancia (deslizador).
  - [ ] 4 Meseros y cocina: **viaje del pedido animado** (mesa → cocina → despacho → aviso).
  - [ ] 5 Cuentas: **números que suman solos** (vendiste − gastaste = te quedó) y barras del mes.
- [x] Planes: **selector mensual / 6 meses / 12 meses** que recalcula precios (Emprendedor 59.900 ·
      Comerciante 79.900 · Empresario 99.900 · Desarrollador 3.000.000 único), sello «2.º mes gratis».
- [x] Demo (QR + link `appetic.vercel.app/demo`) · CTA WhatsApp · botón **Descargar PDF**
      (`../propuestas/propuesta-appetic.pdf`) · **Solicitar cotización formal**.
- [x] **Modo presentación** (D1): botón «Presentar» → cada sección a pantalla completa, flechas /
      teclado / deslizar, salir con Esc.
- [x] `og:` para WhatsApp (D7) con imagen `img/og-appetic.jpg` 1200×630.
- [x] Imágenes WebP ya en `web/appetic/img/` (44 archivos, 2 MB) ✅ 4-nov.

### B · Formulario de cotización (D8–D14) — en la misma página, como hoja/modal
- [x] Paso 1: «Soy vendedor de Swiftfly» / «Soy dueño de un negocio».
- [x] Campos D11 (+ vendedor de la lista, foto del lugar, GPS, carta y logo si es vendedor).
- [x] Reducción de fotos en el navegador (S11) · honeypot (D14).
- [x] Cola sin señal en IndexedDB + reintento al volver `online` (D13/S10).
- [x] `POST https://appetic.vercel.app/api/solicitud` (S8).

### C · Servidor y panel (en este repo)
- [x] `api/solicitud.js`: CORS para switflysolutions.com, valida, honeypot, guarda en `solicitudes/`
      y fotos en Storage; límite de tamaño.
- [x] `firestore.rules` / `storage.rules`: `solicitudes/` solo la lee el superadmin; nadie escribe desde
      el cliente (escribe el servidor). Desplegar con /Actualizar_Reglas_Firebase.
- [x] Sección «Solicitudes» en el panel del superadmin (S9): lista, estado, mapa, fotos.
- [x] Desplegar Appetic a Vercel (/despliegue_en_vercel).

### D · Inicio del sitio
- [x] En `web/index.html`, el botón de Appetic pasa de «Descargar la propuesta (PDF)» a
      «Ver la propuesta» → `appetic/` (D3). El PDF sigue disponible dentro de la propuesta.

### Qué se construyó (4-nov-2026)
- `web/appetic/index.html` + `estilos.css` + `app.js` + `img/` (44 WebP + `og-appetic.jpg`): página larga
  con portada de vuelo y pase de abordar animado, qué es Appetic, las 5 cosas con sus interactivos
  (celular con carrito que arma el mensaje de WhatsApp y se demuestra solo, TV que rota y cambia el
  precio al tocar el panel, envío por distancia con deslizador, viaje del pedido animado, cuentas que
  suman solas), demo con QR, planes con selector mes / 6 / 12, CTA, modo presentación (botón
  «Presentar», flechas, teclado, deslizar, `#presentar`) y el formulario de cotización (hoja con 4
  pasos, fotos reducidas en el navegador, GPS, cola sin señal en IndexedDB, honeypot).
- Repo Appetic (commit `0664653`): `api/solicitud.js`, `LIMITES.solicitud`, reglas de Firestore y
  Storage para `solicitudes/`, `src/services/solicitudes.js`, sección «📋 Solicitudes de cotización»
  en `/superadmin` (`Solicitudes.jsx`, también en el modo simulado `?super=1`).
- `web/index.html`: el botón de Appetic en «Proyectos» pasó a «Ver la propuesta» → `appetic/`.
- Pruebas: formulario de punta a punta contra la API local (dueño, vendedor con foto, sin foto
  bloquea, cola sin señal guarda y envía al volver), reglas en el emulador (13 casos), `npm run build`,
  capturas PC y celular locales y en vivo (`web/appetic/.capturas/`). Datos de prueba borrados.

### F · Retoques de la ronda 3 (4-nov-2026)
- [x] Página: vendedor con botones · sin ciudad/barrio para vendedor · GPS obligatorio · «Solo
      registrar la visita» con motivos (D15, D21, D22) · sin «Desliza» (D16, también chocaba en PC) ·
      golondrina quieta en el pase (D17).
- [x] Recorrido automático en lugar de las diapositivas (D24) · sin zoom en celular (D25).
- [x] TV réplica del real (D20) con el control de precio.
- [x] Sección 4: celular del mesero y tablet de cocina simulados, cada uno con su demo (D18, D19, S18).
- [x] API `api/solicitud.js`: `registro`, `motivo`, `motivoTexto`; ubicación obligatoria para
      vendedor; celular opcional en visitas (S16). Commit `491da28`, en Vercel.
- [x] Panel: filtro «Visitas», chip del motivo, bloque «Recorridos» por vendedor y fecha (D23, S17).
- [x] Publicar: Appetic a GitHub/Vercel (`491da28`) · `web/appetic/` por FTP (versiones `?v=3`) · verificado en vivo.

### E · Publicar y verificar
- [x] Respaldo del `index.html` en vivo (`respaldo-servidor-<fecha>/`) antes de subir.
- [x] FTP desde esta PC: `ftp.switflysolutions.com`, usuario `u374493639.switfly` (el usuario lo
      recuerda como `u374493639.switflysolutions.com` + `switfly`, pero lo que conecta es esto).
      Subir `appetic/` completo + `index.html`. No tocar `privacy-policy/`.
- [x] Verificar en vivo PC y celular con capturas; `og:` con el depurador de WhatsApp/Facebook.

---

## 8. Bitácora

- **3 de noviembre de 2026** — Leída la propuesta (7 págs.) y descargado y capturado el inicio de
  switflysolutions.com (PC y celular). Probado el FTP: `u374493639.switflysolutions.com` no existe
  en DNS; `ftp.switflysolutions.com` (46.28.42.185) resuelve pero los puertos 21/22/65002 no
  conectan desde el entorno en la nube → la red del entorno lo bloquea. Entregada la ronda 1.
- **3 de noviembre de 2026** — Ronda 1 respondida (D1–D7, S7). P2 en blanco → decidí la cara
  visual (S7). Apareció algo nuevo, el formulario de cotización (D6): la ronda 2 es solo eso. FTP
  vuelto a probar: sigue cerrado. Hostinger sirve el sitio (cabecera `platform: hostinger`), así que
  PHP para enviar correo es viable.
- **4 de noviembre de 2026 (noche)** — Rama traída a la PC. Ronda 2 respondida → D8–D14 y S8–S12. Lo
  grande: la solicitud **se guarda en Firestore de Appetic** con foto del lugar y GPS del vendedor
  (control de zonas de venta), nada de correo. Decidido por mí cómo llega (función en Vercel, S8) y
  dónde se ve (panel del superadmin, S9). Imágenes pasadas a WebP en `web/appetic/img/` (14 MB → 2 MB).
  Comprobado que el `index.html` en vivo es idéntico a `web/index.html` y que `/appetic/` aún no
  existe. El usuario pasó la clave del FTP en el chat (no se guarda). Se pausa por hoy: **mañana
  5-nov se construye** siguiendo el plan de la sección 7, sin más preguntas.
- **4 de noviembre de 2026 (día)** — Construido todo el plan A–E. Problemas encontrados y resueltos:
  el panel del navegador de la app no capturaba (se reescribió `web/captura.mjs` por CDP, S15); en
  PC el sello «Abordado» tapaba un dato del pase (ahora va en el talón); `#planes` estaba repetido
  como id (la sección y la cuadrícula) y el tachado de precios no salía; en celular las manchas
  giradas de fondo ensanchaban la página (`main{overflow-x:clip}`); en modo presentación la portada
  no se ocultaba por la especificidad del id. Vercel acepta cuerpos de ~4,5 MB → las fotos se
  reducen a ≤ 900 KB y 1280 px. Publicado por FTP (respaldo en `respaldo-servidor-2026-11-04/`),
  `main` de Appetic empujado a GitHub (Vercel despliega solo).
  **Pendientes del usuario:** (1) desplegar las reglas de Firebase (el modo automático me lo
  bloqueó): `firebase deploy --only firestore:rules,storage --project appetic-17477 --account
  jostivtrb@gmail.com` desde `Appetic/`; sin eso el superadmin no ve la lista (la API sí guarda).
  (2) Pasar los nombres definitivos de los vendedores (S13).
- **4 de noviembre de 2026 (tarde)** — El usuario vio la página en vivo y pidió 7 cosas: (1) el
  desplegable de vendedores se dibuja fuera del celular (es el emulador de Chrome, pero se pasa a
  botones y listo); (2) no le gustó el logo recortado volando en el pase; (3) el «Desliza» tapaba
  el logo del talón en celular; (4) le gustó el celular del menú y quiere uno así para el mesero y
  otro para la cocina; (5) el TV debe ser como el real de la app; (6) correr las reglas y tener el
  apartado en el superadmin → **reglas desplegadas** (`firebase deploy … --project appetic-17477
  --account jostivtrb@gmail.com`, compiladas y liberadas) y el apartado ya existía; (7) el vendedor
  no pone ciudad ni barrio, sí foto y ubicación. Decidido sin preguntar: D15 vendedor con botones y
  sin ciudad/barrio; D16 sin «Desliza» en celular. Capturadas las pantallas reales del TV, mesero y
  cocina de la demo (`web/appetic/.capturas/app-*.png`) para replicarlas. Entregada la ronda 3 con
  5 preguntas (avión, qué reemplazan los simuladores, si van conectados, TV réplica o incrustado,
  ubicación obligatoria) y 2 sugerencias (registrar visitas sin interés; recorrido del día).
- **4 de noviembre de 2026 (tarde, 2)** — Ronda 3 respondida → D17–D23. Construido: golondrina quieta
  en el pase; TV réplica del real (las dos mitades en absoluto para que el contenido no estire el
  16:9; en celular se oculta el precio «para llevar»); celular del mesero y tablet de cocina con sus
  demos propias; formulario con vendedores en botones, visita con motivo, ubicación obligatoria y
  sin ciudad/barrio para el vendedor; API y panel con visitas y recorridos (agente, pruebas en
  verde, datos de prueba borrados). A mitad de camino el usuario pidió dos cosas más al verlo en el
  celular: **sin zoom** (D25) y **recorrido automático en vez de diapositivas** (D24); hechas y
  probadas (avanza solo, se detiene al tocar, continúa desde donde esté). Publicado por FTP y en
  Vercel. El guion `web/captura.mjs` ahora acepta `--gps` (ubicación simulada) y devuelve el valor
  del JS, con lo que sirve para probar flujos enteros sin tocar la pantalla.
- **4 de noviembre de 2026 (tarde, 3)** — La golondrina del pase se veía dentro de un **rectángulo
  claro**: no era la imagen (el PNG original es transparente y sin halo, medido) sino mi CSS, que le
  ponía fondo crema y una sombra, y la sombra dibujaba la caja. Arreglo: `web/appetic/img/golondrina.png`
  limpio desde `assets/marca/golondrina.png` (recortado al cuerpo, 360 px, 37 KB, verificado sobre
  crema, oscuro y violeta) y la línea punteada partida en dos tramos con el pájaro en medio, sin
  fondo ni sombra. Subido (`?v=6`) y comprobado en vivo.
- **4 de noviembre de 2026 (tarde, 4)** — Voz y karaoke del recorrido (D26): guion de 10 secciones,
  generado con edge-tts (hubo que pedir `boundary='WordBoundary'` para que entregue los tiempos de
  palabra; sin eso devuelve cero palabras). La narración de cada sección se reparte entre sus paradas
  (en celular hay varias por sección) para que la voz y el scroll vayan juntos. Cocina en celular
  rehecha (D27). Herramienta nueva: venv `~/.claude/tools/edge-tts-venv`.
- **4 de noviembre de 2026 (tarde, 5)** — Música de fondo (D28) sintetizada con numpy (`voz/musica.py`:
  pad de acordes Cmaj9·Am9·Dm9·G13 a 76 bpm, piano eléctrico con swing, bajo discreto, cierre cruzado
  sin corte) y mezclada bajo la voz (0,16 sola → 0,07 cuando habla). Al reanudar, el recorrido tomaba
  la parada siguiente en vez de la que se veía: ahora elige la última cuyo inicio ya pasó el tercio
  superior de la pantalla, y la voz sigue donde iba. Carta en varias fotos o PDF (D29): página con
  lista de archivos, envío archivo por archivo con progreso («Subiendo la carta: 2 de 3…») y
  reanudación desde la cola sin señal; API `solicitud-archivo` + panel (agente, pruebas en verde;
  CORS compartido en `api/_lib/cors.js`). Probado de punta a punta (2 fotos + PDF) y borrado. Las
  pruebas automáticas ahora corren con el audio silenciado (`--mute-audio` en `captura.mjs`).
- **4 de noviembre de 2026 (tarde, 6)** — D30 y D31 construidos, probados (toques no pausan; al
  moverse a otra sección el recorrido continúa allí con su voz; el subtítulo muestra 2 líneas y se
  desplaza con la voz) y publicados (`?v=11`).
- **4 de noviembre de 2026 (tarde, 7)** — D32: el recorrido pasó de paradas con tiempo fijo a un
  deslizamiento continuo por sección atado al reloj de la narración (`deslizar()` en rAF; `glide.libre`
  cuando la persona toma el control). Publicado `?v=12`.
- **4 de noviembre de 2026 (tarde, 8)** — Al acabar el clip de voz el reloj de la narración se quedaba
  en el último segundo y el tramo no terminaba nunca: al `ended` del audio el reloj pasa a correr solo.
  D33 insignia en píldora. Publicado `?v=13`.
