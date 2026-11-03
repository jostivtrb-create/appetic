import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { getPerfil, guardarPerfil } from '../services/usuarios'

// ❤️ Favoritos del cliente, como un mini-resumen por local { id, slug, nombre, logo } para mostrarlos
// en "Mis favoritos" SIN lecturas extra (cuida costos D32).
//  • Con sesión: en su perfil (usuarios/{uid}.favoritos).
//  • Sin sesión: en este aparato. Al iniciar sesión se suman a su perfil.
// Todo local donde el cliente PIDE le queda de favorito solo (guía «Planes en la app» D14).
const FavoritosContext = createContext(null)
export const useFavoritos = () => useContext(FavoritosContext)

const KEY = 'appetic_favoritos'
const leerAparato = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
const guardarAparato = l => { try { localStorage.setItem(KEY, JSON.stringify(l)) } catch { /* nada */ } }
const resumen = local => ({ id: local.id, slug: local.slug, nombre: local.nombre, logo: local.logo || '' })

export function FavoritosProvider({ children }) {
  const { user } = useAuth()
  const [favoritos, setFavoritos] = useState(leerAparato)
  const listos = useRef(!user)

  useEffect(() => {
    if (!user) { listos.current = true; setFavoritos(leerAparato()); return }
    listos.current = false
    let activo = true
    getPerfil(user.uid).then(p => {
      if (!activo) return
      const delPerfil = p?.favoritos || []
      // Los que marcó (o pidió) sin sesión en este aparato se suman a su perfil, una sola vez.
      const sueltos = leerAparato().filter(f => !delPerfil.some(x => x.id === f.id))
      const todos = [...delPerfil, ...sueltos]
      setFavoritos(todos)
      listos.current = true
      if (sueltos.length) guardarPerfil(user.uid, { favoritos: todos })
      guardarAparato([])
    })
    return () => { activo = false }
  }, [user])

  function guardar(next) {
    setFavoritos(next)
    if (user) guardarPerfil(user.uid, { favoritos: next }) // best-effort (persiste con las reglas desplegadas)
    else guardarAparato(next)
  }

  function esFavorito(id) {
    return favoritos.some(f => f.id === id)
  }

  // Devuelve true si quedó como favorito y false si se quitó.
  function toggleFavorito(local) {
    const existe = favoritos.some(f => f.id === local.id)
    guardar(existe ? favoritos.filter(f => f.id !== local.id) : [...favoritos, resumen(local)])
    return !existe
  }

  // Al pedir: lo deja de favorito si no lo era (nunca lo quita).
  function agregarFavorito(local) {
    if (!local?.id || local.esDemo) return
    // Con sesión, espera a que llegue su perfil para no pisarlo con la lista vacía.
    const base = listos.current ? favoritos : leerAparato()
    if (base.some(f => f.id === local.id)) return
    if (!listos.current) { guardarAparato([...base, resumen(local)]); return }
    guardar([...base, resumen(local)])
  }

  return (
    <FavoritosContext.Provider value={{ favoritos, esFavorito, toggleFavorito, agregarFavorito }}>
      {children}
    </FavoritosContext.Provider>
  )
}
