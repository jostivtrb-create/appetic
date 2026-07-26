// 🛵 Domiciliarios GLOBALES de Appetic (una sola lista, no por local).
// Vive en config/domiciliarios = { emails: [...] }. El superadmin la mantiene;
// cualquier correo de la lista entra a /domiciliario y ve todos los pedidos a domicilio.
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

const REF = () => doc(db, 'config', 'domiciliarios')

// Lee la lista global de correos de domiciliarios (vacía si el doc no existe).
export async function getDomiciliariosGlobal() {
  try {
    const snap = await getDoc(REF())
    const emails = snap.exists() ? snap.data()?.emails : []
    return Array.isArray(emails) ? emails : []
  } catch (err) {
    console.warn('No se pudo leer los domiciliarios:', err?.code || err)
    return []
  }
}

// Guarda la lista global (solo superadmin, ver firestore.rules). Normaliza y quita repetidos.
export async function setDomiciliariosGlobal(emails) {
  const limpios = [...new Set(
    (emails || [])
      .map(e => String(e || '').trim().toLowerCase())
      .filter(Boolean),
  )]
  await setDoc(REF(), { emails: limpios }, { merge: true })
  return limpios
}
