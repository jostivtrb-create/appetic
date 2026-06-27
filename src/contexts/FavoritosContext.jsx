import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { getPerfil, guardarPerfil } from '../services/usuarios'

// ❤️ Favoritos del cliente. Se guardan en su perfil (usuarios/{uid}.favoritos)
// como un mini-resumen por local { id, slug, nombre, logo } para mostrarlos en
// "Mis favoritos" SIN lecturas extra (cuida costos D32).
const FavoritosContext = createContext(null)
export const useFavoritos = () => useContext(FavoritosContext)

export function FavoritosProvider({ children }) {
  const { user } = useAuth()
  const [favoritos, setFavoritos] = useState([])

  useEffect(() => {
    if (!user) { setFavoritos([]); return }
    let activo = true
    getPerfil(user.uid).then(p => { if (activo) setFavoritos(p?.favoritos || []) })
    return () => { activo = false }
  }, [user])

  function esFavorito(id) {
    return favoritos.some(f => f.id === id)
  }

  // Devuelve true si quedó como favorito, false si se quitó, null si no hay sesión.
  function toggleFavorito(local) {
    if (!user) return null
    const existe = favoritos.some(f => f.id === local.id)
    const next = existe
      ? favoritos.filter(f => f.id !== local.id)
      : [...favoritos, { id: local.id, slug: local.slug, nombre: local.nombre, logo: local.logo || '' }]
    setFavoritos(next)
    guardarPerfil(user.uid, { favoritos: next }) // best-effort (persiste con las reglas desplegadas)
    return !existe
  }

  return (
    <FavoritosContext.Provider value={{ favoritos, esFavorito, toggleFavorito }}>
      {children}
    </FavoritosContext.Provider>
  )
}
