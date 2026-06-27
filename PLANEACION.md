# 📐 PLANEACIÓN — APPETIC (App de menús del barrio · estudio ZEVEN)

> Documento vivo. Aquí vamos sentando TODAS las bases antes de programar.
> Cómo se usa: responde debajo de cada pregunta donde dice **✍️ Tu respuesta:** y guarda el archivo.
> Claude lee tus respuestas, consolida las decisiones arriba y agrega la siguiente fase.

- **Última actualización:** 2026-06-27
- **Estado:** ✅ **Capa 1 EN VIVO** + 🔵 **Capa 2 EN CONSTRUCCIÓN** (login por roles, buscador y panel de superadmin ya hechos). → Ver **§8 Pendientes y próximos pasos**.
- **Nombre de la app:** 🎉 **APPETIC** (logo en `assets/brand/appetic-logo.png`)
- **Forma de lanzar:** app **completa y funcional** (Capa 1), sin demos. Ver D36.
- **🛠️ Construcción:** ✅ **Capa 1 COMPLETA Y EN VIVO** 🎉 — Etapas 1-4. Repo: `jostivtrb-create/appetic`.
  - 🌐 **EN PRODUCCIÓN:** https://appetic.vercel.app · Local piloto: **/burgerdemo** · Panel: **/burgerdemo/admin** (admin: jostivtrb@gmail.com)
  - ✅ Reglas Firestore desplegadas · ✅ Local piloto creado · ✅ Desplegado en Vercel (env vars OK) · ✅ Dominio autorizado en Firebase Auth
  - Firebase proyecto: `appetic-17477`. Alta de locales: `node scripts/seed-local.mjs` (necesita `scripts/serviceAccount.json`, gitignored).

---

