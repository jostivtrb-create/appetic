// 🔑 Lo que comparten las funciones de Vercel (api/*.js). Las carpetas con «_» no son rutas.
//
// firebase-admin se carga DENTRO de la petición (no arriba del archivo): si algo falla al cargarlo,
// la función responde el motivo en vez de morir con un FUNCTION_INVOCATION_FAILED mudo.
//
// La llave es la variable secreta FIREBASE_SERVICE_ACCOUNT de Vercel: el JSON tal cual o en UNA
// línea base64 (scripts/serviceAccount.base64.txt, ignorado por git).
let fa = null
export async function cargar() {
  if (fa) return fa
  const [app, auth, fs, msg, ac, st] = await Promise.all([
    import('firebase-admin/app'), import('firebase-admin/auth'), import('firebase-admin/firestore'),
    import('firebase-admin/messaging'), import('firebase-admin/app-check'), import('firebase-admin/storage'),
  ])
  fa = {
    initializeApp: app.initializeApp, cert: app.cert, getApps: app.getApps,
    getAuth: auth.getAuth, getFirestore: fs.getFirestore, FieldValue: fs.FieldValue, Timestamp: fs.Timestamp,
    getMessaging: msg.getMessaging, getAppCheck: ac.getAppCheck, getStorage: st.getStorage,
  }
  return fa
}

export const SUPERADMINS = ['jostivtrb@gmail.com'] // espejo de src/config/roles.js

function leerLlave(raw) {
  let t = String(raw || '').trim()
  if (/^["'].*["']$/s.test(t)) t = t.slice(1, -1).trim()
  if (!t.startsWith('{')) t = Buffer.from(t, 'base64').toString('utf8').trim()
  return JSON.parse(t)
}

function iniciar({ getApps, initializeApp, cert }) {
  if (getApps().length) return true
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return false
  const llave = leerLlave(raw)
  initializeApp({ credential: cert(llave), storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || `${llave.project_id}.firebasestorage.app` })
  return true
}

// Carga e inicia firebase-admin. Devuelve { f } o responde el error y devuelve null.
export async function conAdmin(res) {
  let f
  try { f = await cargar() } catch (e) {
    console.error('api: no cargó firebase-admin', e)
    res.status(500).json({ error: 'No cargó firebase-admin', detalle: String(e?.message || e).slice(0, 300) })
    return null
  }
  try {
    if (!iniciar(f)) { res.status(503).json({ error: 'Falta FIREBASE_SERVICE_ACCOUNT en Vercel' }); return null }
  } catch (e) {
    // Pistas SIN revelar la llave: largo, saltos de línea y cómo empieza (`{"type":…`, no es secreto).
    const raw = String(process.env.FIREBASE_SERVICE_ACCOUNT || '')
    res.status(500).json({
      error: 'La llave FIREBASE_SERVICE_ACCOUNT no es válida', detalle: String(e?.message || e).slice(0, 160),
      largo: raw.length, saltos: (raw.match(/\n/g) || []).length, empieza: raw.slice(0, 12),
    })
    return null
  }
  return f
}

export const cuerpo = req => (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}))

// La conexión de quien llama (la primera IP de la cadena que pone Vercel).
export const ipDe = req => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim() || 'sin-ip'

// Quién llama, si mandó su sesión (Authorization: Bearer <idToken>). null si no.
export async function sesionDe(f, req) {
  const idToken = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!idToken) return null
  return f.getAuth().verifyIdToken(idToken).catch(() => null)
}

// 🛡️ App Check (guía «Blindaje» D7 · S10). La app manda X-Firebase-AppCheck. Mientras
// APPCHECK_OBLIGATORIO no sea «1», solo se MIDE (se registra si vino o no, sin bloquear); así se
// puede prender sin dejar por fuera a nadie y exigirlo cuando las métricas digan que todos la traen.
export async function revisarAppCheck(f, req) {
  const token = String(req.headers['x-firebase-appcheck'] || '')
  let valido = false
  if (token) valido = !!(await f.getAppCheck().verifyToken(token).catch(() => null))
  const obligatorio = process.env.APPCHECK_OBLIGATORIO === '1'
  if (!valido) console.info(`appcheck: ${token ? 'inválido' : 'sin token'}${obligatorio ? ' · BLOQUEADO' : ' · solo se mide'}`)
  return { valido, bloquear: obligatorio && !valido }
}
