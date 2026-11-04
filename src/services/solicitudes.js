// 📋 Solicitudes de cotización que llegan de la propuesta web (switflysolutions.com/appetic → /api/solicitud).
// Las crea solo el servidor; aquí el superadmin las lista y les mueve el estado (ver firestore.rules).
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

export const ESTADOS_SOLICITUD = ['nueva', 'contactada', 'cerrada']

// Las últimas 200, de la más nueva a la más vieja.
export async function listarSolicitudes() {
  const snap = await getDocs(query(collection(db, 'solicitudes'), orderBy('creadaEn', 'desc'), limit(200)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// nueva → contactada → cerrada (o de vuelta). Guarda cuándo se movió.
export async function cambiarEstadoSolicitud(id, estado) {
  if (!ESTADOS_SOLICITUD.includes(estado)) throw new Error(`Estado desconocido: ${estado}`)
  await updateDoc(doc(db, 'solicitudes', id), { estado, estadoEn: serverTimestamp() })
}
