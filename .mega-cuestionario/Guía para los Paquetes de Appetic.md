# Guía para los Paquetes de Appetic

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** cambiar los planes en escalera (Emprendedor, Comerciante, Empresario) por **paquetes** que cada negocio combina según lo que pide. Primero el contenido de cada paquete y después los precios.
- **Inicio:** 7 de noviembre de 2026
- **Estado:** 🔵 Fase A, propuesta por paquetes (D36) e Inventario (C3) hechos y probados en local, SIN publicar · siguen la fase B y lo que falta de la C
- **Proyecto:** `~/Apps Zeven/Swiftfly Solutions/Appetic` (app) y `web/appetic/` (propuesta)
- **Relacionada:** «Guía para las Mejoras frente a Loggro», cuya S5 dice que lo nuevo queda en Empresario mientras se definen los planes.

---

## 1. Objetivo

En sus palabras: *«sacarla por secciones, no por planes, porque cada negocio nos pide cosas diferentes; que cada cosa esté empaquetada en mini planes y uno los va agregando y arma un combo»*.

---

## 2. Decisiones CERRADAS

### Propuesta del usuario (7-nov, en el chat)

| # | Paquete | Qué trae (sus palabras) |
|---|---------|-------------------------|
| D1 | **Base** (la llevan todos) | Menú digital con fotos, sin domicilios; las fotos y el diseño del menú los montamos nosotros. Pedidos por WhatsApp solo para recoger. **Menú en Pantalla** (ya no se llama «TV»). Horario del local. Menú del día si es restaurante. Aparecer en el buscador. Soporte por WhatsApp. Notificaciones a los usuarios con la app descargada, sin saturar y en momentos estratégicos. |
| D2 | **Domicilios** | Panel de domiciliarios (ilimitados). Cálculo del costo del domicilio. Publicidad para domicilios: afiches con IA (Gemini). |
| D3 | **Contabilidad y registro** | Caja con sistema de cierre y cajero. Nómina y personal con turnos. Estadísticas de ventas. Ganancias. Conectar datáfono o cobro en línea, *«solo si de verdad se puede»*. |
| D4 | **Gestión** | Panel de cocina con comandas. Panel de meseros. Impresoras para tickets y comandas. Pedidos desde la mesa con QR. |
| D5 | **Inventario** | Gestión del inventario. Descuento automático por productos. Aviso de recarga. Panel de proveedores. |
| D6 | **El nombre «TV» se cambia por «Menú en Pantalla»** en la propuesta (y en la app, cuando se toque). | Al usuario no le gusta «TV». |

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| D7 | **Se cambian la propuesta y la app.** En la app, cada local tiene su lista de paquetes prendidos. | P1. |
| D8 | **La caja básica va en la Base** (vender, cobrar, historial del día). | P2. Sin eso, Salón vendería pedidos que nadie puede cobrar. |
| D9 | **Notificaciones a los clientes: las manda el dueño, máximo 3 por semana.** | P3, con su observación. |
| D10 | **«Personal con turnos» = el horario de la semana** (quién trabaja qué día y a qué hora). | P4. |
| D11 | **Gestión se parte en dos: Cocina** (comandas e impresora de comandas) **y Salón** (meseros y QR en la mesa). | P5. |
| D12 | **El ticket en papel va con la Caja**, o sea en la Base. Las comandas en papel van con Cocina. | P6. |
| D13 | **Proveedores:** la lista de proveedores y pedirles lo que falta por WhatsApp. | P7. |
| D14 | **Base:** el QR, el link, el afiche del menú y el mensaje de bienvenida. **Domicilios:** la publicidad con IA y el afiche de domicilios. | S1. |
| D15 | **Contabilidad** trae además gastos, saldos, contar la caja y los Excel y PDF para el contador y para facturar. | S2. |
| D16 | **El «cierre» es el conteo de billetes que ya existe** (D17 de Loggro). No se abre ni se cierra caja. | S3. |
| D17 | **El cobro en línea va en Domicilios; el datáfono, en Contabilidad.** Los dos solo si la empresa de pagos deja conectarse. | S4. |
| D18 | **Las notificaciones en iPhone se venden con su límite** (solo si el cliente agregó Appetic a su pantalla de inicio). | S5. |
| D19 | **Nadie paga hoy.** Pilotos usa solo la Base y se le vendió sin suscripción. Al migrar, Pilotos queda con la Base; los demás locales son muestras o cortesía. | S6. |
| D20 | **El Plan Desarrollador se queda aparte**, como está. | S7. |
| D21 | **Los precios NO se ven en la propuesta.** Los paquetes tampoco aparecen hasta que el cliente toca «Solicitar cotización». | P8. |
| D22 | **Flujo nuevo de cotización:** | P8. |

  D22 paso a paso:
  1. **Mini formulario:** nombre de quien cotiza, WhatsApp y nombre del local. También la opción «soy vendedor»: el vendedor elige su nombre y le sale un panel extra para la foto y la ubicación en tiempo real.
  2. **Elegir paquetes:** se muestran los paquetes separados, «bien bonitos», con «Ver detalles» o selección rápida.
  3. **«Crear cotización»:** sale la cotización completa, con su precio, en la pantalla de quien cotiza.
  4. **En el superadmin** queda guardada como «cotización pendiente». Desde ahí, «Enviar cotización» arma el PDF de lo que eligió, listo para mandarlo al WhatsApp que dejó.
  5. **Comentarios:** los vendedores pueden dejar comentarios en algún momento del proceso.
