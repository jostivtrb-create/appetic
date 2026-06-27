import {
  doc, updateDoc, collection, addDoc, deleteDoc, increment,
} from 'firebase/firestore'
import { db } from '../config/firebase'

// ---- Config del local (horario, domicilio, pagos, etc.) ----
export async function actualizarLocal(localId, cambios) {
  await updateDoc(doc(db, 'locales', localId), cambios)
}

// Sube la versión del menú → invalida la caché de productos en los clientes.
async function bumpMenu(localId) {
  try {
    await updateDoc(doc(db, 'locales', localId), { menuVersion: increment(1) })
  } catch (err) {
    console.warn('No se pudo subir menuVersion', err?.code || err)
  }
}

// ---- Productos ---- (cada cambio sube la versión del menú)
export async function agregarProducto(localId, data) {
  const ref = await addDoc(collection(db, 'locales', localId, 'productos'), data)
  await bumpMenu(localId)
  return ref.id
}

export async function actualizarProducto(localId, productoId, cambios) {
  await updateDoc(doc(db, 'locales', localId, 'productos', productoId), cambios)
  await bumpMenu(localId)
}

export async function borrarProducto(localId, productoId) {
  await deleteDoc(doc(db, 'locales', localId, 'productos', productoId))
  await bumpMenu(localId)
}

// Nota: las métricas ahora viven en services/stats.js (contadores incrementales),
// para NO leer toda la colección de pedidos cada vez (cuida costos D32).
