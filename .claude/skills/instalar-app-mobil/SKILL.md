---
name: instalar-app-mobil
description: >
  Configura automáticamente todo lo necesario para que cualquier aplicación web se pueda instalar
  como PWA (Progressive Web App) en dispositivos móviles. Úsala cuando el usuario diga "quiero
  que mi app se pueda instalar en el celular", "añade instalación PWA", "hazla instalable",
  "agrega el botón de instalar la app", "configura PWA", "quiero ícono en pantalla de inicio",
  "descargar la app como app web", o cualquier variación de querer convertir su web app en una
  app instalable. También úsala si el usuario menciona service worker, manifest.json, o quiere
  soporte offline. Crea: manifest.json, service worker, componente InstallPrompt con modal visual
  para Android E iOS (sin alert()), meta tags en index.html y registro del SW en el entry point.
  ACTÍVATE siempre que el contexto involucre instalar una web app en móvil.
---

# PWA Install Setup — Instalar-App-Mobil

Convierte cualquier web app en una PWA completamente instalable en Android e iOS.
Configura todo automáticamente, detectando lo que ya existe para no sobreescribir.

## Paso 0 — Detectar el proyecto

Antes de crear nada, explora el proyecto:

```
¿Existe package.json? → Lee para conocer el nombre del proyecto
¿Es React + Vite?      → main.jsx / main.tsx  |  index.html en raíz
¿Es Next.js?           → app/ o pages/        |  sin index.html propio
¿Es Vue + Vite?        → main.js / main.ts    |  index.html en raíz
```

Revisa qué archivos PWA ya existen para no duplicarlos:
- `public/manifest.json`
- `public/sw.js`
- `src/components/UI/InstallPrompt.jsx` (o .tsx)
- Etiquetas `<link rel="manifest">` en index.html
- Registro de SW en el entry point

**Si algo ya existe**, actualízalo. Al final, informa qué se creó y qué se actualizó.

---

## Paso 1 — manifest.json

Crea `public/manifest.json`. Usa el nombre del proyecto de `package.json` (o "Mi App" si no hay).

Lee el asset en `assets/manifest.json` de esta skill y adáptalo con:
- `name`: nombre completo del proyecto
- `short_name`: primeras 10 letras sin espacios
- `theme_color` y `background_color`: `"#FFFFFF"` por defecto

**Íconos:** Si no existen `public/icon-192.png` e `public/icon-512.png`, crea
`public/ICONOS-REQUERIDOS.md` con instrucciones. Lee el asset `assets/ICONOS-REQUERIDOS.md`.

---

## Paso 2 — Service Worker

Crea `public/sw.js` usando el asset `assets/sw.js` de esta skill.

**El SW se AUTO-ACTUALIZA: la app se refresca sola al recargar o al cerrar y abrir, SIN reinstalar.** Estrategias:
- **Navegación SPA**: network-first → al recargar/reabrir trae el HTML fresco (y con él los assets nuevos, que llevan hash).
- **Assets JS/CSS/imágenes/fuentes**: stale-while-revalidate (rápidos desde caché, se refrescan solos).
- **Caché versionada**: al activar una versión nueva borra las viejas.
- **SIN `self.skipWaiting()` y SIN `clients.claim()`**: a propósito. Eso evita que el SW secuestre una sesión abierta, que es lo que causa el **bucle de login de Firebase Auth en iOS** (ver skill `Solucion_Ingreso`). La versión nueva queda lista y entra al cerrar/reabrir.
- **Otros orígenes (Firebase/Google)**: NO se interceptan; van directo a la red.

> ⚠️ Para que la auto-actualización funcione, el Paso 6 DEBE registrar con `updateViaCache: 'none'` y llamar `reg.update()` al cargar y al volver la app a primer plano. Ambos pasos van juntos.

---

## Paso 3 — Componente InstallPrompt

Crea `src/components/UI/InstallPrompt.jsx` (o `.tsx` para TypeScript).

Lee el asset `assets/InstallPrompt.jsx`. El componente maneja **tres casos**:

### Caso 1 — Ya instalada
`window.matchMedia('(display-mode: standalone)').matches` → no renderiza nada.

### Caso 2 — Android/Chrome
Captura `beforeinstallprompt`, muestra modal con botón "Instalar App".
Al hacer clic → `deferredPrompt.prompt()`.

### Caso 3 — iOS Safari (NUNCA alert())
Detecta iOS: `/ipad|iphone|ipod/i.test(navigator.userAgent)`
Muestra modal con instrucciones visuales paso a paso:
- Paso 1: ícono Compartir ⎙ en barra inferior
- Paso 2: "Añadir a pantalla de inicio" ＋
- Paso 3: Tocar "Añadir"

Guarda en `sessionStorage` si el usuario lo descartó (clave: `pwa-install-dismissed`).

---

## Paso 4 — Estilos

Crea `src/components/UI/InstallPrompt.css` desde `assets/InstallPrompt.css`.

Incluye: overlay semitransparente (z-index: 1000), tarjeta centrada con `max-width: 380px`,
animaciones `slide-up` y `fade-in`, botón primario con `var(--color-primary, #D32F2F)`,
pasos iOS numerados visualmente.

---

## Paso 5 — Meta tags en index.html

Añade en `<head>` solo las etiquetas que falten:

```html
<meta name="theme-color" content="#FFFFFF" />
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icon-192.png" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="[Nombre]" />
```

Para **Next.js**: añadir en `app/layout.tsx` vía objeto `metadata`, no en index.html.

---

## Paso 6 — Registrar Service Worker (con auto-actualización)

En el entry point (`src/main.jsx` o `src/main.tsx`). **Usa SIEMPRE esta versión** (con `updateViaCache:'none'` + `reg.update()`), que es lo que hace que la app se actualice sola sin reinstalar:

```javascript
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        reg.update(); // revisa si hay versión nueva al cargar
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update(); // y al volver a la app
        });
      })
      .catch(() => {});
  });
}
```

Para **Next.js**: usar `next/script` con `strategy="afterInteractive"` en `layout.tsx`, con la misma lógica de `updateViaCache:'none'` + `reg.update()` en `load` y `visibilitychange`.

---

## Paso 7 — Integrar InstallPrompt

Añade `<InstallPrompt />` en el componente raíz o layout:
- **React + Vite**: en `App.jsx` o componente Layout
- **Next.js**: en `app/layout.tsx` o `pages/_app.tsx`
- Para Next.js: añadir directiva `'use client'` al componente

---

## Resumen final

Muestra siempre al terminar:

```
✅ Archivos creados:
  - [lista]

🔄 Archivos actualizados:
  - [lista]

⚠️ Pendiente (manual):
  - Generar icon-192.png e icon-512.png en /public/
    (Ver public/ICONOS-REQUERIDOS.md)

💡 El prompt Android solo aparece en producción:
   npm run build && npx serve dist

🔄 La app se actualiza SOLA al recargar o al cerrar/abrir (sin reinstalar),
   y sin romper el login de Firebase (SW sin skipWaiting/clientsClaim).
```
