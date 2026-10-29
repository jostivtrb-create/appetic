// 🧾 PEDIDOS DE LA APP (domicilio y recoger) — guía «Mesero y Comandas», paso 3.
//
//   locales/{id}/pedidos/{pid}          → el pedido COMPLETO (teléfono, dirección, pago…). Fuente de
//                                         verdad del precio. Lo lee y mueve el personal del local.
//   locales/{id}/pedidosPublicos/{pid}  → RESUMEN sin teléfono ni dirección, para «Mi pedido» del
//                                         cliente (el link puede reenviarse). Solo se lee por su id.
//
// Los dos se crean con el MISMO id, generado antes de abrir WhatsApp (el link va en el mensaje).
//
// Estados (S24): nuevo → en-cocina → listo → en-camino → entregado · o rechazado.
//   Recoger termina en «listo» (listo para recoger).
//
// Al confirmar se crea la COMANDA con el mismo id del pedido (confirmar dos veces no duplica).
//
// Hay dos motores con la misma interfaz, como en comandas.js: Firestore y DEMO (vista previa
// ?preview=1, en el navegador: así probar la vista previa no ensucia los pedidos reales).
import {
  collection, doc, setDoc, getDoc, onSnapshot, query, where, orderBy, limit,
  serverTimestamp, Timestamp, writeBatch, runTransaction,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { registrarPedidoStats } from './stats'
import { precioItem } from '../utils/price'
import { resumenSeleccion } from '../utils/selectionSummary'

// Los pedidos se auto-borran a los 2 días (política TTL de Firestore sobre `ttl`).
const DIAS_VIDA = 2

export const ESTADOS_VIVOS_DOMICILIO = ['en-cocina', 'listo', 'en-camino']
export const primerNombre = n => String(n || '').trim().split(/\s+/)[0] || ''

// Ítems del carrito del cliente → como se guardan en el pedido.
function itemsDePedido(items) {
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
function armarPedido(local, pedido, codigo) {
  const items = itemsDePedido(pedido.items)
  return {
    codigo: codigo || '',
    estado: 'nuevo',
    entrega: pedido.entrega || 'recoger',
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
function publicoDe(p) {
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

// Comanda que sale de un pedido de la app (destino domicilio / recoger con el nombre del cliente).
function comandaDe(p, por) {
  const items = (p.items || []).map((it, i) => ({
    uid: it.uid || `p${i}`,
    productoId: it.productoId || '',
    nombre: it.nombre,
    cantidad: it.cantidad || 1,
    opciones: it.opciones || '',
    seleccion: it.seleccion || {},
    comentario: it.notas || '',
    descripcion: it.descripcion || '',
    precio: it.precio || 0,
    hecho: false,
  }))
  if (p.notas) items[0] = { ...items[0], comentario: [items[0].comentario, `Nota del pedido: ${p.notas}`].filter(Boolean).join(' · ') }
  return {
    destino: { tipo: p.entrega === 'domicilio' ? 'domicilio' : 'recoger', mesa: null, nombre: primerNombre(p.cliente?.nombre) || null },
    items,
    origen: 'app',
    pedidoId: p.id,
    codigo: p.codigo || '',
    creadaPor: por,
    total: items.reduce((s, it) => s + it.precio, 0),
    cantidadItems: items.reduce((s, it) => s + it.cantidad, 0),
  }
}

export class YaAtendidoError extends Error {
  constructor(pedido) { super('ya-atendido'); this.pedido = pedido }
}

// ─────────────────────────────── Motor Firestore ───────────────────────────────

function firestoreApi(localId) {
  const col = () => collection(db, 'locales', localId, 'pedidos')
  const pub = id => doc(db, 'locales', localId, 'pedidosPublicos', id)
  const comandaRef = id => doc(db, 'locales', localId, 'comandas', id)
  const lista = (q, cb, onError) => onSnapshot(q, s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), onError)

  // Cambia el pedido y su resumen público juntos.
  async function actualizar(id, cambios, cambiosPublicos = cambios) {
    const b = writeBatch(db)
    b.update(doc(col(), id), { ...cambios, actualizadoEn: serverTimestamp() })
    b.update(pub(id), { ...cambiosPublicos, actualizadoEn: serverTimestamp() })
    await b.commit()
  }

  return {
    nuevoId: () => doc(col()).id,
    async crear(local, pedido, codigo, id) {
      const p = armarPedido(local, pedido, codigo)
      const ttl = Timestamp.fromMillis(Date.now() + DIAS_VIDA * 86400000)
      const b = writeBatch(db)
      b.set(doc(col(), id), { ...p, createdAt: serverTimestamp(), ttl })
      b.set(pub(id), { ...publicoDe(p), createdAt: serverTimestamp(), ttl })
      await b.commit()
    },
    escucharPublico(id, cb, onError) {
      return onSnapshot(pub(id), s => cb(s.exists() ? { id: s.id, ...s.data() } : null), onError)
    },
    escucharPedido(id, cb, onError) {
      return onSnapshot(doc(col(), id), s => cb(s.exists() ? { id: s.id, ...s.data() } : null), onError)
    },
    escucharPorConfirmar(cb, onError) {
      return lista(query(col(), where('estado', '==', 'nuevo'), orderBy('createdAt', 'asc')), cb, onError)
    },
    escucharDomicilios(cb, onError) {
      return lista(query(col(), where('entrega', '==', 'domicilio'), where('estado', 'in', ESTADOS_VIVOS_DOMICILIO), orderBy('createdAt', 'asc')), cb, onError)
    },
    escucharEntregados(cb, onError) {
      return lista(query(col(), where('entrega', '==', 'domicilio'), where('estado', '==', 'entregado'), orderBy('actualizadoEn', 'desc'), limit(10)), cb, onError)
    },
    // Confirmar: una sola vez (transacción). Crea la comanda con el MISMO id del pedido.
    async confirmar(id, por) {
      return runTransaction(db, async tx => {
        const ref = doc(col(), id)
        const snap = await tx.get(ref)
        if (!snap.exists()) throw new Error('no-existe')
        const p = { id: snap.id, ...snap.data() }
        if (p.estado !== 'nuevo') throw new YaAtendidoError(p)
        tx.set(comandaRef(id), { ...comandaDe(p, por), estado: 'activa', creadaEn: serverTimestamp(), cerradaEn: null })
        tx.update(ref, { estado: 'en-cocina', confirmadoPor: por, confirmadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() })
        tx.update(pub(id), { estado: 'en-cocina', actualizadoEn: serverTimestamp() })
        return p
      })
    },
    async rechazar(id, por) {
      return runTransaction(db, async tx => {
        const ref = doc(col(), id)
        const snap = await tx.get(ref)
        if (!snap.exists()) throw new Error('no-existe')
        const p = { id: snap.id, ...snap.data() }
        if (p.estado !== 'nuevo') throw new YaAtendidoError(p)
        tx.update(ref, { estado: 'rechazado', rechazadoPor: por, actualizadoEn: serverTimestamp() })
        tx.update(pub(id), { estado: 'rechazado', actualizadoEn: serverTimestamp() })
        return p
      })
    },
    async cambiarEstado(id, estado, extra = {}) {
      await actualizar(id, { estado, ...extra }, { estado })
    },
    // Tras corregir la comanda (paso 2): el pedido queda con los mismos platos y el total nuevo.
    async sincronizarConComanda(comanda) {
      const snap = await getDoc(doc(col(), comanda.pedidoId))
      if (!snap.exists()) return null
      const p = snap.data()
      const items = comanda.items.filter(it => !it.quitado).map(it => ({
        uid: it.uid, productoId: it.productoId || '', nombre: it.nombre, cantidad: it.cantidad,
        opciones: it.opciones || '', seleccion: it.seleccion || {}, precio: it.precio || 0,
        notas: it.comentario || '', descripcion: it.descripcion || '',
      }))
      const subtotal = items.reduce((s, it) => s + it.precio, 0)
      const total = subtotal + (p.domicilio || 0)
      const cantidadItems = items.reduce((s, it) => s + it.cantidad, 0)
      await actualizar(comanda.pedidoId, { items, subtotal, total, cantidadItems },
        { items: publicoDe({ items }).items, subtotal, total })
      return { antes: p.total || 0, ahora: total, pedido: { id: snap.id, ...p, items, subtotal, total } }
    },
    async getPedido(id) {
      const s = await getDoc(doc(col(), id))
      return s.exists() ? { id: s.id, ...s.data() } : null
    },
  }
}

// ─────────────────────────────── Motor DEMO ───────────────────────────────

function demoApi(localId) {
  const KEY = `appetic_demo_pedidos_${localId}`
  const KEY_COM = `appetic_demo_comandas_${localId}`
  const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(KEY) : null
  const canalCom = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(KEY_COM) : null
  const oyentes = new Set()
  const leer = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
  const avisar = () => { for (const fn of oyentes) fn() }
  const escribir = l => { try { localStorage.setItem(KEY, JSON.stringify(l)) } catch { /* nada */ } avisar(); canal?.postMessage('cambio') }
  canal?.addEventListener('message', avisar)
  const ts = n => (n ? { seconds: Math.floor(n / 1000), nanoseconds: 0, toMillis: () => n } : null)
  const hidratar = p => ({ ...p, createdAt: ts(p.createdAt), actualizadoEn: ts(p.actualizadoEn) })
  const suscribir = (calc, cb) => { const fn = () => cb(calc()); oyentes.add(fn); fn(); return () => oyentes.delete(fn) }
  const cambiar = (id, fn) => escribir(leer().map(p => p.id === id ? { ...fn(p), actualizadoEn: Date.now() } : p))
  const uno = id => leer().find(p => p.id === id)

  return {
    nuevoId: () => 'demo-p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    async crear(local, pedido, codigo, id) {
      escribir([...leer(), { id, ...armarPedido(local, pedido, codigo), createdAt: Date.now(), actualizadoEn: Date.now() }])
    },
    escucharPublico(id, cb) { return suscribir(() => { const p = uno(id); return p ? { id, ...publicoDe(p), createdAt: ts(p.createdAt) } : null }, cb) },
    escucharPedido(id, cb) { return suscribir(() => { const p = uno(id); return p ? hidratar(p) : null }, cb) },
    escucharPorConfirmar(cb) { return suscribir(() => leer().filter(p => p.estado === 'nuevo').sort((a, b) => a.createdAt - b.createdAt).map(hidratar), cb) },
    escucharDomicilios(cb) { return suscribir(() => leer().filter(p => p.entrega === 'domicilio' && ESTADOS_VIVOS_DOMICILIO.includes(p.estado)).sort((a, b) => a.createdAt - b.createdAt).map(hidratar), cb) },
    escucharEntregados(cb) { return suscribir(() => leer().filter(p => p.entrega === 'domicilio' && p.estado === 'entregado').sort((a, b) => b.actualizadoEn - a.actualizadoEn).slice(0, 10).map(hidratar), cb) },
    async confirmar(id, por) {
      const p = uno(id)
      if (!p) throw new Error('no-existe')
      if (p.estado !== 'nuevo') throw new YaAtendidoError(hidratar(p))
      // La comanda va al motor demo de comandas (mismo localStorage que usa comandas.js).
      let coms = []
      try { coms = JSON.parse(localStorage.getItem(KEY_COM) || '[]') } catch { /* nada */ }
      if (!coms.some(c => c.id === id)) {
        coms.push({ id, ...comandaDe({ ...p, id }, por), estado: 'activa', creadaEn: Date.now(), cerradaEn: null })
        try { localStorage.setItem(KEY_COM, JSON.stringify(coms)) } catch { /* nada */ }
        canalCom?.postMessage('cambio')
      }
      cambiar(id, x => ({ ...x, estado: 'en-cocina', confirmadoPor: por }))
      return hidratar(p)
    },
    async rechazar(id, por) {
      const p = uno(id)
      if (!p) throw new Error('no-existe')
      if (p.estado !== 'nuevo') throw new YaAtendidoError(hidratar(p))
      cambiar(id, x => ({ ...x, estado: 'rechazado', rechazadoPor: por }))
      return hidratar(p)
    },
    async cambiarEstado(id, estado, extra = {}) { cambiar(id, x => ({ ...x, estado, ...extra })) },
    async sincronizarConComanda(comanda) {
      const p = uno(comanda.pedidoId)
      if (!p) return null
      const items = comanda.items.filter(it => !it.quitado).map(it => ({ uid: it.uid, productoId: it.productoId || '', nombre: it.nombre, cantidad: it.cantidad, opciones: it.opciones || '', seleccion: it.seleccion || {}, precio: it.precio || 0, notas: it.comentario || '', descripcion: it.descripcion || '' }))
      const subtotal = items.reduce((s, it) => s + it.precio, 0)
      const total = subtotal + (p.domicilio || 0)
      cambiar(p.id, x => ({ ...x, items, subtotal, total, cantidadItems: items.reduce((s, it) => s + it.cantidad, 0) }))
      return { antes: p.total || 0, ahora: total, pedido: hidratar({ ...p, items, subtotal, total }) }
    },
    async getPedido(id) { const p = uno(id); return p ? hidratar(p) : null },
  }
}

const cache = new Map()
export function pedidosDe(localId, { demo = false } = {}) {
  const k = `${demo ? 'demo' : 'fs'}:${localId}`
  if (!cache.has(k)) cache.set(k, demo ? demoApi(localId) : firestoreApi(localId))
  return cache.get(k)
}

// 🧾 Checkout: guarda el pedido COMPLETO + su resumen público, con el id que ya va en el link de
// WhatsApp. Best-effort: si falla, NO rompe el flujo del cliente (el WhatsApp sale igual).
export async function crearPedido(local, pedido, codigo, id, { demo = false } = {}) {
  if (!local?.id || !id) return false
  if (!demo) registrarPedidoStats(local.id, pedido.total)
  try {
    await pedidosDe(local.id, { demo }).crear(local, pedido, codigo, id)
    return true
  } catch (err) {
    console.warn('No se pudo guardar el pedido:', err?.code || err)
    return false
  }
}
