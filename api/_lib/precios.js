// 🧮 El precio lo pone el MENÚ, no el celular del cliente (guía «Blindaje» D1 · D2).
//
// Recibe las líneas que manda el navegador y los productos tal como están HOY en Firestore, y
// devuelve las líneas rehechas aquí: nombre, opciones, descripción y precio salen del menú, nunca
// del cliente. Si algo no cuadra (cambió el precio, se agotó, ya no existe, la opción no vale) no
// se adivina: se devuelve en `cambios` para que el cliente vea su carrito actualizado y decida.
//
// Sin Firebase ni React: se prueba con `node prueba-appetic.mjs`.
import { precioUnitario, validarSeleccion, grupoAplica } from '../../src/utils/price.js'
import { resumenSeleccion } from '../../src/utils/selectionSummary.js'

export const MAX_LINEAS = 60
export const MAX_CANTIDAD = 99
const texto = (v, max) => String(v ?? '').trim().slice(0, max)

// ¿Todo lo elegido existe en el producto de hoy? (Una opción borrada valdría $0 sin avisar.)
function eleccionesExisten(producto, seleccion) {
  if (seleccion.varianteId && !(producto.variantes || []).some(v => v.id === seleccion.varianteId)) return false
  const grupos = seleccion.grupos || {}
  for (const [gid, ids] of Object.entries(grupos)) {
    if (!Array.isArray(ids)) return false
    if (!ids.length) continue
    const g = (producto.gruposOpciones || []).find(x => x.id === gid)
    if (!g || !grupoAplica(g, seleccion)) return false
    if (ids.some(id => !(g.opciones || []).some(o => o.id === id))) return false
  }
  return true
}

// Solo lo que el cliente puede elegir: tamaño, opciones por grupo y lo que no lleva.
function limpiarSeleccion(s) {
  const sel = {}
  if (s && typeof s === 'object') {
    if (typeof s.varianteId === 'string') sel.varianteId = s.varianteId
    if (s.grupos && typeof s.grupos === 'object') {
      sel.grupos = {}
      for (const [k, v] of Object.entries(s.grupos)) if (Array.isArray(v)) sel.grupos[k] = v.filter(x => typeof x === 'string').slice(0, 30)
    }
    if (Array.isArray(s.noLleva)) sel.noLleva = s.noLleva.filter(x => typeof x === 'string').slice(0, 30)
  }
  return sel
}

/**
 * @param {Array} lineas    [{ uid, productoId, cantidad, seleccion, notas, precio }] del navegador
 * @param {Object} productos { [id]: producto } del menú de hoy (con el almuerzo del día si aplica)
 * @returns {{ items: Array, cambios: Array, subtotal: number, error?: string }}
 *   items:   líneas rehechas con el precio del menú (solo si no hay cambios)
 *   cambios: [{ uid, productoId, tipo: 'precio'|'agotado'|'no-existe'|'opciones', nombre, antes, ahora }]
 */
export function recalcular(lineas, productos) {
  if (!Array.isArray(lineas) || !lineas.length) return { items: [], cambios: [], subtotal: 0, error: 'vacio' }
  if (lineas.length > MAX_LINEAS) return { items: [], cambios: [], subtotal: 0, error: 'demasiadas-lineas' }
  const items = []
  const cambios = []
  lineas.forEach((l, i) => {
    const uid = texto(l?.uid, 60) || `l${i}`
    const productoId = texto(l?.productoId, 120)
    const cantidad = Math.trunc(Number(l?.cantidad))
    if (!(cantidad >= 1 && cantidad <= MAX_CANTIDAD)) { cambios.push({ uid, productoId, tipo: 'opciones', nombre: '' }); return }
    const producto = productos[productoId]
    if (!producto) { cambios.push({ uid, productoId, tipo: 'no-existe', nombre: texto(l?.nombre, 80) }); return }
    if (producto.disponible === false) { cambios.push({ uid, productoId, tipo: 'agotado', nombre: producto.nombre }); return }
    const seleccion = limpiarSeleccion(l?.seleccion)
    if (validarSeleccion(producto, seleccion) || !eleccionesExisten(producto, seleccion)) {
      cambios.push({ uid, productoId, tipo: 'opciones', nombre: producto.nombre }); return
    }
    const precio = precioUnitario(producto, seleccion) * cantidad
    const antes = Number(l?.precio)
    if (Number.isFinite(antes) && antes !== precio) cambios.push({ uid, productoId, tipo: 'precio', nombre: producto.nombre, antes, ahora: precio })
    items.push({
      uid, productoId, nombre: producto.nombre || 'Producto', cantidad,
      opciones: resumenSeleccion(producto, seleccion) || '', seleccion,
      notas: texto(l?.notas, 200), descripcion: texto(producto.descripcion, 300), precio,
    })
  })
  const subtotal = items.reduce((s, it) => s + it.precio, 0)
  return { items: cambios.length ? [] : items, cambios, subtotal }
}
