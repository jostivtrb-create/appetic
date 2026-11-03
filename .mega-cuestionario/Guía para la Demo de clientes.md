# Guía para la Demo de clientes

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** un local DEMO de Appetic donde los clientes potenciales entren, cambien y prueben a su gusto, y que nosotros podamos reiniciar.
- **Inicio:** 29 de octubre de 2026
- **Estado:** 🔵 Construyendo — ronda 3 (3-nov): la demo se ordena por los 5 servicios de la propuesta
- **Proyecto:** Appetic/

---

## 1. Objetivo

Un local DEMO **compartido** (un local de verdad en Firestore) al que el cliente potencial entra **sin cuenta**
con un link que le mandamos por WhatsApp, y prueba TODO como dueño: menú y pedido, catálogo, apariencia,
mesero → cocina → entregado, domicilios, QR por mesa, métricas y equipo. Nosotros (superadmin) lo dejamos
como nuevo con un botón «Reiniciar demo».

---

## 2. Decisiones CERRADAS

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| D1 | Una sola demo **compartida**, local real en Firestore | Funciona entre aparatos (mesero en un celular, cocina en otro) como la app de verdad |
| D2 | Uso principal: el cliente la abre **solo**, con un link por WhatsApp | Tiene que entenderse sin que nadie le explique |
| D3 | Entra **sin cuenta**: abre el link y ya está adentro | Cero fricción |
| D4 | Puede probar **todo**: menú+pedido, catálogo, apariencia, mesero→comandas→entregado, domicilios, QR por mesa, métricas (de ejemplo) y equipo | Que vea la app completa |
| D5 | Se reinicia con un botón **«Reiniciar demo»** que solo ve el superadmin | Control de ustedes |
| D6 | Base: **Burger Demo mejorado** — menú más completo y fotos con IA como las de los clientes | Las fotos de Unsplash y el menú corto no venden |
| D7 | Los pedidos de prueba abren el **WhatsApp de ventas (320 843 5143)** | De paso queda el contacto del interesado |
| D8 | El visitante es un **admin que ve todos los paneles** (no hace falta selector de rol) | Obs. del usuario en S2; el admin ya ve Mesero, Comandas y Domicilios |
| D9 | **Escondida del buscador** y no cuenta como restaurante | No es un local de verdad |
| D10 | **Letrero fijo «Esto es una demo»** + botón «Quiero esto para mi negocio» → WhatsApp de ventas | Que nadie la confunda y convertir al interesado |


### De la ronda 2

| # | Decisión | Por qué |
|---|----------|---------|
| D11 | Se llama **Burger Demo** | Que se note que es de mentiras |
| D12 | El link abre una **bienvenida** con «Ver como cliente» y «Ver como dueño» | El que llega solo entiende en 5 s qué está viendo |
| D13 | Pueden subir **cualquier foto** (platos, logo, portada); se borran al reiniciar | Que pruebe con su propio plato |
| D14 | Arranca con **3–4 comandas y un domicilio de ejemplo**, y vuelven al reiniciar | Una cocina vacía no impresiona |
| D15 | Dos visitantes a la vez se ven los cambios: **se acepta**; ~~se reinicia a mano antes de mandar el link~~ → **se reinicia sola** (madrugada y 30 min sin uso) y no se borran platos ni categorías: ver «Guía para el Blindaje de Appetic» D5 | Decisión del usuario (S1), ajustada el 3-nov |
| D16 | **Bloqueados** en la demo: WhatsApp del local, link (slug) y horario | Si los cambian, se rompe para el siguiente (S2) |
| D17 | **Tutorial guiado tipo videojuego**: resalta en pantalla qué tocar, espera a que lo haga y avanza; no solo texto | Obs. del usuario en S3: «muy bonito e interactivo, una experiencia guiada» |
| D18 | Se miden **visitas y clics** a «Quiero esto para mi negocio» | Saber si la demo convierte (S4) |


