// 💰 CUENTAS DEL NEGOCIO (guía «Cuentas del negocio»): ventas, gastos, nómina, saldos y resúmenes.
//
// Todo vive en subcolecciones PRIVADAS del local (el documento del local es público):
//
//   ventas/{id}       → cada venta cobrada (Caja, comanda o mesa entera).
//       { jornada 'AAAA-MM-DD', hora 0…23, en, por {email,nombre}, origen 'caja'|'comanda'|'mesa',
//         comandaIds[], mesa, items[{productoId,nombre,cantidad,precio}], subtotal,
//         descuento {valor, cortesia, motivo} | null, total, pagos [{cuenta, nombre, monto}] (suman
//         el total), propina {valor, cuenta, nombre} | null, recibido (efectivo con que pagó),
//         estado 'ok'|'eliminada', eliminada {por, motivo, en}, cambios [{en, por, antes, despues, motivo}] }
//   movimientos/{id}  → plata que entra o sale sin ser venta.
//       { tipo 'gasto'|'nomina'|'retiro'|'ingreso'|'traslado', jornada, en, por, cuenta,
//         cuentaDestino (traslado), monto, concepto, trabajadorId, trabajador, dias [] (nómina),
//         estado 'ok'|'eliminado', eliminado {por, motivo, en} }
//   trabajadores/{id} → la gente a la que se le paga (use o no la app). { nombre, activo, creadoEn }
//   resumen/saldos    → { [cuentaId]: saldo }
//   resumen/d_AAAA-MM-DD · resumen/m_AAAA-MM → totales del día y del mes:
//       { ventas, nVentas, descuentos, propinas, gastos, nomina, retiros, ingresos,
//         porCuenta {cuenta: $}, porPlato {clave: {n, monto, nombre}}, porHora {'13': $},
//         porTipo {mesa|llevar|recoger|domicilio|caja: n} }
//
// Los totales se mueven con increment() EN EL MISMO LOTE que la venta o el movimiento (S7): leer
// el mes cuesta un documento, no cientos. Eliminar o cambiar el pago aplica el mismo delta al revés.
// Nada se borra (S18): eliminar marca, devuelve la plata y deja quién y por qué.
//
// Dos motores con la misma interfaz, como comandas.js: Firestore y DEMO (vista previa ?preview=1,
// en el navegador con localStorage + BroadcastChannel).
import {
  collection, doc, writeBatch, runTransaction, onSnapshot, query, where, orderBy, limit,
  serverTimestamp, increment, arrayUnion, deleteField, getDocs, documentId, setDoc, updateDoc,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { escucharConReintento, comandasDe } from './comandas'
import { jornadaDe, horaDe, mesDe } from '../utils/jornada'

export const POR_PAGINA = 20

// ─────────────────────────────── Deltas (comunes a los dos motores) ───────────────────────────────

// Clave segura para un mapa de Firestore (sin puntos, barras ni nada raro).
const clavePlato = it => String(it.productoId || it.nombre || 'x').replace(/[^\w-]/g, '_').slice(0, 60) || 'x'
const sumaPagos = pagos => (pagos || []).reduce((s, p) => s + (Number(p.monto) || 0), 0)

// Lo que una venta le suma (s = 1) o le resta (s = -1) al resumen de su día y de su mes.
function deltaVenta(v, s) {
  const d = {
    ventas: s * (v.total || 0), nVentas: s,
    descuentos: s * (v.descuento?.valor || 0), propinas: s * (v.propina?.valor || 0),
    porCuenta: {}, porPlato: {}, porHora: { [String(v.hora ?? 0)]: s * (v.total || 0) },
    // Cuántas ventas de cada tipo (mesa · llevar · recoger · domicilio · caja): el «movimiento».
    porTipo: { [v.destino?.tipo || 'caja']: s },
  }
  for (const p of v.pagos || []) d.porCuenta[p.cuenta] = (d.porCuenta[p.cuenta] || 0) + s * (Number(p.monto) || 0)
  for (const it of v.items || []) {
    const k = clavePlato(it)
    const prev = d.porPlato[k] || { n: 0, monto: 0, nombre: it.nombre }
    d.porPlato[k] = { n: prev.n + s * (it.cantidad || 1), monto: prev.monto + s * (it.precio || 0), nombre: it.nombre }
  }
  return d
}

// Lo que una venta mueve en los saldos: lo pagado + la propina, cada cosa en su cuenta.
function saldosVenta(v, s) {
  const d = {}
  for (const p of v.pagos || []) d[p.cuenta] = (d[p.cuenta] || 0) + s * (Number(p.monto) || 0)
  if (v.propina?.valor) d[v.propina.cuenta] = (d[v.propina.cuenta] || 0) + s * v.propina.valor
  return d
}

const CAMPO_MOV = { gasto: 'gastos', nomina: 'nomina', retiro: 'retiros', ingreso: 'ingresos' }
const SIGNO_SALDO = { gasto: -1, nomina: -1, retiro: -1, ingreso: 1, traslado: -1 }

function deltaMovimiento(m, s) {
  const campo = CAMPO_MOV[m.tipo]
  return campo ? { [campo]: s * m.monto } : {}
}
function saldosMovimiento(m, s) {
  const d = { [m.cuenta]: s * SIGNO_SALDO[m.tipo] * m.monto }
  if (m.tipo === 'traslado' && m.cuentaDestino) d[m.cuentaDestino] = (d[m.cuentaDestino] || 0) + s * m.monto
  return d
}

// Cambio de medio de pago: se quita lo viejo y se pone lo nuevo, solo en porCuenta y saldos.
function deltaCambioPago(antes, despues) {
  const res = { porCuenta: {} }
  for (const p of antes.pagos || []) res.porCuenta[p.cuenta] = (res.porCuenta[p.cuenta] || 0) - p.monto
  for (const p of despues.pagos || []) res.porCuenta[p.cuenta] = (res.porCuenta[p.cuenta] || 0) + p.monto
  return res
}
function saldosCambioPago(antes, despues) {
  const a = saldosVenta(antes, -1), b = saldosVenta(despues, 1)
  for (const [k, n] of Object.entries(b)) a[k] = (a[k] || 0) + n
  return a
}

const docsResumen = jornada => [`d_${jornada}`, `m_${mesDe(jornada)}`]

const limpiarPagos = pagos => (pagos || []).filter(p => p.monto > 0).map(p => ({ cuenta: p.cuenta, nombre: p.nombre, monto: Math.round(p.monto) }))
// Al cambiar el pago, la propina conserva su valor: solo puede pasar a otra cuenta.
const propinaEn = (propina, cuenta) => propina ? { ...propina, ...(cuenta ? { cuenta: cuenta.cuenta, nombre: cuenta.nombre } : {}) } : null

// Valida y completa una venta que llega de la pantalla.
function armarVenta(datos, por, local) {
  const ahora = Date.now()
  const items = (datos.items || []).map(it => ({
    productoId: it.productoId || '', nombre: it.nombre || 'Producto',
    cantidad: it.cantidad || 1, precio: Number(it.precio) || 0,
    ...(it.opciones ? { opciones: it.opciones } : {}),
  }))
  const subtotal = items.reduce((s, it) => s + it.precio, 0)
  const desc = datos.descuento?.valor > 0
    ? { valor: Math.min(datos.descuento.valor, subtotal), cortesia: !!datos.descuento.cortesia, motivo: (datos.descuento.motivo || '').trim() }
    : null
  const total = subtotal - (desc?.valor || 0)
  const pagos = limpiarPagos(datos.pagos)
  if (total > 0 && sumaPagos(pagos) !== total) throw new Error('pagos-no-cuadran')
  const jornada = jornadaDe(ahora, local?.horario)
  return {
    jornada, hora: horaDe(ahora), por,
    origen: datos.origen || 'caja',
    comandaIds: (datos.comandas || []).map(c => c.id),
    mesa: datos.mesa || null,
    destino: datos.destino || null,
    items, subtotal, descuento: desc, total, pagos,
    propina: datos.propina?.valor > 0 ? { valor: Math.round(datos.propina.valor), cuenta: datos.propina.cuenta, nombre: datos.propina.nombre } : null,
    recibido: datos.recibido > 0 ? Math.round(datos.recibido) : null,
    estado: 'ok',
  }
}

function armarMovimiento(datos, por, local) {
  const ahora = Date.now()
  const monto = Math.round(Number(datos.monto) || 0)
  if (!(monto > 0)) throw new Error('monto')
  if (!CAMPO_MOV[datos.tipo] && datos.tipo !== 'traslado') throw new Error('tipo')
  return {
    tipo: datos.tipo, jornada: jornadaDe(ahora, local?.horario), por,
    cuenta: datos.cuenta, ...(datos.cuentaDestino ? { cuentaDestino: datos.cuentaDestino } : {}),
    monto, concepto: (datos.concepto || '').trim(),
    ...(datos.trabajadorId ? { trabajadorId: datos.trabajadorId, trabajador: datos.trabajador || '' } : {}),
    ...(datos.dias?.length ? { dias: [...datos.dias].sort() } : {}),
    estado: 'ok',
  }
}

// ─────────────────────────────── Motor Firestore ───────────────────────────────

// { a: 3, b: { c: -2, nombre: 'x' } } → los números se vuelven increment() (los textos quedan).
function aIncrementos(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'number') { if (v !== 0) out[k] = increment(v) }
    else if (v && typeof v === 'object') { const sub = aIncrementos(v); if (Object.keys(sub).length) out[k] = sub }
    else out[k] = v
  }
  return out
}

