// 📋 Solicitudes de cotización y visitas que llegan de la propuesta web (switflysolutions.com/appetic → /api/solicitud).
// Las crea solo el servidor; aquí el superadmin las lista y les mueve el estado (ver firestore.rules).
// Cada doc trae `registro`: 'cotizacion' (estado nueva → contactada → cerrada) o 'visita' (el vendedor
// pasó y el dueño no pidió cotización; estado fijo 'visita', con `motivo` y `motivoTexto`).
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

export const ESTADOS_SOLICITUD = ['pendiente', 'enviada', 'cerrada'] // antes nueva → contactada (guía «Paquetes» S5)

// Por qué una visita no terminó en cotización (guía «Propuesta web» D22). Espejo de api/solicitud.js.
export const MOTIVOS_VISITA = {
  'no-estaba': 'El dueño no estaba',
  ocupados: 'Estaban ocupados',
  'no-se-dejo-hablar': 'No se dejó hablar',
  'no-le-intereso': 'No le interesó',
  otro: 'Otro',
}

const PUNTOS_POR_LINK = 10 // Google Maps acepta ~10 paradas por link de indicaciones
const coord = p => `${Number(p.lat).toFixed(6)},${Number(p.lng).toFixed(6)}`

// El recorrido de un vendedor ([{ lat, lng }] en orden) → links de Google Maps para verlo en el mapa.
// Devuelve SIEMPRE un array: 1 link si son ≤ 10 puntos; si son más, un link por tramo de hasta 10
// puntos, y cada tramo arranca donde terminó el anterior (para que no quede un hueco entre ellos).
// Con un solo punto no hay ruta: se abre el punto.
export function recorridoUrls(puntos) {
  const ps = (puntos || []).filter(p => p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
  if (ps.length === 0) return []
  if (ps.length === 1) return [`https://www.google.com/maps?q=${coord(ps[0])}`]
  const urls = []
  for (let i = 0; i < ps.length - 1; i += PUNTOS_POR_LINK - 1) {
    const tramo = ps.slice(i, i + PUNTOS_POR_LINK)
    urls.push(`https://www.google.com/maps/dir/${tramo.map(coord).join('/')}`)
  }
  return urls
}

// Las últimas 200, de la más nueva a la más vieja.
export async function listarSolicitudes() {
  const snap = await getDocs(query(collection(db, 'solicitudes'), orderBy('creadaEn', 'desc'), limit(200)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// pendiente → enviada → cerrada (o de vuelta). Guarda cuándo se movió.
export async function cambiarEstadoSolicitud(id, estado) {
  if (!ESTADOS_SOLICITUD.includes(estado)) throw new Error(`Estado desconocido: ${estado}`)
  await updateDoc(doc(db, 'solicitudes', id), { estado, estadoEn: serverTimestamp() })
}
