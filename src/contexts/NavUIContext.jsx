import { createContext, useContext, useState, useCallback } from 'react'

// 🧭 Estado compartido de la barra inferior GLOBAL (siempre visible: Menú ·
// Cuenta · [🛒] · Favoritos · Buscar).
//
//  • activeLocal: el local "en curso". Lo fija LocalMenu al entrar y se
//    CONSERVA aunque navegues a Buscar/Cuenta/Favoritos.
//  • cartCount: nº de items del carrito del local activo (lo mantiene LocalMenu).
//  • live: handlers en vivo del menú del local (abrir carrito, subir al menú) y
//    si hay una capa abierta. Solo existe dentro del menú del local.
//  • pendiente: solicitud de cambio de local que espera confirmación (para el
//    modal bonito que reemplaza al window.confirm).
//  • panelCatalogo: las categorías del local que se está administrando AHORA
//    ({ slug, categorias: [{ id, nombre, emoji, count }] }). Lo publica AdminPage
//    y lo lee la barra lateral del panel en PC para desplegarlas bajo "Catálogo".
//  • panelMenu: si el cajón del panel (celular) está abierto. Lo abre el ☰ de
//    la cabecera del panel (PanelMenuBoton) y lo pinta PanelDrawer.
const NavUIContext = createContext(null)
export const useNavUI = () => useContext(NavUIContext)

export function NavUIProvider({ children }) {
  const [activeLocal, setActiveLocal] = useState(null) // { id, slug, nombre, tema }
  const [cartCount, setCartCount] = useState(0)
  const [live, setLive] = useState(null) // { slug, oculta, onCarrito, onMenu } | null
  const [pendiente, setPendiente] = useState(null) // { nombre, id, onOk } | null
  const [panelCatalogo, setPanelCatalogo] = useState(null)
  const [panelMenu, setPanelMenu] = useState(false)

  // 🛒 Regla del negocio: solo se pide de UN local a la vez. Al ir a otro local
  // con carrito, abrimos el modal de confirmación; si no hay conflicto, sigue
  // derecho. `onOk` es la navegación a ejecutar cuando se pueda continuar.
  const irAOtroLocal = useCallback((slug, onOk) => {
    if (!activeLocal || activeLocal.slug === slug || cartCount === 0) { onOk(); return }
    setPendiente({ nombre: activeLocal.nombre, id: activeLocal.id, onOk })
  }, [activeLocal, cartCount])

  const confirmarCambio = useCallback(() => {
    if (!pendiente) return
    try { localStorage.removeItem(`appetic_cart_${pendiente.id}`) } catch { /* nada */ }
    setCartCount(0)
    const cb = pendiente.onOk
    setPendiente(null)
    cb()
  }, [pendiente])

  const cancelarCambio = useCallback(() => setPendiente(null), [])

  const value = {
    activeLocal, setActiveLocal,
    cartCount, setCartCount,
    live, setLive,
    irAOtroLocal, pendiente, confirmarCambio, cancelarCambio,
    panelCatalogo, setPanelCatalogo,
    panelMenu, setPanelMenu,
  }
  return <NavUIContext.Provider value={value}>{children}</NavUIContext.Provider>
}
