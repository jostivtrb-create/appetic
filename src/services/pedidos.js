import {
  collection, collectionGroup, addDoc, serverTimestamp, Timestamp,
  query, orderBy, limit, where, getDocs, onSnapshot,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { registrarPedidoStats } from './stats'
import { precioItem } from '../utils/price'
import { resumenSeleccion } from '../utils/selectionSummary'

// Los pedidos se auto-borran a los 2 días (política TTL de Firestore sobre el campo `ttl`),
// para que el panel del domiciliario no se vuelva una lista infinita.
const DIAS_VIDA = 2

// 🧾 Guarda el pedido COMPLETO en Firestore (locales/{id}/pedidos) con su CÓDIGO.
// Es la FUENTE DE VERDAD del precio: el domiciliario busca por código y ve estos importes,
// no los del texto de WhatsApp (que el cliente podría editar). Best-effort: si falla, NO
// rompe el flujo del cliente. Guarda también datos del local para el feed global.
export async function crearPedido(local, pedido, codigo) {
  const localId = local?.id
  if (!localId) return false
  registrarPedidoStats(localId, pedido.total)

  const items = (pedido.items || []).map(it => ({
    nombre: it.producto?.nombre || 'Producto',
    cantidad: it.cantidad || 1,
    opciones: resumenSeleccion(it.producto, it.seleccion) || '',
    precio: precioItem(it),            // total de la línea (unitario × cantidad)
    notas: it.notas || '',
  }))

  const data = {
    codigo: codigo || '',
    estado: 'nuevo',
    entrega: pedido.entrega || 'recoger',
    // Datos del local (para el feed global del domiciliario, sin lecturas extra).
    localId,
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
    subtotal: pedido.subtotal || 0,
    domicilio: pedido.entrega === 'domicilio' ? (pedido.domicilio?.costo ?? 0) : 0,
    domicilioAConvenir: !!pedido.domicilioAConvenir,
    metodoPago: pedido.pago?.id || null,
    metodoPagoNombre: pedido.pago?.nombre || '',
    efectivoCon: pedido.pago?.tipo === 'efectivo' ? (pedido.pago?.cashAmount || 0) : 0,
    total: pedido.total || 0,
    cantidadItems: items.reduce((s, it) => s + it.cantidad, 0),
    createdAt: serverTimestamp(),
    // TTL: Firestore borra el doc pasada esta fecha (requiere activar la política TTL
    // sobre el grupo de colecciones 'pedidos', campo 'ttl', una vez en la consola).
    ttl: Timestamp.fromMillis(Date.now() + DIAS_VIDA * 86400000),
  }

  try {
    await addDoc(collection(db, 'locales', localId, 'pedidos'), data)
    return true
  } catch (err) {
    console.warn('No se pudo guardar el pedido:', err?.code || err)
    return false
  }
}

// 🔔 GLOBAL (solo para AVISAR): escucha los últimos pedidos para detectar cuando entra
// un DOMICILIO nuevo y sonar/notificar en el panel del domiciliario. NO alimenta ninguna
// lista (el panel es solo buscador por código): por eso el límite es pequeño y barato.
export function escucharNuevosDomicilios(cb, onError) {
  const q = query(collectionGroup(db, 'pedidos'), orderBy('createdAt', 'desc'), limit(20))
  const desde = Date.now() - DIAS_VIDA * 86400000
  return onSnapshot(
    q,
    snap => {
      const arr = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.entrega === 'domicilio')
        .filter(p => {
          const ms = p.createdAt?.toMillis ? p.createdAt.toMillis() : Date.now()
          return ms >= desde
        })
      cb(arr)
    },
    err => { console.warn('pedidos snapshot:', err?.code || err); onError?.(err) },
  )
}

// 🔎 GLOBAL: busca un pedido por CÓDIGO en todos los locales. Igualdad sobre campo
// único → sin índice compuesto. Tolerante a cómo lo escriba el domiciliario: acepta
// con o sin guion ("ft7k2q" también encuentra "FT-7K2Q").
export async function buscarPedidoGlobalPorCodigo(codigo) {
  const limpio = String(codigo || '').toUpperCase().replace(/\s+/g, '').trim()
  if (!limpio) return []
  const candidatos = new Set([limpio])
  const soloAlfa = limpio.replace(/[^A-Z0-9]/g, '')
  if (soloAlfa.length > 4) {
    // Reconstruye el formato guardado PREFIJO-XXXX (los últimos 4 son el sufijo).
    candidatos.add(`${soloAlfa.slice(0, -4)}-${soloAlfa.slice(-4)}`)
    candidatos.add(soloAlfa)
  }
  const q = query(collectionGroup(db, 'pedidos'), where('codigo', 'in', [...candidatos].slice(0, 10)), limit(10))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.entrega === 'domicilio')
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
}
