// 🧾 Historial de pedidos guardado en el PROPIO DISPOSITIVO (localStorage).
// Sin nube, sin costo de Firebase: cada pedido se guarda al enviarlo por
// WhatsApp, para que el cliente pueda verlos y repetirlos. Es por dispositivo
// (no se sincroniza si cambia de teléfono) — esa sería la versión "en la nube".
const KEY = 'appetic_historial'
const MAX = 40 // guardamos los últimos 40; los viejos se caen solos.

export function getHistorial() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

// Guarda un pedido en el historial. Best-effort: si algo falla (sin espacio,
// modo incógnito…) NO debe romper el flujo del pedido.
export function guardarEnHistorial(local, pedido) {
  try {
    const registro = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fecha: Date.now(),
      localSlug: local.slug,
      localNombre: local.nombre,
      localLogo: local.icono || local.logo || '',
      entrega: pedido.entrega,
      total: pedido.total,
      subtotal: pedido.subtotal,
      items: (pedido.items || []).map(it => ({
        nombre: it.producto?.nombre || 'Producto',
        cantidad: it.cantidad || 1,
      })),
    }
    const arr = getHistorial()
    arr.unshift(registro)
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX)))
    return true
  } catch {
    return false
  }
}

export function borrarHistorial() {
  try { localStorage.removeItem(KEY) } catch { /* nada */ }
}
