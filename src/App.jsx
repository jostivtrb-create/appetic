import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home.jsx'
import LocalPage from './pages/Local/LocalPage.jsx'
import AdminPage from './pages/Admin/AdminPage.jsx'
import NotFound from './pages/NotFound/NotFound.jsx'
import Cuenta from './pages/Cuenta/Cuenta.jsx'
import Superadmin from './pages/Superadmin/Superadmin.jsx'
import InstallPrompt from './components/InstallPrompt/InstallPrompt.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <InstallPrompt />
      <Routes>
        {/* Inicio = buscador del barrio (Capa 2) */}
        <Route path="/" element={<Home />} />

        {/* Cuenta / sesión (cliente, local o superadmin) */}
        <Route path="/cuenta" element={<Cuenta />} />

        {/* Panel interno de superadmin (suscripciones) */}
        <Route path="/superadmin" element={<Superadmin />} />

        {/* Panel del local (modo administrador) */}
        <Route path="/:slug/admin" element={<AdminPage />} />

        {/* Cada local vive en su propio slug: appetic.app/su-negocio */}
        <Route path="/:slug" element={<LocalPage />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