| D23 | **Precio tope: $99.900** al mes si piden todo lo que existe hoy (el antiguo Empresario). | P8. |

### De la ronda 2

| # | Decisión | Por qué |
|---|----------|---------|
| D24 | **Los precios se rehacen para que TODO, incluido el Inventario, llegue a $99.900.** La Base es la más cara (**$29.900**) y el resto, más suave según qué tan útil es. Deja sin efecto S4 y el tope de $119.900. | P1 y P2, por la observación. |
| D25 | **Nunca se muestra el precio de cada paquete: solo el total.** La propuesta dice «planes desde $29.900 al mes». | P1, observación. |
| D26 | **Promoción: solo el «2.º mes gratis hasta el 31 de diciembre».** Salen el 6x5 y el 12x10. | P3. |
| D27 | **«Enviar cotización» baja el PDF y abre el chat de WhatsApp del cliente** con un saludo. El saludo ofrece una reunión en persona para explicar todo el sistema. El PDF se adjunta a mano. | P4, observación. |
| D28 | **El cliente solo VE su cotización** en la pantalla: no la baja. | P5. |
| D29 | **Los comentarios del vendedor van después de elegir los paquetes y antes de «Crear cotización»**, porque el cliente opina mientras se eligen. Solo salen cuando cotiza un vendedor. | P6, observación. |
| D30 | **Salen de la propuesta web la sección de planes y el botón «Descargar PDF».** | P7. |
| D31 | **Las notificaciones del dueño les llegan a quien marcó el local como favorito y a quien le ha pedido**, si aceptó recibirlas. | P8. |
| D32 | **La cotización vale 15 días.** | S1. |
| D33 | **Cada cotización lleva un número consecutivo: AP-0001, AP-0002…** | S2. |
| D35 | **Nada dice «Próximamente» en la propuesta: todo sale incluido**, también el Inventario, que se construye hoy (7-nov). Deja sin efecto S8. | El usuario, en el chat. Lo que aún no existe pasa a la cola de la fase C y debe estar listo antes de entregárselo a un cliente: notificaciones, horario semanal, cobro en línea y datáfono (estos dos dependen de las empresas de pagos). |
| D36 | **La propuesta web se reorganiza por paquetes:** una sección por paquete (Base → Domicilios → Contabilidad → Cocina → Salón → Inventario), cada una interactiva y enfocada, para que el vendedor explique rápido y se salte lo que el local no necesita. Que se vea bien en celular, tablet y PC. | Mensaje del usuario (7-nov). |
| D37 | **El formulario empieza directo en los datos**, sin las dos tarjetas de «¿quién eres?». Arriba va el selector «Soy el dueño / Soy vendedor de Swiftfly». **El dueño llena casi nada:** negocio y WhatsApp (su nombre, opcional). **El vendedor llena todo:** su nombre, el dueño, el WhatsApp, el negocio, la ciudad, el barrio, la foto del lugar, la carta y la ubicación; el logo queda opcional. | El usuario, en el chat (7-nov): «el dueño ponga casi nada de datos y el vendedor sí los deba colocar todos». |
| D38 | **Sale «Tipo de negocio»** del formulario. | El usuario, en el chat: ya no hace falta con los paquetes. |
| D39 | **Los totales siempre terminan en $900:** la Base vale $29.900 y el resto son números cerrados (Domicilios $16.000, Contabilidad $16.000, Cocina $13.000, Inventario $13.000, Salón $12.000). Todo junto da exacto $99.900. Deja sin efecto los precios de S7. | El usuario, en el chat (7-nov). Verificado: las 32 combinaciones terminan en 900. |
| D40 | **Nombres:** «Salón» pasa a llamarse **Servicio a la Mesa**, y todos los paquetes llevan «Paquete» delante (Paquete Base, Paquete Domicilios, Paquete Contabilidad y Registro, Paquete Cocina, Paquete Servicio a la Mesa, Paquete Inventario). Afecta al cotizador, al PDF, al superadmin, a la propuesta y a la voz. El id interno sigue siendo `salon`. En la barra fija y en el contador del cotizador van cortos, para que quepan. | El usuario, en el chat (7-nov). |
| D34 | **El permiso de notificaciones se le pide al cliente después de su primer pedido o al marcar el local como favorito.** | S3. |

