// 📊 Estadísticas del local con CONTADORES (cuida costos D32).
// En vez de leer toda la colección de pedidos, mantenemos documentos-contador
// que se incrementan en cada evento. Leer las métricas = pocas lecturas fijas.
//
// Estructura:
//   locales/{localId}/stats/total          -> { visitas, pedidos, monto, domicilios, recoger, mesaQR } (acumulado)
//   locales/{localId}/stats/d_YYYY-MM-DD    -> { fecha, visitas, pedidos, monto, domicilios, recoger, mesaQR } (por día)
import {
  doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, increment, startAt, endAt,
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
  if (!localId) return
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

// Suma un pedido enviado y su monto estimado, y de qué tipo fue: domicilio, recoger o desde el QR
// de una mesa. Los pedidos se borran a los 2 días (TTL); estos contadores quedan para siempre y son
// los que responden «¿cuántos domicilios hicieron este mes?».
const CAMPO_ENTREGA = { domicilio: 'domicilios', recoger: 'recoger', mesa: 'mesaQR' }
export async function registrarPedidoStats(localId, total, entrega) {
  if (!localId) return
  const campo = CAMPO_ENTREGA[entrega]
  await sumar(localId, { pedidos: increment(1), monto: increment(Number(total) || 0), ...(campo ? { [campo]: increment(1) } : {}) })
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

// 📊 Cuentas → Mes (guía «Cuentas del negocio» D15): visitas y pedidos por la app de un rango de
// días ('AAAA-MM-DD'). Lo que era «Métricas» vive ahora dentro de Cuentas; el «Estimado» en plata
// ya no se muestra (las ventas de verdad salen de la caja).
export async function estadisticasEntre(localId, desde, hasta) {
  const q = query(collection(db, 'locales', localId, 'stats'), orderBy('fecha'), startAt(desde), endAt(hasta))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data()).reduce((t, d) => ({
    visitas: t.visitas + (d.visitas || 0), pedidos: t.pedidos + (d.pedidos || 0),
    domicilios: t.domicilios + (d.domicilios || 0), recoger: t.recoger + (d.recoger || 0),
  }), { visitas: 0, pedidos: 0, domicilios: 0, recoger: 0 })
}
