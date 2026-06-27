import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/appetic-logo.png'
import { getLocalesExplorador } from '../../services/locales'
import { estaAbierto } from '../../utils/horario'
import { useAuth } from '../../contexts/AuthContext'
import './Home.css'

export default function Home() {
  const { user } = useAuth()
  const [estado, setEstado] = useState('cargando') // cargando | ok | error
  const [locales, setLocales] = useState([])
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    let activo = true
    getLocalesExplorador()
      .then(ls => { if (activo) { setLocales(ls); setEstado('ok') } })
      .catch(() => { if (activo) setEstado('error') })
    return () => { activo = false }
  }, [])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return locales
    return locales.filter(l => {
      const enNombre = l.nombre?.toLowerCase().includes(q)
      const enDesc = l.descripcion?.toLowerCase().includes(q)
      const enCats = (l.categorias || []).some(c => c.nombre?.toLowerCase().includes(q))
      return enNombre || enDesc || enCats
    })
  }, [locales, busqueda])

  return (
    <div className="home">
      <div className="home-glow home-glow-1" />
      <div className="home-glow home-glow-2" />

      {/* Barra superior */}
      <header className="home-bar">
        <div className="home-bar-brand">
          <img src={logo} alt="Appetic" />
          <span>Appetic</span>
        </div>
        <Link to="/cuenta" className="home-cuenta">
          {user?.photoURL
            ? <img className="home-cuenta-avatar" src={user.photoURL} alt="" />
            : <span className="home-cuenta-icon">👤</span>}
          <span>{user ? 'Mi cuenta' : 'Entrar'}</span>
        </Link>
      </header>

      <main className="home-content">
        <h1 className="home-title">El menú de tu barrio</h1>
        <p className="home-tagline">Descubre dónde comer cerca y pide en segundos.</p>

        <div className="home-search">
          <span className="home-search-icon">🔎</span>
          <input
            placeholder="Busca un local o un antojo (ej: hamburguesa)"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {estado === 'cargando' && (
          <div className="home-skeletons">
            {[0, 1, 2].map(i => <div key={i} className="home-skel" />)}
          </div>
        )}

        {estado === 'error' && (
          <div className="home-empty">
            <span className="home-empty-emoji">📡</span>
            <p>No pudimos cargar los locales. Revisa tu conexión.</p>
          </div>
        )}

        {estado === 'ok' && filtrados.length === 0 && (
          <div className="home-empty">
            <span className="home-empty-emoji">🍔</span>
            <p>{busqueda
              ? 'Ningún local coincide con tu búsqueda.'
              : 'Pronto vas a descubrir aquí todos los locales del barrio.'}</p>
            <span className="home-empty-hint">¿Tienes el link de un negocio? Ábrelo para ver su menú.</span>
          </div>
        )}

        {estado === 'ok' && filtrados.length > 0 && (
          <ul className="home-locales">
            {filtrados.map(l => {
              const abierto = estaAbierto(l.horario)
              return (
                <li key={l.id}>
                  <Link to={`/${l.slug}`} className="loc-card">
                    <div className="loc-card-img">
                      {l.logo
                        ? <img src={l.logo} alt={l.nombre} loading="lazy" />
                        : <span>🍽️</span>}
                    </div>
                    <div className="loc-card-info">
                      <h3>{l.nombre}</h3>
                      {l.descripcion && <p>{l.descripcion}</p>}
                      <span className={`loc-chip ${abierto ? 'on' : 'off'}`}>
                        {abierto ? 'Abierto ahora' : 'Cerrado'}
                      </span>
                    </div>
                    <span className="loc-card-go">›</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      <footer className="home-footer">
        Hecho con 🧡 en Bogotá · <span>Appetic</span>
      </footer>
    </div>
  )
}