## 🧭 Índice
1. [La idea explicada](#1-la-idea-explicada)
2. [Decisiones tomadas (se va llenando)](#2-decisiones-tomadas)
3. [Preguntas abiertas / pendientes](#3-preguntas-abiertas)
4. [CUESTIONARIO — Fase 1](#4-cuestionario--fase-1) ✅
4.B. [CUESTIONARIO — Fase 2](#4b-cuestionario--fase-2-experiencia-del-cliente--estructura-del-menú) ✅
4.C. [CUESTIONARIO — Fase 3](#4c-cuestionario--fase-3-el-motor-del-menú--checkout--panel-del-local) ✅
4.D. [CUESTIONARIO — Fase 4](#4d-cuestionario--fase-4-arquitectura-técnica--multi-tenant) ✅
4.E. [CUESTIONARIO — Fase 5](#4e-cuestionario--fase-5-nombre--identidad) ✅
4.F. [CUESTIONARIO — Fase 6](#4f-cuestionario--fase-6-recorte-de-la-v1-el-mvp) ✅
5. [Próximas fases](#5-próximas-fases)
6. [🚀 Checklist de Preparación](#6--checklist-de-preparación-antes-de-la-primera-línea-de-código)
7. [📦 Kit de Bienvenida del Local](#7--kit-de-bienvenida-del-local-entregable-estándar)

---

## 1. La idea explicada

**Pitch en una frase:**
> "Es una app del barrio donde cualquier negocio tiene su menú digital gratis (adiós al PDF y al menú por WhatsApp), y donde los vecinos descubren dónde comer. El negocio paga solo si quiere que clientes *nuevos* lo encuentren."

**Versión de un párrafo:**
> "Estamos creando una app local, tipo un mini-Rappi del barrio. Los negocios tienen ahí su menú digital, bonito y fácil de editar, gratis. Cada negocio tiene su propio link y su propio 'mundo' (sus colores, su estética). Si un cliente entra por el link del negocio, ve ese negocio aunque sea gratis. Pero si un cliente abre la app para *explorar* qué hay en el barrio, solo le aparecen los negocios que pagan una suscripción. O sea: la herramienta es gratis, lo que se paga es la **visibilidad** para llegar a clientes nuevos."

**Qué gana cada quien:**

| Actor | Qué gana |
|---|---|
| **Cliente** | Una sola app para ver los menús del barrio, bonitos y actualizados, en vez de pedir el PDF o el catálogo por WhatsApp. |
| **Negocio (gratis)** | Reemplaza su menú-PDF por uno digital editable al instante, con su propia estética. Lo usa con *sus* clientes vía su link/QR. |
| **Negocio (de pago)** | Además aparece en el explorador del barrio → lo descubren clientes que aún no lo conocen. |
| **Nosotros** | Suscripción mensual de los negocios que quieren visibilidad/alcance. |

**El corazón del modelo:** No se cobra por la herramienta, se cobra por el **alcance**. Freemium donde el muro de pago no es el menú, sino "que te descubran".

> Analogía: es como un "Linktree de menús" gratis + un mini-Rappi del barrio donde estar listado es el upgrade de pago.

**⚠️ Riesgo central conocido — Huevo y gallina:** el explorador solo es valioso para el cliente si tiene muchos negocios; pero los negocios solo pagan por aparecer si ya hay clientes explorando. Esto no rompe la idea, pero define toda la estrategia de arranque.

**✅ Estrategia decidida (resuelve el huevo y la gallina):** se lanza primero como **menú digital gratis** para crear tráfico y hábito. Cuando ya haya tráfico, se les plantea a los locales la suscripción para aparecer en el explorador. Primero repartir valor, después monetizar la visibilidad.

### 🎯 Qué ES realmente ZEVEN (refinado tras Fase 1)

El producto se construye en **dos capas**:

- **CAPA 1 — La cuña (v1, lo primero que se construye):** un **menú digital con carrito** por cada local. El cliente entra por el link/QR del local → ve el menú bonito y personalizado → arma su carrito → al finalizar, el pedido completo (con productos, cantidades, datos) se envía al **WhatsApp del local**. Ahí termina la interacción con ZEVEN. El local pone su propio domiciliario. Esto reemplaza el PDF y el "pásame el menú" de WhatsApp.

- **CAPA 2 — El explorador del barrio (después, cuando haya tráfico):** los clientes buscan por tipo de comida (ej. "hamburguesa") y ZEVEN les muestra los locales cercanos (por GPS) que **pagan suscripción** o a los que **ya entraron por su link**. Aquí entra la monetización.

> No competimos con Rappi ni con Instagram. Competimos con **el PDF y el menú por WhatsApp**. Ese es el comportamiento real que atacamos.

**🏗️ Nota de arquitectura (definida en Fase 2):** desde el día 1 es **una sola app multi-local** (no menús sueltos). Al entrar por el link de un local, la app abre con ese local "de primeras". Cada local es como un "mundo" con su propia estética, pero todos viven dentro de la misma app y comparten el mismo motor de menú y el mismo carrito. Lo que cambia entre locales es **diseño + contenido**, no el código base.

---

## 2. Decisiones tomadas

> Fuente de verdad del proyecto. Cada decisión cerrada queda aquí con fecha.

| # | Tema | Decisión | Fecha |
|---|------|----------|-------|
| D1 | Tipo de app | **Menú digital con carrito** (no vitrina pura, no pago in-app). El carrito es **individual por local**. Al finalizar, el pedido completo se envía al **WhatsApp del local**. | 2026-06-26 |
| D2 | Domicilios | Los pone **el local** con su propio domiciliario. ZEVEN termina al llegar el pedido al WhatsApp. **Sin logística ni pago dentro de la app.** | 2026-06-26 |
| D3 | Rubro | **Solo comida.** | 2026-06-26 |
| D4 | Territorio | **Bogotá, Colombia.** Explorador filtra por **radio GPS** desde la ubicación del cliente (capa 2). | 2026-06-26 |
| D5 | Estrategia de arranque | **Primero menú gratis para crear tráfico**, luego se ofrece la suscripción de visibilidad. (Resuelve huevo-y-gallina). | 2026-06-26 |
| D6 | Monetización | Suscripción **suave/leve** solo para **aparecer en el explorador** y ser descubierto por clientes nuevos. (Precio exacto: pendiente). | 2026-06-26 |
| D7 | Diferenciación | Atacar el hábito real: la gente pide por WhatsApp, no busca en Instagram. ZEVEN reemplaza el PDF/menú-por-WhatsApp y crea el hábito de "ahí está todo el barrio". | 2026-06-26 |
| D8 | Creación de menús | **Nosotros montamos cada menú a mano con código** (con bases comunes + personalización por local). Meta inicial: **~10 locales**. Manual a propósito; automatizar solo si despega. | 2026-06-26 |
| D9 | Roles | **Tres roles:** (1) cliente que explora/pide, (2) local que edita su menú con un correo asignado (precios, disponibilidad, agregar/editar productos), (3) nosotros (panel interno: cobro, aprobar, activar visibilidad). | 2026-06-26 |
| D10 | Plataforma | **PWA instalable.** | 2026-06-26 |
| D11 | Equipo | **El dueño (Camilo) + Claude**, en tiempo libre. | 2026-06-26 |
| D12 | Login | **Sin login en v1** (ver y pedir sin cuenta, cero fricción). Pero **cada pedido enviado a WhatsApp se registra anónimo** en Firebase para métricas: nº de pedidos y $ estimado. *Mide intención (pedidos enviados), no venta confirmada.* | 2026-06-26 |
| D13 | Arquitectura de acceso | **Una sola app multi-local** (no páginas sueltas). Entrar por el link de un local → abre la app con ese local de primeras (banner) + popup de instalar PWA. Un local **gratis** es accesible **solo por su propio link** (cada vez; sin desbloqueo guardado). Abrir la app directo (sin link) → solo se ven locales **que pagan**. | 2026-06-26 |
| D14 | Carrito | **Carrito completo:** cantidades por producto + **indicaciones/notas** por producto. Individual por local. | 2026-06-26 |
| D15 | Checkout → WhatsApp | El checkout recoge **nombre, ubicación, método de pago y notas**; arma un mensaje con **todo el pedido** y lo envía al **WhatsApp del local**. El cliente confirma allá. | 2026-06-26 |
| D16 | Reglas del local | El menú maneja **horario** (abierto/cerrado) y **costo de domicilio configurable por el local según zonas/radio** (estilo app "Krusty Burguer" que ya hizo Camilo). | 2026-06-26 |
| D17 | Personalización | **Tematización total por local:** la estética de la app se adapta al local que se está viendo. **El diseño/colores lo controlamos nosotros; el local NO los edita.** | 2026-06-26 |
| D18 | Contenido vs Diseño | Separación de capas: **nosotros** controlamos estructura + diseño (config/código); **el local** edita solo **contenido** (productos, precios, fotos, disponible/agotado, horario). *El "cómo" técnico = motor de menú flexible, se define en Fase 3.* | 2026-06-26 |
| D19 | Motor único | **Un solo sistema/código** con **funciones activables o desactivables por local** (feature flags), NO 20 menús distintos. El primer menú de cada local lo montamos nosotros con base en el menú que envíen; si un formato no encaja, se crea una **pieza nueva reutilizable** y el sistema la "aprende" para los siguientes. Cada menú nuevo es más fácil porque se reúsa lo anterior. | 2026-06-26 |
| D20 | Piezas del producto | Un producto puede tener (opcional): **variantes/tamaños**, **adicionales/extras**, **grupos de elección (combos)**. Set inicial; se amplía caso por caso al montar cada local. *(Ya validado: Krusty Burger tiene esto en `ProductBuilderModal`.)* | 2026-06-26 |
| D21 | Qué edita cada local | Configurable **por menú**: al montar cada local se define qué puede editar y qué no. (Detalle fino diferido). | 2026-06-26 |
| D22 | Ubicación + domicilio | Botón **"obtener ubicación"** (GPS) → distancia local↔cliente (Haversine) → **tarifa por intervalos de 0.5 km** configurable por el local, con **distancia máxima**. *Reutilizar el sistema de Krusty Burger (`deliveryPricing`/`deliveryCost`).* | 2026-06-26 |
| D23 | Métodos de pago | Se muestran **todos**, pero el local **activa/desactiva** cuáles usar y configura su **número/llave/link**. En **efectivo** se pregunta "¿con cuánto paga?" (para el cambio). *Reutilizar lógica de Krusty.* | 2026-06-26 |
| D24 | Tipo de entrega | El cliente elige **Domicilio** o **Recoger en el local** (recoger = sin cobro de domicilio). | 2026-06-26 |
| D25 | Fuera de horario | El cliente **ve el menú** pero con aviso "fuera de horario de atención" y **no puede pedir**. | 2026-06-26 |
| D26 | Panel del local | **Modo administrador dentro de la misma app**, al iniciar sesión con el correo del local. El local ve **sus propias métricas**. Los **clientes pueden registrarse opcionalmente** (no obligatorio) y eso les da beneficios. *(Refina D12: login opcional con ventajas.)* | 2026-06-26 |
| D27 | Fotos | Cada producto con **foto**, almacenadas en **Firebase Storage (plan Blaze)**, comprimidas. *Reutilizar `imageCompressor` de Krusty.* | 2026-06-26 |
| D28 | Plano técnico base | **La app de Krusty Burger es el plano validado de un local.** ZEVEN v1 = generalizar Krusty a **multi-local**, **quitándole**: sellos/lealtad, seguimiento de estados del pedido, premios y reclamos (ZEVEN termina al enviar a WhatsApp). | 2026-06-26 |
| D29 | Base de código | ZEVEN se crea **limpio** (multi-local desde el diseño), **trasplantando las piezas probadas de Krusty** (motor de productos, cobro de domicilio, ubicación GPS, generador de WhatsApp, compresor de imágenes). NO se forkea Krusty tal cual. | 2026-06-26 |
| D30 | Estructura Firebase | **Un solo proyecto Firebase.** Colección `locales/{localId}` con campos (nombre, slug, whatsapp, tema, horario, métodos de pago, config domicilio, suscripción) y subcolecciones `productos/` y `pedidos/` (registro anónimo para métricas). Link de cada local por **slug**. | 2026-06-26 |
| D31 | Candado por link | El campo `suscripción` del local decide: si NO paga, solo accesible por su link directo; si paga, aparece además en el explorador. | 2026-06-26 |
| D32 | ⛔ PRINCIPIO RECTOR — Costos Firebase | **Mantener los costos de Firebase casi en cero al arranque.** Es un criterio de diseño **NO negociable**: cachear menús, minimizar lecturas, comprimir fotos, evitar listeners innecesarios, vigilar el consumo. Camilo NO quiere pagar de su bolsillo mientras el proyecto no sea rentable. | 2026-06-26 |
| D33 | Infra real desde el día 1 | **Nada de demo desechable.** Se construye directo sobre **cuentas reales** (GitHub, Firebase, Vercel) para no duplicar trabajo. Esto exige **definir el nombre primero** (para nombrar repo, proyecto y dominio). → ver Checklist de Preparación. | 2026-06-26 |
| D34 | 🎉 Nombre de marca | La app se llama **APPETIC** (de "appetite/apetito"). Logo ya creado: `assets/brand/appetic-logo.png` — "A" con tenedor integrado, naranja degradado con mordisco. Personalidad: **cercana de barrio + moderna y minimalista**. (ZEVEN queda como estudio paraguas, no es el nombre de esta app). | 2026-06-26 |
| D35 | Identidad visual base | Color primario **naranja** (apetito), estética limpia/minimalista. Paleta exacta y tipografía: se derivan del logo en la fase de diseño. | 2026-06-26 |
| D36 | ⛔ Sin demos — app completa | **NO se entregan demos ni versiones de prueba al usuario/local.** Se construye la app **completa y funcional** (toda la Capa 1, pulida) y se implementa cuando esté lista. La división en etapas es **solo interna de desarrollo**; de cara al local, lo que ve "ya quedó". | 2026-06-26 |
| D37 | Capa 2 sigue siendo posterior | Aunque la app se entregue "completa", el **explorador + búsqueda + suscripción (Capa 2)** se mantienen para después: no pueden funcionar sin tráfico. "Completa y funcional" = Capa 1 entera (menú, carrito, checkout, panel, kit del local). | 2026-06-26 |
| D38 | Local piloto | Camilo **ya tiene un local en mente**; el siguiente paso comercial es **hablar con él** para conseguir su menú e info (formulario de intake). | 2026-06-26 |
| D39 | Entrega estándar (Kit de Bienvenida) | A cada local se le entrega **siempre el Kit completo (A+B+C+D)**: link, QR, acceso al panel, plantillas de WhatsApp, artes de Instagram, QR impreso, tarjeta de empaque y mini guía. **Producción manual por local** (con skills de imagen). Detalle en §7. | 2026-06-26 |
| D40 | Formulario de intake | Antes de montar un local se le pide SIEMPRE lo mismo: logo, fotos, menú con precios, WhatsApp, horario, zonas+precios de domicilio, métodos de pago (llaves/números), preferencia de colores. Detalle en §7. | 2026-06-26 |

---

## 3. Preguntas abiertas

> Cosas que decidimos "resolver después" para no perderlas.

- **Nombre de marca:** aún no hay. Camilo quiere ideas buenas. → Se trabaja en la fase de Branding.
- **Precio exacto de la suscripción:** pendiente. Solo se definió que será "suave/leve".
- **Automatización / escala:** por ahora todo manual (montar menús, alta de locales). Se revisa solo si el proyecto despega.
- **Detalles del radio GPS del explorador:** cuántos km, cómo se calcula, qué pasa si no hay locales cerca. Es de la capa 2 (explorador), se afina más adelante.
- **Pasarela de pago para cobrar la suscripción** (Wompi/MercadoPago/etc.): pendiente, es de la capa 2.
- **Formato de la "ubicación" en el checkout:** ¿dirección escrita a mano, o pin en mapa con GPS? (Importante porque se conecta con el cobro de domicilio por zonas). → Fase 3.
- **Métodos de pago a listar en el checkout** (efectivo, transferencia, Nequi…): por definir. → Fase 3.
- **Qué pasa fuera del horario:** ¿se ve el menú pero no deja pedir, o se oculta? → ✅ Resuelto en D25.
- **Beneficios del cliente registrado:** ¿qué gana exactamente al registrarse? (ej. dirección guardada, historial, favoritos). → Por definir.
- **Multi-tenant en Firebase:** ¿un solo proyecto Firebase con los datos separados por local? ¿cómo? → Fase 4.
- **¿Reutilizar el código de Krusty (fork) o empezar limpio con sus patrones?** → Fase 4.

---

## 4. CUESTIONARIO — Fase 1

> Decisiones grandes. Responde por número, con la profundidad que quieras. "No sé todavía" es una respuesta válida — la marcamos como pendiente.
> 👉 = recomendación de Claude.

### Faceta A — Qué ES la app (alcance del producto)

**A1.** ¿La app es solo **vitrina** (el cliente ve el menú y ya; si quiere, pide aparte por WhatsApp/en el local), o es **transaccional** (el cliente arma carrito y *pide/paga dentro de la app*, como Rappi)?
👉 *Recomendación: arrancar como vitrina + botón de pedido por WhatsApp. El carrito/pago/domicilios es otro universo de complejidad y costos.*

**✍️ Tu respuesta:**NO, es un menu funcional con su propio carrito (el carrito es individual por cada local) ya cuando arme su menu llega al whatsapp del local con un mensaje junto con toda la informacion, como ubicacion, pedido etc... ahi ya finaliza la interaccion con nuestra app

---

**A2.** Si en algún momento hay pedidos: ¿quién hace el **domicilio**? ¿El negocio con su propio domiciliario, o nosotros montamos logística?

**✍️ Tu respuesta:**

El negocio con su propio domiciliario nosotros terminamos justo al llegar al whatsapp del local
---

**A3.** ¿Es solo **comida**, o cualquier **negocio del barrio** (barbería, tienda, postres, ferretería)?

**✍️ Tu respuesta:** 

Solo comida!!


---

### Faceta B — El territorio

**B1.** ¿Qué es "**el barrio**"? ¿Un barrio real, una ciudad, varias ciudades? ¿Cómo se decide qué negocios le salen a un cliente: por **GPS/radio**, por **zonas** definidas por nosotros, o todo junto sin filtro geográfico al principio?

**✍️ Tu respuesta:** Va a salir en un radio de donde se conecte el cliente 


---

**B2.** ¿En qué **ciudad/país** arrancas? (Para definir pagos, moneda, competencia).

**✍️ Tu respuesta:**

Solo va a ser en Bogota, colombia


---

### Faceta C — Modelo de negocio y arranque

**C1.** Sobre el huevo y la gallina: ¿cómo imaginas **conseguir los primeros negocios y los primeros clientes**?

**✍️ Tu respuesta:**

Hablando con el local diciendole que le vamos a crear un menu virtual gratis y que ya lo empiece a usar es decir que ahora todos sus domicilios los pidan por la app por ejemplo un mensaje automatico que al ingresar los envia al link dentro de la app la gente ve su menu hace su pedido y vuelve al whatsapp con toda la info
---

**C2.** La suscripción: ¿idea de **precio**? ¿Un solo plan o varios niveles (ej. básico/destacado)? Aunque sea un número al aire.

**✍️ Tu respuesta:** 

Por ahora una suscripcion suave y leve solo para aparecer en la app y que lo encuentren otros locales


---

**C3.** ¿Por qué un negocio te pagaría a TI y no usaría **gratis Instagram, Google Maps/Mi Negocio, o el catálogo de WhatsApp Business**? ¿Cuál es tu "esto no lo tienes en otro lado"?

**✍️ Tu respuesta:**

Porque la gente en estos momentos no entra a instagram para buscar negocios locales del barrio la gente tiene el numero y escribe y pide el menu, y si de a pocos se va haciendo a la idea de que ahi dentro estan todos los locales del barrio pues la hicimos

---

### Faceta D — Personalización ("su propio mundo")

**D1.** "Su propio mundo, su estética, sus colores": ¿imaginas **plantillas** que el negocio personaliza (colores, logo, fondo, tipografía), o **libertad total** de diseño?
👉 *Recomendación: plantillas con buen nivel de personalización. La "libertad total" es años de desarrollo y casi nadie del barrio sabría usarla.*

**✍️ Tu respuesta:**

No, nosotros vamos a crear todos los menus entonces desde aca con codigo vamos creando el menu del local personalizado, que si tenga ya bases pero que se personalice a las necesidades del local por ahora la idea es unos 10 ya luego vamos viendo a quien mas metemos

---

**D2.** "Que el cliente navegue entre opciones": ¿te refieres a navegar por categorías dentro de UN negocio (entradas, platos, bebidas), o a **saltar de un negocio a otro** dentro de la app?

**✍️ Tu respuesta:**


NO Se, osea como que la gente busque hamburguesa y les salga todos los locales que manejan hamburguesas (y que pagaron o que entraron mediante ese link)
---

### Faceta E — Administración y mantenimiento

**E1.** Dijiste "**nosotros ayudamos a crear** el menú". ¿Eso es para siempre (montamos cada menú a mano) o solo el primer empujón y luego el negocio se autogestiona?
⚠️ *Ojo: montar cada menú a mano no escala. Con 200 negocios te vuelves esclavo del soporte.*

**✍️ Tu respuesta:**

Pues es un proyecto pequeño aun no quiero pensarlo a escala porque no se si vaya a funcionar prefiero hacerlo manual por ahora y si estalla la idea pues ahi si lo automatizamos

---

**E2.** ¿De acuerdo con que hay **tres roles**? (1) cliente que explora, (2) negocio que edita su menú y ve su suscripción, (3) nosotros (panel interno para cobrar, aprobar, activar visibilidad). ¿Lo ves igual o distinto?

**✍️ Tu respuesta:**

Si tal cual asi lo necesito es perfecto, que el cliente con un correo que asignemos a ese local entre y modifique precios y cosas activas es decir nosotros sentamos las bases pero de ahi para alla el cliente mira como usarlo agregando productos nuevos o editando los suyos
---

### Faceta F — Realidades técnicas y de recursos

**F1.** ¿**PWA instalable** (web que se instala en el celu, más barata y rápida de iterar) o app **nativa en Play Store / App Store**?
👉 *Recomendación: PWA. Ya tienes skills de PWA, login con Google y Firebase; encaja perfecto.*

**✍️ Tu respuesta:**

PWA queda perfecta 

---

**F2.** ¿Quién va a **construir** esto y con cuánto tiempo/presupuesto? (¿Tú solo con Claude? ¿Noches y fines de semana o tiempo completo?).

**✍️ Tu respuesta:**

Yo con claude en mi tiempo libre que es bastante 
---

**F3.** El **nombre**: la carpeta dice "ZEVEN". ¿Es el nombre oficial de la marca o provisional?

**✍️ Tu respuesta:**

NO tengo nombre de marca aun necesito ideas pero buenas entonces aun esta en veremos 

---

## 4.B. CUESTIONARIO — Fase 2 (Experiencia del cliente + estructura del menú)

> Ahora bajamos un nivel de detalle. Arrancamos resolviendo las 3 tensiones que salieron de la Fase 1, y luego definimos cómo se ve y funciona el menú para el cliente.
> 👉 = recomendación de Claude. Responde debajo de cada **✍️ Tu respuesta:**.

### Faceta G — Acceso del cliente (las 3 tensiones a resolver) 🔴

**G1. Login (la más importante).** Cuando un cliente abre el link de un local, ¿qué necesita para ver el menú y pedir?
- (a) **Sin cuenta**: ve el menú y arma el pedido sin loguearse. El login con Google es **opcional** y solo sirve para guardar favoritos/historial.
- (b) **Con cuenta obligatoria**: debe iniciar sesión con Google antes de ver/pedir.
👉 *Recomendación fuerte: opción (a). Obligar login antes de ver el menú mata la conversión del flujo "pido mi almuerzo rápido".*

**✍️ Tu respuesta:** Entonces dejemosla sin login por ahora pero si quiero como un contador para el registro para saber cuantos enviaron pedido por whatsapp y cuanta plata significo eso


---

**G2. Qué ve el cliente al entrar por el link de un local.**
- (a) **Solo ese local** (su menú es como una página propia; no ve a nadie más).
- (b) **Entra a "la app"** con su shell (buscador, explorador), pero por ahora solo ve ese local + los que pagan.
👉 *Recomendación: (a) para la v1 (la cuña). El explorador (b) es la capa 2. Construir primero la página de menú individual perfecta.*

**✍️ Tu respuesta:** Quiero que al entrar vean la app pero con el local de primeras es decir el banner de el local y un popup que diga instalar app ya la proxima que entren si no es por el link del cliente no ban a encontrar ese restaurante a menos que pague 


---

**G3. El "desbloqueo" por link.** Si un cliente entró por el link de un local, ¿ese local le queda guardado/visible después?
- (a) **Solo durante esa visita** (no se guarda nada).
- (b) **Se guarda** para que lo vuelva a encontrar fácil (requiere algo de cuenta o memoria del dispositivo).
*(Tu respuesta depende mucho de G1).*

**✍️ Tu respuesta:** solo por ese link queda habilitado


---

### Faceta H — Estructura del menú y del pedido

**H1. Anatomía de un producto.** ¿Qué tiene cada producto del menú? Marca lo que aplique y agrega lo que falte:
- [ ] Nombre
- [ ] Foto
- [ ] Precio
- [ ] Descripción
- [ ] Categoría (entradas, hamburguesas, bebidas…)
- [ ] Disponible sí/no (para agotados)
- [ ] **Variantes/tamaños** (ej. personal / mediana / familiar con distinto precio)
- [ ] **Adicionales/toppings** (ej. +queso, +tocineta con costo extra)
- [ ] Otro: ___

**✍️ Tu respuesta:** Cada menu toca hacerlo personalizado porque hay menus que son simples como otros complejos con combos y etc entonces toca analizar cada caso pero que el flujo sea el mismo entra al banner del local o llega al local pide en el menu (Como sea que vaya al final es solo texto) y desde el carrito le da en pedir y ya llega al whatsapp del cliente 


---

**H2. El carrito.** ¿Permite cantidades por producto? ¿Permite **nota** por producto (ej. "sin cebolla") y/o una nota general del pedido?

**✍️ Tu respuesta:** Si el carrito debe ser muy completo pedido con indicaciones y con cantidades para cada menu 


---

**H3. Qué viaja al WhatsApp del local.** El mensaje automático que llega al local, ¿qué debe incluir? Marca/edita:
- [ ] Lista de productos con cantidades y precios
- [ ] Subtotal / total
- [ ] Nombre del cliente
- [ ] Dirección de entrega
- [ ] Teléfono del cliente
- [ ] Método de pago elegido (efectivo, transferencia…)
- [ ] Notas del pedido
- **Pregunta clave:** ¿la **dirección y datos del cliente** se piden DENTRO de la app antes de enviar, o se dejan para que el local los pregunte por WhatsApp?
👉 *Recomendación: pedir lo mínimo en la app (nombre, dirección, pago) para que el mensaje llegue listo y el local solo confirme.*

**✍️ Tu respuesta:** al local le llega todo el menu de lo que pidio el cliente con su nombre y con su pedido y ubicacion, metodo de pago todo el cliente ya solo confirma y listo 


---

**H4. Reglas del local.** ¿El menú maneja…?
- [ ] **Horario** (abierto/cerrado, y qué pasa si piden cerrado)
- [ ] **Costo de domicilio** (fijo, por zona, o lo dice el local por WhatsApp)
- [ ] **Pedido mínimo**
- [ ] Otro: ___

**✍️ Tu respuesta:**
Si que maneje horario y el costo lo quiero hacer como lo hice en la app de krusty burguer que el local ponga sus precios en base a su radio de amplitud

---

### Faceta I — "Su propio mundo" (personalización del local)

**I1. Qué se personaliza por local.** ¿Qué hace que cada menú se sienta "su propio mundo"? Marca/edita:
- [ ] Logo
- [ ] Colores (primario/secundario)
- [ ] Portada/banner
- [ ] Tipografía
- [ ] Foto o fondo propio
- [ ] Otro: ___

**✍️ Tu respuesta:**

Todo que cambie la estetica de la app y se adapte al local que se esta mirando

---

**I2. El panel del local (cómo edita).** El local entra con su correo asignado. ¿Qué debe poder hacer ÉL solo, sin nosotros?
- [ SI  ] Cambiar precios
- [ SI ] Marcar agotado / disponible
- [ SI ] Agregar / editar / borrar productos
- [ SI ] Cambiar fotos
- [ SI ] Cambiar horario
- [ NO ] Editar diseño/colores *(o eso lo dejamos solo a nosotros)*
- [ ] Otro: ___

**✍️ Tu respuesta:**


---

## 4.C. CUESTIONARIO — Fase 3 (El motor del menú + checkout + panel del local)

> Aquí definimos el **corazón técnico de la v1**: cómo un mismo motor muestra menús simples y complejos, cómo es el checkout exacto, y qué ve/edita el local. Esto es lo último antes de poder diseñar la base de datos.
> 👉 = recomendación de Claude. Responde debajo de cada **✍️ Tu respuesta:**.

### Faceta J — El motor de menú flexible (resuelve la tensión H1 vs I2) 🔴

> Idea: en vez de programar cada menú a mano, hacemos UN motor que arma cualquier menú a partir de "piezas". Así el local edita contenido y nosotros configuramos el diseño. Necesito validar las piezas.

**J1.** ¿Confirmas la separación **"nosotros = diseño/estructura, local = contenido"** (tabla D18)? ¿O hay algo del diseño que sí quieras que el local pueda tocar?

**✍️ Tu respuesta:**

Si me parece excelente asi pero el primer menu nosotros lo tenemos que montar igual en el menu que envien basamos las arquitectura y lo que el va a modificar la idea es si se puede automatizar mejor si no se crea una nueva forma de menu para algo que maneje diferente pero ya quedo el sistema con ese metodo aprendido asi cada menu ya se va haciendo mas facil porque reusamos los creador es mas mejor crear un solo sistema unico pero que dependiendo el local use algunas herramientas u otras asi no tenemos 20 menus diferentes (hablando de codigo) si no uno con funciones actividas o desactivadas dependiendo de el lcoal
---

**J2. Las "piezas" de un producto.** Para cubrir desde lo simple hasta combos, propongo que un producto pueda tener (opcionalmente):
- **Variantes / tamaños:** ej. Personal $X / Mediana $Y / Familiar $Z (elige una, cambia el precio).
- **Adicionales / extras:** ej. +queso $2, +tocineta $3 (elige varios, suman al precio).
- **Grupos de elección (combos):** ej. "elige tu bebida" / "elige 2 de 5 acompañamientos".
¿Estas 3 piezas cubren todos los menús que tienes en mente, o se te ocurre algún caso que no encaje?

**✍️ Tu respuesta:** Toca cuando quiero yo agregar un menu nuevo ver que encaja y que no encaja como explique en el punto anterior 


---

**J3.** ¿El local debería poder **crear esas piezas él mismo** (definir un combo nuevo, agregar un tamaño) desde su panel, o eso lo configuramos nosotros y el local solo cambia precios/fotos/disponibilidad de lo que ya existe?
👉 *Recomendación: en v1, nosotros configuramos la estructura (combos, variantes); el local solo edita valores. Darle al local un "constructor de combos" es mucha complejidad para empezar.*

**✍️ Tu respuesta:**

Toca mirarlo luego dependiendo cada menu asi quedara configurado lo que el puede editar y lo que no 

---

### Faceta K — El checkout exacto (lo que pasa al dar "Pedir")

**K1. La ubicación.** Cuando el cliente va a pedir domicilio, ¿cómo da su ubicación?
- (a) **La escribe** a mano (dirección en texto).
- (b) **Pin en un mapa** (GPS) → más preciso y se conecta con el cobro por zonas.
- (c) Las dos.
👉 *Nota: si el domicilio se cobra por zonas/radio (D16), el mapa (b) hace ese cálculo automático; el texto solo no.*

**✍️ Tu respuesta:**

Con un boton que diga optener ubicacion asi lo tengo en la app de krusty ( la puedes analizar para referencias ) y es necesario para saber el precio del domicilio


---

**K2. Métodos de pago a mostrar.** ¿Cuáles listamos en el checkout? (marca/edita)
- [ ] Efectivo
- [ ] Transferencia / Nequi
- [ ] Daviplata
- [ ] Datáfono al recibir
- [ ] Otro: ___

**✍️ Tu respuesta:**

Meter todos los metodos de pago pero ya el cliente los edita desde su panel si lo quiere meter o no y cual es el numero la llave o el link si es efectivo si que se coloque con cuanto se paga


---

**K3. ¿Pedido para domicilio o también para recoger/mesa?** ¿El cliente elige "domicilio" vs "recoger en el local"? (Eso cambia si pedimos dirección o no).

**✍️ Tu respuesta:**

Si me parece que ponga recojo en el local y asi no se le sume el valor del domiciliario

---

**K4. Fuera de horario.** Si el local está cerrado, ¿el cliente…?
- (a) Ve el menú pero **no puede pedir** (botón desactivado + aviso "abre a las X").
- (b) Puede pedir igual (el local responde cuando abra).
- (c) No ve el local.

**✍️ Tu respuesta:**

Ve el menu pero dise que no esta en horario de atencion aun y no puede pedir nada

---

**K5. El cobro de domicilio por zonas (estilo "Krusty Burguer").** Cuéntame en tus palabras cómo funcionaba ahí: ¿el local define zonas/anillos con un precio cada uno? ¿Cómo se decide en qué zona cae el cliente?

**✍️ Tu respuesta:**

Analiza la app esta en la carpeta de Zeven asi entiendes las referencias 

---

### Faceta L — El panel del local (a detalle)

**L1.** Ya sabemos QUÉ edita el local (D9/I2). Ahora el CÓMO: ¿imaginas el panel **dentro de la misma app** (el local entra con su correo y ve un modo "administrador"), o una **pantalla/web aparte** solo para locales?
👉 *Recomendación: dentro de la misma app, con un "modo administrador" que aparece al iniciar sesión con el correo del local. Menos cosas que mantener.*

**✍️ Tu respuesta:**

Si al ingresar con el correo ya entra en modo admin, igual que los clientes se puedan registrar aunque no sea obligatrorio pero si tiene ventajas 
---

**L2.** ¿El local necesita ver sus **propias métricas** (cuántos pedidos le entraron, cuánto suman) dentro de su panel, o esas métricas son solo para nosotros por ahora?

**✍️ Tu respuesta:**

Si que tengan sus propias metricas

---

**L3.** ¿Habrá **fotos** de cada producto siempre, o algunos menús son solo texto (nombre + precio)? (Afecta cuánto "pesa" la app y cómo se ve).

**✍️ Tu respuesta:**

Fotos pero todas dentro del plan blaze de firebase

---

## 4.D. CUESTIONARIO — Fase 4 (Arquitectura técnica + multi-tenant)

> Cambio de formato: como esto es técnico, **yo (Claude) propongo** y tú solo **validas o corriges**. No necesitas saber de código; solo dime si el rumbo te late. Marca ✅ / ❌ / o comenta.

### Faceta M — ¿Reutilizar Krusty o empezar limpio? 🔴

**M1.** Mi propuesta: **NO partir de cero ni forkear Krusty tal cual.** Krusty está hecho para UN restaurante; ZEVEN es multi-local, así que copiarlo entero arrastraría supuestos equivocados. Propongo:
- **Crear ZEVEN limpio**, pero **trasplantando las piezas ya probadas de Krusty** (motor de productos, cobro de domicilio, ubicación GPS, generador de WhatsApp, compresor de imágenes), adaptándolas a multi-local.
- Así aprovechamos lo probado sin heredar la deuda de lo que no aplica (sellos, estados de pedido, etc.).

**✍️ ¿Lo apruebas? (✅/❌/comentario):**

SI APRUEBO


---

### Faceta N — Cómo se separan los locales en Firebase

**N1.** Mi propuesta: **un solo proyecto Firebase** para todo ZEVEN. Cada local es un documento en una colección `locales`, y sus productos/config cuelgan de ahí. Algo así:

```
locales/{localId}
   ├── nombre, slug (para el link), whatsapp, tema (colores/logo/banner),
   │   horario, métodos de pago activos, config de domicilio, pagó-suscripción (sí/no)
   ├── productos/{productoId}   → nombre, precio, foto, categoría, disponible,
   │                              variantes[], adicionales[], combos[]
   └── pedidos/{pedidoId}       → registro anónimo para métricas (qué, cuánto, cuándo)
```

El link de cada local sería tipo `zeven.app/nombre-del-local` (usando el `slug`).

**✍️ ¿Lo apruebas? (✅/❌/comentario):**

Si me parece como veas mejor 


---

**N2.** El **candado por link** (D13): un local que NO paga, su `localId` solo es accesible si llegas con su link directo; nunca aparece en el explorador. Un local que paga, aparece también en el explorador. Esto se controla con el campo `pagó-suscripción`.

**✍️ ¿Lo apruebas? (✅/❌/comentario):**

Si aprobado


---

### Faceta O — Costos de Firebase (realidad económica)

**O1.** Heads-up honesto: el plan **Blaze es de pago por uso**. Con pocos locales y tráfico normal, suele costar **centavos o caer en la capa gratis**. Pero hay que cuidar dos cosas que disparan costos: (1) **lecturas** mal optimizadas, y (2) **almacenamiento/descarga de fotos**. Lo tendré en cuenta en el diseño (cachear menús, comprimir fotos). ¿Te sirve que yo vigile esto activamente y te avise si algo se vuelve caro?

**✍️ Tu respuesta:**

SUPER IMPORTANTE NO DEJAR QUE SE DISPAREN COSTOS DE FIREBASE AL COMIENZO SERA POCO RENTABLE Y NO QUIERO ANTES PAGAR YO

---

**O2.** ¿Tienes ya un **proyecto de Firebase** creado para ZEVEN, o lo creamos cuando llegue el momento de programar? (Solo para saber; no hay que hacerlo aún).

**✍️ Tu respuesta:**

MEJOR TENER YA UN APARTADO DE PLANO QUE ME DIGA QUE HACER ANTES DE EMPEZAR CON EL CODIGO ASI NO CREAMOS DOBLE CODIGO DE DEMO SI NO YA CON CUENTAS REALES COMO GITHUB, FIREBASE, VERCEL 

---

## 4.E. CUESTIONARIO — Fase 5 (Nombre + Identidad)

> Esto se adelantó porque el **nombre desbloquea el setup real** (D33): sin nombre no podemos crear repo, proyecto de Firebase ni dominio. "ZEVEN" parece ser tu **estudio/marca paraguas** (Beats ZEVEN, etc.), así que esta app necesita **su propio nombre**.

**P1. Personalidad de la marca.** ¿Cómo quieres que se sienta? (marca/edita)
- [ X ] Cercana y de barrio (calidez, familiar)
- [ X ] Moderna y minimalista (limpia, tech)
- [ ] Divertida y juvenil (colorida, emojis)
- [ ] Antojadora / sabrosa (que dé hambre)
- [ ] Otro: ___

**✍️ Tu respuesta:**


---

**P2. Lluvia de nombres (mis propuestas).** Pensados para Bogotá, fáciles de decir, cortos y con buena pinta. Dime cuáles te laten (o si ya tienes uno tuyo):

| Nombre | Por qué funciona |
|---|---|
| **Cuadra** | "Pide en tu Cuadra". Muy colombiano (la cuadra = tu zona), corto, memorable. |
| **Antojo** / **Antojado** | Va directo al hambre/deseo. Muy food-forward y local. |
| **Ñam** | Súper corto, sonoro, divertido, fácil de recordar. |
| **Pica** / **Picao** | "¿Qué pica hoy?" Coloquial, con energía. |
| **Sazón** | Evoca comida casera/sabrosa del barrio. |
| **Vecino** | Juega con lo local y la confianza ("pide al Vecino"). |
| **Menú** + algo (ej. **Menúa**, **Menri**) | Conecta directo con "menú digital". |

**✍️ ¿Cuáles te gustan? ¿Alguno propio?:**

Ya tengo la app se va a llamar Appetic "C:\Users\Sinfi\Downloads\APPETIC_sticker.png" Ahi esta en logo para que lo guardes en algun lado


---

**P3.** ¿Quieres que te genere **logos de prueba** con IA (tengo skill para eso) una vez elijamos 1–2 nombres finalistas?

**✍️ Tu respuesta:**


---

## 4.F. CUESTIONARIO — Fase 6 (Recorte de la v1: el MVP)

> Última fase antes de programar. Objetivo: definir el **mínimo** que demuestra valor con **1 local piloto real**, para no construir 50 cosas y quemarnos. Yo propongo el recorte; tú apruebas o ajustas.

**Q1. El piloto.** ¿Tienes ya en mente **un local real** (idealmente conocido tuyo, que confíe) para ser el **primero**? Arrancar con uno solo y real vale más que 10 imaginarios.

**✍️ Tu respuesta:**

SI YA TENGO UNO EN MENTE SOLO TOCA HABLAR CON EL 
---

**Q2. Propuesta de alcance del MVP (v1).** Propongo que la **primera versión** tenga SOLO esto:

**SÍ entra en la v1:**
- 1 local (el piloto), montado por nosotros, con su tema/estética.
- Menú con categorías + productos (con foto, precio, disponible/agotado).
- Las "piezas" que ese local necesite (variantes / adicionales / combos — solo las que use).
- Carrito con cantidades + notas.
- Checkout: domicilio (con GPS + cobro por zonas) o recoger en local + métodos de pago + envío a WhatsApp.
- Horario (abierto/cerrado).
- Panel del local (editar productos, precios, fotos, disponible, horario).
- Registro anónimo de pedidos para métricas (las tuyas y las del local).
- PWA instalable.

**NO entra en la v1 (queda para después):**
- Explorador del barrio / búsqueda por comida.
- Suscripción y cobro a locales.
- Login de clientes con beneficios.
- Multi-local visible (aunque la base de datos ya lo soporte, mostramos solo el piloto).

**✍️ ¿Apruebas este recorte? (✅/❌/ajustes):**

NO YO QUIERO LA APP FINAL PARA EMPEZARLA A USAR COMO TU LA DIVIDAS ME DA IGUAL PERO LA QUIERO IMPLEMENTAR CUANDO YA ESTE COMPLETA Y FUNCIONAL

---

**Q3. Definición de "éxito" del piloto.** ¿Qué tendría que pasar para decir "esto funciona, sigamos"? (ej. que el local mande X domicilios por la app en 2 semanas, que le guste al dueño, etc.)

**✍️ Tu respuesta:**

TODO TOCA IRLO PROBANDO PERO NO QUIERO VERSIONES DE PRUEBA NI DEMOS SI NO ESTO YA QUEDO SIGUIENTE PANTALLA O APARTADO NO SE ASI
---

## 5. Próximas fases

> (Se irán abriendo a medida que cerremos la anterior.)

- ✅ **Fase 1** — Decisiones grandes. *Completada.*
- ✅ **Fase 2** — Experiencia del cliente + estructura del menú. *Completada.*
- ✅ **Fase 3** — Motor del menú + checkout + panel del local. *Completada.*
- ✅ **Fase 4** — Arquitectura técnica + multi-tenant. *Completada.*
- ✅ **Fase 5** — Nombre + identidad. *Completada → **APPETIC**.*
- ✅ **Fase 6** — Alcance v1 + local piloto + Kit de Bienvenida. *Completada.*
- ✅ **Checklist de Preparación** (sección 6) — cuentas reales listas (GitHub, Firebase, Vercel).
- ✅ **Capa 1 PROGRAMADA Y EN VIVO** — menú, carrito, checkout, panel del local, métricas, PWA.
- 🔵 **Fase 7 / Capa 2 — EN CONSTRUCCIÓN** — explorador, login por roles, suscripción.
  - ✅ Ya hecho: login con roles (`/cuenta`), buscador en el inicio, panel de superadmin (`/superadmin`), perfil del cliente (datos guardados/prellenados).
  - ⏳ Falta: filtro por GPS/radio en el buscador, cobro real de la suscripción (pasarela), beneficios extra del cliente, Kit de Bienvenida.
  - 👉 **Detalle accionable en §8.**

---

## 6. 🚀 Checklist de Preparación (antes de la primera línea de código)

> Pedido en O2: dejar listo el "qué hacer antes de programar" para construir sobre **cuentas reales** (no demo desechable).
> 📄 **Guía paso a paso detallada:** ver `GUIA-SETUP-CUENTAS.md`.
> ⛔ Recordatorio permanente: **vigilar costos de Firebase** (D32) en cada paso.

- [x] **Nombre** elegido → **APPETIC**.
- [x] **Repositorio en GitHub** creado → `jostivtrb-create/appetic` (privado).
- [x] **Proyecto en Firebase** creado → `appetic-17477`:
  - [x] Authentication con Google.
  - [x] Firestore (región `southamerica-east1`).
  - [x] Storage (fotos de productos).
  - [x] Plan **Blaze** con **alertas de presupuesto** configuradas.
- [x] **firebaseConfig** obtenido (lo migramos a `.env` al programar).
- [ ] ⏳ **Proyecto en Vercel** — *aplazado: se hace cuando haya código en `main`.*
- [ ] ⏳ **Dominio** — *aplazado: arrancamos con `appetic.vercel.app` (sin costo).*
- [x] **Logo** de Appetic (`assets/brand/appetic-logo.png`).
- [ ] Definir el **slug/estructura de links** de los locales → se define al programar.
- [ ] (Opcional) Reunir el **menú real del primer local piloto** para montarlo de una.

---

## 7. 📦 Kit de Bienvenida del Local (entregable estándar)

> Lo que SIEMPRE se le entrega a cada local. Regla de oro: **todo el kit existe para meter a los clientes del local al link.** Producción **manual por local** (con skills de imagen). Kit **completo (A+B+C+D)**.

### A. Lo esencial (digital)
- **Link único** del menú → `appetic.app/su-negocio` (slug).
- **Código QR** del link (alta resolución, para imprimir).
- **Acceso al panel**: correo asignado + instrucciones de ingreso (modo admin).

### B. Para que el local jale a SUS clientes (lo más importante)
- **Plantilla de respuesta automática de WhatsApp Business** (el truco de oro: cada "¿menú?" responde con el link).
- **Mensaje de difusión / broadcast** para avisar a su lista de clientes.
- **Arte/sticker para historias** de Instagram/WhatsApp ("Pide por aquí 👇") con su link.
- **Texto + link para la bio** de Instagram/Facebook.

### C. Para el mundo físico
- **QR impreso** para mesas, vitrina, caja y **empaques de domicilio**.
- **Tarjeta/sticker dentro del domicilio**: "¿Te gustó? Vuelve a pedir, escanea aquí 🧡".

### D. Soporte
- **Mini guía de uso del panel** (cambiar precios, marcar agotado, etc.). *Formato (PDF 1 página vs video): pendiente.*

---

### 📝 Formulario de Intake (lo que le pedimos SIEMPRE al local antes de montarlo)
- [ ] Logo (mejor calidad posible)
- [ ] Fotos de los productos
- [ ] Menú completo con precios
- [ ] Número de WhatsApp para pedidos
- [ ] Horario de atención
- [ ] Zonas y precios de domicilio (o punto de referencia para calcular por GPS)
- [ ] Métodos de pago que acepta (con llaves/números/links: Nequi, etc.)
- [ ] Preferencia de colores / estética (o libertad para que decidamos nosotros)

---

### ✍️ Plantillas de mensajes (borrador, se pulen luego)

**🤖 Respuesta automática de WhatsApp del local:**
> ¡Hola! 👋 Gracias por escribir a **[Local]**. Mira nuestro menú completo con fotos y pide en segundos aquí 👇
> 🍔 **[link]**
> Armas tu pedido y te llega aquí mismo para confirmarte. ¡Buen provecho! 🧡

**📢 Mensaje para difundir a sus clientes:**
> ¡Novedad en **[Local]**! 🎉 Ahora ves nuestro menú con fotos y pides desde el celular, sin descargar nada 📱👉 **[link]**. Pídelo y te llega 🛵🧡

**🏷️ Tarjeta de empaque (texto):**
> ¿Disfrutaste tu pedido de **[Local]**? 🧡 Vuelve a pedir escaneando este código 👇 — más rápido, con fotos y a un toque.

---

## 8. 🔧 Pendientes y próximos pasos (estado real tras programar)

> Estado a **2026-06-27**. Capa 1 en vivo. Capa 2 a medio construir.

### 🌅 PARA MAÑANA (cuando esté en el PC) — acción de Camilo

- [ ] **Desplegar las reglas de Firestore** (¡importante! sin esto la Capa 2 nueva da "permiso denegado").
  Cambiamos `firestore.rules` para que: (a) el **superadmin** (jostivtrb@gmail.com) pueda activar/desactivar suscripciones, y (b) cada **cliente** guarde su perfil en `usuarios/{uid}`. Comando:
  ```
  firebase deploy --only firestore:rules
  ```
- [ ] **Re-sembrar el local piloto** para que salga en el buscador del inicio (ya tiene `suscripcion.activa: true` en el seed):
  ```
  node scripts/seed-local.mjs
  ```
  *(Alternativa: una vez desplegadas las reglas, activarlo a mano desde `/superadmin`.)*
- [ ] **Probar el flujo nuevo de punta a punta:** entrar a `/cuenta` con jostivtrb@gmail.com → ver el panel 👑 → activar/desactivar `burgerdemo` → confirmar que aparece/desaparece en el inicio. Probar también iniciar sesión como cliente y que se guarden los datos del checkout.

### 🛵 SIGUIENTE TAREA DE PRODUCTO (acordada para mañana)

- [ ] **Que el local configure sus tarifas de domicilio por radio desde su panel.**
  Hoy las tarifas por intervalos de 0.5 km (`domicilio.tarifas`) y el `maxKm` los configura Appetic en el seed; el motor de cobro ya funciona (`utils/delivery.js`). Falta una sección en `/:slug/admin` → Configuración para que el dueño edite esas tarifas y la distancia máxima él mismo (sin depender de nosotros).

### 🔵 CAPA 2 — lo que falta para completarla

- [ ] **Filtro por GPS / radio en el buscador del inicio** (D4/B1): hoy el inicio muestra *todos* los locales con suscripción; falta ordenarlos/filtrarlos por la distancia al cliente (reusar `utils/geo.js` Haversine).
- [ ] **Cobro real de la suscripción** (D6, pregunta abierta línea 130): hoy el superadmin activa/desactiva a mano. Falta definir **precio** y conectar una **pasarela** (Wompi/MercadoPago) para cobrarles a los locales. *Precio: aún "suave/leve", sin número.*
- [ ] **Beneficios del cliente registrado** (pregunta abierta línea 134): ya se guardan nombre/teléfono/dirección. Faltan extras como **favoritos** e **historial de pedidos**.
- [ ] **Kit de Bienvenida del local** (§7): producción manual (QR, plantillas de WhatsApp, artes de Instagram, tarjeta de empaque). Aún no se ha armado para ningún local.

### 🧹 DEUDAS TÉCNICAS (no urgentes, pero anotadas — ⛔ ojo costos D32)

- [ ] **Métricas del local** leen *toda* la subcolección `pedidos` cada vez (`adminLocal.js` → `obtenerMetricas`). Con mucho volumen sube el costo de lecturas; cambiar a un **contador incremental** si crece.
- [ ] **Regla de `pedidos`** permite crear casi libremente (vector de spam que infla métricas/costos). Endurecer validación (campos/tamaño) más adelante.
- [ ] **Autonomía del local en el panel:** hoy no edita desde su panel las tarifas de domicilio, los métodos de pago, ni los precios de adicionales/combos (solo precio base y tamaños). Es a propósito (D18), pero revisar cuánto darle.

### ✅ HECHO RECIENTEMENTE (2026-06-27)

- ✅ **PWA se actualiza sola** (sin desinstalar/reinstalar): registro del service worker + chequeo de versión periódico y al volver a la app.
- ✅ **Banner de instalación** bonito (vidrio esmerilado) con guía para iPhone; aparece en toda la app si no está instalada.
- ✅ **Bug horario:** fuera de horario el cliente ve el menú pero no puede pedir (antes no se aplicaba).
- ✅ **Bug foto:** la foto se guarda al *crear* un producto (antes solo al editar).
- ✅ **Capa 2 base:** login por roles (`/cuenta`), buscador en el inicio, panel de superadmin (`/superadmin`), perfil del cliente.