function firestoreApi(localId) {
  const col = n => collection(db, 'locales', localId, n)
  const resumenRef = id => doc(db, 'locales', localId, 'resumen', id)
  const comandaRef = id => doc(db, 'locales', localId, 'comandas', id)
  // Aplica un delta al día, al mes y a los saldos dentro de un lote o transacción.
  const aplicar = (w, jornada, delta, saldos) => {
    const inc = aIncrementos(delta)
    if (Object.keys(inc).length) for (const id of docsResumen(jornada)) w.set(resumenRef(id), inc, { merge: true })
    const s = aIncrementos(saldos)
    if (Object.keys(s).length) w.set(resumenRef('saldos'), s, { merge: true })
  }

  return {
    nuevoId: () => doc(col('ventas')).id,

    // 🧾 Registra una venta cobrada. Si viene de comandas, las marca cobradas en el MISMO lote.
    async registrarVenta(datos, por, local) {
      const v = armarVenta(datos, por, local)
      const id = datos.id || doc(col('ventas')).id
      const b = writeBatch(db)
      b.set(doc(col('ventas'), id), { ...v, en: serverTimestamp() })
      aplicar(b, v.jornada, deltaVenta(v, 1), saldosVenta(v, 1))
      for (const c of datos.comandas || []) {
        b.update(comandaRef(c.id), { porCobrar: false, cobradaEn: serverTimestamp(), cobradaPor: por, ventaId: id })
      }
      await b.commit()
      return id
    },

    // Cambia el medio de pago de una venta ya registrada (nuevo = { pagos, propinaCuenta? }). Queda en `cambios`.
    async cambiarPago(venta, nuevo, por, motivo = '') {
      const ref = doc(col('ventas'), venta.id)
      await runTransaction(db, async tx => {
        const snap = await tx.get(ref)
        if (!snap.exists() || snap.data().estado !== 'ok') throw new Error('ya-no')
        const antes = snap.data()
        const despues = { ...antes, pagos: limpiarPagos(nuevo.pagos), propina: propinaEn(antes.propina, nuevo.propinaCuenta) }
        if (antes.total > 0 && sumaPagos(despues.pagos) !== antes.total) throw new Error('pagos-no-cuadran')
        aplicar(tx, antes.jornada, deltaCambioPago(antes, despues), saldosCambioPago(antes, despues))
        tx.update(ref, {
          pagos: despues.pagos, propina: despues.propina,
          cambios: arrayUnion({ en: Date.now(), por, antes: antes.pagos, despues: despues.pagos, motivo: motivo.trim() }),
        })
      })
    },

    // Elimina (marca) una venta: devuelve la plata y la saca de los totales. Si venía de comandas
    // y la cuenta sigue pendiente (se cobró mal), vuelven a «por cobrar»; si no (estaba repetida),
    // se quedan cerradas.
    async eliminarVenta(venta, por, motivo, { devolverComandas = true } = {}) {
      const ref = doc(col('ventas'), venta.id)
      await runTransaction(db, async tx => {
        const snap = await tx.get(ref)
        if (!snap.exists() || snap.data().estado !== 'ok') throw new Error('ya-no')
        const v = snap.data()
        aplicar(tx, v.jornada, deltaVenta(v, -1), saldosVenta(v, -1))
        tx.update(ref, { estado: 'eliminada', eliminada: { por, motivo: motivo.trim(), en: Date.now() } })
        if (devolverComandas) for (const cid of v.comandaIds || []) {
          tx.update(comandaRef(cid), { porCobrar: true, cobradaEn: deleteField(), cobradaPor: deleteField(), ventaId: deleteField() })
        }
      })
    },

    // Historial en vivo: las últimas n (las válidas o, con eliminadas, solo las eliminadas).
    escucharVentas(cb, onError, { n = POR_PAGINA, eliminadas = false } = {}) {
      const q = query(col('ventas'), where('estado', '==', eliminadas ? 'eliminada' : 'ok'), orderBy('en', 'desc'), limit(n))
      return escucharConReintento(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() })), snap.size >= n), onError)
    },

    async registrarMovimiento(datos, por, local) {
      const m = armarMovimiento(datos, por, local)
      const b = writeBatch(db)
      b.set(doc(col('movimientos')), { ...m, en: serverTimestamp() })
      aplicar(b, m.jornada, deltaMovimiento(m, 1), saldosMovimiento(m, 1))
      await b.commit()
    },

    async eliminarMovimiento(mov, por, motivo) {
      const ref = doc(col('movimientos'), mov.id)
      await runTransaction(db, async tx => {
        const snap = await tx.get(ref)
        if (!snap.exists() || snap.data().estado !== 'ok') throw new Error('ya-no')
        const m = snap.data()
        aplicar(tx, m.jornada, deltaMovimiento(m, -1), saldosMovimiento(m, -1))
        tx.update(ref, { estado: 'eliminado', eliminado: { por, motivo: motivo.trim(), en: Date.now() } })
      })
    },

    // Movimientos en vivo; con `tipo` solo los de ese tipo (el cajero solo puede leer gastos).
    escucharMovimientos(cb, onError, { n = 50, tipo = null } = {}) {
      const q = tipo
        ? query(col('movimientos'), where('tipo', '==', tipo), orderBy('en', 'desc'), limit(n))
        : query(col('movimientos'), orderBy('en', 'desc'), limit(n))
      return escucharConReintento(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() })), snap.size >= n), onError)
    },

    escucharSaldos(cb, onError) {
      return onSnapshot(resumenRef('saldos'), s => cb(s.exists() ? s.data() : {}), onError)
    },
    escucharResumen(clave, cb, onError) {
      return onSnapshot(resumenRef(clave), s => cb(s.exists() ? s.data() : null), onError)
    },
    // Resúmenes entre dos claves ('d_2026-11-01' … 'd_2026-11-31', o 'm_2026-06' … 'm_2026-11').
    async resumenesEntre(desde, hasta) {
      const snap = await getDocs(query(col('resumen'), where(documentId(), '>=', desde), where(documentId(), '<=', hasta)))
      return Object.fromEntries(snap.docs.map(d => [d.id, d.data()]))
    },

    // Para la descarga del mes y el día de Cuentas: todo lo de un rango de jornadas.
    async ventasEntre(desde, hasta) {
      const snap = await getDocs(query(col('ventas'), where('jornada', '>=', desde), where('jornada', '<=', hasta), orderBy('jornada')))
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.en?.toMillis?.() || 0) - (b.en?.toMillis?.() || 0))
    },
    async movimientosEntre(desde, hasta) {
      const snap = await getDocs(query(col('movimientos'), where('jornada', '>=', desde), where('jornada', '<=', hasta), orderBy('jornada')))
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.en?.toMillis?.() || 0) - (b.en?.toMillis?.() || 0))
    },

    escucharTrabajadores(cb, onError) {
      return onSnapshot(query(col('trabajadores'), orderBy('nombre')), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), onError)
    },
    async guardarTrabajador({ id, nombre, activo = true }) {
      const datos = { nombre: nombre.trim(), activo }
      if (id) await updateDoc(doc(col('trabajadores'), id), datos)
      else await setDoc(doc(col('trabajadores')), { ...datos, creadoEn: serverTimestamp() })
    },
  }
}

