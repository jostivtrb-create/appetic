// 📦 INVENTARIO — datos (modelo en utils/inventario.js). Dos motores con la misma interfaz, como
// cuentas.js: Firestore y DEMO (vista previa ?preview=1, en localStorage + BroadcastChannel).
//   Insumos y recetas los lee la caja (el cajero descuenta al vender y suma al anotar una compra);
//   proveedores y movimientos, solo el dueño.
import {
  collection, doc, onSnapshot, query, orderBy, limit, runTransaction, setDoc, updateDoc, serverTimestamp, increment,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { escucharConReintento } from './comandas'
import { costoTrasCompra } from '../utils/inventario'

const limpio = s => String(s || '').trim()

function firestoreApi(localId) {
  const col = n => collection(db, 'locales', localId, n)
  const lista = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }))
  // Cambia el stock de un insumo con su rastro (conteo, merma o ajuste). `real`: lo que hay de verdad.
  async function moverStock({ insumoId, tipo, cantidad = null, real = null, motivo = '', por, idMov = null }) {
    const ref = doc(col('insumos'), insumoId)
    const refMov = idMov ? doc(col('inventarioMov'), idMov) : doc(col('inventarioMov'))
    await runTransaction(db, async tx => {
      const [snap, ya] = await Promise.all([tx.get(ref), tx.get(refMov)])
      if (ya.exists()) return
      if (!snap.exists()) throw new Error('no-existe')
      const i = snap.data(), antes = Number(i.stock) || 0
      const despues = real != null ? Number(real) : antes + Number(cantidad)
      tx.update(ref, { stock: despues, actualizado: serverTimestamp() })
      tx.set(refMov, { tipo, insumoId, nombre: i.nombre, unidad: i.unidad, cantidad: despues - antes, antes, despues, motivo: limpio(motivo), por, en: serverTimestamp() })
    })
  }
  return {
    nuevoId: n => doc(col(n)).id,
    escucharInsumos(cb, onError) { return escucharConReintento(query(col('insumos'), orderBy('nombre')), s => cb(lista(s)), onError) },
    async guardarInsumo({ id, ...datos }) {
      const d = { nombre: limpio(datos.nombre), unidad: datos.unidad, minimo: Number(datos.minimo) || 0, proveedorId: datos.proveedorId || '', activo: datos.activo !== false }
      if (id) return updateDoc(doc(col('insumos'), id), d)
      // Nuevo: con lo que hay hoy y lo que costó (opcional).
      return setDoc(doc(col('insumos')), { ...d, stock: Number(datos.stock) || 0, costoUnit: Number(datos.costoUnit) || 0, creadoEn: serverTimestamp() })
    },
    escucharRecetas(cb, onError) { return onSnapshot(col('recetas'), s => cb(Object.fromEntries(s.docs.map(d => [d.id, d.data()]))), onError) },
    guardarReceta(productoId, items) { return setDoc(doc(col('recetas'), productoId), { items, actualizada: serverTimestamp() }) },
    escucharProveedores(cb, onError) { return onSnapshot(query(col('proveedores'), orderBy('nombre')), s => cb(lista(s)), onError) },
    guardarProveedor({ id, nombre, whatsapp, insumos }) {
      const d = { nombre: limpio(nombre), whatsapp: limpio(whatsapp), insumos: insumos || [] }
      return id ? updateDoc(doc(col('proveedores'), id), d) : setDoc(doc(col('proveedores')), { ...d, creadoEn: serverTimestamp() })
    },
    escucharMovimientos(cb, onError, n = 40) { return escucharConReintento(query(col('inventarioMov'), orderBy('en', 'desc'), limit(n)), s => cb(lista(s)), onError) },
    // 🛒 Compra (desde el gasto, D7): suma al stock y recalcula el costo promedio. `idMov` fijo = sin repetir.
    async registrarCompra({ insumoId, cantidad, monto, por, idMov }) {
      const ref = doc(col('insumos'), insumoId), refMov = doc(col('inventarioMov'), idMov)
      await runTransaction(db, async tx => {
        const [snap, ya] = await Promise.all([tx.get(ref), tx.get(refMov)])
        if (ya.exists()) return
        if (!snap.exists()) throw new Error('no-existe')
        const i = snap.data(), antes = Number(i.stock) || 0
        tx.update(ref, { stock: antes + Number(cantidad), costoUnit: costoTrasCompra(i, cantidad, monto), actualizado: serverTimestamp() })
        tx.set(refMov, { tipo: 'compra', insumoId, nombre: i.nombre, unidad: i.unidad, cantidad: Number(cantidad), antes, despues: antes + Number(cantidad), monto: Number(monto) || 0, motivo: '', por, en: serverTimestamp() })
      })
    },
    contar: (insumoId, real, por) => moverStock({ insumoId, tipo: 'conteo', real, motivo: 'Conteo físico', por }),
    merma: (insumoId, cantidad, motivo, por) => moverStock({ insumoId, tipo: 'merma', cantidad: -Math.abs(cantidad), motivo, por }),
  }
}

