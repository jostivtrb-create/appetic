import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { AdminProvider } from './contexts/AdminContext.jsx'
import { FavoritosProvider } from './contexts/FavoritosContext.jsx'
import { NavUIProvider } from './contexts/NavUIContext.jsx'
// 🖥️ De ÚLTIMO a propósito: así el CSS de escritorio se inyecta después del de
// todos los componentes (que entran al importarse desde App) y puede ajustarlos
// sin subir la especificidad ni usar !important. Todo su contenido vive dentro
// de @media (min-width: …): por debajo de 768px este archivo no pinta nada.
import './styles/desktop.css'
import './registerSW.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AdminProvider>
          <FavoritosProvider>
            <NavUIProvider>
              <App />
            </NavUIProvider>
          </FavoritosProvider>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
