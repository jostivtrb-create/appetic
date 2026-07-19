import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { FavoritosProvider } from './contexts/FavoritosContext.jsx'
import { NavUIProvider } from './contexts/NavUIContext.jsx'
import './registerSW.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <FavoritosProvider>
          <NavUIProvider>
            <App />
          </NavUIProvider>
        </FavoritosProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
