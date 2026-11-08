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
import { db, auth } from '../config/firebase'
import { limpiarConteo, sumarConteo, ajusteDe } from '../utils/arqueo.js'
import { aplicarConsumoEn, inventarioDe } from './inventario'
import { escucharConReintento, comandasDe } from './comandas'
import { jornadaDe, horaDe, mesDe } from '../utils/jornada'
import {
  sumaPagos, deltaVenta, saldosVenta, deltaMovimiento, saldosMovimiento, deltaCambioPago, saldosCambioPago, docsResumen, esPrivado, limpiarPagos, propinaEn, armarVenta, armarMovimiento, sumarEn,
} from '../utils/cuentasCalculo.js'

export const POR_PAGINA = 20

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
  const aplicar = (w, jornada, delta, saldos, privado = false) => {
    const inc = aIncrementos(delta)
    if (Object.keys(inc).length) for (const id of docsResumen(jornada, privado)) w.set(resumenRef(id), inc, { merge: true })
    const s = aIncrementos(saldos)
    if (Object.keys(s).length) w.set(resumenRef('saldos'), s, { merge: true })
  }

  return {
    nuevoId: () => doc(col('ventas')).id,

    // 🧾 Registra una venta cobrada. Si viene de comandas, las marca cobradas en el MISMO lote.
    // En transacción (auditoría «mesero y cocina» H3): si otra caja ya cobró o anuló alguna de esas
    // comandas, no se registra nada. Con `datos.id` fijo, un reintento de una venta que sí llegó no
    // la suma dos veces.
    async registrarVenta(datos, por, local) {
      const v = armarVenta(datos, por, local)
      const id = datos.id || doc(col('ventas')).id
      const refVenta = doc(col('ventas'), id)
      const refs = (datos.comandas || []).map(c => comandaRef(c.id))
      await runTransaction(db, async tx => {
        const [yaEsta, ...snaps] = await Promise.all([tx.get(refVenta), ...refs.map(r => tx.get(r))])
        if (yaEsta.exists()) return
        for (const s of snaps) {
          if (!s.exists()) throw new Error('comanda-no-existe')
          if (s.data().porCobrar === false) throw new Error(s.data().estado === 'cancelada' ? 'comanda-cancelada' : 'ya-cobrada')
        }
        tx.set(refVenta, { ...v, en: serverTimestamp() })
        aplicar(tx, v.jornada, deltaVenta(v, 1), saldosVenta(v, 1))
        if (v.inventario) aplicarConsumoEn(tx, localId, v.inventario, -1)
        for (const r of refs) tx.update(r, { porCobrar: false, cobradaEn: serverTimestamp(), cobradaPor: por, ventaId: id })
      })
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
        if (v.inventario) aplicarConsumoEn(tx, localId, v.inventario, 1)
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

    nuevoIdMovimiento: () => doc(col('movimientos')).id,
    // Con `datos.id` fijo (lo pone la pantalla al abrir el formulario) y en transacción: un doble
    // toque o un reintento sin red no anota el gasto o el pago de nómina dos veces (auditoría H3).
    async registrarMovimiento(datos, por, local) {
      const m = armarMovimiento(datos, por, local)
      const ref = datos.id ? doc(col('movimientos'), datos.id) : doc(col('movimientos'))
      await runTransaction(db, async tx => {
        if ((await tx.get(ref)).exists()) return
        tx.set(ref, { ...m, en: serverTimestamp() })
        aplicar(tx, m.jornada, deltaMovimiento(m, 1), saldosMovimiento(m, 1), esPrivado(m))
      })
    },

    async eliminarMovimiento(mov, por, motivo) {
      const ref = doc(col('movimientos'), mov.id)
      await runTransaction(db, async tx => {
        const snap = await tx.get(ref)
        if (!snap.exists() || snap.data().estado !== 'ok') throw new Error('ya-no')
        const m = snap.data()
        // Se resta de donde se sumó: los anotados antes del 3-nov sumaron la nómina en `d_`.
        aplicar(tx, m.jornada, deltaMovimiento(m, -1), saldosMovimiento(m, -1), !!m.enPrivado)
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

    // 🧮 ARQUEO (utils/arqueo.js): lo guarda el servidor, que pone el esperado (el cajero no lee saldos).
    nuevoIdArqueo: () => doc(col('arqueos')).id,
    async contarCaja({ id, cuenta, conteo }) {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) throw new Error('sin-sesion')
      let r
      try {
        r = await fetch('/api/arqueo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ localId, id, cuenta, conteo }),
        })
      } catch { throw new Error('sin-red') }
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw Object.assign(new Error('arqueo'), { detalle: j.error || '' })
      return j
    },
    // Solo el dueño (las reglas no dejan al cajero leerlos).
    escucharArqueos(cb, onError, { n = 10 } = {}) {
      return escucharConReintento(query(col('arqueos'), orderBy('en', 'desc'), limit(n)), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onError)
    },
    // «Ajustar» deja el saldo igual a lo contado con un Meter/Sacar de id fijo (un reintento no
    // ajusta dos veces); «Dejar así» solo lo marca revisado.
    async revisarArqueo(arqueo, accion, por, local) {
      const ajuste = accion === 'ajustado' ? ajusteDe(arqueo) : null
      const movimientoId = ajuste ? `arq-${arqueo.id}` : null
      if (ajuste) await this.registrarMovimiento({ id: movimientoId, ...ajuste }, por, local)
      await updateDoc(doc(col('arqueos'), arqueo.id), { revisado: { accion, por, en: Date.now(), movimientoId } })
    },
  }
}

// ─────────────────────────────── Motor DEMO ───────────────────────────────

function demoApi(localId) {
  const KEY = `appetic_demo_cuentas_${localId}`
  const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(KEY) : null
  const oyentes = new Set()
  const vacio = () => ({ ventas: [], movimientos: [], trabajadores: [], resumen: {}, arqueos: [] })
  const leer = () => { try { return { ...vacio(), ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return vacio() } }
  const avisar = () => { for (const fn of oyentes) fn() }
  const escribir = st => {
    try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* nada */ }
    avisar()
    canal?.postMessage('cambio')
  }
  canal?.addEventListener('message', avisar)
  const suscribir = (calcular, cb) => { const fn = () => cb(...calcular(leer())); oyentes.add(fn); fn(); return () => oyentes.delete(fn) }
  const aplicar = (st, jornada, delta, saldos, privado = false) => {
    for (const id of docsResumen(jornada, privado)) st.resumen[id] = sumarEn(st.resumen[id], delta)
    st.resumen.saldos = sumarEn(st.resumen.saldos, saldos)
  }
  const nuevoId = () => 'demo-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const comandas = comandasDe(localId, { demo: true })

  return {
    nuevoId,
    async registrarVenta(datos, por, local) {
      const v = armarVenta(datos, por, local)
      const id = datos.id || nuevoId()
      if (leer().ventas.some(x => x.id === id)) return id
      for (const c of datos.comandas || []) {
        const fresca = await comandas.obtener(c.id)
        if (fresca?.porCobrar === false) throw new Error(fresca.estado === 'cancelada' ? 'comanda-cancelada' : 'ya-cobrada')
      }
      const st = leer()
      st.ventas.push({ id, ...v, en: Date.now() })
      aplicar(st, v.jornada, deltaVenta(v, 1), saldosVenta(v, 1))
      escribir(st)
      if (v.inventario) inventarioDe(localId, { demo: true })._aplicarVenta(v.inventario, -1)
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
      if (v.inventario) inventarioDe(localId, { demo: true })._aplicarVenta(v.inventario, 1)
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
    nuevoIdMovimiento: nuevoId,
    async registrarMovimiento(datos, por, local) {
      const m = armarMovimiento(datos, por, local)
      const st = leer()
      if (datos.id && st.movimientos.some(x => x.id === datos.id)) return
      st.movimientos.push({ id: datos.id || nuevoId(), ...m, en: Date.now() })
      aplicar(st, m.jornada, deltaMovimiento(m, 1), saldosMovimiento(m, 1), esPrivado(m))
      escribir(st)
    },
    async eliminarMovimiento(mov, por, motivo) {
      const st = leer()
      const m = st.movimientos.find(x => x.id === mov.id)
      if (!m || m.estado !== 'ok') throw new Error('ya-no')
      aplicar(st, m.jornada, deltaMovimiento(m, -1), saldosMovimiento(m, -1), !!m.enPrivado)
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
    nuevoIdArqueo: nuevoId,
    async contarCaja({ id, cuenta, conteo }, por, local) {
      const st = leer()
      const ya = st.arqueos.find(a => a.id === id)
      if (ya) return ya
      const limpio = limpiarConteo(conteo), contado = sumarConteo(limpio)
      const esperado = Number(st.resumen.saldos?.[cuenta]) || 0
      const a = { id, jornada: jornadaDe(Date.now(), local?.horario), en: Date.now(), por, cuenta, conteo: limpio, contado, esperado, diferencia: contado - esperado, revisado: null }
      st.arqueos.push(a)
      escribir(st)
      return a
    },
    escucharArqueos(cb, _onError, { n = 10 } = {}) {
      return suscribir(st => [[...st.arqueos].sort((a, b) => b.en - a.en).slice(0, n)], cb)
    },
    async revisarArqueo(arqueo, accion, por, local) {
      const ajuste = accion === 'ajustado' ? ajusteDe(arqueo) : null
      const movimientoId = ajuste ? `arq-${arqueo.id}` : null
      if (ajuste) await this.registrarMovimiento({ id: movimientoId, ...ajuste }, por, local)
      const st = leer()
      const a = st.arqueos.find(x => x.id === arqueo.id)
      if (a) a.revisado = { accion, por, en: Date.now(), movimientoId }
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
  if (m === 'ya-no') return 'Eso ya había cambiado (otra persona lo corrigió o eliminó). Mira la lista de nuevo.'
  if (m === 'monto') return 'Escribe un valor mayor a cero.'
  if (m === 'sin-sesion') return 'Se cerró la sesión. Vuelve a entrar e intenta de nuevo.'
  if (m === 'arqueo') return err.detalle ? `No se guardó el conteo: ${err.detalle}.` : 'No se guardó el conteo. Intenta de nuevo.'
  if (m === 'sin-red') return 'Sin internet: no se registró. Revisa la señal y vuelve a cobrar (no se cobra dos veces).'
  if (m === 'ya-cobrada') return 'Esta cuenta ya la cobraron en otra caja. Mira el historial.'
  if (m === 'comanda-cancelada') return 'Una de estas comandas la cancelaron. Revisa la cuenta.'
  if (m === 'comanda-no-existe') return 'Una de estas comandas ya no existe. Revisa la cuenta.'
  if (c === 'permission-denied') return 'Esta cuenta no tiene permiso para hacer eso.'
  if (c === 'failed-precondition') return 'La base de datos se está preparando. Intenta en un minuto.'
  return 'No se pudo guardar. Revisa el internet e intenta de nuevo.'
}
