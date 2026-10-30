// 🧪 Cada PROCESO de la demo se vale solo (pedido del usuario, 30-oct): al empezarlo se crea, si
// hace falta, lo que esa persona necesita ver — sin obligar a hacer antes otro proceso.
//   • Mesero        → un pedido de la app «por confirmar».
//   • Cocina        → una comanda en la fila.
//   • Domiciliario  → un domicilio «listo para salir».
//   • Administrador → una comanda terminada, lista para cobrar.
// Usa los MISMOS servicios que la app (el visitante administra la demo), así que vale igual en la
// demo publicada (Firestore) y en la vista previa (?preview=1, en el navegador).
import { DEMO_LOCAL, DEMO_PRODUCTOS } from '../../dev/burgerDemo'
import { DEMO_SLUG } from '../../config/demo'
import { isDevSlug } from '../../dev'
import { comandasDe, itemsDeComanda } from '../../services/comandas'
import { pedidosDe, crearPedido } from '../../services/pedidos'

const prod = id => DEMO_PRODUCTOS.find(p => p.id === id)
let n = 0
const linea = (id, cantidad, seleccion = {}, notas = '') =>
  ({ uid: `ej-${Date.now()}-${++n}`, producto: prod(id), cantidad, seleccion, notas, comentario: notas })
const POR = { email: '', nombre: 'Demo' }

// Primer valor de un «escuchar…» (y se suelta).
function unaVez(escuchar) {
  return new Promise(resolve => {
    let parar = null, listo = false
    parar = escuchar(v => {
      if (listo) return
      listo = true
      resolve(v)
      setTimeout(() => parar?.(), 0)
    }, () => { if (!listo) { listo = true; resolve([]) } })
  })
}

async function pedidoDomicilio(api, nombre) {
  const items = [
    linea('bbq-tocineta', 1, { grupos: { 'g-presentacion': ['con-papas'], 'g-punto': ['tres-cuartos'] } }),
    linea('limonada', 1, { varianteId: 'coco' }),
  ]
  const subtotal = 24000 + 4000 + 9000
  const id = api.nuevoId()
  await crearPedido(DEMO_LOCAL, {
    items, entrega: 'domicilio',
    // Sin teléfono: confirmar o «voy en camino» no abre el WhatsApp de nadie real.
    cliente: { nombre, telefono: '', direccion: 'Calle 72 # 10-35, apto 402', coord: { lat: 4.6621, lng: -74.0639 } },
    pago: { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo', cashAmount: 50000 },
    domicilio: { ok: true, costo: 3500 }, notas: 'Timbre dañado, llamar al llegar',
    subtotal, total: subtotal + 3500,
  }, 'BD-' + Math.random().toString(36).slice(2, 6).toUpperCase(), id, { demo: isDevSlug(DEMO_SLUG) })
  return id
}

async function comandaMesa(com, mesa, ids) {
  const id = com.nuevoId()
  await com.crear({
    id, destino: { tipo: 'mesa', mesa, nombre: null },
    items: itemsDeComanda(ids),
    creadaPor: { email: '', nombre: 'Ana (mesera)' },
  })
  return id
}

export async function prepararProceso(proceso) {
  const demo = isDevSlug(DEMO_SLUG)
  const com = comandasDe(DEMO_SLUG, { demo })
  const ped = pedidosDe(DEMO_SLUG, { demo })
  try {
    if (proceso === 'mesero') {
      const porConfirmar = await unaVez(cb => ped.escucharPorConfirmar(cb))
      if (!porConfirmar.length) await pedidoDomicilio(ped, 'Juan Pérez')
    }
    if (proceso === 'cocina') {
      const activas = await unaVez(cb => com.escucharActivas(cb))
      if (!activas.filter(c => c.estado === 'activa').length) {
        await comandaMesa(com, '6', [
          linea('doble-queso', 1, { grupos: { 'g-presentacion': ['con-papas'], 'g-punto': ['bien-asada'] } }, 'Sin pepinillos'),
          linea('malteada', 2, { varianteId: 'chocolate' }),
        ])
      }
    }
    if (proceso === 'domiciliario') {
      const vivos = await unaVez(cb => ped.escucharDomicilios(cb))
      if (!vivos.some(p => p.estado === 'listo')) {
        // De punta a punta por los mismos pasos de la app: pedido → confirmado → cocina lo entrega → listo.
        const id = await pedidoDomicilio(ped, 'Laura Gómez')
        await ped.confirmar(id, POR)
        const c = await com.obtener(id)
        if (c) await com.entregar(c)
        await ped.cambiarEstado(id, 'listo')
      }
    }
    if (proceso === 'admin') {
      const porCobrar = await unaVez(cb => com.escucharPorCobrar(cb))
      if (!porCobrar.some(c => c.estado === 'entregada' && c.destino?.tipo !== 'domicilio')) {
        const id = await comandaMesa(com, '3', [
          linea('clasica', 2, { grupos: { 'g-presentacion': ['sola'], 'g-punto': ['medio'] } }),
          linea('gaseosa', 2, { varianteId: '400' }),
        ])
        const c = await com.obtener(id)
        if (c) await com.entregar(c)
      }
    }
  } catch (e) {
    console.warn('[demo] no se pudo preparar el proceso', proceso, e?.code || e)
  }
}
