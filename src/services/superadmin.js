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

// Define el correo del ADMIN (dueño) del local. Con ese Google el dueño entra a
// /<slug>/admin. Guarda el correo normalizado (minúsculas, sin espacios) como único
// admin del local. Solo el superadmin puede hacerlo (ver firestore.rules).
export async function setAdminEmail(localId, email) {
  const correo = String(email || '').trim().toLowerCase()
  await updateDoc(doc(db, 'locales', localId), { admins: [correo] })
}

// 🛵 Define los DOMICILIARIOS del local (correos Google). Con ese Google entran a
// /<slug>/domiciliario y ven los pedidos a domicilio para repartir. Guarda una lista
// normalizada y sin repetidos. Solo el superadmin puede hacerlo (ver firestore.rules).
export async function setDomiciliarios(localId, emails) {
  const limpios = [...new Set(
    (emails || [])
      .map(e => String(e || '').trim().toLowerCase())
      .filter(Boolean),
  )]
  await updateDoc(doc(db, 'locales', localId), { domiciliarios: limpios })
}
