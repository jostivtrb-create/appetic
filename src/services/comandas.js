// 🧾 COMANDAS — lo que el mesero manda a la cocina (locales/{id}/comandas).
//
// Una comanda = un envío del mesero. Si la mesa 4 pide otra ronda, es OTRA comanda que entra al
// final de la fila (no se pega a la anterior: es otro pedido a la mitad).
//
//   destino:   { tipo: 'mesa' | 'llevar', mesa: '4' | null, nombre: 'Barra' | null }
//   items:     [{ uid, productoId, nombre, cantidad, opciones (texto), seleccion, comentario,
//                 descripcion (¿qué lleva?), precio (total de la línea), hecho: bool }]
//   estado:    'activa' | 'entregada' | 'cancelada'
//   creadaEn · entregadaEn · canceladaEn   (Timestamp)
//   creadaPor: { email, nombre }
//   total · cantidadItems · origen: 'mesero'
//
// Tachar es por LÍNEA (las 4 hamburguesas son una línea): la cocina tacha la pizza que ya salió
// y deja las hamburguesas. «Entregada» = la cocina confirmó todo (un solo paso, D5 de la guía).
//
// Hay DOS motores con la misma interfaz:
//   • Firestore en TIEMPO REAL (producción).
//   • DEMO en el navegador (vista previa ?preview=1): localStorage + BroadcastChannel, así el
//     mesero en una pestaña y la cocina en otra se ven en vivo sin tocar Firestore.
import {
  collection, doc, setDoc, updateDoc, onSnapshot, query, where, orderBy, limit, startAfter,
  getDocs, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { precioItem } from '../utils/price'
import { resumenSeleccion } from '../utils/selectionSummary'

export const POR_PAGINA = 20

// Convierte los ítems del carrito del mesero al formato de la comanda.
export function itemsDeComanda(carrito) {
  return carrito.map(it => ({
    uid: it.uid,
    productoId: it.producto?.id || '',
    nombre: it.producto?.nombre || 'Producto',
    cantidad: it.cantidad || 1,
    opciones: resumenSeleccion(it.producto, it.seleccion) || '',
    seleccion: it.seleccion || {},
    comentario: (it.comentario || '').trim(),
    // «¿Qué lleva?» para la cocina: la descripción del plato tal como estaba al enviarse.
    descripcion: it.producto?.descripcion || '',
    precio: precioItem(it),
    hecho: false,
  }))
}

// ¿Es una comanda viva (la cocina todavía la tiene en la fila)?
export const estaActiva = c => c?.estado === 'activa'

// Texto corto del destino: «MESA 4» · «BARRA» · «PARA LLEVAR · Carlos».
export function etiquetaDestino(destino) {
  if (!destino) return ''
  if (destino.tipo === 'llevar') return destino.nombre ? `Para llevar · ${destino.nombre}` : 'Para llevar'
  if (destino.mesa) return `Mesa ${destino.mesa}`
  return destino.nombre || 'Mesa'
}

// Clave para saber si dos comandas van a la MISMA mesa (aviso de «mesa en proceso»).
export function claveMesa(destino) {
  if (!destino || destino.tipo !== 'mesa') return null
  if (destino.mesa) return `n:${String(destino.mesa).trim()}`
  if (destino.nombre) return `t:${destino.nombre.trim().toLowerCase()}`
  return null
}

// Milisegundos de un Timestamp de Firestore, un Date o un número.
export function ms(t) {
  if (!t) return null
  if (typeof t === 'number') return t
  if (typeof t.toMillis === 'function') return t.toMillis()
  if (t instanceof Date) return t.getTime()
  if (typeof t.seconds === 'number') return t.seconds * 1000
  return null
}

// ─────────────────────────────── Motor Firestore ───────────────────────────────

function firestoreApi(localId) {
  const col = () => collection(db, 'locales', localId, 'comandas')

  return {
    // Fila de la cocina y vista del mesero: activas + canceladas recientes (para que la cocina
    // vea «CANCELADA» antes de que se vaya). Orden de llegada.
    escucharActivas(cb, onError) {
      const q = query(col(), where('estado', '==', 'activa'), orderBy('creadaEn', 'asc'))
      return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onError)
    },
    // Las últimas entregadas/canceladas (para «Entregadas» con Deshacer y para el «listo» del mesero).
    escucharRecientes(cb, onError, n = POR_PAGINA) {
      const q = query(col(), where('estado', 'in', ['entregada', 'cancelada']), orderBy('cerradaEn', 'desc'), limit(n))
      return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() })), snap.docs.at(-1) || null), onError)
    },
    // Historial por partes: «ver más» pide las siguientes 20 a partir de la última que ya tiene.
    async historial(despuesDe) {
      const base = [where('estado', 'in', ['entregada', 'cancelada']), orderBy('cerradaEn', 'desc')]
      const q = despuesDe
        ? query(col(), ...base, startAfter(despuesDe), limit(POR_PAGINA))
        : query(col(), ...base, limit(POR_PAGINA))
      const snap = await getDocs(q)
      return { lista: snap.docs.map(d => ({ id: d.id, ...d.data() })), ultimo: snap.docs.at(-1) || null }
    },
    nuevoId: () => doc(col()).id,
    // Con id propio (setDoc): si el mesero reintenta un envío que en realidad sí había llegado,
    // escribe el MISMO documento y no aparece una comanda repetida en cocina.
    async crear({ id, destino, items, creadaPor }) {
      const data = {
        destino,
        items,
        estado: 'activa',
        origen: 'mesero',
        creadaPor,
        total: items.reduce((s, it) => s + (it.precio || 0), 0),
        cantidadItems: items.reduce((s, it) => s + (it.cantidad || 0), 0),
        creadaEn: serverTimestamp(),
        cerradaEn: null,
      }
      await setDoc(doc(col(), id), data)
      return id
    },
    // Tachar / destachar una línea. Se reescribe la lista entera (Firestore no edita un elemento
    // de un array por índice) a partir de la comanda que tiene la pantalla.
    async marcarItem(comanda, uid, hecho) {
      const items = comanda.items.map(it => it.uid === uid ? { ...it, hecho } : it)
      await updateDoc(doc(col(), comanda.id), { items })
    },
    async marcarTodo(comanda, hecho) {
      const items = comanda.items.map(it => ({ ...it, hecho }))
      await updateDoc(doc(col(), comanda.id), { items })
    },
    async entregar(comanda) {
      const items = comanda.items.map(it => ({ ...it, hecho: true }))
      await updateDoc(doc(col(), comanda.id), {
        items, estado: 'entregada', entregadaEn: serverTimestamp(), cerradaEn: serverTimestamp(),
      })
    },
    // Deshacer un «entregado» por error de dedo: vuelve a la fila en su lugar (por creadaEn).
    async deshacer(comanda) {
      await updateDoc(doc(col(), comanda.id), { estado: 'activa', entregadaEn: null, cerradaEn: null })
    },
    async cancelar(comanda, porQuien) {
      await updateDoc(doc(col(), comanda.id), {
        estado: 'cancelada', canceladaEn: serverTimestamp(), cerradaEn: serverTimestamp(),
        canceladaPor: porQuien || null,
      })
    },
  }
}

