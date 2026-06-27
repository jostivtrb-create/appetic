// Registro del Service Worker con auto-actualización.
//
// Gracias a `registerType: 'autoUpdate'` (vite.config.js), cuando se detecta una
// versión nueva el navegador instala el nuevo Service Worker, toma el control y
// recarga la app automáticamente. Así la app instalada se actualiza sola, sin
// tener que desinstalarla y volver a instalarla.
//
// Aquí añadimos lo que falta para que esa detección ocurra de verdad en una app
// ya instalada: un chequeo periódico y otro cada vez que el usuario vuelve a
// abrir la app (la trae a primer plano).

import { registerSW } from 'virtual:pwa-register'

// Cada cuánto comprobamos si hay una versión nueva (1 hora).
const PERIODO_MS = 60 * 60 * 1000

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return

    const buscarActualizacion = async () => {
      // Si ya hay una instalación en curso, o no hay conexión, no hacemos nada.
      if (registration.installing) return
      if ('onLine' in navigator && !navigator.onLine) return

      try {
        // Pedimos el archivo del SW saltándonos la caché para detectar cambios.
        const resp = await fetch(swUrl, {
          cache: 'no-store',
          headers: { 'cache-control': 'no-cache' },
        })
        if (resp?.status === 200) {
          await registration.update()
        }
      } catch {
        // Sin conexión o error de red: lo reintentamos en el próximo ciclo.
      }
    }

    // 1) Chequeo periódico mientras la app está abierta.
    setInterval(buscarActualizacion, PERIODO_MS)

    // 2) Chequeo cada vez que el usuario vuelve a la app (clave para PWAs
    //    instaladas, que se reabren desde el ícono de inicio).
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') buscarActualizacion()
    })
  },
})