---

## 3. Suposiciones del agente

- **S1** — **Lo que NO existe en la app y sería nuevo:**
  - notificaciones a los clientes (hoy solo se avisa al equipo: `services/notificaciones.js`);
  - turnos del personal (la nómina solo anota días pagados: `CuentasNomina.jsx`);
  - panel de proveedores;
  - el inventario completo (era el paso 4 de la guía de Loggro).

  *(deducida del código)*
- **S2** — **Domicilios incluye los pedidos a domicilio en sí** (checkout con dirección y envío), aunque no se nombraron. *(es la razón de ser del paquete)*
- **S3** — **Dependencias** (el cotizador las respeta solo):
  - la Base es obligatoria;
  - Inventario exige Contabilidad, porque las compras entran por los gastos;
  - los turnos del Menú en Pantalla salen solo si hay Cocina.
- **S4** — ~~Precios estimados de la ronda 2~~ → reemplazados por S7 (D24).

  Lo que quedó tachado:

  | Paquete | Precio al mes |
  |---|---|
  | Base | $39.900 |
  | Domicilios | $19.900 |
  | Contabilidad | $19.900 |
  | Cocina | $14.900 |
  | Salón | $14.900 |
  | Inventario (cuando exista) | $19.900 |

  - Todo lo de hoy suma $109.500 y se cobra con el **tope de $99.900**.
  - Calzan con lo de antes: Base + Contabilidad = $59.800 (≈ Emprendedor), + Domicilios = $79.700 (≈ Comerciante).
- **S5** — **Estados de la cotización en el superadmin:** pendiente → enviada → cerrada. Reemplazan los de las solicitudes de hoy (nueva → contactada → cerrada).
- **S7** — **Precios internos** (D24: los decido yo «según lo útil»; nunca se muestran por separado):

  | Paquete | Precio al mes |
  |---|---|
  | Base | $29.900 |
  | Domicilios | $16.900 |
  | Contabilidad | $16.900 |
  | Cocina | $12.900 |
  | Inventario | $12.900 |
  | Salón | $11.900 |

  - Todo suma $101.400 y se cobra con el **tope de $99.900**.
  - **Lectura de la observación:** decía «que el base sea carito» y también «en 29.900 me gustaría la base». La interpreto así: la Base es la más cara de todas, a $29.900.
  - Con cinco precios terminados en 900 la suma no puede dar justo $99.900; por eso el tope.
