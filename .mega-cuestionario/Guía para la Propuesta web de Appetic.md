# Guía para la Propuesta web de Appetic

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** pasar la propuesta de Appetic a una página del sitio de Swiftfly Solutions,
  interactuable, con animaciones, optimizada en PC y celular, a la altura del inicio.
- **Inicio:** 3 de noviembre de 2026
- **Estado:** 🟡 Ronda 2 entregada, esperando
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

---

## 4. Descartado (no volver a proponer)

- **Demo real incrustada en un celular** → no se marcó en P3; el celular es simulado.
- **Link con saludo por cliente (`?para=`)** → S2: no.
- **Apagar la promo sola el 31-dic** → S3: no.

---

## 5. Estado de las rondas

- **Ronda 1 — Visión general** ✅ respondida · `Cuestionario-1-Propuesta-Web-Appetic.html`
- **Ronda 2 — La cotización formal** 🟡 entregada, esperando · `Cuestionario-2-Cotizacion-Formal.html`

---

## 6. Incógnitas abiertas

1. A dónde llega la solicitud de cotización (WhatsApp / correo / lista guardada). *(ronda 2)*
2. Un formulario o dos para vendedor y dueño. *(ronda 2)*
3. Si se identifica al vendedor. *(ronda 2)*
4. Qué datos del local se piden. *(ronda 2)*
5. Correo de destino. *(ronda 2)*

---

## 7. Plan de implementación

*(se escribe al cerrar las rondas)*

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
