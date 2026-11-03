# Guía para el Blindaje de Appetic

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** arreglar **bien, no por encima**, los 6 problemas que salieron al cruzar la propuesta
  (noviembre 2026) con el código: precios sin validar, demo que se puede dañar, reglas abiertas,
  candado de plan en cuenta por mesa, detalles menores y los pendientes de la notificación.
- **Inicio:** 3 de noviembre de 2026
- **Estado:** ✅ Publicado — 3 de noviembre de 2026 (`6939a34` en Vercel + reglas e índices en Firebase) · faltan solo las acciones del usuario (App Check, prueba del aviso en su celular)
- **Proyecto:** `Appetic/` (Vite/React + Firebase + funciones de Vercel en `api/`)

---

## 1. Objetivo

En sus palabras: *"arreglemos los 6 errores pero bien … que todo quede bien pulido, no solo
arreglarlo por encima"*. Es el primer paso de construir todo lo que promete la propuesta: antes de
sumar, que lo que ya está sea confiable.

---

## 2. Decisiones CERRADAS

### Heredadas (otras guías, vigentes)

| # | Decisión | De dónde |
|---|----------|----------|
| H1 | La cuenta por mesa y el QR por mesa son **solo del plan Empresario**. | «Planes en la app» H2 + propuesta pág. 7 |
| H2 | Al mesero le avisa «listo» **la comanda que él tomó**; las del QR de la mesa avisan a **todos** los meseros. Es lo que dice la propuesta («Si pide la mesa, cuando sale, les suena a todos los meseros»). → **No es un error**, no se toca. | «Mesero y Comandas» D5 + QR por mesa |
| H3 | La demo siempre muestra todo (Empresario). | «Planes en la app» D10 |

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| D1 | **El servidor recalcula todo.** El pedido de la app y la comanda del QR pasan por una función de Vercel (`/api/pedido`) que vuelve a sacar cada precio del menú real (incluido el menú del día). El navegador ya no escribe pedidos ni comandas del QR directo en Firestore. | P1. Imposible de engañar; ~1 s más al enviar. |
| D2 | **Si un precio cambió con el carrito armado, el carrito se actualiza y se avisa «el precio cambió»** antes de enviar. | S1. Ni el cliente paga una sorpresa ni el local cobra un precio viejo. |
| D3 | **El envío a domicilio también lo recalcula el servidor** con la ubicación y las tarifas del local. | S2. Mismo hueco que el precio. |
| D4 | **Comandas falsas del QR: límite de envíos por celular.** Sin código secreto en el QR ni confirmación del mesero. | P2. El cliente sigue pidiendo solo y no hay que reimprimir nada. |
| D5 | **La demo se reinicia sola** (cada madrugada y cuando lleva 30 min sin nadie) **y lo crítico queda bloqueado**: no se pueden borrar platos ni categorías; sí cambiar precios, fotos y colores. Reemplaza a «Demo de clientes» D15 (reinicio a mano). | P3. La propuesta manda a todos los interesados a la demo. |
| D6 | **Claude sube la llave `FIREBASE_SERVICE_ACCOUNT` a Vercel con el CLI**, pidiendo permiso en el momento. | P4. |
| D7 | **Sí al escudo anti-robots (Firebase App Check).** | S3, contra mi recomendación. Ver S10 sobre cómo se prende sin romper nada. |

### Choque resuelto en el chat (3-nov)

| # | Decisión | Por qué |
|---|----------|---------|
| D8 | **La cuenta por mesa es SOLO del plan Empresario.** En Emprendedor y Comerciante la Caja deja cuentas «para llevar» a nombre de alguien (botón «＋ Cuenta») y muestra el candado. Reemplaza D2 de «Cuenta por mesa» (todos los planes). | Respuesta del usuario: manda la propuesta y la guía de Planes (más nueva). |

---

## 3. Suposiciones del agente

- **S1** — Hoy el precio del pedido (WhatsApp) y de la comanda del QR se calcula en el navegador con
  `precioItem` y se guarda tal cual; las reglas solo piden `total >= 0`. Al confirmar, el pedido se
  vuelve comanda `porCobrar` y la Caja cobra **ese** total. El envío a domicilio también lo calcula
  el navegador. *(verificado: `CheckoutMesa.jsx`, `services/pedidos.js`, `firestore.rules:161-167, 210-223`)*
- **S2** — Las reglas de Firestore no pueden recalcular 60 líneas con opciones (tope de ~10 lecturas
  por escritura), así que validar el precio de verdad exige **servidor** (función de Vercel con
  `firebase-admin`, como `api/notificar-listo.js`) o que el personal lo verifique.
