// Registro del Service Worker: la app se actualiza sola, pero NUNCA en mitad de algo.
//
// Antes el SW nuevo entraba de inmediato (skipWaiting + clientsClaim) y recargaba la app a quien
// la tuviera abierta: el mesero en plena comanda, el cliente en el checkout. Además cortaba el
// refresco del token de Firebase Auth (sesiones que se cierran solas, lección de TodyPan) y dejaba
// a la página vieja pidiendo trozos de JS que ya no estaban en la caché nueva.
//
// Ahora (registerType 'prompt' en vite.config.js) la versión nueva se descarga y QUEDA ESPERANDO.
// Entra en uno de estos momentos, que son como «volver a abrir la app»:
//   1) Al cerrar la app del todo y abrirla otra vez (lo hace el navegador solo).
//   2) Al volver a la app después de tenerla un buen rato en segundo plano (VOLVER_MS). Así entra
//      también en las PWA instaladas que el celular nunca cierra del todo.
// Mientras la tiene en pantalla, nadie se lleva una recarga.

import { registerSW } from 'virtual:pwa-register'

// Cada cuánto comprobamos si hay una versión nueva (1 hora).
const PERIODO_MS = 60 * 60 * 1000
// Cuánto tiene que estar la app en segundo plano para que volver cuente como «abrirla de nuevo».
const VOLVER_MS = 15 * 60 * 1000

let hayVersionNueva = false
let registro = null // el registro del SW, para pedirle a la versión que espera que entre ya
let ocultaDesde = document.visibilityState === 'hidden' ? Date.now() : null

const actualizar = registerSW({
  immediate: true,
  onNeedRefresh() { hayVersionNueva = true; window.dispatchEvent(new Event('appetic:version-nueva')) },
  onRegisteredSW(swUrl, registration) {
    if (!registration) return
    registro = registration

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

    // 2) Al volver a la app: si estuvo fuera un buen rato y ya hay versión nueva, entra ahora
    //    (recarga limpia, el carrito y la cuenta de la Caja viven en localStorage). Si no, solo
    //    se busca la versión nueva para la próxima vez.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') { ocultaDesde = Date.now(); return }
      const fuera = ocultaDesde ? Date.now() - ocultaDesde : 0
      ocultaDesde = null
      if (hayVersionNueva && fuera >= VOLVER_MS) actualizar(true)
      else buscarActualizacion()
    })
  },
})

// 📺 El TV nunca se va a segundo plano: su recarga de las 4 a. m. llama esto para que la versión
// nueva entre (una recarga normal no activa el service worker que espera). true = ya se aplicó.
export function aplicarVersionNueva() {
  if (!hayVersionNueva) return false
  actualizar(true)
  return true
}

// 🔄 Para el aviso «Hay una versión nueva · Actualizar» del panel (components/VersionNueva.jsx):
// el dueño o el superadmin la aplican con un toque, sin tener que cerrar la app instalada.
export const versionNuevaLista = () => hayVersionNueva
// Se quedaba en «Actualizando…» para siempre (8-nov) cuando la página no estaba controlada por el
// service worker (recarga forzada, otra pestaña abierta): el aviso de «ya tomé el control» nunca
// llegaba y no se recargaba. Ahora: se le pide directo a la versión que espera que entre, se
// recarga apenas tome el control y, si en 3 s no pasó nada, se recarga igual.
export function actualizarAhora() {
  let listo = false
  const recargar = () => { if (listo) return; listo = true; window.location.reload() }
  try { navigator.serviceWorker?.addEventListener('controllerchange', recargar, { once: true }) } catch { /* nada */ }
  try { registro?.waiting?.postMessage({ type: 'SKIP_WAITING' }) } catch { /* nada */ }
  try { actualizar(true) } catch { /* nada */ }
  setTimeout(recargar, 3000)
}
