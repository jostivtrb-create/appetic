import {
  collection, addDoc, serverTimestamp, query, orderBy, limit, where, getDocs, onSnapshot,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { registrarPedidoStats } from './stats'
import { precioItem } from '../utils/price'
import { resumenSeleccion } from '../utils/selectionSummary'

// 🧾 Guarda el pedido COMPLETO en Firestore (locales/{id}/pedidos) con su CÓDIGO.
// Este documento es la FUENTE DE VERDAD del precio: el domiciliario busca por código
// y ve estos importes, no los del texto de WhatsApp (que el cliente podría editar).
// Best-effort: si falla, NO rompe el flujo del cliente (igual se abre WhatsApp).
// Devuelve true si quedó guardado.
export async function crearPedido(localId, pedido, codigo) {
  // Contadores baratos para el panel del dueño (métricas).
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
    estado: 'nuevo',                   // reservado para el futuro (en camino/entregado)
    entrega: pedido.entrega || 'recoger',
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
  }

  try {
    await addDoc(collection(db, 'locales', localId, 'pedidos'), data)
    return true
  } catch (err) {
    console.warn('No se pudo guardar el pedido:', err?.code || err)
    return false
  }
}

// 🛵 Escucha en vivo los últimos pedidos a DOMICILIO del local (para el panel del
// domiciliario). Orden por fecha desc (índice de campo único, sin índice compuesto);
// el filtro 'domicilio' se hace en el cliente para no exigir índice compuesto.
// Devuelve la función de "unsubscribe".
export function escucharPedidosDomicilio(localId, cb, onError) {
  const q = query(
    collection(db, 'locales', localId, 'pedidos'),
    orderBy('createdAt', 'desc'),
    limit(120),
  )
  return onSnapshot(
    q,
    snap => {
      const arr = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.entrega === 'domicilio')
      cb(arr)
    },
    err => { console.warn('pedidos snapshot:', err?.code || err); onError?.(err) },
  )
}

// 🔎 Busca un pedido por su CÓDIGO (igualdad, campo único → sin índice compuesto).
export async function buscarPedidoPorCodigo(localId, codigo) {
  const c = String(codigo || '').toUpperCase().trim()
  if (!c) return []
  const q = query(
    collection(db, 'locales', localId, 'pedidos'),
    where('codigo', '==', c),
    limit(5),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
