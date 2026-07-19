import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getLocalesDeAdmin } from '../services/locales'

// 🏪 Estado de administración: qué locales administra el usuario (dueño) y cuál
// está "seleccionado" para administrar. Alimenta la barra de admin.
//  • esDueno: administra ≥1 local → la barra pasa a modo administrador.
//  • slug: local seleccionado. 1 local → ese (automático). Varios → el elegido
//    en Cuenta (o null hasta que elija). Entrar a un local propio lo selecciona.
const AdminContext = createContext(null)
export const useAdmin = () => useContext(AdminContext)

const SLUG_KEY = 'appetic_admin_slug'

export function AdminProvider({ children }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [locales, setLocales] = useState([])
  const [cargando, setCargando] = useState(true)
  const [slug, setSlugState] = useState(null)

  const setSlug = useCallback((s) => {
    setSlugState(s)
    try { if (s) localStorage.setItem(SLUG_KEY, s); else localStorage.removeItem(SLUG_KEY) } catch { /* nada */ }
  }, [])

  // Carga los locales que administra el usuario.
  useEffect(() => {
    let activo = true
    async function cargar() {
      // 🧪 DEV: ?owner=slug1,slug2 simula ser dueño de esos locales de prueba
      // (para revisar el flujo sin iniciar sesión). No aplica en producción.
      if (import.meta.env.DEV) {
        const owner = new URLSearchParams(window.location.search).get('owner')
        if (owner) {
          const { getDevLocal } = await import('../dev')
          const slugs = owner.split(',').map(s => s.trim()).filter(Boolean)
          const devs = await Promise.all(slugs.map(s => getDevLocal(s)))
          if (!activo) return
          setLocales(devs.filter(Boolean).map(d => d.local))
          setCargando(false)
          return
        }
      }
      if (!user) { if (activo) { setLocales([]); setCargando(false) } return }
      setCargando(true)
      try {
        const ls = await getLocalesDeAdmin(user.email)
        if (activo) setLocales(ls)
      } catch { if (activo) setLocales([]) }
      finally { if (activo) setCargando(false) }
    }
    cargar()
    return () => { activo = false }
  }, [user])

  // Selección por defecto: 1 local → ese; varios → el guardado (si sigue válido); ninguno → null.
  useEffect(() => {
    if (cargando) return
    if (locales.length === 1) { setSlugState(locales[0].slug); return }
    if (locales.length === 0) { setSlugState(null); return }
    let guardado = null
    try { guardado = localStorage.getItem(SLUG_KEY) } catch { /* nada */ }
    setSlugState(locales.some(l => l.slug === guardado) ? guardado : null)
  }, [locales, cargando])

  // Al entrar a un local propio, queda seleccionado.
  useEffect(() => {
    const seg = pathname.split('/')[1]
    if (seg && locales.some(l => l.slug === seg)) setSlug(seg)
  }, [pathname, locales, setSlug])

  const esDueno = locales.length > 0
  const localSel = locales.find(l => l.slug === slug) || null

  const value = { locales, cargando, esDueno, slug, localSel, setSlug }
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}
