import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut,
} from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// Traduce el código de error de Firebase a un mensaje que el cliente entienda.
// Estas son las causas reales por las que a alguien "no le abre" en el celular.
function mensajeError(err) {
  const code = err?.code || ''
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Cerraste la ventana de Google antes de terminar. Inténtalo de nuevo.'
    case 'auth/network-request-failed':
      return 'No hay conexión estable. Revisa tu internet e inténtalo otra vez.'
    case 'auth/web-storage-unsupported':
    case 'auth/operation-not-supported-in-this-environment':
      return 'Tu navegador está bloqueando el inicio de sesión. Abre el enlace en Chrome o Safari (no dentro de Instagram/Facebook) y activa las cookies.'
    case 'auth/unauthorized-domain':
      return 'Este sitio aún no está autorizado para iniciar sesión. Avísale al administrador.'
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento y vuelve a intentar.'
    default:
      // Mensaje genérico + el código real para poder diagnosticar si vuelve a pasar.
      return `No se pudo iniciar sesión${code ? ` (${code})` : ''}. Prueba abriendo el enlace en Chrome o Safari.`
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorLogin, setErrorLogin] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setCargando(false)
    })
    // Al volver de un login por redirect (respaldo del popup), consumimos el
    // resultado. Si falló, aquí es donde aparece el error — antes se perdía.
    getRedirectResult(auth).catch((err) => {
      console.error('[login] falló el redirect de Google:', err?.code, err)
      setErrorLogin(mensajeError(err))
    })
    return unsub
  }, [])

  // Login con Google: popup primero, con redirect como respaldo (lección PWA).
  // Nunca lanza: guarda el error en `errorLogin` para que la pantalla lo muestre.
  async function entrar() {
    setErrorLogin(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, googleProvider)
        } catch (err2) {
          console.error('[login] falló popup y redirect:', err2?.code, err2)
          setErrorLogin(mensajeError(err2))
        }
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // El usuario abrió otra ventana; no es un fallo real, no molestamos.
      } else {
        console.error('[login] falló el popup de Google:', err?.code, err)
        setErrorLogin(mensajeError(err))
      }
    }
  }

  async function salir() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, cargando, entrar, salir, errorLogin }}>
      {children}
    </AuthContext.Provider>
  )
}
