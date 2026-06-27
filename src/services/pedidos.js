import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { registrarPedidoStats } from './stats'

// 📊 Registra un pedido ANÓNIMO (D12): nº de pedidos y $ estimado.
// Mide intención (pedidos enviados a WhatsApp), no venta confirmada.
// Best-effort: si falla, NO debe romper el flujo del cliente.
// - Suma a los contadores de stats (lectura barata para el panel).
// - Guarda además el pedido (mínimo, sin datos personales) por si luego se usa.
export async function registrarPedido(localId, pedido) {
  // Contadores (lo que el panel lee de forma barata).
  registrarPedidoStats(localId, pedido.total)
  try {
    await addDoc(collection(db, 'locales', localId, 'pedidos'), {
      total: pedido.total,
      subtotal: pedido.subtotal,
      domicilio: pedido.entrega === 'domicilio' ? (pedido.domicilio?.costo ?? 0) : 0,
      entrega: pedido.entrega,
      metodoPago: pedido.pago?.id || null,
      cantidadItems: pedido.items.reduce((s, it) => s + it.cantidad, 0),
      createdAt: serverTimestamp(),
    })
    return true
  } catch (err) {
    console.warn('No se pudo registrar el pedido (métricas):', err?.code || err)
    return false
  }
}