- **S3** — Cualquier función de servidor depende de `FIREBASE_SERVICE_ACCOUNT` en Vercel. **Ya está
  puesta** (verificado: `/api/notificar-listo` responde «Sesión inválida», no «Falta la llave»), así que
  D6 no hizo falta. El proyecto de Vercel de Appetic es de la cuenta jostivtrb; el CLI de este PC está
  con otra cuenta (sinfiniity), así que variables NUEVAS (App Check) las pone el usuario en el panel.
- **S4** — `stats` acepta cualquier número de cualquiera; se arregla en reglas exigiendo que cada
  campo suba de a 1 (y `monto` con tope razonable). No hace falta preguntar.
- **S5** — El turno del TV ya solo sube de a 1; el abuso posible es inflarlo con muchas llamadas. Se
  amarra a que solo lo suba quien crea una comanda (misma escritura) o el servidor.
- **S6** — Ningún local real usa hoy el QR por mesa (los de muestra están en Emprendedor/Comerciante),
  así que cambiar el formato del link del QR no obliga a reimprimir nada.
- **S7** — Detalles menores que se arreglan sin preguntar:
  - iPhone bloquea la ventana de «Imprimir los QR»: abrir la ventana en el mismo toque y guardar después.
  - Menú del día guarda dos veces: limpiar el reloj tras guardar.
  - Mesero de dos locales: el aviso de «listo» vigila todos sus locales, no solo el primero.
  - `AdminPage.jsx` usa `location` global: pasar a `useLocation`.
  - `api/notificar-listo.js`: revisar que el local esté al día y partir los destinatarios en grupos de 30.
  - Buscador: quitar el residuo de `suscripcion.activa` que ya no se usa.

- **S8** — El límite del QR (D4): **4 comandas cada 10 minutos por celular y mesa**, y **20 por
  local cada 10 minutos desde la misma conexión**. Se cuenta en el servidor (doc `limites/…`). El
  pedido por WhatsApp: 5 cada 10 minutos por celular. Al pasarse: «Espera un momento antes de volver a pedir».
- **S9** — Si el servidor no responde (internet malo), el pedido por WhatsApp **sale igual** como hoy
  (best-effort), pero sin «Mi pedido» y sin quedar en la Caja: el local lo ve en su WhatsApp. La
  comanda del QR, en cambio, **no sale** hasta que el servidor la acepte (no tiene WhatsApp de respaldo).
- **S10** — App Check (D7) se prende **en dos tiempos**, como recomienda Google: primero la app manda
  la prueba y el servidor solo la **mide**; cuando las métricas de la consola muestren que los pedidos
  reales la traen, se pone obligatoria (`APPCHECK_OBLIGATORIO=1` en Vercel y «Aplicar» en Firestore).
  Necesita una clave de reCAPTCHA v3 que se crea en la consola de Google (acción del usuario).
- **S11** — La Gran Esquina (menú externo) sigue igual: su pedido lo cobra su propia caja con sus precios.
- **S12** — El reinicio de la demo pasa al servidor (`/api/demo`): el botón del superadmin, la tarea
  programada de la madrugada (3 a. m. Bogotá) y el «nadie en 30 min» usan el mismo código. La demo
  avisa que sigue en uso cada 5 minutos mientras alguien la tiene abierta.
- **S13** — Las métricas del pedido (pedidos, monto, por tipo) las suma el servidor; el navegador
  solo puede sumar de a uno visitas e interesados.

---

## 4. Descartado (no volver a proponer)

- QR con código secreto, confirmación del mesero y botón de rechazo en cocina → D4.
- Copia de demo por visitante → D5.
- Que el personal verifique precios a mano → D1, lo hace el servidor.
- Avisar «listo» a todos los meseros también en sus propias comandas → H2, la propuesta y la app ya coinciden.

---

## 5. Estado de las rondas

- **Ronda 1 — Visión general** ✅ respondida · `Cuestionario-1-Blindaje.html`
- **Ronda 2** ❌ no se hace: con D1–D7 no queda nada que adivinar.

---

## 6. Incógnitas abiertas

Ninguna. Faltan solo acciones del usuario: clave de reCAPTCHA v3 (App Check) y probar el aviso en su celular.

---

## 7. Plan de implementación