### De la ronda 3 (3-nov · auditoría `.auditoria/demo-de-clientes.md` H1–H3 + revisión de la propuesta)

| # | Decisión | Por qué |
|---|----------|---------|
| D19 | La bienvenida se ordena por los **5 servicios de la propuesta**, con su mismo número, nombre e ícono: 1 Menú digital · 2 Menú en el TV · 3 Domicilios · 4 Meseros y cocina · 5 Tus cuentas. **Reemplaza** la bienvenida por procesos del 30-oct | Quien llega con el papel encuentra lo que acaba de leer (H2) |
| D20 | El TV tiene **recorrido propio**: prende el TV → cambia un precio en la carta → vuelve al TV y lo ve cambiado | La promesa del papel es «cambias un precio y cambia en el TV» (H1) |
| D21 | En el servicio 1 el cliente **elige cómo pide**: 🛍️ para recoger · 🛵 a domicilio · 🪑 desde la mesa (QR) | El Emprendedor (recoger) y el QR de mesa no se veían en ningún lado (H3) |
| D22 | Se mide **de dónde llegan** a la demo (`?origen=`): visitas y «Quiero esto» por origen | Saber si la propuesta impresa trae gente (S1) |
| D23 | Al final de cada servicio se dice **en qué plan viene** y desde cuánto | Que el de un tráiler no piense «esto no es para mí» (S2 · H5 de la auditoría) |

**Propuesta (ronda 3):** no se le agregan bloques (P4), el Plan Desarrollador se queda arriba como ancla (P5), se quedan las dos portadas (P6), las fotos de los platos van **incluidas en todos los planes, hechas con IA** desde sus fotos o su carta (P7 — ya es lo que dice el papel). Único cambio: un **QR pequeño de la demo arriba** (pág. 2–3) además del de la pág. 6 (S3), y los dos QR con su `?origen=` (D22).

---

## 3. Suposiciones del agente

- **Lo que hay hoy (del código):** `?preview=1`, `?super=1` y `?equipo=` solo funcionan en DEV
  (`import.meta.env.DEV` en `src/dev/index.js`, `AdminContext.jsx`, `PanelRail.jsx`). En producción el
  panel exige Google + correo en `local.admins` (o superadmin). → La demo para clientes es nueva.
- El motor DEMO de comandas/pedidos/equipo ya existe (localStorage + BroadcastChannel): sirve tal cual
  para una demo «cada visitante su copia», pero solo sincroniza pestañas del MISMO navegador.
- Burger Demo = `src/dev/mockLocal.js` (slug `demo`, fotos de Unsplash, 4 categorías). No está sembrado en Firestore.
- El QR de la página 4 de la propuesta lleva a `appetic.vercel.app/pilotos`.
- **Técnico (decidido por mí):** para que alguien sin cuenta pueda escribir sin abrir la base a todo el mundo,
  se usa **inicio de sesión anónimo de Firebase** (invisible para el visitante) y las reglas solo permiten
  escribir en locales marcados `esDemo: true`. ⚠️ Requiere activar «Anónimo» en Firebase Console → Authentication.
- Las métricas de ejemplo se siembran al reiniciar.
- **Link:** `appetic.vercel.app/demo` (slug `demo`). Se retira el atajo de DEV que hacía de `demo` un local de mentiras.
- **⚠️ Seguridad al activar el anónimo:** hoy `storage.rules` deja subir a CUALQUIERA con sesión a cualquier
  carpeta de local. Con el anónimo eso sería un hueco → la subida del anónimo queda limitada a `locales/demo/`.
  Las reglas de Firestore que miran solo `request.auth != null` (usuarios propio uid, config lectura) no abren nada.
