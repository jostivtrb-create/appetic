// 📺 El menú en vivo para la pantalla de TV.
//
// Costo (S2 de la guía): una escucha sobre el documento del local y otra sobre sus platos. Al
// prender se leen los platos una vez; después solo llega lo que cambia (antes cada precio que
// tocaba el dueño hacía que cada TV releyera el menú completo — auditoría «pantalla de TV» H8).
//
// Sin internet (S6): se guarda en el aparato lo último que se mostró. Si el TV prende antes que el
// Wi-Fi, arranca con eso y REINTENTA solo (5 s, 15 s, 1 min… y apenas vuelve la red). Las escuchas
// se reconectan solas si Firestore las corta (H2, H5).

import { doc, collection } from 'firebase/firestore'
import { db } from '../config/firebase'
import { getLocalBySlug } from './locales'
import { getMenuExterno } from './menuExterno'
import { escucharConReintento } from './comandas'

// Esperas entre intentos de arranque: rápido al principio (el Wi-Fi del TV tarda segundos).
const ESPERAS = [5000, 15000, 60000, 120000, 300000]
const ordenar = l => l.sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity))

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

    // Arranque con reintentos: sin red, getLocalBySlug falla (o responde vacío) y antes el TV se
    // quedaba así para siempre. Un «no existe» con red se cree; sin red, se sigue intentando.
    let local = null
    for (let i = 0; vivo; i++) {
      try {
        local = await getLocalBySlug(slug)
        if (local) break
        if (navigator.onLine !== false) { alError?.('no-existe'); return }
      } catch (e) { console.warn('TV: sin conexión al arrancar, reintentando', e?.code || e) }
      if (i === 0) alError?.('sin-red')
      await esperar(ESPERAS[Math.min(i, ESPERAS.length - 1)])
    }
    if (!vivo || !local) return

    if (local.menuExterno) {
      // Menú de otra app (La Gran Esquina): se relee cada 10 min. Una lista VACÍA cuando antes había
      // platos es un fallo de red, no un menú vacío: se conserva lo que había (H6).
      const leer = async l => {
        const res = await getMenuExterno(l.menuExterno, l)
        const nuevos = res.productos || []
        if (nuevos.length || !productos?.length) productos = nuevos
        return productos
      }
      await leer(local)
      if (!vivo) return
      alCambiar({ local, productos })
      if (productos.length) guardar(slug, { local, productos })
      // El documento del local también se escucha: anuncios, transición, menú del día, cortes.
      soltar = escucharConReintento(doc(db, 'locales', local.id), snap => {
        if (!vivo || !snap.exists()) return
        local = { id: snap.id, ...snap.data() }
        alCambiar({ local, productos })
      }, e => console.warn('TV: escucha del local', e?.code || e))
      reloj = setInterval(async () => {
        try {
          const ps = await leer(local)
          if (vivo) { alCambiar({ local, productos: ps }); if (ps.length) guardar(slug, { local, productos: ps }) }
        } catch (e) { console.warn('TV: no se pudo releer el menú externo', e) }
      }, CADA_EXTERNO)
      return
    }

    let l = local
    const avisar = () => {
      if (!vivo || !productos) return
      alCambiar({ local: l, productos })
      guardar(slug, { local: l, productos })
    }
    const s1 = escucharConReintento(doc(db, 'locales', local.id), snap => {
      if (!vivo || !snap.exists()) return
      l = { id: snap.id, ...snap.data() }
      avisar()
    }, e => console.warn('TV: escucha del local', e?.code || e))
    // Los platos en vivo. Sin red, una respuesta vacía de la caché no borra el tablero.
    const s2 = escucharConReintento(collection(db, 'locales', local.id, 'productos'), snap => {
      if (!vivo) return
      if (snap.empty && snap.metadata?.fromCache && productos?.length) return
      productos = ordenar(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      avisar()
    }, e => console.warn('TV: escucha de los platos', e?.code || e))
    soltar = () => { s1(); s2() }
  }

  // Espera que también termina apenas vuelve el internet (para no esperar el minuto entero).
  function esperar(ms) {
    return new Promise(res => {
      const t = setTimeout(fin, ms)
      function fin() { clearTimeout(t); window.removeEventListener('online', fin); res() }
      window.addEventListener('online', fin)
    })
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
