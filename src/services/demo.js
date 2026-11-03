// 🍔 Demo para clientes (guía «Demo de clientes» D5 · D13 · D14 y «Blindaje» D5 · S12).
//
// El REINICIO vive en el servidor (api/demo.js): se hace solo de madrugada y cuando nadie la usa
// hace 30 min, y el superadmin lo puede pedir ya. Aquí queda:
//   • reiniciarDemoAhora() — el botón del superadmin.
//   • avisarDemo…          — «entré» y «sigo aquí» del visitante (para no reiniciársela encima).
//   • fijarFotosBase()     — guarda las fotos actuales como base: el reinicio no las borra.
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import { DEMO_SLUG } from '../config/demo'

const ID = DEMO_SLUG

// 📌 FOTOS BASE: las que subimos NOSOTROS por el panel de la demo (platos, portada, logo).
// «Fijar fotos» las guarda en config/demoBase; «Reiniciar» las vuelve a poner y no las borra.
const BASE = () => doc(db, 'config', 'demoBase')

export async function fijarFotosBase() {
  const [l, prods] = await Promise.all([getDoc(doc(db, 'locales', ID)), getDocs(collection(db, 'locales', ID, 'productos'))])
  const local = l.data() || {}
  const fotos = {}
  prods.docs.forEach(d => { const f = d.data().foto; if (f) fotos[d.id] = f })
  const base = { fotos, banner: local.banner || '', logo: local.logo || '', icono: local.icono || '', fijadaEn: serverTimestamp() }
  await setDoc(BASE(), base)
  return Object.keys(fotos).length
}

async function llamar(accion, conSesion = false, extra = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (conSesion && auth.currentUser) headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`
  const r = await fetch('/api/demo', { method: 'POST', headers, body: JSON.stringify({ accion, ...extra }), keepalive: true })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`)
  return d
}

// El botón del superadmin: la deja como nueva ya, aunque haya alguien adentro.
export const reiniciarDemoAhora = () => llamar('reiniciar', true)

// El visitante llega: si nadie la usaba hace 30 min, el servidor la reinicia antes. { reiniciada }
// `nueva` (primera vez hoy en este aparato) suma una visita a su `origen` (D22).
export const avisarDemoEntrada = ({ origen, nueva } = {}) => llamar('entrar', false, { origen, nueva }).catch(() => ({ reiniciada: false }))
// Tocó «Quiero esto para mi negocio» (D18 · D22).
export const avisarDemoInteresado = origen => llamar('interesado', false, { origen }).catch(() => {})
// «Sigo aquí» (cada 5 min mientras la tenga abierta): así no se la reinician encima.
export const avisarDemoLatido = () => llamar('latido').catch(() => {})
