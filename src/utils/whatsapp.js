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

// Mensaje de confirmación que el LOCAL le envía al CLIENTE (con un toque desde el
// link que va en el pedido). Confirma la recepción y valida de paso que el WhatsApp
// del cliente sea correcto (si el link no abre chat, el número estaba mal).
export function mensajeRespuestaCliente(local, pedido) {
  // Sin nombre saludamos a secas: el fallback anterior era 'Hola' y salía "¡Hola Hola!".
  const primerNombre = (pedido?.cliente?.nombre || '').trim().split(/\s+/)[0]
  const saludo = primerNombre ? `¡Hola ${primerNombre}!` : '¡Hola!'
  const cod = pedido?.codigo ? `*${pedido.codigo}* ` : ''
  return `${saludo} \u{1F9E1} Recibimos tu pedido ${cod}hecho con Appetic y ya lo estamos preparando. Haremos lo posible por tenerlo listo lo más pronto — te pedimos un poquito de paciencia. ¡Gracias por pedir en ${local.nombre}! \u{1F6F5}`
}

// Endpoint correcto de WhatsApp según el dispositivo (Regla 3), con el texto ya
// codificado. Lo usan tanto el pedido al local como la respuesta al cliente.
export function urlWhatsApp(tel, texto) {
  const t = encodeURIComponent(texto)
  return isMobileBrowser()
    ? `whatsapp://send?phone=${tel}&text=${t}`
    : `https://api.whatsapp.com/send?phone=${tel}&text=${t}`
}

// Link CORTO para que el local le responda al cliente de un toque.
// Antes metíamos el mensaje entero dentro de la URL (?text=...) y quedaba un muro
// de ~450 caracteres dentro del WhatsApp del pedido. Ahora apunta a /r/… y es esa
// ruta la que arma el texto y abre WhatsApp (ver pages/Responder).
// Va todo en el path (no en Firestore) porque el dueño no puede leer los pedidos
// según firestore.rules, y abrirlos al público expondría datos del cliente.
// De paso arregla los emojis en PC: /r/ usa api.whatsapp.com y no wa.me (Regla 3).
export function linkRespuestaCliente(local, pedido) {
  const tel = normalizarTel(pedido?.cliente?.telefono)
  if (!tel || !local?.slug) return ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  // '-' = "este dato no vino"; la ruta lo entiende y saluda sin nombre / sin código.
  const cod = pedido?.codigo || '-'
  const nombre = (pedido?.cliente?.nombre || '').trim().split(/\s+/)[0] || '-'
  return `${origin}/r/${local.slug}/${tel}/${encodeURIComponent(cod)}/${encodeURIComponent(nombre)}`
}

// Construye el texto del pedido para el WhatsApp del local.
export function textoPedido(local, pedido) {
  const { items, entrega, cliente, pago, domicilio, domicilioAConvenir, notas, subtotal, total } = pedido
  const L = []

  L.push(`*Nuevo pedido — ${local.nombre}* \u{1F354}`)
  if (pedido.codigo) L.push(`\u{1F516} *Código:* ${pedido.codigo}`)
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

  // Link para que el LOCAL responda al cliente de un toque (y confirme su WhatsApp).
  const linkResp = linkRespuestaCliente(local, pedido)
  if (linkResp) {
    L.push('')
    L.push('\u{1F4AC} *Responder al cliente (toca aquí):*')
    L.push(linkResp)
  }

  L.push('')
  L.push('_Pedido enviado con Appetic \u{1F9E1}_')

  return L.join('\n')
}

// URL final con el mensaje codificado. Endpoint según dispositivo (Regla 3):
//   móvil -> whatsapp://send  ·  PC -> api.whatsapp.com/send (NO wa.me).
export function urlPedidoWhatsApp(local, pedido) {
  return urlWhatsApp(normalizarTel(local.whatsapp), textoPedido(local, pedido))
}

// Abre WhatsApp con el pedido. En móvil navega al deep link; en PC abre pestaña.
export function abrirPedidoWhatsApp(local, pedido) {
  const url = urlPedidoWhatsApp(local, pedido)
  if (isMobileBrowser()) window.location.href = url
  else window.open(url, '_blank')
  return url
}