// ─────────────────────────────── Motor DEMO ───────────────────────────────
// Vive en localStorage y avisa a las otras pestañas con BroadcastChannel. Sin Firestore.

function demoApi(localId) {
  const KEY = `appetic_demo_comandas_${localId}`
  const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(KEY) : null
  const oyentes = new Set()

  const leer = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
  }
  const avisar = () => { for (const fn of oyentes) fn() }
  const escribir = lista => {
    try { localStorage.setItem(KEY, JSON.stringify(lista)) } catch { /* nada */ }
    avisar()
    canal?.postMessage('cambio')
  }
  canal?.addEventListener('message', avisar)

  const ts = n => ({ seconds: Math.floor(n / 1000), nanoseconds: 0, toMillis: () => n })
  // Al leer de localStorage los Timestamp vuelven como objetos planos: se rehidratan.
  const hidratar = c => ({
    ...c,
    creadaEn: c.creadaEn ? ts(c.creadaEn) : null,
    entregadaEn: c.entregadaEn ? ts(c.entregadaEn) : null,
    canceladaEn: c.canceladaEn ? ts(c.canceladaEn) : null,
    cerradaEn: c.cerradaEn ? ts(c.cerradaEn) : null,
  })
  const cambiar = (id, fn) => escribir(leer().map(c => c.id === id ? fn(c) : c))
  const suscribir = (calcular, cb) => {
    const fn = () => cb(...calcular())
    oyentes.add(fn)
    fn()
    return () => oyentes.delete(fn)
  }
  const cerradas = () => leer()
    .filter(c => c.estado !== 'activa')
    .sort((a, b) => (b.cerradaEn || 0) - (a.cerradaEn || 0))

  return {
    escucharActivas(cb) {
      return suscribir(() => [leer()
        .filter(c => c.estado === 'activa')
        .sort((a, b) => a.creadaEn - b.creadaEn)
        .map(hidratar)], cb)
    },
    escucharRecientes(cb, _onError, n = POR_PAGINA) {
      return suscribir(() => {
        const l = cerradas().slice(0, n)
        return [l.map(hidratar), l.length ? l.length : null]
      }, cb)
    },
    async historial(despuesDe) {
      const desde = typeof despuesDe === 'number' ? despuesDe : 0
      const l = cerradas().slice(desde, desde + POR_PAGINA)
      return { lista: l.map(hidratar), ultimo: l.length ? desde + l.length : null }
    },
    nuevoId: () => 'demo-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    async crear({ id, destino, items, creadaPor }) {
      const ahora = Date.now()
      escribir([...leer().filter(c => c.id !== id), {
        id, destino, items, estado: 'activa', origen: 'mesero', creadaPor,
        total: items.reduce((s, it) => s + (it.precio || 0), 0),
        cantidadItems: items.reduce((s, it) => s + (it.cantidad || 0), 0),
        creadaEn: ahora, cerradaEn: null,
      }])
      return id
    },
    async marcarItem(comanda, uid, hecho) {
      cambiar(comanda.id, c => ({ ...c, items: c.items.map(it => it.uid === uid ? { ...it, hecho } : it) }))
    },
    async marcarTodo(comanda, hecho) {
      cambiar(comanda.id, c => ({ ...c, items: c.items.map(it => ({ ...it, hecho })) }))
    },
    async entregar(comanda) {
      const ahora = Date.now()
      cambiar(comanda.id, c => ({
        ...c, items: c.items.map(it => ({ ...it, hecho: true })),
        estado: 'entregada', entregadaEn: ahora, cerradaEn: ahora,
      }))
    },
    async deshacer(comanda) {
      cambiar(comanda.id, c => ({ ...c, estado: 'activa', entregadaEn: null, cerradaEn: null }))
    },
    async cancelar(comanda, porQuien) {
      const ahora = Date.now()
      cambiar(comanda.id, c => ({ ...c, estado: 'cancelada', canceladaEn: ahora, cerradaEn: ahora, canceladaPor: porQuien || null }))
    },
  }
}

// Id nuevo para una comanda (se genera ANTES de enviar y se reusa en los reintentos).
export const nuevoIdComanda = api => api.nuevoId()

const cache = new Map()
// Devuelve el motor de comandas de un local. `demo` = vista previa (no toca Firestore).
export function comandasDe(localId, { demo = false } = {}) {
  const k = `${demo ? 'demo' : 'fs'}:${localId}`
  if (!cache.has(k)) cache.set(k, demo ? demoApi(localId) : firestoreApi(localId))
  return cache.get(k)
}
