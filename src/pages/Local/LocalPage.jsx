import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getLocalBySlug } from '../../services/locales'
import { localThemeVars } from '../../utils/theme'
import './LocalPage.css'

export default function LocalPage() {
  const { slug } = useParams()
  const [estado, setEstado] = useState('cargando') // cargando | ok | no-existe | error
  const [local, setLocal] = useState(null)

  useEffect(() => {
    let activo = true
    setEstado('cargando')
    getLocalBySlug(slug)
      .then((data) => {
        if (!activo) return
        if (!data) { setEstado('no-existe'); return }
        setLocal(data)
        setEstado('ok')
      })
      .catch((err) => {
        console.error('Error cargando local:', err)
        if (activo) setEstado('error')
      })
    return () => { activo = false }
  }, [slug])

  if (estado === 'cargando') {
    return (
      <div className="local-loading">
        <div className="local-spinner" />
        <p>Cargando menú…</p>
      </div>
    )
  }

  if (estado === 'no-existe') {
    return (
      <div className="local-msg">
        <div className="local-msg-emoji">🤔</div>
        <h2>No encontramos este local</h2>
        <p>El link <strong>/{slug}</strong> no corresponde a ningún negocio (todavía).</p>
        <Link to="/" className="btn btn-ghost">Ir al inicio</Link>
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <div className="local-msg">
        <div className="local-msg-emoji">📡</div>
        <h2>Algo falló al cargar</h2>
        <p>Revisa tu conexión e inténtalo de nuevo.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    )
  }

  // estado === 'ok'
  return (
    <div className="local-page" style={localThemeVars(local.tema)}>
      <header className="local-hero">
        {local.banner && <img className="local-banner" src={local.banner} alt="" />}
        <div className="local-hero-overlay" />
        <div className="local-hero-content">
          {local.logo && <img className="local-logo" src={local.logo} alt={local.nombre} />}
          <h1 className="local-name">{local.nombre}</h1>
          {local.descripcion && <p className="local-desc">{local.descripcion}</p>}
        </div>
      </header>

      <main className="local-body">
        <div className="local-soon-card">
          <span className="local-soon-badge">🚧 En construcción</span>
          <h3>El menú de {local.nombre} viene en camino</h3>
          <p>Estamos montando su carta digital con Appetic. ¡Muy pronto vas a poder pedir desde aquí!</p>
        </div>
      </main>
    </div>
  )
}
