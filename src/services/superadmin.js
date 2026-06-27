// 👑 Operaciones de superadmin (solo jostivtrb@gmail.com, ver firestore.rules):
// listar todos los locales y activar/desactivar su suscripción (visibilidad en el buscador).
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

export async function listarTodosLocales() {
  const snap = await getDocs(collection(db, 'locales'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Activa/desactiva la suscripción. Actualiza solo el campo anidado, sin tocar el resto.
export async function setSuscripcion(localId, activa) {
  await updateDoc(doc(db, 'locales', localId), { 'suscripcion.activa': !!activa })
}
