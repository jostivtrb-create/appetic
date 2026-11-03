// 🔔 Un solo audio para toda la app (avisos de «listo», cocina, domicilios).
//
// iPhone/iPad dejan el audio CALLADO hasta que la persona toca la pantalla, y lo vuelven a callar al
// bloquear o cambiar de app. Antes cada aviso creaba un audio nuevo fuera de un toque: en iOS nacía
// callado y no sonaba. Aquí se crea uno, se desbloquea con el primer toque y se reanuda al volver.
let ctx = null

function contexto() {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!ctx) { try { ctx = new Ctx() } catch { return null } }
  return ctx
}

const reanudar = () => { const c = contexto(); if (c && c.state !== 'running') c.resume?.().catch(() => {}) }

if (typeof window !== 'undefined') {
  const primerToque = () => { reanudar(); window.removeEventListener('pointerdown', primerToque); window.removeEventListener('keydown', primerToque) }
  window.addEventListener('pointerdown', primerToque)
  window.addEventListener('keydown', primerToque)
  // Al volver del bloqueo o de otra app: cada toque vuelve a intentar (iOS lo deja «interrupted»).
  window.addEventListener('pointerdown', () => { if (ctx && ctx.state !== 'running') reanudar() })
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reanudar() })
}

// ¿Está sonando de verdad? (si no, la pantalla debe pedir un toque: «Activar sonido»).
export const sonidoListo = () => contexto()?.state === 'running'

// Desbloquear desde un toque explícito («Empezar turno», «Activar sonido»).
export async function activarSonido() {
  const c = contexto()
  try { await c?.resume?.() } catch { /* sin audio */ }
  return c?.state === 'running'
}

// Notas cortas con el sintetizador del navegador (sin archivos). notas = [[frecuencia, retraso], …]
export function tocar(notas, volumen = 0.25, duracion = 0.42) {
  const c = contexto()
  if (!c) return
  reanudar()
  try {
    const t0 = c.currentTime
    notas.forEach(([f, d]) => {
      const o = c.createOscillator(), g = c.createGain()
      o.type = 'sine'; o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t0 + d)
      g.gain.exponentialRampToValueAtTime(volumen, t0 + d + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + duracion)
      o.connect(g).connect(c.destination)
      o.start(t0 + d); o.stop(t0 + d + duracion + 0.05)
    })
  } catch { /* sin audio */ }
}
