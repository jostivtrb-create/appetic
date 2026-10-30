// 🍔 «Reiniciar demo» (guía «Demo de clientes» D5 · D13 · D14).
//
// Lo usa SOLO el superadmin (firestore.rules: solo él borra comandas/pedidos/stats de la demo y
// puede volver a crear el local). Deja Burger Demo exactamente como en src/dev/burgerDemo.js:
//   1. Borra comandas, pedidos (y su resumen público), equipo, productos y stats.
//   2. Borra las fotos que subieron los visitantes (Storage locales/demo/…).
//   3. Escribe de nuevo el local y el menú.
//   4. Siembra 4 comandas en la cocina (con tiempos distintos) y un domicilio por confirmar.
//   5. Siembra métricas de ejemplo de los últimos 7 días.
import {
  collection, doc, getDoc, getDocs, setDoc, writeBatch, Timestamp, serverTimestamp,
} from 'firebase/firestore'
import { ref, listAll, deleteObject } from 'firebase/storage'
import { db, storage } from '../config/firebase'
import { DEMO_LOCAL, DEMO_PRODUCTOS } from '../dev/burgerDemo'
import { DEMO_SLUG } from '../config/demo'
import { itemsDeComanda } from './comandas'
import { crearPedido } from './pedidos'

const ID = DEMO_SLUG
// pedidosPublicos no se puede listar (reglas): se borra por los mismos ids de los pedidos.
const SUBCOLECCIONES = ['comandas', 'pedidos', 'equipo', 'productos', 'stats']

async function vaciar(nombre) {
  const snap = await getDocs(collection(db, 'locales', ID, nombre))
  for (let i = 0; i < snap.docs.length; i += 200) {
    const b = writeBatch(db)
    snap.docs.slice(i, i + 200).forEach(d => {
      b.delete(d.ref)
      if (nombre === 'pedidos') b.delete(doc(db, 'locales', ID, 'pedidosPublicos', d.id))
    })
    await b.commit()
  }
  return snap.size
}

// Borra lo que subieron los visitantes, MENOS las fotos fijadas como base de la demo.
async function borrarCarpeta(r, guardar = new Set()) {
  const { items, prefixes } = await listAll(r)
  await Promise.all(items.filter(it => !guardar.has(it.fullPath)).map(it => deleteObject(it).catch(() => {})))
  for (const p of prefixes) await borrarCarpeta(p, guardar)
  return items.length
}

// 📌 FOTOS BASE: las que subimos NOSOTROS por el panel de la demo (platos, portada, logo).
// «Fijar fotos» las guarda en config/demoBase; «Reiniciar» las vuelve a poner y no las borra.
const BASE = () => doc(db, 'config', 'demoBase')
const rutaDe = url => { try { return decodeURIComponent(new URL(url).pathname.split('/o/')[1] || '') } catch { return '' } }

export async function fijarFotosBase() {
  const [l, prods] = await Promise.all([getDoc(doc(db, 'locales', ID)), getDocs(collection(db, 'locales', ID, 'productos'))])
  const local = l.data() || {}
  const fotos = {}
  prods.docs.forEach(d => { const f = d.data().foto; if (f) fotos[d.id] = f })
  const base = { fotos, banner: local.banner || '', logo: local.logo || '', icono: local.icono || '', fijadaEn: serverTimestamp() }
  await setDoc(BASE(), base)
  return Object.keys(fotos).length
}

async function leerBase() {
  try { return (await getDoc(BASE())).data() || null } catch { return null }
}

const prod = id => DEMO_PRODUCTOS.find(p => p.id === id)
// Una línea de carrito (la misma forma que arma el menú) → sirve para comandas y pedidos.
let n = 0
const linea = (id, cantidad = 1, seleccion = {}, comentario = '') =>
  ({ uid: `demo-${++n}`, producto: prod(id), cantidad, seleccion, comentario, notas: comentario })

function comandasDeEjemplo() {
  const ahora = Date.now()
  const hace = min => Timestamp.fromMillis(ahora - min * 60000)
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

function metricasDeEjemplo() {
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

export async function reiniciarDemo(onPaso = () => {}) {
  const base = await leerBase()
  const fotosBase = base?.fotos || {}
  const guardar = new Set([...Object.values(fotosBase), base?.banner, base?.logo, base?.icono].filter(Boolean).map(rutaDe).filter(Boolean))

  onPaso('Borrando lo que hicieron los visitantes…')
  for (const s of SUBCOLECCIONES) await vaciar(s)
  onPaso('Borrando fotos subidas…')
  await borrarCarpeta(ref(storage, `locales/${ID}`), guardar).catch(() => 0)

  onPaso('Dejando el local y el menú como nuevos…')
  await setDoc(doc(db, 'locales', ID), {
    ...DEMO_LOCAL,
    ...(base?.banner ? { banner: base.banner } : {}),
    ...(base?.logo ? { logo: base.logo } : {}),
    ...(base?.icono ? { icono: base.icono } : {}),
    reiniciadaEn: serverTimestamp(),
  })
  const b = writeBatch(db)
  for (const { id, ...p } of DEMO_PRODUCTOS) b.set(doc(db, 'locales', ID, 'productos', id), { ...p, foto: fotosBase[id] || p.foto })
  await b.commit()

  onPaso('Poniendo comandas y un domicilio de ejemplo…')
  const bc = writeBatch(db)
  for (const [id, data] of comandasDeEjemplo()) bc.set(doc(db, 'locales', ID, 'comandas', id), data)
  await bc.commit()
  const items = [linea('bbq-tocineta', 2, { grupos: { 'g-presentacion': ['con-papas'], 'g-punto': ['tres-cuartos'] } }), linea('gaseosa', 1, { varianteId: '15' })]
  const subtotal = 2 * (24000 + 4000) + 8000
  await crearPedido(DEMO_LOCAL, {
    items, entrega: 'domicilio',
    cliente: { nombre: 'Juan Pérez', telefono: '', // sin teléfono: confirmarlo no abre el WhatsApp de nadie real
       direccion: 'Calle 72 # 10-35, apto 402', coord: { lat: 4.6553, lng: -74.0590 } },
    pago: { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo', cashAmount: 70000 },
    domicilio: { ok: true, costo: 3500 }, notas: 'Timbre dañado, llamar al llegar',
    subtotal, total: subtotal + 3500,
  }, 'BD-7K2Q', 'demo-domicilio-1')

  onPaso('Poniendo métricas de ejemplo…')
  const bs = writeBatch(db)
  for (const [id, data] of metricasDeEjemplo()) bs.set(doc(db, 'locales', ID, 'stats', id), data)
  await bs.commit()
  onPaso('¡Listo! La demo quedó como nueva.')
}
