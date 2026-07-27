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

// Define los correos de los ADMINS (dueños) del local. Con esos Google entran a
// /<slug>/admin. Se admite MÁS DE UNO (ej. el dueño y su socio o el encargado):
// todos tienen exactamente los mismos permisos, no hay jerarquía entre ellos.
// Guarda los correos normalizados (minúsculas, sin espacios) y sin repetidos:
// firestore.rules compara el correo del token TAL CUAL contra `admins`, así que un
// correo con mayúsculas abriría el panel pero fallaría al guardar.
// Solo el superadmin puede hacerlo (ver firestore.rules).
export async function setAdminEmails(localId, emails) {
  const lista = (Array.isArray(emails) ? emails : [emails])
    .map(e => String(e || '').trim().toLowerCase())
    .filter(Boolean)
  await updateDoc(doc(db, 'locales', localId), { admins: [...new Set(lista)] })
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
