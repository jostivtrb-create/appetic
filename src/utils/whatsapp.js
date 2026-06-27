import { cop } from './money'
import { precioItem } from './price'
import { resumenSeleccion } from './selectionSummary'
import { mapsUrl } from './geo'

// Normaliza un número colombiano a formato wa.me (57XXXXXXXXXX)
export function normalizarTel(numero) {
  const limpio = String(numero || '').replace(/\D/g, '')
  if (!limpio) return ''
  return limpio.startsWith('57') ? limpio : `57${limpio}`
}

// Construye el texto del pedido para el WhatsApp del local.
export function textoPedido(local, pedido) {
  const { items, entrega, cliente, pago, domicilio, notas, subtotal, total } = pedido
  const L = []

  L.push(`*Nuevo pedido — ${local.nombre}* 🍔`)
  L.push('')
  L.push(`👤 *Cliente:* ${cliente.nombre}`)
  if (cliente.telefono) L.push(`📞 *Tel:* ${cliente.telefono}`)

  if (entrega === 'domicilio') {
    L.push('🛵 *Entrega:* Domicilio')
    if (cliente.direccion) L.push(`📍 *Dirección:* ${cliente.direccion}`)
    if (cliente.coord) L.push(`🗺️ Ubicación: ${mapsUrl(cliente.coord)}`)
  } else {
    L.push('🏪 *Entrega:* Recoger en el local')
  }

  // Pago
  let pagoTxt = pago?.nombre || '—'
  if (pago?.tipo === 'efectivo' && pago.cashAmount) {
    const cambio = Math.max(0, pago.cashAmount - total)
    pagoTxt = `Efectivo (paga con ${cop(pago.cashAmount)}, cambio ${cop(cambio)})`
  } else if (pago?.llave) {
    pagoTxt = `${pago.nombre}`
  }
  L.push(`💳 *Pago:* ${pagoTxt}`)

  // Items
  L.push('')
  L.push('*Tu pedido:*')
  for (const it of items) {
    const resumen = resumenSeleccion(it.producto, it.seleccion)
    L.push(`• ${it.cantidad}x ${it.producto.nombre}${resumen ? ` (${resumen})` : ''} — ${cop(precioItem(it))}`)
    if (it.notas) L.push(`   _“${it.notas}”_`)
  }

  // Totales
  L.push('')
  L.push(`Subtotal: ${cop(subtotal)}`)
  if (entrega === 'domicilio' && domicilio?.ok) L.push(`Domicilio: ${cop(domicilio.costo)}`)
  L.push(`*Total: ${cop(total)}*`)

  if (notas) {
    L.push('')
    L.push(`📝 *Notas:* ${notas}`)
  }

  L.push('')
  L.push('_Pedido enviado con Appetic 🧡_')

  return L.join('\n')
}

// URL final wa.me con el mensaje codificado (emojis se ven bien con encodeURIComponent).
export function urlPedidoWhatsApp(local, pedido) {
  const tel = normalizarTel(local.whatsapp)
  const texto = encodeURIComponent(textoPedido(local, pedido))
  return `https://wa.me/${tel}?text=${texto}`
}