- [x] 1 · Llave en Vercel — ya estaba (S3)
- [x] 2 · `api/_lib/` compartido: `admin.js` (firebase-admin, llave, sesión, App Check medir/exigir), `limites.js`, `precios.js`
- [x] 3 · `/api/pedido`: recalcula precios (menú + menú del día), envío, límites; escribe pedido+resumen o comanda QR+turno (transacción); suma métricas
- [x] 4 · Checkout y CheckoutMesa usan `/api/pedido` (`services/enviarPedido.js`); «Actualizamos tu pedido» pone el carrito al día (`ponerAlDia` en CartContext)
- [x] 5 · Reglas: pedidos y comandas QR solo servidor · turno solo personal · stats solo de a uno · `limites/` cerrado · TTL de `limites`
- [x] 6 · Demo: `/api/demo` (entrar · latido · reiniciar · tarea 3 a. m.), «Preparando la demo para ti…», reglas sin borrar platos/categorías
- [x] 7 · Candado de plan en cuenta por mesa (reglas `mesaEnPlan` + Caja «＋ Cuenta» con candado)
- [x] 8 · Detalles menores (S7): QR iPhone, menú del día, aviso multi-local, `useLocation`, notificar-listo (plan, corte, grupos de 30, cajero), buscador
- [x] 9 · App Check en la app (se prende con `VITE_RECAPTCHA_V3`) + el servidor lo mide (`APPCHECK_OBLIGATORIO=1` para exigir)
- [x] 10a · Pruebas: `node prueba-appetic.mjs` (10 nuevas), 22 de reglas en el emulador, función contra la demo real, navegador (mesa con precio cambiado, WhatsApp, Mi pedido, Preparando en celular, candado de la Caja)
- [x] 10b · Publicado: app a Vercel primero (confirmado en el bundle servido y en `/api/pedido`), luego reglas + índices (TTL). En producción: pedido directo sin sesión y métricas a mano → PERMISSION_DENIED; por el servidor → OK
- [x] 11a · App Check (lo pidió hacer el usuario): reCAPTCHA **Enterprise** (no v3), clave «Appetic App Check (web)» `6Ld6dw4uAAAAAKkJEIcBvfvK6ivXhMogRsmQL3rJ` para appetic.vercel.app y localhost, registrada en App Check de la app web. Va en el código (es pública); no hizo falta Vercel. Firestore sigue SIN exigirla y el servidor solo mide
- [ ] 11b · Usuario: prueba del aviso con la app cerrada en su celular
- [ ] 12 · En ~1 semana: mirar en Firebase Console → App Check que casi todo el tráfico llegue verificado; entonces «Aplicar» en Firestore y `APPCHECK_OBLIGATORIO=1` en Vercel

---

## 8. Bitácora

- **3-nov-2026** — Auditoría propuesta vs. código: 13 de 16 promesas cumplidas, 3 a medias. Abierta esta guía.
- **3-nov-2026 · construcción** —
  - *Sobre la marcha:* para que el servidor use el mismo código que la app, los cálculos puros salieron
    de los servicios con Firebase: `utils/pedidoDoc.js` (pedido y resumen), `utils/comandaItems.js`,
    `utils/cuentasCalculo.js` (deltas de cuentas) y `services/demoEjemplo.js` (datos de la demo). Los
    imports de esos archivos llevan `.js` (Node no los resuelve sin extensión en Vercel).
  - *Sobre la marcha:* el límite de envíos se cuenta **justo antes de guardar**: un «el precio
    cambió» o un reintento no gastan cupo.
  - *Sobre la marcha:* el reinicio pone `menuVersion: Date.now()`; antes volvía a la versión fija y
    un celular con el menú cambiado en caché no lo volvía a leer.
  - *Sobre la marcha:* el reinicio tarda ~9 s; si `entrar` tarda más de 1,2 s se tapa con «Preparando
    la demo para ti…» y al terminar se recarga UNA vez (marca en sessionStorage, sin ciclos).
  - *Sobre la marcha:* `vite.config.js` atiende `/api/*` en desarrollo con las mismas funciones
    (`apiLocal`), usando la llave local. Escribe en el Firebase real: probar con la demo.
  - *Problema:* la demo vacía el carrito al entrar al menú, así que «precio viejo en el carrito» se
    probó cambiando el precio en Firebase con el plato ya en el carrito (el caso real).
- **3-nov-2026 · App Check** — Creado por API con la sesión de firebase-tools de la cuenta dueña
  (jostivtrb): activar `recaptchaenterprise` y `firebaseappcheck`, crear la clave (SCORE) y
  `recaptchaEnterpriseConfig` de la app. *Problema:* los primeros minutos el canje respondía 400
  «Unable to call the reCAPTCHA Enterprise CreateAssessment method…» con todo bien configurado: era
  propagación (~5 min); después, token real OK y el servidor lo valida. Se cambió de
  `ReCaptchaV3Provider` a `ReCaptchaEnterpriseProvider` (lo que recomienda Firebase hoy).

