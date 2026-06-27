import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home.jsx'
import LocalPage from './pages/Local/LocalPage.jsx'
import NotFound from './pages/NotFound/NotFound.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        {/* Inicio / bienvenida de marca (el explorador llega en la Capa 2) */}
        <Route path="/" element={<Home />} />

        {/* Cada local vive en su propio slug: appetic.app/su-negocio */}
        <Route path="/:slug" element={<LocalPage />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
