import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getLocalesDeAdmin, getLocalById } from '../services/locales'
import { getRolesDeEquipo } from '../services/equipo'

// 🏪 Estado de administración: qué locales administra el usuario (dueño) y cuál
// está "seleccionado" para administrar. Alimenta la barra de admin.
//  • esDueno: administra ≥1 local → la barra pasa a modo administrador.
//  • slug: local seleccionado. 1 local → ese (automático). Varios → el elegido
//    en Cuenta (o null hasta que elija). Entrar a un local propio lo selecciona.
//  • equipo: locales donde es MESERO, COCINA o DOMICILIARIO (sin ser dueño) → también tiene barra,
//    pero solo ve la sección de su rol. rolesEn(slug) dice qué puede hacer en cada local.
const AdminContext = createContext(null)
export const useAdmin = () => useContext(AdminContext)

const SLUG_KEY = 'appetic_admin_slug'
const DEV_EQUIPO_KEY = 'appetic_dev_equipo'

// 🧪 DEV: ?equipo=bon-appetit:mesero,bon-appetit:cocina simula ser del equipo de esos locales de
// prueba (para revisar Mesero/Comandas sin iniciar sesión). ?equipo=0 lo quita. No existe en
// producción.
function devEquipo() {
  if (!import.meta.env.DEV) return null
  try {
    const q = new URLSearchParams(window.location.search).get('equipo')
    if (q === '0') sessionStorage.removeItem(DEV_EQUIPO_KEY)
    else if (q) sessionStorage.setItem(DEV_EQUIPO_KEY, q)
    const v = sessionStorage.getItem(DEV_EQUIPO_KEY)
    if (!v) return null
    return v.split(',').map(par => { const [slug, rol] = par.split(':'); return { slug: slug?.trim(), rol: rol?.trim() } })
      .filter(p => p.slug && ['mesero', 'cocina', 'domiciliario'].includes(p.rol))
  } catch { return null }
}

export function AdminProvider({ children }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [locales, setLocales] = useState([])
  const [cargando, setCargando] = useState(true)
  const [slug, setSlugState] = useState(null)
  const [equipo, setEquipo] = useState([]) // [{ local, rol }]

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
      // 🧪 DEV: equipo simulado (ver devEquipo).
      const simulado = devEquipo()
      if (simulado) {
        const { getDevLocal } = await import('../dev')
        const pares = await Promise.all(simulado.map(async p => {
          const d = await getDevLocal(p.slug)
          return d ? { local: d.local, rol: p.rol } : null
        }))
        if (activo) setEquipo(pares.filter(Boolean))
      }
      if (!user) { if (activo) { setLocales([]); if (!simulado) setEquipo([]); setCargando(false) } return }
      setCargando(true)
      try {
        const [ls, roles] = await Promise.all([getLocalesDeAdmin(user.email), getRolesDeEquipo(user.email)])
        // Del equipo, solo los locales que NO administra (si es dueño, ya lo ve todo).
        const ajenos = roles.filter(r => !ls.some(l => l.id === r.localId))
        const conLocal = await Promise.all(ajenos.map(async r => {
          const local = await getLocalById(r.localId).catch(() => null)
          return local ? { local, rol: r.rol } : null
        }))
        if (activo) {
          setLocales(ls)
          if (!simulado) setEquipo(conLocal.filter(Boolean))
        }
      } catch { if (activo) { setLocales([]); if (!simulado) setEquipo([]) } }
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
  // ¿Tiene barra del panel? Dueño o parte del equipo de algún local (el superadmin se suma aparte).
  const tienePanel = esDueno || equipo.length > 0
  // Locales del equipo (sin repetir), para el selector de la barra.
  const localesEquipo = [...new Map(equipo.map(e => [e.local.slug, e.local])).values()]

  // Qué puede hacer en un local: ['admin'] si lo administra; si no, sus roles de equipo.
  const rolesEn = useCallback((s, { esSuper = false } = {}) => {
    if (!s) return []
    if (esSuper || locales.some(l => l.slug === s)) return ['admin']
    return equipo.filter(e => e.local.slug === s).map(e => e.rol)
  }, [locales, equipo])

  const value = { locales, cargando, esDueno, slug, localSel, setSlug, equipo, localesEquipo, tienePanel, rolesEn }
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}
