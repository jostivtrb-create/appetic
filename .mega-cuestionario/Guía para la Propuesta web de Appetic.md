# Guía para la Propuesta web de Appetic

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** pasar la propuesta de Appetic a una página del sitio de Swiftfly Solutions,
  interactuable, con animaciones, optimizada en PC y celular, a la altura del inicio.
- **Inicio:** 3 de noviembre de 2026
- **Estado:** 🟡 Ronda 1 entregada, esperando
- **Proyecto:** repo `appetic` (fuente: `propuesta/propuesta-appetic.html`) · sitio `switflysolutions.com` (Hostinger)

---

## 1. Objetivo

En sus palabras: *"pasar la propuesta de Appetic a la página de Swiftfly Solutions, pero que sea
interactuable y con animaciones, optimizada en PC y optimizada en celular, que esté a la altura del
inicio"*.

---

## 2. Decisiones CERRADAS

*(ninguna todavía — ronda 1 pendiente)*

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
- **S6** — Contacto: WhatsApp 320 843 5143, con mensaje precargado.

---

## 4. Descartado (no volver a proponer)

*(nada todavía)*

---

## 5. Estado de las rondas

- **Ronda 1 — Visión general** 🟡 entregada, esperando · `Cuestionario-1-Propuesta-Web-Appetic.html`

---

## 6. Incógnitas abiertas

1. Tipo de página (scroll largo / diapositivas / ambas).
2. Identidad visual (Swiftfly, Appetic o transición).
3. Qué partes son interactivas.
4. Dirección (URL) y qué pasa con el botón del inicio.
5. Cómo se publica (el FTP está bloqueado desde el entorno en la nube).
6. Cambios de contenido respecto al PDF.

---

## 7. Plan de implementación

*(se escribe al cerrar las rondas)*

---

## 8. Bitácora

- **3 de noviembre de 2026** — Leída la propuesta (7 págs.) y descargado y capturado el inicio de
  switflysolutions.com (PC y celular). Probado el FTP: `u374493639.switflysolutions.com` no existe
  en DNS; `ftp.switflysolutions.com` (46.28.42.185) resuelve pero los puertos 21/22/65002 no
  conectan desde el entorno en la nube → la red del entorno lo bloquea. Entregada la ronda 1.
