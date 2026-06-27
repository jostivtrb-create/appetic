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