// ─────────────────────────────── Motor DEMO ───────────────────────────────
function demoApi(localId) {
  const KEY = `appetic_demo_inventario_${localId}`
  const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(KEY) : null
  const oyentes = new Set()
  const vacio = () => ({ insumos: [], recetas: {}, proveedores: [], movs: [] })
  const leer = () => { try { return { ...vacio(), ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return vacio() } }
  const avisar = () => { for (const fn of oyentes) fn() }
  const escribir = st => { try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* nada */ } avisar(); canal?.postMessage('cambio') }
  canal?.addEventListener('message', avisar)
  const suscribir = (calc, cb) => { const fn = () => cb(...calc(leer())); oyentes.add(fn); fn(); return () => oyentes.delete(fn) }
  const nuevoId = () => 'demo-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const porNombre = l => [...l].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  function mover(st, i, despues, tipo, extra) {
    const antes = Number(i.stock) || 0
    i.stock = despues
    st.movs.unshift({ id: nuevoId(), tipo, insumoId: i.id, nombre: i.nombre, unidad: i.unidad, cantidad: despues - antes, antes, despues, en: Date.now(), ...extra })
  }
  return {
    nuevoId: () => nuevoId(),
    escucharInsumos(cb) { return suscribir(st => [porNombre(st.insumos)], cb) },
    async guardarInsumo({ id, ...d }) {
      const st = leer()
      const base = { nombre: limpio(d.nombre), unidad: d.unidad, minimo: Number(d.minimo) || 0, proveedorId: d.proveedorId || '', activo: d.activo !== false }
      if (id) st.insumos = st.insumos.map(i => i.id === id ? { ...i, ...base } : i)
      else st.insumos.push({ id: nuevoId(), ...base, stock: Number(d.stock) || 0, costoUnit: Number(d.costoUnit) || 0 })
      escribir(st)
    },
    escucharRecetas(cb) { return suscribir(st => [st.recetas], cb) },
    async guardarReceta(productoId, items) { const st = leer(); st.recetas[productoId] = { items }; escribir(st) },
    escucharProveedores(cb) { return suscribir(st => [porNombre(st.proveedores)], cb) },
    async guardarProveedor({ id, nombre, whatsapp, insumos }) {
      const st = leer(), d = { nombre: limpio(nombre), whatsapp: limpio(whatsapp), insumos: insumos || [] }
      if (id) st.proveedores = st.proveedores.map(p => p.id === id ? { ...p, ...d } : p)
      else st.proveedores.push({ id: nuevoId(), ...d })
      escribir(st)
    },
    escucharMovimientos(cb, _e, n = 40) { return suscribir(st => [st.movs.slice(0, n)], cb) },
    async registrarCompra({ insumoId, cantidad, monto, por, idMov }) {
      const st = leer(), i = st.insumos.find(x => x.id === insumoId)
      if (!i) throw new Error('no-existe')
      if (st.movs.some(m => m.id === idMov)) return
      const costo = costoTrasCompra(i, cantidad, monto)
      mover(st, i, (Number(i.stock) || 0) + Number(cantidad), 'compra', { id: idMov, monto: Number(monto) || 0, por })
      i.costoUnit = costo
      escribir(st)
    },
    async contar(insumoId, real, por) { const st = leer(), i = st.insumos.find(x => x.id === insumoId); if (!i) throw new Error('no-existe'); mover(st, i, Number(real), 'conteo', { motivo: 'Conteo físico', por }); escribir(st) },
    async merma(insumoId, cantidad, motivo, por) { const st = leer(), i = st.insumos.find(x => x.id === insumoId); if (!i) throw new Error('no-existe'); mover(st, i, (Number(i.stock) || 0) - Math.abs(cantidad), 'merma', { motivo: limpio(motivo), por }); escribir(st) },
    // La venta de la demo descuenta (signo −1) o devuelve (+1) lo de su receta (lo llama cuentas.js).
    _aplicarVenta(consumo, signo) {
      const st = leer()
      for (const c of consumo || []) { const i = st.insumos.find(x => x.id === c.insumoId); if (i) i.stock = (Number(i.stock) || 0) + signo * c.cantidad }
      escribir(st)
    },
  }
}

const cache = new Map()
export function inventarioDe(localId, { demo = false } = {}) {
  const k = `${demo ? 'demo' : 'fs'}:${localId}`
  if (!cache.has(k)) cache.set(k, demo ? demoApi(localId) : firestoreApi(localId))
  return cache.get(k)
}

// Para las ventas de Firestore: lo que descuenta (o devuelve) una venta, dentro de SU transacción.
export function aplicarConsumoEn(tx, localId, consumo, signo) {
  for (const c of consumo || []) {
    tx.set(doc(db, 'locales', localId, 'insumos', c.insumoId), { stock: increment(signo * c.cantidad) }, { merge: true })
  }
}

export function motivoErrorInventario(e) {
  if (e?.message === 'no-existe') return 'Ese insumo ya no existe. Recarga la lista.'
  if (e?.code === 'permission-denied') return 'Esta cuenta no tiene permiso para hacer eso.'
  return 'No se pudo guardar. Revisa el internet e intenta de nuevo.'
}
