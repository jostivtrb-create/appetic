// 📊 Estadísticas del local con CONTADORES (cuida costos D32).
// En vez de leer toda la colección de pedidos, mantenemos documentos-contador
// que se incrementan en cada evento. Leer las métricas = pocas lecturas fijas.
//
// Estructura:
//   locales/{localId}/stats/total          -> { visitas, pedidos, monto }   (acumulado)
//   locales/{localId}/stats/d_YYYY-MM-DD    -> { fecha, visitas, pedidos, monto } (por día)
import {
  doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, increment,
} from 'firebase/firestore'
import { db } from '../config/firebase'

function fechaKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Suma a los contadores (hoy + total) en una sola tanda. Best-effort.
async function sumar(localId, campos) {
  const dia = fechaKey()
  try {
    await Promise.all([
      setDoc(doc(db, 'locales', localId, 'stats', 'total'), campos, { merge: true }),
      setDoc(doc(db, 'locales', localId, 'stats', `d_${dia}`), { fecha: dia, ...campos }, { merge: true }),
    ])
  } catch (err) {
    console.warn('stats: no se pudo sumar', err?.code || err)
  }
}

// Cuenta UNA visita por DISPOSITIVO y por DÍA (no por recarga, pestaña ni sesión).
// Usa localStorage con la fecha en la clave: si este dispositivo ya visitó hoy,
// no vuelve a contar; al día siguiente cuenta una vez más como máximo.
export async function registrarVisita(localId) {
  if (!localId || localId === 'demo') return
  const hoy = fechaKey()
  const prefijo = `appetic_visit_${localId}_`
  const key = `${prefijo}${hoy}`
  try {
    if (localStorage.getItem(key)) return // ya contó hoy en este dispositivo
    // Limpia las marcas de días anteriores de este local (no acumular basura).
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith(prefijo) && k !== key) localStorage.removeItem(k)
    }
    localStorage.setItem(key, '1')
  } catch { /* sin localStorage: igual contamos (mejor de más que de menos) */ }
  await sumar(localId, { visitas: increment(1) })
}

// Suma un pedido enviado y su monto estimado.
export async function registrarPedidoStats(localId, total) {
  if (!localId || localId === 'demo') return
  await sumar(localId, { pedidos: increment(1), monto: increment(Number(total) || 0) })
}

// Lee las estadísticas para el panel: total (1 lectura) + últimos 7 días (≤7 lecturas).
export async function obtenerEstadisticas(localId) {
  const vacio = { visitas: 0, pedidos: 0, monto: 0 }
  const totalSnap = await getDoc(doc(db, 'locales', localId, 'stats', 'total'))
  const total = totalSnap.exists() ? { ...vacio, ...totalSnap.data() } : { ...vacio }

  let dias = []
  try {
    const q = query(collection(db, 'locales', localId, 'stats'), orderBy('fecha', 'desc'), limit(7))
    const snap = await getDocs(q)
    dias = snap.docs.map(d => ({ ...vacio, ...d.data() }))
  } catch { /* sin índice/datos: dejamos días vacío */ }

  const hoy = dias.find(d => d.fecha === fechaKey()) || { ...vacio, fecha: fechaKey() }
  return { total, hoy, dias }
}
