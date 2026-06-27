import {
  doc, updateDoc, collection, addDoc, deleteDoc, getDocs,
} from 'firebase/firestore'
import { db } from '../config/firebase'

// ---- Config del local (horario, domicilio, pagos, etc.) ----
export async function actualizarLocal(localId, cambios) {
  await updateDoc(doc(db, 'locales', localId), cambios)
}

// ---- Productos ----
export async function agregarProducto(localId, data) {
  const ref = await addDoc(collection(db, 'locales', localId, 'productos'), data)
  return ref.id
}

export async function actualizarProducto(localId, productoId, cambios) {
  await updateDoc(doc(db, 'locales', localId, 'productos', productoId), cambios)
}

export async function borrarProducto(localId, productoId) {
  await deleteDoc(doc(db, 'locales', localId, 'productos', productoId))
}

// ---- Métricas (pedidos enviados) ----
// Lee la subcolección 'pedidos' y agrega total/conteo.
// Para v1 está bien; si crece, se reemplaza por un contador incremental.
export async function obtenerMetricas(localId) {
  const snap = await getDocs(collection(db, 'locales', localId, 'pedidos'))
  let pedidos = 0
  let monto = 0
  snap.forEach((d) => {
    pedidos += 1
    monto += Number(d.data().total) || 0
  })
  return { pedidos, monto }
}
