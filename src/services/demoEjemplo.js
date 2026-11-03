// 🍔 Lo que trae la demo recién reiniciada: comandas en la cocina, un domicilio por confirmar y
// métricas de la semana (guía «Demo de clientes» D14). Sin Firebase: lo usa el reinicio en el
// servidor (api/demo.js, guía «Blindaje» D5 · S12).
import { DEMO_PRODUCTOS } from '../dev/burgerDemo.js'
import { itemsDeComanda } from '../utils/comandaItems.js'

const prod = id => DEMO_PRODUCTOS.find(p => p.id === id)
// Una línea de carrito (la misma forma que arma el menú) → sirve para comandas y pedidos.
let n = 0
const linea = (id, cantidad = 1, seleccion = {}, comentario = '') =>
  ({ uid: `demo-${++n}`, producto: prod(id), cantidad, seleccion, comentario, notas: comentario })

// `ts(ms)` convierte milisegundos al Timestamp de quien escribe (el cliente o firebase-admin).
export function comandasDeEjemplo(ts) {
  const ahora = Date.now()
  const hace = min => ts(ahora - min * 60000)
  const mesero = { email: 'ana@burgerdemo.co', nombre: 'Ana (mesera)' }
  const base = (id, minutos, destino, lineas, extra = {}) => {
    const items = itemsDeComanda(lineas)
    return [id, {
      destino, items, estado: 'activa', origen: 'mesero', creadaPor: mesero,
      total: items.reduce((s, it) => s + (it.precio || 0), 0),
      cantidadItems: items.reduce((s, it) => s + (it.cantidad || 0), 0),
      creadaEn: hace(minutos), cerradaEn: null, porCobrar: true, ...extra,
    }]
  }
  const c = [
    base('demo-mesa-4', 12, { tipo: 'mesa', mesa: '4', nombre: null }, [
      linea('doble-queso', 1, { grupos: { 'g-presentacion': ['con-papas'], 'g-punto': ['bien-asada'] } }, 'Sin pepinillos'),
      linea('clasica', 1, { grupos: { 'g-presentacion': ['sola'], 'g-punto': ['medio'] } }),
      linea('limonada', 2, { varianteId: 'coco' }),
    ]),
    base('demo-mesa-7', 6, { tipo: 'mesa', mesa: '7', nombre: 'Laura' }, [
      linea('salchipapa-mixta', 1, { varianteId: 'para-dos', grupos: { 'g-salsas': ['rosada', 'bbq'] } }),
      linea('malteada', 1, { varianteId: 'chocolate' }),
    ], { origen: 'qr', creadaPor: { email: '', nombre: 'Laura (desde la mesa)' } }),
    base('demo-llevar', 2, { tipo: 'llevar', mesa: null, nombre: 'Carlos' }, [
      linea('combo-clasico', 2, { grupos: { 'g-punto': ['tres-cuartos'], 'g-bebida': ['gaseosa'] } }),
    ]),
  ]
  // La primera ya tiene un plato tachado: se ve cómo va la cocina por tandas.
  c[0][1].items[2].hecho = true
  return c
}

export function metricasDeEjemplo() {
  const docs = []
  let visitas = 0, pedidos = 0, monto = 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const finDe = [5, 6, 0].includes(d.getDay())
    const v = (finDe ? 190 : 120) + ((i * 37) % 45)
    const p = Math.round(v * (finDe ? 0.24 : 0.18))
    const m = p * (31000 + ((i * 1700) % 6000))
    visitas += v; pedidos += p; monto += m
    docs.push([`d_${fecha}`, { fecha, visitas: v, pedidos: p, monto: m }])
  }
  docs.push(['total', { visitas: visitas * 4, pedidos: pedidos * 4, monto: monto * 4 }])
  return docs
}

// El domicilio «por confirmar» de ejemplo (sin teléfono: confirmarlo no abre el WhatsApp de nadie).
export function pedidoDeEjemplo() {
  const items = [linea('bbq-tocineta', 2, { grupos: { 'g-presentacion': ['con-papas'], 'g-punto': ['tres-cuartos'] } }), linea('gaseosa', 1, { varianteId: '15' })]
  const subtotal = 2 * (24000 + 4000) + 8000
  return {
    id: 'demo-domicilio-1', codigo: 'BD-7K2Q',
    pedido: {
      items, entrega: 'domicilio',
      cliente: { nombre: 'Juan Pérez', telefono: '', direccion: 'Calle 72 # 10-35, apto 402', coord: { lat: 4.6553, lng: -74.0590 } },
      pago: { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo', cashAmount: 70000 },
      domicilio: { ok: true, costo: 3500 }, notas: 'Timbre dañado, llamar al llegar',
      subtotal, total: subtotal + 3500,
    },
  }
}
