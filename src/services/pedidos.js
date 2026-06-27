import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

// 📊 Registra un pedido ANÓNIMO para métricas (D12): nº de pedidos y $ estimado.
// Mide intención (pedidos enviados a WhatsApp), no venta confirmada.
// Best-effort: si falla, NO debe romper el flujo del cliente.
// Guarda lo mínimo (sin datos personales) para no inflar costos ni exponer privacidad.
export async function registrarPedido(localId, pedido) {
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