- El anónimo solo se crea **dentro de /demo**; fuera de la demo la app lo trata como «sin sesión» (no aparece en Cuenta).
- **Tutorial (diseño mío):** foco que oscurece la pantalla y deja un hueco brillante sobre lo que hay que tocar,
  burbuja con el paso y barra de progreso; avanza solo cuando el visitante hace la acción; se puede saltar y
  retomar. Recorrido: 1) bienvenida → 2) como cliente: pide un plato desde la **mesa 4** (QR) → 3) **Cocina**:
  ahí llegó, tacha y entrega → 4) **Mesero**: toma una comanda → 5) **Catálogo**: cambia un precio y míralo en
  el menú → 6) **Apariencia**: cambia el color → 7) **Domicilios**: confirma el domicilio de ejemplo →
  8) final con «Quiero esto para mi negocio». El progreso se guarda en su navegador (es por visitante,
  aunque la demo sea compartida).
- **Reiniciar:** botón en «Locales y planes» del superadmin; borra comandas, pedidos, equipo, productos y
  fotos subidas, y vuelve a escribir el local, el menú, las comandas de ejemplo y las métricas de ejemplo.
- Notificaciones push y «Activar avisos» se esconden en la demo.
- **Ronda 3 (decidido por mí):**
  - Lo que antes estaba en los procesos se reparte así: **1 Menú** (el cliente pide, 3 caminos) · **2 TV** (incluye editar un precio en Catálogo) · **3 Domicilios** (confirmar el pedido del cliente → domiciliario: en camino → entregado) · **4 Meseros y cocina** (mesero toma la comanda → cocina abre, tacha y despacha → QR por mesa en Difundir) · **5 Cuentas** (cobrar en la Caja → ver Cuentas).
  - Planes al final: 1, 2 y 5 → Emprendedor ($59.900) · 3 → Comerciante ($79.900) · 4 y el pedido desde la mesa → Empresario ($99.900). Precios leídos de `utils/plan.js`.
  - El TV se abre en la MISMA pestaña (`/demo/tv`) con el letrero y el recorrido encima; al volver tras cambiar un precio abre `?plato=<id>` y salta a la página del tablero donde está ese plato, resaltado.
  - El conteo por origen vive en `config/demoEmbudo` y lo suma el servidor (`/api/demo`), **no** en `locales/demo/stats`: ⚠️ hallazgo de paso — el reinicio borra `stats`, así que el contador «tocaron Quiero esto» (D18) se volvía a 0 cada vez que la demo se reiniciaba sola.
  - Orígenes: `prop-p2` (QR nuevo de arriba) y `prop-p6` (el de siempre); sin `?origen=` cuenta como `directo`. Una visita por aparato y por día.
  - Título de la bienvenida: «Así funcionaría tu negocio» (H7 de la auditoría, va de paso al rehacerla).


---

## 4. Incógnitas abiertas

Acciones del usuario: activar «Anónimo» en Firebase Auth · generar las fotos IA en Gemini (`.prompts-imagenes/burger-demo.md`) ·
dar permiso para publicar · luego tocar «Crear demo» en /superadmin.
Pregunta abierta: ¿agregamos al panel un editor de colores y logo? (hoy no existe, ver bitácora).

---

## 6. Plan paso a paso

- [x] 1. Datos de Burger Demo mejorado (`src/dev/burgerDemo.js`): menú completo, logo y prompts de fotos IA (`.prompts-imagenes/burger-demo.md`)
- [x] 2. Reglas: Firestore (`esDemo` → el anónimo administra solo ese local) + Storage (anónimo solo en `locales/demo/`)
- [x] 3. Sesión anónima solo en /demo + el visitante entra como admin de la demo; bloqueo de WhatsApp/link/horario; sin avisos push
- [x] 4. Bienvenida `/demo` (Ver como cliente / Ver como dueño) + letrero fijo «Esto es una demo» + «Quiero esto para mi negocio»
- [x] 5. Pedidos de prueba → WhatsApp de ventas; escondida del buscador; medición de visitas y clics
- [x] 6. Reiniciar demo (botón superadmin) con comandas, domicilio y métricas de ejemplo
- [x] 7. Tutorial guiado tipo videojuego
- [~] 8. Probar todo en vista previa ✅ → publicar ✅ (29-oct: reglas Firestore+Storage y app) → sembrar la demo («Crear demo», usuario) → probar en producción

