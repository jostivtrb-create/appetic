import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { esSuperadmin } from '../../config/roles'
import { listarTodosLocales, setSuscripcion } from '../../services/superadmin'
import './Superadmin.css'

export default function Superadmin() {
  const { user, cargando, entrar } = useAuth()
  const superadmin = esSuperadmin(user?.email)

  const [estado, setEstado] = useState('cargando') // cargando | ok | error
  const [locales, setLocales] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [guardandoId, setGuardandoId] = useState(null)

  useEffect(() => {
    if (!superadmin) return
    let activo = true
    listarTodosLocales()
      .then(ls => { if (activo) { setLocales(ls); setEstado('ok') } })
      .catch(() => { if (activo) setEstado('error') })
    return () => { activo = false }
  }, [superadmin])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return locales
    return locales.filter(l =>
      l.nombre?.toLowerCase().includes(q) || l.slug?.toLowerCase().includes(q))
  }, [locales, busqueda])

  const activos = useMemo(() => locales.filter(l => l.suscripcion?.activa).length, [locales])

  async function alternar(local) {
    const nuevoValor = !local.suscripcion?.activa
    setGuardandoId(local.id)
    // Optimista
    setLocales(ls => ls.map(l => l.id === local.id
      ? { ...l, suscripcion: { ...(l.suscripcion || {}), activa: nuevoValor } }
      : l))
    try {
      await setSuscripcion(local.id, nuevoValor)
    } catch (err) {
      // Revertir si falla
      setLocales(ls => ls.map(l => l.id === local.id
        ? { ...l, suscripcion: { ...(l.suscripcion || {}), activa: !nuevoValor } }
        : l))
      alert('No se pudo guardar. Revisa que las reglas de Firestore estén desplegadas.')
    } finally {
      setGuardandoId(null)
    }
  }

  if (cargando) {
    return <div className="local-loading"><div className="local-spinner" /><p>Cargando…</p></div>
  }

  if (!user) {
    return (
      <div className="local-msg">
        <div className="local-msg-emoji">🔐</div>
        <h2>Panel de Appetic</h2>
        <p>Inicia sesión con el correo de superadmin.</p>
        <button className="btn btn-primary" onClick={entrar}>Entrar con Google</button>
      </div>
    )
  }

  if (!superadmin) {
    return (
      <div className="local-msg">
        <div className="local-msg-emoji">🚫</div>
        <h2>Sin acceso</h2>
        <p><strong>{user.email}</strong> no es superadmin de Appetic.</p>
        <Link to="/" className="btn btn-ghost">Ir al inicio</Link>
      </div>
    )
  }

  return (
    <div className="sa">
      <header className="sa-top">
        <Link to="/cuenta" className="cuenta-volver-chip">‹</Link>
        <div>
          <span className="sa-eyebrow">👑 Superadmin</span>
          <h1>Suscripciones</h1>
        </div>
      </header>

      <div className="sa-resumen">
        <strong>{activos}</strong> de <strong>{locales.length}</strong> locales activos en el buscador
      </div>

      <div className="sa-search">
        <span>🔎</span>
        <input placeholder="Buscar local…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {estado === 'cargando' && <div className="sa-skel-wrap">{[0,1,2].map(i => <div key={i} className="sa-skel" />)}</div>}
      {estado === 'error' && <div className="home-empty"><span className="home-empty-emoji">📡</span><p>No se pudieron cargar los locales.</p></div>}

      {estado === 'ok' && (
        <ul className="sa-lista">
          {filtrados.map(l => {
            const activa = !!l.suscripcion?.activa
            return (
              <li key={l.id} className="sa-item">
                <div className="sa-item-logo">
                  {l.logo ? <img src={l.logo} alt="" /> : <span>🍽️</span>}
                </div>
                <div className="sa-item-info">
                  <strong>{l.nombre}</strong>
                  <span>/{l.slug}</span>
                </div>
                <button
                  className={`sa-toggle ${activa ? 'on' : ''}`}
                  onClick={() => alternar(l)}
                  disabled={guardandoId === l.id}
                  aria-label={activa ? 'Desactivar' : 'Activar'}
                >
                  <span className="sa-toggle-knob" />
                </button>
              </li>
            )
          })}
          {filtrados.length === 0 && <li className="sa-vacio">Sin resultados.</li>}
        </ul>
      )}
    </div>
  )
}