- **S8** — **Lo que todavía no existe se muestra como «Próximamente»** en el detalle de cada paquete y no se cobra (regla S4 de Loggro: no prometer lo que no existe):
  - en la Base: las notificaciones;
  - en Contabilidad: el horario semanal y el datáfono;
  - en Domicilios: el cobro en línea;
  - **el paquete Inventario entero**, que sale en el cotizador pero no se puede elegir hasta que exista.
- **S9** — **El cotizador lo reutiliza todo:** el «Soy vendedor» (botones, foto, GPS) y el registro de visitas («solo registrar la visita» con motivo) siguen igual. El total lo calcula el servidor, no el navegador.
- **S10** — **Los paquetes los prende el superadmin en cada local.** Al migrar:
  - Pilotos queda con la Base (D19);
  - los locales de muestra y la demo quedan con todo, en cortesía.
- **S6** — **Lo que ya existe y se reutiliza:**
  - el formulario de la propuesta web (vendedores en botones, foto, GPS, visita con motivo);
  - `/api/solicitud`, `/api/solicitud-archivo` y la sección «Solicitudes de cotización» del superadmin.

---

## 4. Descartado

- **Gestión como un solo paquete** → se partió en Cocina y Salón (D11).
- **Que las notificaciones sean automáticas** → las manda el dueño (D9).
- **Marcar entrada y salida del personal** → solo el horario de la semana (D10).
- **Lo que se le debe al proveedor y el historial de precios** → no se marcaron en P7.
- **Mostrar los precios de los planes en la propuesta** → D21.
- **Precio de cada paquete a la vista** → D25.
- **Promociones 6x5 y 12x10** → D26.
- **Link a la cotización por WhatsApp** → se manda el PDF a mano (D27).
- **Que el cliente baje su PDF** → D28.
- **Botón «Descargar PDF» de la propuesta** → D30.

---

## 5. Estado de las rondas

- **Ronda 1 — Los paquetes y lo que se pasó** ✅ respondida
- **Ronda 2 — Precios y cotizador** ✅ respondida
- **Ronda 3** ❌ no se hace: con esto no queda nada que adivinar.

---

## 6. Incógnitas abiertas

*(ninguna)*

---

## 7. Plan de implementación

**Fase A — Propuesta y cotizador** (lo que el usuario pidió primero)

- [x] A1 · **`src/utils/paquetes.js`**, compartido por la app, la API y la web:
  - los 6 paquetes: nombre, ícono, resumen, qué incluye (con «Próximamente» donde toca), precio interno y si está disponible;
  - las dependencias: la Base es obligatoria; Inventario exige Contabilidad;
  - `totalDe()` con el tope y la promoción del 2.º mes.
- [x] A2 · **`/api/solicitud`:**
  - acepta `paquetes` y `comentarioVendedor`;
  - calcula el total;
  - da el número consecutivo AP-0001 (contador en `config/cotizaciones`, dentro de una transacción) y vence a los 15 días;
  - devuelve número, paquetes y total para mostrarlos.
- [x] A3 · **Propuesta web `web/appetic/`:**
  - salen la sección de planes y «Descargar PDF», y entra «planes desde $29.900 al mes»;
  - el formulario va así: datos → paquetes (tarjetas, «Ver detalles», elegir) → comentarios del vendedor → «Crear cotización» → la cotización en pantalla, solo para ver;
  - «Menú en Pantalla» en vez de «TV».
- [x] A4 · **Superadmin:**
  - las «Cotizaciones» pasan por pendiente → enviada → cerrada, con el número, los paquetes, el total y el comentario del vendedor;
  - «Enviar cotización» baja el PDF y abre `wa.me` con el saludo y la oferta de reunión; queda «enviada».
