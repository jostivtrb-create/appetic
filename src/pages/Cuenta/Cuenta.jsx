import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { esSuperadmin } from '../../config/roles'
import { getLocalesDeAdmin } from '../../services/locales'
import { getPerfil } from '../../services/usuarios'
import logo from '../../assets/appetic-logo.png'
import './Cuenta.css'

export default function Cuenta() {
  const { user, cargando, entrar, salir } = useAuth()

  const [misLocales, setMisLocales] = useState([])
  const [perfil, setPerfil] = useState({ nombre: '', telefono: '', direccion: '' })
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [avatarFallo, setAvatarFallo] = useState(false)

  const superadmin = esSuperadmin(user?.email)
  // Dueño = administra al menos un local. A él no le mostramos ni el botón de
  // volver al inicio ni la sección "Tus datos" (esos son cosas de cliente).
  const esDuenio = misLocales.length > 0

  useEffect(() => {
    if (!user) return
    let activo = true
    setCargandoDatos(true)
    Promise.all([getLocalesDeAdmin(user.email), getPerfil(user.uid)])
      .then(([locales, p]) => {
        if (!activo) return
        setMisLocales(locales)
        setPerfil({
          nombre: p?.nombre || user.displayName || '',
          telefono: p?.telefono || '',
          direccion: p?.direccion || '',
        })
      })
      .finally(() => { if (activo) setCargandoDatos(false) })
    return () => { activo = false }
  }, [user])

  // ----- Cargando sesión -----
  if (cargando) {
    return <div className="local-loading"><div className="local-spinner" /><p>Cargando…</p></div>
  }

  // ----- Sin sesión: login bonito -----
  if (!user) {
    return (
      <div className="cuenta-login">
        <div className="cuenta-login-glow" />
        <Link to="/" className="cuenta-volver">‹ Inicio</Link>
        <div className="cuenta-login-card">
          <img className="cuenta-login-logo" src={logo} alt="Appetic" />
          <h1>Tu cuenta Appetic</h1>
          <p>Inicia sesión para guardar tus datos y pedir más rápido. Si tienes un local, entra a administrarlo.</p>
          <button className="btn btn-primary cuenta-google" onClick={entrar}>
            <GoogleIcon /> Continuar con Google
          </button>
          <ul className="cuenta-beneficios">
            <li>🧾 Tus datos se llenan solos en el checkout</li>
            <li>🏪 Administra tu local si eres dueño</li>
            <li>🧡 Más rápido en cada pedido</li>
          </ul>
          <Link to="/pedidos" className="cuenta-login-pedidos">🧾 Ver mis pedidos</Link>
        </div>
      </div>
    )
  }

  // ----- Con sesión -----
  return (
    <div className="cuenta">
      <header className="cuenta-top">
        {!cargandoDatos && !esDuenio && <Link to="/" className="cuenta-volver-chip">‹</Link>}
        <h1>Mi cuenta</h1>
      </header>

      <div className="cuenta-perfil">
        {user.photoURL && !avatarFallo
          ? <img className="cuenta-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFallo(true)} />
          : <div className="cuenta-avatar cuenta-avatar-fallback">{(perfil.nombre || user.email)[0]?.toUpperCase()}</div>}
        <div className="cuenta-perfil-info">
          <strong>{perfil.nombre || user.displayName || 'Hola 👋'}</strong>
          <span>{user.email}</span>
        </div>
        <button className="cuenta-salir" onClick={salir}>Salir</button>
      </div>

      {/* Mis pedidos (historial guardado en este dispositivo) */}
      <Link to="/pedidos" className="cuenta-rol cuenta-rol-pedidos">
        <span className="cuenta-rol-emoji">🧾</span>
        <div>
          <strong>Mis pedidos</strong>
          <span>Revisa lo que has pedido y vuelve a pedir</span>
        </div>
        <span className="cuenta-rol-go">›</span>
      </Link>

      {/* Accesos por rol */}
      {superadmin && (
        <Link to="/superadmin" className="cuenta-rol cuenta-rol-admin">
          <span className="cuenta-rol-emoji">👑</span>
          <div>
            <strong>Panel de suscripciones</strong>
            <span>Activa qué locales aparecen en el buscador</span>
          </div>
          <span className="cuenta-rol-go">›</span>
        </Link>
      )}

      {misLocales.map(l => (
        <Link key={l.id} to={`/${l.slug}/admin`} className="cuenta-rol cuenta-rol-local">
          <span className="cuenta-rol-logo">
            {(l.icono || l.logo)
              ? <img src={l.icono || l.logo} alt="" loading="lazy" />
              : <span className="cuenta-rol-emoji">🏪</span>}
          </span>
          <div>
            <strong>Administrar {l.nombre}</strong>
            <span>Edita tu menú, precios, horario y más</span>
          </div>
          <span className="cuenta-rol-go">›</span>
        </Link>
      ))}

      {/* Mis datos (para clientes; un dueño no los necesita). Abre su pantalla. */}
      {!cargandoDatos && !esDuenio && (
        <Link to="/datos" className="cuenta-rol cuenta-rol-datos">
          <span className="cuenta-rol-emoji">📇</span>
          <div>
            <strong>Mis datos</strong>
            <span>Nombre, teléfono y dirección para pedir más rápido</span>
          </div>
          <span className="cuenta-rol-go">›</span>
        </Link>
      )}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}
