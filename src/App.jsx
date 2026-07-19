import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useNavUI } from './contexts/NavUIContext.jsx'
import { appThemeVars } from './utils/theme.js'
import Home from './pages/Home/Home.jsx'
import LocalPage from './pages/Local/LocalPage.jsx'
import AdminPage from './pages/Admin/AdminPage.jsx'
import NotFound from './pages/NotFound/NotFound.jsx'
import Cuenta from './pages/Cuenta/Cuenta.jsx'
import Pedidos from './pages/Pedidos/Pedidos.jsx'
import Favoritos from './pages/Favoritos/Favoritos.jsx'
import Datos from './pages/Datos/Datos.jsx'
import Superadmin from './pages/Superadmin/Superadmin.jsx'
import InstallPrompt from './components/InstallPrompt/InstallPrompt.jsx'
import BottomNav from './components/BottomNav/BottomNav.jsx'
import ConfirmCambioLocal from './components/ConfirmCambioLocal/ConfirmCambioLocal.jsx'

export default function App() {
  const { activeLocal } = useNavUI()
  const { pathname } = useLocation()

  // 🌎 Toda la app se transforma con el mundo del local activo (fondo incluido).
  // En los paneles internos (admin del local, superadmin) no se aplica: son de
  // gestión, no de cliente. Sin local activo → tokens Appetic de :root.
  const enPanel = /\/admin(\/|$)/.test(pathname) || pathname.startsWith('/superadmin')
  useEffect(() => {
    const el = document.documentElement
    const vars = (activeLocal && !enPanel) ? appThemeVars(activeLocal.tema) : {}
    const keys = Object.keys(vars)
    keys.forEach(k => el.style.setProperty(k, vars[k]))
    return () => keys.forEach(k => el.style.removeProperty(k))
  }, [activeLocal, enPanel])

  return (
    <div className="app-shell">
      <InstallPrompt />
      <Routes>
        {/* Inicio = buscador del barrio (Capa 2) */}
        <Route path="/" element={<Home />} />

        {/* Cuenta / sesión (cliente, local o superadmin) */}
        <Route path="/cuenta" element={<Cuenta />} />

        {/* Mis pedidos (historial en el propio dispositivo) */}
        <Route path="/pedidos" element={<Pedidos />} />

        {/* Mis favoritos (locales marcados por el cliente) */}
        <Route path="/favoritos" element={<Favoritos />} />

        {/* Mis datos (nombre, teléfono, dirección para el checkout) */}
        <Route path="/datos" element={<Datos />} />

        {/* Panel interno de superadmin (suscripciones) */}
        <Route path="/superadmin" element={<Superadmin />} />

        {/* Panel del local (modo administrador) — por secciones: catalogo/difundir/config */}
        <Route path="/:slug/admin" element={<AdminPage />} />
        <Route path="/:slug/admin/:panel" element={<AdminPage />} />

        {/* Cada local vive en su propio slug: appetic.app/su-negocio */}
        <Route path="/:slug" element={<LocalPage />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Barra inferior de navegación (se pinta con el tema del local activo) */}
      <BottomNav />

      {/* Modal bonito al cambiar de local con carrito (reemplaza window.confirm) */}
      <ConfirmCambioLocal />
    </div>
  )
}
