// 📺 El menú en vivo para la pantalla de TV.
//
// Costo (S2 de la guía): UN listener sobre el documento del local. Los productos se
// vuelven a leer solo cuando sube `menuVersion` (y getProductos los saca de la caché del
// aparato si ya los tiene). Un TV prendido 12 horas sin cambios no gasta lecturas.
//
// Sin internet (S6): se guarda en el aparato lo último que se mostró. Si el TV se reinicia
// sin red, arranca con eso; el listener de Firestore se reconecta solo cuando vuelve.

import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import { getLocalBySlug } from './locales'
import { getProductos } from './productos'
import { getMenuExterno } from './menuExterno'

const CLAVE = slug => `appetic_tv_${slug}`
// Un menú externo (La Gran Esquina) no tiene `menuVersion`: se relee cada 10 minutos.
const CADA_EXTERNO = 10 * 60 * 1000

function guardar(slug, datos) {
  try { localStorage.setItem(CLAVE(slug), JSON.stringify({ ...datos, guardadoEn: Date.now() })) } catch { /* sin espacio */ }
}

export function ultimoGuardado(slug) {
  try {
    const raw = localStorage.getItem(CLAVE(slug))
    const d = raw ? JSON.parse(raw) : null
    return d?.local && Array.isArray(d.productos) ? d : null
  } catch { return null }
}

/**
 * Escucha el local y su menú. `alCambiar({ local, productos })` se llama al arrancar y en
 * cada cambio; `alError(motivo)` con 'no-existe' o 'error'. Devuelve la función para soltar.
 */
export function escucharPantalla(slug, alCambiar, alError) {
  let vivo = true
  let soltar = () => {}
  let reloj = null
  let version = Symbol('ninguna')
  let productos = null

  async function arrancar() {
    // 🧪 Vista previa (?preview=1) y locales de desarrollo: menú desde el código, sin Firestore.
    const params = new URLSearchParams(window.location.search)
    if (import.meta.env.DEV || params.has('preview')) {
      const { getPreviewLocal } = await import('../preview')
      const prev = await getPreviewLocal(slug)
      if (prev) {
        if (vivo) alCambiar({ local: prev.local, productos: prev.productos || [] })
        return
      }
    }

    const local = await getLocalBySlug(slug)
    if (!vivo) return
    if (!local) { alError?.('no-existe'); return }

    if (local.menuExterno) {
      const leer = async l => {
        const res = await getMenuExterno(l.menuExterno, l)
        productos = res.productos || []
        return productos
      }
      await leer(local)
      if (!vivo) return
      alCambiar({ local, productos })
      guardar(slug, { local, productos })
      reloj = setInterval(async () => {
        try {
          const ps = await leer(local)
          if (vivo) { alCambiar({ local, productos: ps }); guardar(slug, { local, productos: ps }) }
        } catch (e) { console.warn('TV: no se pudo releer el menú externo', e) }
      }, CADA_EXTERNO)
      return
    }

    soltar = onSnapshot(doc(db, 'locales', local.id), async snap => {
      if (!vivo || !snap.exists()) return
      const l = { id: snap.id, ...snap.data() }
      if (l.menuVersion !== version || !productos) {
        version = l.menuVersion
        try {
          productos = await getProductos(l.id, l.menuVersion)
        } catch (e) {
          console.warn('TV: no se pudieron leer los productos', e)
          if (!productos) return
        }
      }
      if (!vivo) return
      alCambiar({ local: l, productos })
      guardar(slug, { local: l, productos })
    }, err => console.warn('TV: listener del local', err))
  }

  arrancar().catch(err => {
    console.error('TV: error cargando el local', err)
    if (vivo) alError?.('error')
  })

  return () => {
    vivo = false
    soltar()
    if (reloj) clearInterval(reloj)
  }
}
