// 🧾 Manda el pedido de la app o la comanda del QR al SERVIDOR (api/pedido.js), que rehace los
// precios con el menú de hoy (guía «Blindaje» D1). Nunca lanza: devuelve qué pasó.
//
//   { ok: true, total, subtotal, domicilio, turno }
//   { cambios: [...], productos: {...}, domicilio }   ← 409: el carrito se pone al día (D2)
//   { error, motivo }                                  ← no se puede (cerrado, límite, sin plan…)
//   { sinRed: true }                                   ← no contestó o sin App Check: el WhatsApp sale igual (S9)
import { tokenAppCheck } from '../config/firebase'
import { precioItem } from '../utils/price'

const KEY = 'appetic_dispositivo'
// Un id por celular (para el límite de envíos, S8). No identifica a nadie.
function dispositivo() {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) { id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; localStorage.setItem(KEY, id) }
    return id
  } catch { return '' }
}

// Del carrito solo viaja QUÉ eligió y el precio que vio (para avisar si cambió).
export const lineasDelCarrito = items => items.map(it => ({
  uid: it.uid,
  productoId: it.producto?.id || '',
  nombre: it.producto?.nombre || '',
  cantidad: it.cantidad || 1,
  seleccion: it.seleccion || {},
  notas: it.notas || it.comentario || '',
  precio: precioItem(it),
}))

export async function enviarAlServidor(body, { espera = 10000 } = {}) {
  const ctrl = new AbortController()
  const reloj = setTimeout(() => ctrl.abort(), espera)
  try {
    // Tope a la prueba de App Check: si reCAPTCHA no carga (bloqueador, mala señal) se manda sin ella.
    const token = await Promise.race([tokenAppCheck(), new Promise(res => setTimeout(() => res(''), 4000))])
    const r = await fetch('/api/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Firebase-AppCheck': token } : {}) },
      body: JSON.stringify({ ...body, dispositivo: dispositivo() }),
      signal: ctrl.signal,
    })
    const data = await r.json().catch(() => ({}))
    if (r.ok) return data
    if (r.status === 409) return { cambios: data.cambios || [], productos: data.productos || {}, domicilio: data.domicilio || null }
    // Sin la prueba de App Check el servidor no lo guarda, pero la venta no se pierde: el WhatsApp
    // sale igual, como cuando no hay red (S9).
    if (r.status >= 500 || data.motivo === 'appcheck') return { sinRed: true }
    return { error: data.error || 'No se pudo enviar', motivo: data.motivo || 'error' }
  } catch {
    return { sinRed: true }
  } finally {
    clearTimeout(reloj)
  }
}

// «El precio cambió» en palabras (D2): qué se actualizó y qué salió del carrito.
export function textoCambios(cambios) {
  const cop = n => `$${Number(n || 0).toLocaleString('es-CO')}`
  return cambios.map(c => {
    const n = c.nombre || 'Un producto'
    if (c.tipo === 'precio') return `${n}: ahora ${cop(c.ahora)} (antes ${cop(c.antes)})`
    if (c.tipo === 'agotado') return `${n} se agotó y lo quitamos`
    if (c.tipo === 'no-existe') return `${n} ya no está en el menú y lo quitamos`
    return `${n} cambió sus opciones: elígelo de nuevo`
  })
}
