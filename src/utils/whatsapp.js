import { cop } from './money'
import { precioItem } from './price'
import { resumenSeleccion } from './selectionSummary'
import { mapsUrl } from './geo'

// Mensajes de WhatsApp a prueba de rombos (ver skill Mensajes_Whatsapp):
//   Regla 1 — emojis como escapes \u (no el carácter literal) -> el archivo queda
//             ASCII puro y el emoji no se corrompe aunque se re-guarde en otro encoding.
//   Regla 2 — el texto se pasa por encodeURIComponent (una sola vez).
//   Regla 3 — endpoint según dispositivo: PC usa api.whatsapp.com/send (NO wa.me,
//             que corrompe los emojis en WhatsApp Web); móvil usa el deep link.

// ¿El navegador es de un celular? (para elegir el endpoint correcto)
export function isMobileBrowser() {
  return typeof navigator !== 'undefined' &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent || '')
}

// Normaliza un número colombiano a 57XXXXXXXXXX (sin '+', sin espacios).
export function normalizarTel(numero) {
  const limpio = String(numero || '').replace(/\D/g, '')
  if (!limpio) return ''
  return limpio.startsWith('57') ? limpio : `57${limpio}`
}

// Construye el texto del pedido para el WhatsApp del local.
export function textoPedido(local, pedido) {
  const { items, entrega, cliente, pago, domicilio, domicilioAConvenir, notas, subtotal, total } = pedido
  const L = []

  L.push(`*Nuevo pedido — ${local.nombre}* \u{1F354}`)
  L.push('')
  L.push(`\u{1F464} *Cliente:* ${cliente.nombre}`)
  if (cliente.telefono) L.push(`\u{1F4DE} *Tel:* ${cliente.telefono}`)

  if (entrega === 'domicilio') {
    L.push('\u{1F6F5} *Entrega:* Domicilio')
    if (cliente.direccion) L.push(`\u{1F4CD} *Dirección:* ${cliente.direccion}`)
    if (cliente.coord) L.push(`\u{1F5FA} Ubicación: ${mapsUrl(cliente.coord)}`)
    if (domicilioAConvenir) L.push('\u{26A0}\u{FE0F} *Domicilio A CONVENIR* (no se pudo tomar la ubicación del cliente)')
  } else {
    L.push('\u{1F3EA} *Entrega:* Recoger en el local')
  }

  // Pago
  let pagoTxt = pago?.nombre || '—'
  if (pago?.tipo === 'efectivo' && pago.cashAmount) {
    const cambio = Math.max(0, pago.cashAmount - total)
    pagoTxt = `Efectivo (paga con ${cop(pago.cashAmount)}, cambio ${cop(cambio)})`
  } else if (pago?.llave) {
    pagoTxt = `${pago.nombre}`
  }
  L.push(`\u{1F4B3} *Pago:* ${pagoTxt}`)

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
  else if (domicilioAConvenir) L.push('Domicilio: a convenir (NO incluido en el total)')
  L.push(`*Total: ${cop(total)}*`)
  if (domicilioAConvenir) L.push('_El total NO incluye el domicilio._')

  if (notas) {
    L.push('')
    L.push(`\u{1F4DD} *Notas:* ${notas}`)
  }

  L.push('')
  L.push('_Pedido enviado con Appetic \u{1F9E1}_')

  return L.join('\n')
}

// URL final con el mensaje codificado. Endpoint según dispositivo (Regla 3):
//   móvil -> whatsapp://send  ·  PC -> api.whatsapp.com/send (NO wa.me).
export function urlPedidoWhatsApp(local, pedido) {
  const tel = normalizarTel(local.whatsapp)
  const texto = encodeURIComponent(textoPedido(local, pedido))
  return isMobileBrowser()
    ? `whatsapp://send?phone=${tel}&text=${texto}`
    : `https://api.whatsapp.com/send?phone=${tel}&text=${texto}`
}

// Abre WhatsApp con el pedido. En móvil navega al deep link; en PC abre pestaña.
export function abrirPedidoWhatsApp(local, pedido) {
  const url = urlPedidoWhatsApp(local, pedido)
  if (isMobileBrowser()) window.location.href = url
  else window.open(url, '_blank')
  return url
}