- [x] A2b · Propuesta web por paquetes (D36).
- [~] A5 · Probar de punta a punta en local y en producción. Publicar con el permiso del usuario, junto con la impresora (`ea34889`).

**Fase B — La app por paquetes**

- [ ] B1 · **`utils/plan.js`:** de escalera a `suscripcion.paquetes[]`.
  - `tiene(local, función)` sale de los paquetes;
  - espejo en `firestore.rules` (`rolEnPlan` y `nivelPlan`);
  - candados con el nombre del paquete.
- [ ] B2 · **Superadmin:** prender y apagar los paquetes de cada local.
- [ ] B3 · **Migración** (S10) y **«Menú en Pantalla»** en la app.

**Fase C — Lo nuevo de los paquetes** (cada uno, su propia guía o paso)

- [ ] C1 · Notificaciones del dueño a los clientes (D9, D31, D34).
- [ ] C2 · Horario semanal del personal (D10).
- [x] C3 · Inventario con recetas y proveedores (D13 y paso 4 de la guía de Loggro). Hecho el 7-nov, sin publicar.
- [ ] C4 · Cobro en línea y datáfono (pasos 5 a 7 de Loggro), solo si las empresas de pagos dejan conectarse.

---

## 8. Bitácora

- **7-nov-2026** — Primero se propusieron 10 piezas en el chat. El usuario las reagrupó en 5 paquetes. Ronda 1 creada para revisar huecos y dependencias.
- **7-nov-2026** — Ronda 1 respondida. El usuario pidió **no tocar código** hasta ver cómo quedan los paquetes y un estimado de precios, y diseñó el cotizador (D21, D22). Ronda 2 creada.
- **7-nov-2026** — Ronda 2 respondida. Precios internos decididos (S7) y plan escrito. Empieza la fase A.
- **7-nov-2026 · fase A construida.**
  - **Archivos:**
    - `src/utils/paquetes.js` y `scripts/exportar-paquetes.mjs`, que genera `web/appetic/paquetes.json` sin precios;
    - `/api/solicitud` con `paquetes`, el total, el número AP y el vencimiento;
    - en el superadmin, `Solicitudes.jsx` (pendiente → enviada → cerrada; las viejas «nueva» y «contactada» se leen así) y `services/cotizacionPdf.js` (jsPDF 2.5.2, que se carga solo al usarlo);
    - la propuesta web (`index.html`, `app.js` y `estilos.css`).
  - **Cambios en la propuesta:**
    - sale la sección de planes y entra «Planes desde $29.900»;
    - salen los dos «Descargar PDF»;
    - «TV» pasa a llamarse «Menú en Pantalla»;
    - se regeneró la voz de las líneas `tv` y `planes`.
  - **Decidido sobre la marcha:**
    - el dueño llena solo nombre, WhatsApp y local (salen ciudad, barrio, tipo y plan);
    - en el final, el dueño no ve «Registrar otro negocio»;
    - el saludo de WhatsApp lleva el número de la cotización y ofrece la reunión en persona.
  - **Pruebas:**
    - la API contra el emulador de Firestore: AP-0001 y AP-0002 consecutivos, los paquetes «pronto» o inventados se ignoran, un reintento devuelve lo mismo y la página vieja sigue funcionando;
    - el PDF de 2 páginas, revisado como imagen;
    - en el navegador, con la API simulada: dueño, vendedor con comentarios y visita, en PC y en celular;
    - el superadmin en modo simulado.
  - **Sin probar:** contra la API real en producción (necesita publicar).
