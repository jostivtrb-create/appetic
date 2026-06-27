// 📦 Acceso a datos de los locales en Firestore
// Estructura (ver PLANEACION D30):
//   locales/{localId} -> { nombre, slug, whatsapp, tema, horario, ... , suscripcion }
import { collection, query, where, limit, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Busca un local por su slug (el del link: appetic.app/su-negocio).
 * Devuelve { id, ...data } o null si no existe.
 * Optimizado para costo: 1 sola lectura por slug, sin listeners.
 */
export async function getLocalBySlug(slug) {
  if (!slug) return null
  const q = query(
    collection(db, 'locales'),
    where('slug', '==', slug.toLowerCase()),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return { id: docSnap.id, ...docSnap.data() }
}

/**
 * Locales visibles en el buscador del inicio (Capa 2): solo los que tienen
 * suscripción activa. 1 sola lectura, sin listeners (cuida costos D32).
 */
export async function getLocalesExplorador() {
  const q = query(collection(db, 'locales'), where('suscripcion.activa', '==', true))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Locales que administra un correo (para enrutar al panel desde la cuenta).
 * Devuelve [] si no administra ninguno.
 */
export async function getLocalesDeAdmin(email) {
  if (!email) return []
  const q = query(collection(db, 'locales'), where('admins', 'array-contains', email))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
