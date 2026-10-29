# Guía para la Demo de clientes

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** un local DEMO de Appetic donde los clientes potenciales entren, cambien y prueben a su gusto, y que nosotros podamos reiniciar.
- **Inicio:** 29 de octubre de 2026
- **Estado:** 🔵 Construyendo
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
| D15 | Dos visitantes a la vez se ven los cambios: **se acepta**; se reinicia a mano antes de mandar el link | Decisión del usuario (S1) |
| D16 | **Bloqueados** en la demo: WhatsApp del local, link (slug) y horario | Si los cambian, se rompe para el siguiente (S2) |
| D17 | **Tutorial guiado tipo videojuego**: resalta en pantalla qué tocar, espera a que lo haga y avanza; no solo texto | Obs. del usuario en S3: «muy bonito e interactivo, una experiencia guiada» |
| D18 | Se miden **visitas y clics** a «Quiero esto para mi negocio» | Saber si la demo convierte (S4) |

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

---

## 7. Bitácora

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

---

## 5. Estado de las rondas

| Ronda | Tema | Estado |
|---|---|---|
| 1 | Visión general: dónde vive, quién entra, qué toca, cómo se reinicia | ✅ respondida |
| 2 | Cómo se ve y se cuida la demo compartida | ✅ respondida — sin más rondas |