### Ronda 3 (3-nov)
- [x] 9. Recorridos por servicio (`Recorrido.jsx`): menu (elige recoger/domicilio/mesa), tv, domicilios, salon, cuentas, con el plan al final
- [x] 10. Bienvenida por los 5 servicios con los íconos de la propuesta
- [x] 11. TV en la demo: letrero + recorrido en `/demo/tv`, `?plato=` resalta el plato cambiado
- [x] 12. Medir origen: `?origen=` → `/api/demo` → `config/demoEmbudo`; superadmin lo muestra
- [x] 13. Propuesta: QR pequeño arriba (`prop-p2`) y el de la pág. 6 con `prop-p6`; regenerar PDF
- [~] 14. Probado en vista previa (móvil) ✅ → pedir permiso para publicar

---

## 7. Bitácora

- **3-nov · Ronda 3 construida (sin publicar).** Bienvenida por los 5 servicios con los íconos de la propuesta
  (`public/demo-servicios/`), recorridos `menu` (elige → `menu-recoger` / `menu-domicilio` / `menu-mesa`), `tv`,
  `domicilios`, `salon`, `cuentas`, con «Viene en el plan X · desde $Y/mes» al final. Probados en vista previa:
  menú desde la mesa (la comanda cae en cocina), TV (con `appetic-build`: el TV leyendo Firebase mostró La Clásica
  resaltada con el precio nuevo), domicilios de punta a punta, y los arranques de 4 y 5.
- **Problemas encontrados y resueltos en el camino:**
  - Al tocar «Siguiente servicio» con la ventana «¡Listo!» del pedido aún abierta, la burbuja del guía solo decía
    «Entendido»: el visitante quedaba atascado. Ahora la burbuja también trae el botón del paso (y las opciones).
  - El reinicio de la demo borra `locales/demo/stats`, así que el contador «tocaron Quiero esto» (D18) volvía a 0
    cada vez que se reiniciaba sola. Se movió a `config/demoEmbudo`, lo suma el servidor (`/api/demo`), por origen.
  - En el TV la tarjeta del guía tapaba el plato resaltado: el paso ahora apunta a `.tvt-resaltado` y la tarjeta se corre.
  - El TV en la demo ya no pide pantalla completa al primer toque ni esconde el puntero.
  - En «Meseros y cocina» se sumó un paso para mirar Difundir (antes el final lo tapaba con el velo).
- **Decidido sobre la marcha:** el servicio 3 crea SIEMPRE un pedido «por confirmar» nuevo para el visitante (así no
  le toca uno que ya confirmó otro); si toca «Ver el pedido» antes de que exista (~2 s), cae en el de ejemplo.
- **Propuesta:** QR pequeño «Pruébalo mientras lees» en el pie de la pág. 2 (`img/qr-demo-p2.png`, `?origen=prop-p2`)
  y el de la pág. 6 cambiado a `img/qr-demo-p6.png` (`?origen=prop-p6`). PDF regenerado, sigue en 7 páginas. Los dos
  QR leídos con OpenCV desde el PDF. ⚠️ Las propuestas YA impresas siguen con el QR viejo (sin origen): cuentan como «directo».
- ⚠️ En `config/demoEmbudo` quedaron 1 visita y 2 «Quiero esto» de las pruebas (1 de ellos «otro»). Restar al leer o borrar el documento antes de mirar números.

- **30-oct · Pedidos del usuario al probarla:** durante un recorrido **solo se toca lo resaltado** (paneles
  transparentes alrededor del hueco; tocar fuera sacude la tarjeta); con una ventana abierta el guía es una
  burbuja al borde. El letrero quedó con **un solo botón: «↩ Volver al inicio del demo»** (corta el recorrido y
  abre la bienvenida); «Quiero esto» sigue en la bienvenida y al final de cada proceso. El menú de la demo se ve
  como lo ve un cliente (sin «Pedido de prueba» ni ☰). En la demo el domicilio no exige ubicación (usa una de
  ejemplo a ~1,5 km). «Agregar» lleva y resalta lo que falta elegir (para todos los locales).

