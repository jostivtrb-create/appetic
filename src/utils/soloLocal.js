// 🔒 «Solo este local» (guía «Planes en la app» D6 y D13).
//
// Cuando el dueño decide NO salir en el buscador, quien entra por su link o su QR se queda en su
// menú: no hay botón de buscar, Favoritos y Mis pedidos muestran solo ese local, y el inicio lo
// devuelve al menú. Se recuerda en el aparato (también en la app instalada, que abre en «/») hasta
// que el cliente entre a un local que sí sale en el buscador.
import { apareceEnBuscador } from './plan'
import { appLocal, completarAppLocal } from './appLocal'

const KEY = 'appetic_solo_local'

// La app instalada de un local (utils/appLocal.js) es siempre «solo este local», salga o no en el
// buscador: ahí no hay otros locales. Eso vive en la sesión de esa app, no en el aparato.
export function soloLocal() {
  const app = appLocal()
  if (app) return app
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null }
}

// Al abrir el menú de un local. `conPanel`: dueños, equipo y superadmin nunca quedan encerrados.
export function recordarLocal(local, { conPanel = false } = {}) {
  if (appLocal()) { completarAppLocal(local); return }
  try {
    if (conPanel || local?.esDemo || apareceEnBuscador(local)) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify({ id: local.id, slug: local.slug, nombre: local.nombre }))
  } catch { /* sin almacenamiento: no se encierra */ }
}

export function soltarLocal() {
  if (appLocal()) return
  try { localStorage.removeItem(KEY) } catch { /* nada */ }
}
