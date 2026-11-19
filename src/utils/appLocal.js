// 📲 La app instalada de UN local (su manifest: api/manifest.js).
//
// Esa app solo abarca el link del local (/<slug>): si el cliente sale a /cuenta o /pedidos, Android
// le pone encima una barra con la dirección. Por eso, dentro de esa app, todo vive bajo el link del
// local (/<slug>/cuenta, /<slug>/pedidos, /<slug>/p/<pedido>…) y no hay buscador de otros locales.
//
// Cómo se sabe que es esa app: se abre en /<slug>?app=<slug> (el start_url de su manifest). Se
// anota en la sesión y la marca se quita de la dirección. En el navegador, o en la Appetic general
// instalada, esto no existe y nada cambia.
import { slugDeRuta } from './instalacion.js'

const KEY = 'appetic_app_local'
const SUB = 'cuenta|pedidos|favoritos|datos'

const instalada = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

function leer() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || 'null') } catch { return null }
}

// Al arrancar (main.jsx importa este archivo antes de pintar nada).
if (typeof window !== 'undefined') {
  try {
    const url = new URL(window.location.href)
    const marca = url.searchParams.get('app')
    if (marca !== null) {
      // En desarrollo vale sin estar instalada, para poder probarlo en el navegador.
      if (marca && marca === slugDeRuta(url.pathname) && (instalada() || import.meta.env.DEV) && leer()?.slug !== marca) {
        sessionStorage.setItem(KEY, JSON.stringify({ slug: marca }))
      }
      url.searchParams.delete('app')
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
    }
  } catch { /* sin sesión guardada: se comporta como el navegador */ }
}

/** El local de esta app instalada ({ slug, id?, nombre? }) o null si no es la app de un local. */
export function appLocal() { return leer() }

/** Al cargar el menú del local: completa su id y su nombre (Favoritos y Mis pedidos filtran por ellos). */
export function completarAppLocal(local) {
  const a = leer()
  if (!a || a.slug !== local?.slug || a.id === local.id) return
  try { sessionStorage.setItem(KEY, JSON.stringify({ slug: local.slug, id: local.id, nombre: local.nombre })) } catch { /* nada */ }
}

/** La dirección a la que hay que ir: dentro de la app de un local, la misma pantalla bajo su link. */
export function ruta(path) {
  const a = leer()
  if (!a) return path
  const [, camino, resto = ''] = /^([^?#]*)(.*)$/.exec(path)
  if (camino === '/') return `/${a.slug}${resto}`
  if (new RegExp(`^/(${SUB})(/|$)`).test(camino)) return `/${a.slug}${camino}${resto}`
  const p = /^\/p\/([^/]+)\/([^/]+)$/.exec(camino)
  if (p && p[1] === a.slug) return `/${a.slug}/p/${p[2]}${resto}`
  return path
}

/** La dirección «de siempre» de una pantalla que vive bajo el link de un local (para saber cuál es). */
export function rutaLogica(pathname) {
  const s = new RegExp(`^/[^/]+/(${SUB})(/.*)?$`).exec(pathname)
  if (s) return `/${s[1]}${s[2] || ''}`
  const p = /^\/([^/]+)\/p\/([^/]+)$/.exec(pathname)
  return p ? `/p/${p[1]}/${p[2]}` : pathname
}
