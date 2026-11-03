// 🧾 Ítems del carrito → ítems de una comanda. Sin Firebase: lo usan services/comandas.js y el
// reinicio de la demo en el servidor (api/demo.js).
import { precioItem } from './price.js'
import { resumenSeleccion } from './selectionSummary.js'

// Convierte los ítems del carrito del mesero al formato de la comanda.
export function itemsDeComanda(carrito) {
  return carrito.map(it => ({
    uid: it.uid,
    productoId: it.producto?.id || '',
    nombre: it.producto?.nombre || 'Producto',
    cantidad: it.cantidad || 1,
    opciones: resumenSeleccion(it.producto, it.seleccion) || '',
    seleccion: it.seleccion || {},
    comentario: (it.comentario || '').trim(),
    // «¿Qué lleva?» para la cocina: la descripción del plato tal como estaba al enviarse.
    descripcion: it.producto?.descripcion || '',
    precio: precioItem(it),
    hecho: false,
  }))
}