- **30-oct · Recorrido por PROCESOS (pedido del usuario):** la bienvenida ya no ofrece «ver como cliente / dueño»
  sino 5 procesos, cada uno con su recorrido guiado: **Cliente** (pide a domicilio desde su casa y sigue su
  pedido en «Mi pedido»), **Mesero** (comanda en la mesa + confirmar pedido de la app), **Cocina** (tachar y
  despachar), **Domiciliario** (en camino → entregado) y **Administrador** (Comandas: seguir y cobrar; carta;
  Difundir). El 5.º lo sumé yo (es quien cierra todo); se puede quitar. Al terminar uno ofrece el siguiente,
  «Quiero esto» o «Elegir otro proceso». Se repiten cosas a propósito.
- **Bug arreglado:** un recorrido guardado de antes se pintaba encima de la bienvenida (foco suelto). Ahora el
  recorrido espera mientras la bienvenida está abierta, y el estado viejo (sin proceso) se ignora.
- El pedido enviado ahora muestra **«📍 Ver en qué va mi pedido»** (link a «Mi pedido»), para todos los locales.

- **29-oct · Hallazgo (preguntar al usuario):** el panel NO tiene editor de **colores ni de logo**
  (Apariencia = portada + animación del logo; los colores y el logo los ponemos nosotros). D4 pedía
  «colores, logo». En la demo se puede cambiar la portada; el paso «ponle tus colores» se quitó del recorrido.
- El recorrido quedó en 9 pasos: mesa 4 (QR) → pedir → cocina tacha y entrega → mesero toma comanda →
  confirmar el domicilio de ejemplo → cambiar un precio → final con «Quiero esto». Avanza con señales de la app
  (`avisarDemo` en carrito, CheckoutMesa, Comandas, Mesero, MiPedido, catálogo).
- Si otro visitante ya confirmó el domicilio de ejemplo, ese paso dice «ya lo confirmó otra persona» y deja seguir.
- El domicilio de ejemplo va **sin teléfono**: confirmarlo no abre el WhatsApp de un número que podría ser de alguien real.
- Los pedidos tienen vida de 2 días (TTL): el domicilio de ejemplo desaparece solo si nadie reinicia → reiniciar antes de mandar el link (D15).
- Retirado `src/dev/mockLocal.js` (el Burger Demo viejo de DEV): ahora `demo` es la demo real, con vista previa `?preview=1`.
- Checkout y stats tenían la excepción `local.id === 'demo'` (no guardaban): se quitó, la demo guarda de verdad.
- Probado en vista previa (móvil): bienvenida, letrero, recorrido completo de punta a punta.
- **29-oct · Arreglos tras probarla el usuario:** el foco ya no oscurece las ventanas abiertas (plato,
  carrito, pedido); la tarjeta va ARRIBA por defecto (los botones de la app viven abajo; en PC «Continuar
  el pedido» está en la columna del carrito); «Ver como dueño» usa la barra del panel (el visitante cuenta
  como dueño de la demo en AdminContext); el recorrido creció a 19 pasos con **domicilios de punta a punta**
  (cómo pide el cliente → confirmar → cocina → panel del domiciliario: en camino y entregado) y **Difundir**.

---

## 5. Estado de las rondas

| Ronda | Tema | Estado |
|---|---|---|
| 1 | Visión general: dónde vive, quién entra, qué toca, cómo se reinicia | ✅ respondida |
| 2 | Cómo se ve y se cuida la demo compartida | ✅ respondida |
| 3 | Qué cambia: bienvenida por servicios, TV, cómo pide el cliente + afinar la propuesta | ✅ respondida (3-nov) — sin más rondas |
