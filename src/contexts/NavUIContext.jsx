import { createContext, useContext, useState, useCallback } from 'react'

// 🧭 Estado compartido de la barra inferior GLOBAL (siempre visible: Menú ·
// Favoritos · [🛒] · Buscar · Cuenta).
//
//  • activeLocal: el local "en curso". Lo fija LocalMenu al entrar y se
//    CONSERVA aunque navegues a Buscar/Cuenta/Favoritos, para que "Menú" y el
//    carrito sigan apuntando a él y la barra recuerde su identidad.
//  • cartCount: nº de items del carrito del local activo (lo mantiene LocalMenu).
//  • live: handlers en vivo del menú del local (abrir carrito, subir al menú) y
//    si hay una capa abierta. Solo existe mientras estás DENTRO del menú del
//    local; al salir queda null (y la barra se pinta con los colores de Appetic).
const NavUIContext = createContext(null)
export const useNavUI = () => useContext(NavUIContext)

export function NavUIProvider({ children }) {
  const [activeLocal, setActiveLocal] = useState(null) // { id, slug, nombre, tema }
  const [cartCount, setCartCount] = useState(0)
  const [live, setLive] = useState(null) // { slug, oculta, onCarrito, onMenu } | null

  // 🛒 Regla del negocio: solo se pide de UN local a la vez. Si vas a entrar a
  // otro local teniendo carrito, avisamos y (si aceptas) lo vaciamos. Devuelve
  // true si se puede continuar, false si el usuario canceló.
  const confirmarCambioLocal = useCallback((slug) => {
    if (!activeLocal || activeLocal.slug === slug || cartCount === 0) return true
    const ok = window.confirm(
      `Tienes ${cartCount} producto${cartCount > 1 ? 's' : ''} en el carrito de ${activeLocal.nombre}.\n\n` +
      `Si entras a otro local se vaciará — solo puedes pedir de un local a la vez.`
    )
    if (!ok) return false
    try { localStorage.removeItem(`appetic_cart_${activeLocal.id}`) } catch { /* nada */ }
    setCartCount(0)
    return true
  }, [activeLocal, cartCount])

  const value = {
    activeLocal, setActiveLocal,
    cartCount, setCartCount,
    live, setLive,
    confirmarCambioLocal,
  }
  return <NavUIContext.Provider value={value}>{children}</NavUIContext.Provider>
}
