// 🧾 Cómo se guarda un pedido de la app (domicilio y recoger) y su resumen público.
// Sin Firebase: lo usan la app (services/pedidos.js, motor demo) y el servidor (api/pedido.js),
// así los dos escriben exactamente lo mismo. Ver services/pedidos.js para el modelo completo.
import { precioItem } from './price.js'
import { resumenSeleccion } from './selectionSummary.js'

export const primerNombre = n => String(n || '').trim().split(/\s+/)[0] || ''

// Ítems del carrito del cliente → como se guardan en el pedido.
export function itemsDePedido(items) {
  return (items || []).map((it, i) => ({
    uid: it.uid || `p${i}`,
    productoId: it.producto?.id || '',
    nombre: it.producto?.nombre || 'Producto',
    cantidad: it.cantidad || 1,
    opciones: resumenSeleccion(it.producto, it.seleccion) || '',
    seleccion: it.seleccion || {},
    precio: precioItem(it),            // total de la línea (unitario × cantidad)
    notas: it.notas || '',
    descripcion: it.producto?.descripcion || '',
  }))
}

// El pedido completo (doc privado).
export function armarPedido(local, pedido, codigo) {
  // `lineas`: ya rehechas por el servidor con el precio del menú (api/pedido.js). Si no, del carrito.
  const items = pedido.lineas || itemsDePedido(pedido.items)
  return {
    codigo: codigo || '',
    estado: 'nuevo',
    entrega: pedido.entrega || 'recoger',
    // Ya sumó a los contadores por tipo de stats (domicilios/recoger): el script que pasa los pedidos
    // viejos a esos contadores se salta los que lo traen, así nunca se cuentan dos veces.
    enStats: true,
    localId: local.id,
    localNombre: local.nombre || '',
    localSlug: local.slug || '',
    localIcono: local.icono || local.logo || '',
    cliente: {
      nombre: pedido.cliente?.nombre || '',
      telefono: pedido.cliente?.telefono || '',
      direccion: pedido.cliente?.direccion || '',
      coord: pedido.cliente?.coord || null,
    },
    items,
    notas: pedido.notas || '',
    subtotal: pedido.subtotal || 0,
    domicilio: pedido.entrega === 'domicilio' ? (pedido.domicilio?.costo ?? 0) : 0,
    domicilioAConvenir: !!pedido.domicilioAConvenir,
    metodoPago: pedido.pago?.id || null,
    metodoPagoNombre: pedido.pago?.nombre || '',
    efectivoCon: pedido.pago?.tipo === 'efectivo' ? (pedido.pago?.cashAmount || 0) : 0,
    total: pedido.total || 0,
    cantidadItems: items.reduce((s, it) => s + it.cantidad, 0),
  }
}

// Lo que ve el cliente (y cualquiera con el link): SIN teléfono, dirección ni coordenadas.
export function publicoDe(p) {
  return {
    codigo: p.codigo,
    estado: p.estado,
    entrega: p.entrega,
    localSlug: p.localSlug,
    localNombre: p.localNombre,
    clienteNombre: primerNombre(p.cliente?.nombre),
    items: (p.items || []).filter(it => !it.quitado).map(({ nombre, cantidad, opciones, notas, precio }) => ({ nombre, cantidad, opciones, notas, precio })),
    subtotal: p.subtotal || 0,
    domicilio: p.domicilio || 0,
    domicilioAConvenir: !!p.domicilioAConvenir,
    total: p.total || 0,
    metodoPagoNombre: p.metodoPagoNombre || '',
  }
}
