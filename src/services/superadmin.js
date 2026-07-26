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

// 🗂️ Etiquetas del local para los chips del INICIO (ids del catálogo curado
// en src/config/categoriasLocales.js). Solo el superadmin las cambia.
export async function setEtiquetas(localId, etiquetas) {
  await updateDoc(doc(db, 'locales', localId), { etiquetas: etiquetas || [] })
}

// ⭐ Prioridad comercial: el local con prioridad > 0 aparece arriba del listado
// del inicio con el badge "Recomendado" (el boost sutil del local bandera).
export async function setPrioridad(localId, prioridad) {
  await updateDoc(doc(db, 'locales', localId), { prioridad: Number(prioridad) || 0 })
}
