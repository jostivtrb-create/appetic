// 🍛→🏠 El pedido de vuelta a La Gran Esquina.
//
// El cliente arma su almuerzo aquí, en Appetic. Pero quien lo tiene que
// cocinar, cobrar y descontar del inventario es la app del negocio.
//
// Este archivo hace el viaje de vuelta: coge el carrito de Appetic y lo deja
// escrito en La Gran Esquina con la forma exacta que su pantalla de comandas
// ya espera. De ahí en adelante todo el camino existe desde antes: Andrés abre
// el link, confirma, y el almuerzo entra a la cocina enganchado al turno de
// caja abierto.
//
// ── Qué se manda y qué no ──
//
// NO se manda plata. Appetic no cobra: el metodo de pago viaja como un aviso
// —"va a pagar con Nequi"— y el cobro de verdad lo hace la caja. Por eso el
// recargo va en cero: el que corresponda lo pone la cajera al cobrar, con sus
// reglas, y así el cierre del turno cuadra igual que siempre.
//
// ── Las migas ──
//
// Cada plato que arma el traductor de menú trae un campo `lge` con lo que aquí
// hace falta para rehacerlo: lo que va fijo (el arroz que nadie eligió porque
// no se preguntó), de qué combo salió, y en las proteínas el producto del
// inventario que hay que descontar. Appetic los ignora; solo viajan.
//
// ── Si falla, el pedido no se pierde ──
//
// Es best-effort. Si esta escritura falla, el cliente igual manda su WhatsApp
// con todo el pedido escrito y en el local lo teclean a mano, como cualquier
// pedido por teléfono. Lo que no puede pasar es que el cliente se quede
// esperando por esto.

import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { dbLaGranEsquina } from '../config/firebaseLaGranEsquina'

/** El pago de Appetic dicho como lo entiende La Gran Esquina. */
function comoVaAPagar(pago) {
  if (pago?.tipo === 'efectivo') return 'cash'
  if (pago?.tipo === 'transferencia') return 'transfer'
  return null
}

/**
 * Reparte las opciones que eligió el cliente entre las partes del plato y las
 * adiciones, que allá son líneas propias del pedido.
 */
function repartirOpciones(producto, seleccion) {
  const elegidoPorGrupo = seleccion?.grupos || {}
  const selections = { ...(producto.lge?.fijos || {}) }
  const adiciones = []
  // "Sin sopa, mejor huevo" → allá eso NO es una selección, es un REEMPLAZO:
  // la sopa queda vacía y aparte se anota qué quiere en su lugar. La cocina lo
  // lee así desde siempre, y por eso se traduce en vez de mandar el texto.
  const replacements = {}

  for (const grupo of producto.gruposOpciones || []) {
    const ids = elegidoPorGrupo[grupo.id] || []
    if (ids.length === 0) continue

    const opciones = ids
      .map(id => (grupo.opciones || []).find(o => o.id === id))
      .filter(Boolean)

    if (grupo.id === 'g-adiciones') {
      for (const o of opciones) if (o.lgeAddon) adiciones.push(o.lgeAddon)
      continue
    }

    // El id del grupo es 'g-' + la categoría de allá (g-protein → protein),
    // así que no hace falta una tabla de equivalencias que mantener.
    const categoria = grupo.id.replace(/^g-/, '')

    // ¿Pidió quitarlo, o cambiarlo por otra cosa?
    const reemplazo = opciones.find(o => o.lgeReemplazo)
    const quitar = opciones.some(o => o.lgeQuitar)
    if (reemplazo || quitar) {
      // Vacía de verdad: la cocina lee "SIN SOPA" y no un plato inventado.
      selections[categoria] = null
      if (reemplazo) replacements[categoria] = reemplazo.lgeReemplazo
      continue
    }

    const partes = opciones.map(o => ({
      id: o.id,
      name: o.nombre,
      ...(o.productId ? { productId: o.productId } : {}),
      ...(o.id === 'rancheros' ? { isRanchero: true } : {}),
    }))

    // El principio admite mixto —mitad fríjol, mitad pasta— y entonces viaja
    // como lista. Todo lo demás es una sola cosa.
    selections[categoria] = partes.length === 1 ? partes[0] : partes
  }

  return { selections, adiciones, replacements }
}

/** Convierte UN item del carrito en las líneas que entiende La Gran Esquina. */
function lineasDeUnItem(item) {
  const producto = item.producto
  const tipo = producto?.lge?.tipo
  if (!tipo) return []

  const cuantos = Math.max(1, Number(item.cantidad) || 1)
  const nota = (item.notas || '').toString().trim() || null
  const { selections, adiciones, replacements } = repartirOpciones(producto, item.seleccion)
  const hayReemplazos = Object.keys(replacements).length > 0

  const lineas = []

  // Allá cada plato es una línea suya: dos almuerzos son dos comandas, porque
  // cada uno se prepara, se marca listo y se entrega por separado.
  for (let i = 0; i < cuantos; i++) {
    if (tipo === 'breakfast') {
      lineas.push({
        kind: 'breakfast',
        selections,
        price: Number(producto.precio) || 0,
        ...(producto.lge.comboId ? { comboId: producto.lge.comboId } : {}),
        ...(producto.lge.comboName ? { comboName: producto.lge.comboName } : {}),
        ...(nota ? { note: nota } : {}),
      })
    } else {
      lineas.push({
        kind: tipo === 'especial' ? 'especial' : 'corriente',
        selections: tipo === 'especial' && producto.lge.especial
          ? { ...selections, especial: producto.lge.especial }
          : selections,
        price: Number(producto.precio) || 0,
        ...(hayReemplazos ? { replacements } : {}),
        ...(nota ? { note: nota } : {}),
      })
    }
  }

  // Las adiciones van aparte y con su cantidad: si pidió dos almuerzos con
  // sopa extra, son dos sopas. Allá cada una descuenta lo suyo del inventario.
  for (const ad of adiciones) {
    lineas.push({
      kind: 'addon',
      addonType: ad.type,
      quantity: cuantos,
      unitPrice: Number(ad.unitPrice) || 0,
      price: (Number(ad.unitPrice) || 0) * cuantos,
      ...(ad.type === 'protein'
        ? { proteinId: ad.proteinId || null, proteinName: ad.proteinName || null }
        : {}),
    })
  }

  return lineas
}

/**
 * Deja el pedido escrito en La Gran Esquina y devuelve su id, o null si no
 * había nada que mandar o algo falló.
 *
 * El id sirve para armar el link de confirmación que va en el WhatsApp: con un
 * toque, Andrés lo manda a la cocina sin teclear nada.
 */
export async function crearPedidoLaGranEsquina(items, pago) {
  const cart = (items || []).flatMap(lineasDeUnItem)
  if (cart.length === 0) return null

  const subtotal = cart.reduce((s, l) => s + (Number(l.price) || 0), 0)

  const ref = await addDoc(collection(dbLaGranEsquina(), 'customerOrders'), {
    cart,
    subtotal,
    // Appetic no cobra: el recargo que toque lo pone la caja al cobrar.
    surcharge: 0,
    total: subtotal,
    paymentMethod: comoVaAPagar(pago),
    status: 'pending',
    createdAt: serverTimestamp(),
    createdAtClient: Date.now(),
    // De dónde vino, para que en el local sepan que no lo tomaron por teléfono.
    origen: 'appetic',
  })
  return ref.id
}
