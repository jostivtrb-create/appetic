// 📦 Productos de un local en Firestore: locales/{localId}/productos
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Trae todos los productos de un local en UNA sola lectura por carga.
 * (Optimizado para costo: sin listeners en tiempo real para el cliente.)
 */
export async function getProductos(localId) {
  const col = collection(db, 'locales', localId, 'productos')
  let snap
  try {
    snap = await getDocs(query(col, orderBy('orden', 'asc')))
  } catch {
    // Si no existe el campo 'orden', traer sin ordenar
    snap = await getDocs(col)
  }
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
