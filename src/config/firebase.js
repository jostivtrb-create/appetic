// 🔥 Inicialización de Firebase (Appetic)
// Las claves vienen de variables de entorno (.env) — ver .env.example
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Mantener la sesión del local (admin) guardada en el dispositivo.
// Evita que se cierre sola en la PWA instalada (lección de TodyPan).
setPersistence(auth, browserLocalPersistence).catch(() => {})

export default app

// 🛡️ App Check (guía «Blindaje» D7 · S10): prueba de que quien escribe es ESTA app y no un script.
// Solo se prende con la clave de reCAPTCHA v3 (VITE_RECAPTCHA_V3) puesta; sin ella todo sigue igual.
// Se carga aparte para no pesar en el arranque.
let appCheck = null
const CLAVE_RECAPTCHA = import.meta.env.VITE_RECAPTCHA_V3
if (CLAVE_RECAPTCHA && typeof window !== 'undefined') {
  appCheck = import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaV3Provider }) =>
    initializeAppCheck(app, { provider: new ReCaptchaV3Provider(CLAVE_RECAPTCHA), isTokenAutoRefreshEnabled: true }),
  ).catch(e => { console.warn('App Check no arrancó', e); return null })
}

// El token para mandarlo a nuestras funciones (api/*). '' si App Check no está prendido.
export async function tokenAppCheck() {
  try {
    const ac = await appCheck
    if (!ac) return ''
    const { getToken } = await import('firebase/app-check')
    return (await getToken(ac)).token || ''
  } catch { return '' }
}