- **7-nov-2026** — El usuario pide que la propuesta web vaya **por paquetes**: una sección por paquete, de la Base hacia abajo, interactiva y completa en celular, tablet y PC. Se puede usar /Generar_Imagen. Esto es D36 y entra como fase A2.
- **7-nov-2026 · propuesta por paquetes (D36).**
  - **Las secciones:** `web/appetic/index.html` pasa a portada → qué es (índice de 6 paquetes) → 6 secciones `section.paq` (`base`, `domicilios`, `contabilidad`, `cocina-paq`, `salon`, `inventario`) → demo → tu plan → cotizar.
  - **Cada paquete trae:** cabecera con sello «Paquete N», sus bloques interactivos, «Y también trae» y un pie que lleva al paquete siguiente.
  - **Barra fija de paquetes** arriba, para que el vendedor salte al que le sirve al local. Se esconde durante el recorrido.
  - **Interactivos nuevos:**
    - Base, caja simulada: platos → billete → vueltas → ticket impreso;
    - Contabilidad, contar la caja: «Faltan $10.000» hasta que cuadra;
    - Inventario: cada hamburguesa descuenta su receta; el pan llega al mínimo, sale el aviso y el pedido por WhatsApp al proveedor.
  - **Interactivos que se reacomodaron:**
    - menú del celular y Menú en Pantalla → Base;
    - la tablet de cocina → Cocina;
    - el celular del mesero y el viaje del pedido → Salón;
    - las cuentas y el mes → Contabilidad.
  - **Voz:** el guion completo se reescribió y se regeneró (11 paradas). Se borraron `menu`, `tv`, `meseros` y `cuentas` `.mp3`.
  - **Íconos que faltan:** `idx-inventario` y `idx-cocina`. Los prompts están en `.prompts-imagenes/propuesta-paquetes.md`. Mientras tanto se ven 📦 y `ico-comandas`; cuando existan los `.webp`, la página los toma sola (`data-ico`).
  - **Arreglado de paso:** `limpiar()` del formulario se caía en la carta, que no tiene `<img>`, y no limpiaba el GPS.
  - **Revisado en PC, tablet (768) y celular (375):** sin scroll horizontal y con todos los interactivos andando.
- **7-nov-2026 · publicación de Appetic.**
  - Reglas desplegadas (inventario). Push `a67c465`: impresora, cotizador, inventario y guías.
  - Vercel sirve el bundle nuevo (trae `cotizacionPdf` y «Enviar cotización»).
  - **Prueba real** de `/api/solicitud`: **AP-0001** «PRUEBA Swiftfly (borrar)» con los 6 paquetes → total $99.900, ahorro $1.500, 2.º mes gratis, vence el 22-nov. Hay que marcarla «Cerrada» en el superadmin.
  - **La propuesta web queda por subir por FTP.** Lo hace el usuario con su clave, con el comando que se le dio en el chat.
  - **Ícono de Inventario:** recortado y puesto. **El de Cocina:** salió como una taza de té; está el prompt v2 en `.prompts-imagenes/propuesta-paquetes.md`, y mientras tanto se usa `ico-comandas`.
- **7-nov-2026 · el formulario, otra vez (D37, D38).** Pasos: dueño = datos → paquetes; vendedor = datos → fotos → paquetes → comentarios; visita = datos → fotos → revisar. Probado en local con la API simulada (los dos caminos, la carta obligatoria y el celular). Hay que subirlo por FTP (`index.html`, `app.js`, `estilos.css`).
- **7-nov-2026 · el celular del Paquete Base muestra a Pilotos.**
  - Es el menú REAL de Pilotos Burger House: su logo con su animación «lado» (tres bloques que entran alternando, copiada de `LogoEpico.css`), su banner, su piel oscura «jet» (vino #8A1212 y dorado #E8A03D), sus hamburguesas con fotos y precios reales, y su nombre en el WhatsApp.
  - Al lado va la etiqueta «Menú real de Pilotos Burger House: lo montamos con su logo, sus colores y su carta».
  - La demostración del pedido sigue igual.
  - Imágenes en `web/appetic/img/pilotos/` (optimizadas, 144 KB). Subido por FTP con `~/.netrc`.
- **Pendiente de la guía de Loggro:** el paso 3 (impresora) está en un commit local `ea34889` sin publicar. Conviene publicarlo cuando se defina en qué paquete va.
