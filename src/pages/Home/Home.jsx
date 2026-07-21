import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/appetic-logo.png'
import { getLocalesExplorador, getLocalesDeAdmin } from '../../services/locales'
import { estaAbierto } from '../../utils/horario'
import { distanciaKm } from '../../utils/geo'
import { costoDomicilio } from '../../utils/delivery'
import { cop } from '../../utils/money'
import { useAuth } from '../../contexts/AuthContext'
import { useNavUI } from '../../contexts/NavUIContext'
import './Home.css'

export default function Home() {
  const { user, cargando: authCargando } = useAuth()
  const { irAOtroLocal } = useNavUI()
  const navigate = useNavigate()
  const [estado, setEstado] = useState('cargando') // cargando | ok | error
  const [locales, setLocales] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [coord, setCoord] = useState(null)
  const [ubic, setUbic] = useState('idle') // idle | cargando | ok | error
  const [avatarFallo, setAvatarFallo] = useState(false)
  // 🔑 El dueño de un local NO ve el inicio: apenas entra va directo a su panel
  // (si administra uno) o a su perfil para elegir (si administra varios).
  const [verificandoAdmin, setVerificandoAdmin] = useState(true)

  useEffect(() => {
    if (authCargando) return
    if (!user) { setVerificandoAdmin(false); return }
    let activo = true
    getLocalesDeAdmin(user.email)
      .then(admin => {
        if (!activo) return
        if (admin.length === 1) { navigate(`/${admin[0].slug}/admin/catalogo`, { replace: true }); return }
        if (admin.length > 1) { navigate('/cuenta', { replace: true }); return }
        setVerificandoAdmin(false) // no administra locales: cliente normal
      })
      .catch(() => { if (activo) setVerificandoAdmin(false) })
    return () => { activo = false }
  }, [user, authCargando, navigate])

  useEffect(() => {
    let activo = true
    getLocalesExplorador()
      .then(ls => { if (activo) { setLocales(ls); setEstado('ok') } })
      .catch(() => { if (activo) setEstado('error') })
    return () => { activo = false }
  }, [])

  function usarMiUbicacion() {
    if (!navigator.geolocation) { setUbic('error'); return }
    setUbic('cargando')
    navigator.geolocation.getCurrentPosition(
      pos => { setCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setUbic('ok') },
      () => setUbic('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const base = !q ? locales : locales.filter(l => {
      const enNombre = l.nombre?.toLowerCase().includes(q)
      const enDesc = l.descripcion?.toLowerCase().includes(q)
      const enCats = (l.categorias || []).some(c => c.nombre?.toLowerCase().includes(q))
      return enNombre || enDesc || enCats
    })
    // Distancia + costo de domicilio + orden por cercanía si compartió ubicación.
    const conDist = base.map(l => {
      const distancia = coord ? distanciaKm(l.ubicacion, coord) : null
      const domi = coord ? costoDomicilio(distancia, l.domicilio) : null
      return { ...l, distancia, domi }
    })
    if (!coord) return conDist
    return conDist.sort((a, b) => {
      if (a.distancia == null) return 1
      if (b.distancia == null) return -1
      return a.distancia - b.distancia
    })
  }, [locales, busqueda, coord])

  // Mientras se resuelve la sesión / se verifica si es dueño, no mostramos el
  // inicio (evita el parpadeo del explorador antes de redirigir al panel).
  if (authCargando || verificandoAdmin) {
    return <div className="local-loading"><div className="local-spinner" /><p>Cargando…</p></div>
  }

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
          {user?.photoURL && !avatarFallo
            ? <img className="home-cuenta-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFallo(true)} />
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

        <button
          className={`home-ubic ${ubic === 'ok' ? 'on' : ''}`}
          onClick={usarMiUbicacion}
          disabled={ubic === 'cargando'}
        >
          📍 {ubic === 'cargando' ? 'Buscando…'
            : ubic === 'ok' ? 'Ordenado por cercanía'
            : ubic === 'error' ? 'No pudimos ubicarte · reintentar'
            : 'Ver los más cercanos a mí'}
        </button>

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
                  <Link
                    to={`/${l.slug}`}
                    className="loc-card"
                    onClick={e => { e.preventDefault(); irAOtroLocal(l.slug, () => navigate(`/${l.slug}`)) }}
                  >
                    <div className="loc-card-img">
                      {(l.icono || l.logo)
                        ? <img src={l.icono || l.logo} alt={l.nombre} loading="lazy" />
                        : <span>🍽️</span>}
                    </div>
                    <div className="loc-card-info">
                      <h3>{l.nombre}</h3>
                      {l.descripcion && <p>{l.descripcion}</p>}
                      <div className="loc-chips">
                        <span className={`loc-chip ${abierto ? 'on' : 'off'}`}>
                          {abierto ? 'Abierto ahora' : 'Cerrado'}
                        </span>
                        {l.distancia != null && (
                          <span className="loc-chip dist">a {l.distancia.toFixed(1)} km</span>
                        )}
                        {l.domi?.ok && (
                          <span className="loc-chip envio">🛵 Domicilio {cop(l.domi.costo)}</span>
                        )}
                        {l.domi && !l.domi.ok && l.domi.motivo === 'fuera-cobertura' && (
                          <span className="loc-chip envio-off">🛵 Fuera de cobertura</span>
                        )}
                        {l.domi && !l.domi.ok && l.domi.motivo === 'sin-tarifa' && (
                          <span className="loc-chip envio">🛵 Domicilio a convenir</span>
                        )}
                      </div>
                    </div>
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
