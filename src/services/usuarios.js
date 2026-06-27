// 👤 Perfil del cliente: usuarios/{uid} -> { nombre, telefono, direccion, ... }
// Sirve para prellenar el checkout y guardar preferencias. Solo el propio
// usuario puede leer/escribir su perfil (ver firestore.rules).
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

export async function getPerfil(uid) {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db, 'usuarios', uid))
    return snap.exists() ? snap.data() : null
  } catch {
    return null
  }
}

// Guarda/actualiza el perfil (merge, best-effort: no debe romper el flujo).
export async function guardarPerfil(uid, datos) {
  if (!uid) return false
  try {
    await setDoc(
      doc(db, 'usuarios', uid),
      { ...datos, updatedAt: serverTimestamp() },
      { merge: true }
    )
    return true
  } catch (err) {
    console.warn('No se pudo guardar el perfil:', err?.code || err)
    return false
  }
}
