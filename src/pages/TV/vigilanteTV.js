// 📺 El VIGILANTE del TV: vive fuera de React, así sigue andando aunque la pantalla se caiga.
//   • Entre 4:00 y 4:10 a. m. (si lleva más de una hora prendido) se recarga, aplicando la versión
//     nueva de la app si hay una esperando (auditoría «pantalla de TV» H3).
//   • `recargarPronto()` lo usa la red de seguridad de la pantalla: si algo se rompe, recarga al
//     minuto en vez de quedarse negra todo el día (H7).
//   • Mantiene la pantalla despierta: wakeLock si el navegador lo tiene (y lo vuelve a pedir si
//     se suelta), y si no, un video mudo de 2 s en bucle que los TV respetan (Fire TV, Android TV,
//     navegadores de Smart TV sin wakeLock) — H9.
import { minutosAhoraBogota } from '../../utils/horario'

let iniciado = false
let programada = false

async function recargar() {
  try {
    const sw = await import('../../registerSW.js')
    if (sw.aplicarVersionNueva()) return
  } catch { /* sin service worker */ }
  window.location.reload()
}

export function recargarPronto(ms = 60000) {
  if (programada) return
  programada = true
  setTimeout(recargar, ms)
}

export function vigilarTV() {
  if (iniciado) return
  iniciado = true
  const arranque = Date.now()
  setInterval(() => {
    const min = minutosAhoraBogota()
    if (min >= 240 && min < 250 && Date.now() - arranque > 3600000 && navigator.onLine !== false) recargar()
  }, 5 * 60 * 1000)
  despierta()
}

function despierta() {
  let candado = null
  const pedir = async () => {
    if (!navigator.wakeLock) return false
    try {
      candado = await navigator.wakeLock.request('screen')
      candado.addEventListener?.('release', () => { if (document.visibilityState === 'visible') setTimeout(pedir, 1000) })
      return true
    } catch { return false }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pedir() })
  pedir().then(ok => { if (!ok) videoDespierto() })
}

function videoDespierto() {
  const v = document.createElement('video')
  v.src = '/tv-despierto.mp4'
  v.muted = true
  v.loop = true
  v.setAttribute('playsinline', '')
  v.setAttribute('muted', '')
  v.setAttribute('aria-hidden', 'true')
  v.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0.01;pointer-events:none;left:0;bottom:0'
  document.body.appendChild(v)
  const jugar = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}) }
  jugar()
  // Algunos TV solo dejan reproducir tras una tecla del control: se reintenta con la primera.
  window.addEventListener('keydown', jugar, { once: true })
  window.addEventListener('pointerdown', jugar, { once: true })
}
