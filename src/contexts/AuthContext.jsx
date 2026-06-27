import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut,
} from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setCargando(false)
    })
    return unsub
  }, [])

  // Login con Google: popup primero, con redirect como respaldo (lección PWA).
  async function entrar() {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, googleProvider)
      } else {
        throw err
      }
    }
  }

  async function salir() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, cargando, entrar, salir }}>
      {children}
    </AuthContext.Provider>
  )
}
