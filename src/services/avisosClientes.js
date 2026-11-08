// 🔔 Avisos del dueño a sus clientes (modelo en utils/avisosClientes.js).
// El CLIENTE se suscribe después de su primer pedido o al marcar el local de favorito (D34): el
// navegador pide permiso y el token queda en el local. El DUEÑO escribe el aviso en Difundir y lo
// manda el servidor (/api/avisar-clientes), con el tope de 3 por semana. En iPhone solo funciona con
// la app instalada (D18): si el navegador no lo soporta, ni se ofrece.
import { getMessaging, getToken } from 'firebase/messaging'
import { collection, doc, setDoc, getCountFromServer, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import app, { db, auth } from '../config/firebase'
import { avisosSoportados, registrarSW, VAPID } from './notificaciones'

const MARCA = id => `appetic_suscrito_${id}`
const NO = id => `appetic_avisos_no_${id}`
const DIAS_SIN_PREGUNTAR = 30
const lsGet = k => { try { return localStorage.getItem(k) } catch { return null } }
const lsSet = (k, v) => { try { localStorage.setItem(k, v) } catch { /* nada */ } }

// ¿Le ofrecemos los avisos de este local? Solo si el navegador puede, no los bloqueó, no está ya
// suscrito y no dijo «Ahora no» hace menos de 30 días.
export async function puedeInvitar(localId) {
  if (!localId || typeof Notification === 'undefined' || Notification.permission === 'denied') return false
  if (lsGet(MARCA(localId)) === '1') return false
  const no = Number(lsGet(NO(localId)) || 0)
  if (no && Date.now() - no < DIAS_SIN_PREGUNTAR * 86400000) return false
  return avisosSoportados()
}
export const yaSuscrito = localId => lsGet(MARCA(localId)) === '1'
export const ahoraNo = localId => lsSet(NO(localId), String(Date.now()))

// Tiene que venir de un toque (el navegador lo exige para pedir permiso).
export async function suscribirse(localId, motivo) {
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') { ahoraNo(localId); throw new Error(permiso === 'denied' ? 'bloqueado' : 'sin-permiso') }
  const registro = await registrarSW()
  const token = await getToken(getMessaging(app), { vapidKey: VAPID, serviceWorkerRegistration: registro })
  if (!token) throw new Error('sin-token')
  await setDoc(doc(db, 'locales', localId, 'suscriptores', token), { token, motivo: motivo === 'favorito' ? 'favorito' : 'pedido', desde: serverTimestamp() })
  lsSet(MARCA(localId), '1')
  return token
}

// ── El dueño ──
export async function contarSuscriptores(localId) {
  const s = await getCountFromServer(collection(db, 'locales', localId, 'suscriptores'))
  return s.data().count
}
export function escucharAvisos(localId, cb, onError) {
  const q = query(collection(db, 'locales', localId, 'avisos'), orderBy('en', 'desc'), limit(10))
  return onSnapshot(q, s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), onError)
}
// Cuántos lleva esta semana (los cuenta el servidor al enviar).
export function escucharSemana(localId, semana, cb) {
  return onSnapshot(doc(db, 'locales', localId, 'avisosSemana', semana), s => cb(s.exists() ? s.data().n || 0 : 0), () => cb(0))
}
export async function enviarAviso(localId, titulo, mensaje) {
  const idToken = await auth.currentUser?.getIdToken()
  if (!idToken) throw new Error('Se cerró la sesión. Vuelve a entrar.')
  const r = await fetch('/api/avisar-clientes', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ localId, titulo, mensaje }),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || 'No se pudo enviar el aviso.')
  return j
}
