// 🔔 Notificaciones del sistema (app cerrada o celular bloqueado) — guía «Mesero y Comandas», 1g.
//
// Cada celular del mesero o del admin que toca «Activar avisos» queda registrado en
// locales/{localId}/dispositivos/{token} = { email, token, actualizadoEn }.
// Cuando la cocina confirma «entregado», /api/notificar-listo (función de Vercel) busca los
// dispositivos del mesero que tomó la comanda y de los admins del local, y les manda el aviso.
//
// En iPhone solo funciona con la app INSTALADA en la pantalla de inicio (límite de Apple).
import { getMessaging, getToken, deleteToken, isSupported } from 'firebase/messaging'
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import app, { db, auth } from '../config/firebase'

// Clave PÚBLICA de notificaciones web (Firebase → Cloud Messaging → Certificados push web).
// Es pública por diseño (va en cada navegador); la privada nunca sale de Firebase.
const VAPID = 'BBM6J8bJ1fqRT5kkb3iI2WzhGYAkwzFw1TjPYQnn_-L6hsP0OiLxg4sEPEOVJkjtfYWNtt7k4hrGBoNqHHFxCYw'

// La marca es por local Y por persona: en un celular compartido por turnos, el segundo mesero no
// hereda los avisos del primero (auditoría «mesero y cocina» H6).
const marcaKey = (localId, email) => `appetic_avisos_${localId}_${String(email || '').toLowerCase()}`
// Dónde quedó registrado este celular, para borrarlo al cerrar sesión: [{ localId, token }]
const REGISTROS = 'appetic_avisos_registros'
const leerRegistros = () => { try { return JSON.parse(localStorage.getItem(REGISTROS) || '[]') } catch { return [] } }
const guardarRegistros = l => { try { localStorage.setItem(REGISTROS, JSON.stringify(l)) } catch { /* nada */ } }

export async function avisosSoportados() {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) return false
  try { return await isSupported() } catch { return false }
}

// 'activo' · 'pendiente' (se puede activar) · 'bloqueado' (el usuario los negó en el navegador)
export function estadoAvisos(localId, email) {
  if (typeof Notification === 'undefined') return 'no'
  if (Notification.permission === 'denied') return 'bloqueado'
  let marcado = false
  try { marcado = localStorage.getItem(marcaKey(localId, email)) === '1' } catch { /* nada */ }
  return Notification.permission === 'granted' && marcado ? 'activo' : 'pendiente'
}

async function registrarSW() {
  const cfg = app.options
  const q = new URLSearchParams({
    apiKey: cfg.apiKey, projectId: cfg.projectId, messagingSenderId: cfg.messagingSenderId, appId: cfg.appId,
  })
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${q}`, { scope: '/firebase-cloud-messaging-push-scope' })
}

// Pide permiso (tiene que venir de un toque del usuario), saca el token y lo guarda en el local.
export async function activarAvisos(localId, email) {
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') throw new Error(permiso === 'denied' ? 'bloqueado' : 'sin-permiso')
  return registrar(localId, email)
}

// Saca el token (Google lo cambia de vez en cuando) y deja el celular a nombre de quien está ahora.
async function registrar(localId, email) {
  const registro = await registrarSW()
  const token = await getToken(getMessaging(app), { vapidKey: VAPID, serviceWorkerRegistration: registro })
  if (!token) throw new Error('sin-token')
  await setDoc(doc(db, 'locales', localId, 'dispositivos', token), {
    email: String(email || '').toLowerCase(), token, actualizadoEn: serverTimestamp(),
  })
  try { localStorage.setItem(marcaKey(localId, email), '1') } catch { /* nada */ }
  guardarRegistros([...leerRegistros().filter(r => !(r.localId === localId && r.token === token)), { localId, token }].slice(-20))
  return token
}

// Cada vez que se abre el panel con los avisos ya activos: se vuelve a registrar en silencio. Si
// Google cambió el token, el servidor había borrado el viejo y este celular dejaba de recibir el
// «¡Pedido listo!» sin enterarse. Best-effort.
export async function renovarAvisos(localId, email) {
  if (estadoAvisos(localId, email) !== 'activo') return
  try { await registrar(localId, email) } catch (e) { console.warn('No se pudieron renovar los avisos:', e?.message || e) }
}

// Al cerrar sesión: este celular deja de recibir los avisos de esa persona. Antes de signOut (las
// reglas exigen que el registro sea de quien borra).
export async function olvidarAvisos(email) {
  const regs = leerRegistros()
  if (!regs.length) return
  await Promise.all(regs.map(r => deleteDoc(doc(db, 'locales', r.localId, 'dispositivos', r.token)).catch(() => {})))
  try { if (await avisosSoportados()) await deleteToken(getMessaging(app)) } catch { /* nada */ }
  guardarRegistros([])
  try {
    const fin = `_${String(email || '').toLowerCase()}`
    Object.keys(localStorage).filter(k => k.startsWith('appetic_avisos_') && k.endsWith(fin)).forEach(k => localStorage.removeItem(k))
  } catch { /* nada */ }
}

// La cocina avisa que entregó: el servidor manda la notificación. Best-effort (nunca frena a la
// cocina): si falla, el mesero igual lo ve en la app.
export async function notificarListo(localId, comandaId) {
  try {
    const idToken = await auth.currentUser?.getIdToken()
    if (!idToken) return
    await fetch('/api/notificar-listo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ localId, comandaId }),
    })
  } catch (err) {
    console.warn('No se pudo mandar la notificación:', err?.message || err)
  }
}