// ─────────────────────────────── Motor DEMO ───────────────────────────────

// Suma un delta a un objeto plano (los textos se copian; los números se suman).
function sumarEn(base, delta) {
  const out = { ...(base || {}) }
  for (const [k, v] of Object.entries(delta)) {
    if (typeof v === 'number') out[k] = (out[k] || 0) + v
    else if (v && typeof v === 'object') out[k] = sumarEn(out[k], v)
    else out[k] = v
  }
  return out
}

function demoApi(localId) {
  const KEY = `appetic_demo_cuentas_${localId}`
  const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(KEY) : null
  const oyentes = new Set()
  const vacio = () => ({ ventas: [], movimientos: [], trabajadores: [], resumen: {} })
  const leer = () => { try { return { ...vacio(), ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return vacio() } }
  const avisar = () => { for (const fn of oyentes) fn() }
  const escribir = st => {
    try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* nada */ }
    avisar()
    canal?.postMessage('cambio')
  }
  canal?.addEventListener('message', avisar)
  const suscribir = (calcular, cb) => { const fn = () => cb(...calcular(leer())); oyentes.add(fn); fn(); return () => oyentes.delete(fn) }
  const aplicar = (st, jornada, delta, saldos) => {
    for (const id of docsResumen(jornada)) st.resumen[id] = sumarEn(st.resumen[id], delta)
    st.resumen.saldos = sumarEn(st.resumen.saldos, saldos)
  }
  const nuevoId = () => 'demo-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const comandas = comandasDe(localId, { demo: true })

  return {
    nuevoId,
    async registrarVenta(datos, por, local) {
      const v = armarVenta(datos, por, local)
      const id = datos.id || nuevoId()
      const st = leer()
      st.ventas.push({ id, ...v, en: Date.now() })
      aplicar(st, v.jornada, deltaVenta(v, 1), saldosVenta(v, 1))
      escribir(st)
      for (const c of datos.comandas || []) await comandas.cobrar(c, por, id)
      return id
    },
    async cambiarPago(venta, nuevo, por, motivo = '') {
      const st = leer()
      const antes = st.ventas.find(x => x.id === venta.id)
      if (!antes || antes.estado !== 'ok') throw new Error('ya-no')
      const despues = { ...antes, pagos: limpiarPagos(nuevo.pagos), propina: propinaEn(antes.propina, nuevo.propinaCuenta) }
      if (antes.total > 0 && sumaPagos(despues.pagos) !== antes.total) throw new Error('pagos-no-cuadran')
      aplicar(st, antes.jornada, deltaCambioPago(antes, despues), saldosCambioPago(antes, despues))
      Object.assign(antes, { pagos: despues.pagos, propina: despues.propina, cambios: [...(antes.cambios || []), { en: Date.now(), por, antes: antes.pagos, despues: despues.pagos, motivo: motivo.trim() }] })
      escribir(st)
    },
    async eliminarVenta(venta, por, motivo, { devolverComandas = true } = {}) {
      const st = leer()
      const v = st.ventas.find(x => x.id === venta.id)
      if (!v || v.estado !== 'ok') throw new Error('ya-no')
      aplicar(st, v.jornada, deltaVenta(v, -1), saldosVenta(v, -1))
      Object.assign(v, { estado: 'eliminada', eliminada: { por, motivo: motivo.trim(), en: Date.now() } })
      escribir(st)
      if (devolverComandas) for (const cid of v.comandaIds || []) await comandas.descobrar({ id: cid })
    },
    escucharVentas(cb, _onError, { n = POR_PAGINA, eliminadas = false } = {}) {
      return suscribir(st => {
        const l = st.ventas.filter(v => v.estado === (eliminadas ? 'eliminada' : 'ok')).sort((a, b) => b.en - a.en)
        return [l.slice(0, n), l.length > n]
      }, cb)
    },
    async registrarMovimiento(datos, por, local) {
      const m = armarMovimiento(datos, por, local)
      const st = leer()
      st.movimientos.push({ id: nuevoId(), ...m, en: Date.now() })
      aplicar(st, m.jornada, deltaMovimiento(m, 1), saldosMovimiento(m, 1))
      escribir(st)
    },
    async eliminarMovimiento(mov, por, motivo) {
      const st = leer()
      const m = st.movimientos.find(x => x.id === mov.id)
      if (!m || m.estado !== 'ok') throw new Error('ya-no')
      aplicar(st, m.jornada, deltaMovimiento(m, -1), saldosMovimiento(m, -1))
      Object.assign(m, { estado: 'eliminado', eliminado: { por, motivo: motivo.trim(), en: Date.now() } })
      escribir(st)
    },
    escucharMovimientos(cb, _onError, { n = 50, tipo = null } = {}) {
      return suscribir(st => {
        const l = st.movimientos.filter(m => !tipo || m.tipo === tipo).sort((a, b) => b.en - a.en)
        return [l.slice(0, n), l.length > n]
      }, cb)
    },
    escucharSaldos(cb) { return suscribir(st => [st.resumen.saldos || {}], cb) },
    escucharResumen(clave, cb) { return suscribir(st => [st.resumen[clave] || null], cb) },
    async resumenesEntre(desde, hasta) {
      return Object.fromEntries(Object.entries(leer().resumen).filter(([k]) => k >= desde && k <= hasta))
    },
    async ventasEntre(desde, hasta) { return leer().ventas.filter(v => v.jornada >= desde && v.jornada <= hasta).sort((a, b) => a.en - b.en) },
    async movimientosEntre(desde, hasta) { return leer().movimientos.filter(m => m.jornada >= desde && m.jornada <= hasta).sort((a, b) => a.en - b.en) },
    escucharTrabajadores(cb) {
      return suscribir(st => [[...st.trabajadores].sort((a, b) => a.nombre.localeCompare(b.nombre))], cb)
    },
    async guardarTrabajador({ id, nombre, activo = true }) {
      const st = leer()
      if (id) st.trabajadores = st.trabajadores.map(t => t.id === id ? { ...t, nombre: nombre.trim(), activo } : t)
      else st.trabajadores.push({ id: nuevoId(), nombre: nombre.trim(), activo, creadoEn: Date.now() })
      escribir(st)
    },
    // Solo demo: reemplaza todo (datos de ejemplo, S8).
    _sembrar(st) { escribir({ ...vacio(), ...st }) },
    _vacio: () => !localStorage.getItem(KEY),
  }
}

