import { createContext, useContext, useState } from 'react'

// 🧭 Puente entre la pantalla del local y la barra inferior GLOBAL.
// La barra vive arriba de todo (en App), pero necesita cosas que solo conoce
// el menú del local: su tema (colores), el nº de items del carrito y cómo
// abrir el carrito / subir al menú. LocalMenu "publica" ese estado aquí y la
// barra lo lee. Fuera de un local, queda en null y la barra se pinta con los
// colores de Appetic.
const NavUIContext = createContext(null)
export const useNavUI = () => useContext(NavUIContext)

export function NavUIProvider({ children }) {
  const [barra, setBarra] = useState(null) // { local, cartCount, onCarrito, onMenu, oculta } | null
  return (
    <NavUIContext.Provider value={{ barra, setBarra }}>
      {children}
    </NavUIContext.Provider>
  )
}