const cache = new Map()
// El motor de cuentas de un local. `demo` = vista previa (no toca Firestore).
export function cuentasNegocioDe(localId, { demo = false } = {}) {
  const k = `${demo ? 'demo' : 'fs'}:${localId}`
  if (!cache.has(k)) cache.set(k, demo ? demoApi(localId) : firestoreApi(localId))
  return cache.get(k)
}

// Para los datos de ejemplo de la demo (S8): los mismos deltas que usa el motor.
export const _internos = { deltaVenta, saldosVenta, deltaMovimiento, saldosMovimiento, sumarEn, docsResumen, armarVenta, armarMovimiento }

// Mensaje claro para la pantalla.
export function motivoErrorCuentas(err) {
  const m = err?.message || '', c = err?.code || ''
  if (m === 'pagos-no-cuadran') return 'Los pagos no suman el total.'
  if (m === 'ya-no') return 'Esa venta ya había cambiado. Mira el historial de nuevo.'
  if (m === 'monto') return 'Escribe un valor mayor a cero.'
  if (c === 'permission-denied') return 'Esta cuenta no tiene permiso para hacer eso.'
  if (c === 'failed-precondition') return 'La base de datos se está preparando. Intenta en un minuto.'
  return 'No se pudo guardar. Revisa el internet e intenta de nuevo.'
}
