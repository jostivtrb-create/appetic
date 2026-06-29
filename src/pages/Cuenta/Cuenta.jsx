import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useFavoritos } from '../../contexts/FavoritosContext'
import { esSuperadmin } from '../../config/roles'
import { getLocalesDeAdmin } from '../../services/locales'
import { getPerfil, guardarPerfil } from '../../services/usuarios'
import logo from '../../assets/appetic-logo.png'
import './Cuenta.css'

export default function Cuenta() {
  const { user, cargando, entrar, salir } = useAuth()
  const { favoritos } = useFavoritos()

  const [misLocales, setMisLocales] = useState([])
  const [perfil, setPerfil] = useState({ nombre: '', telefono: '', direccion: '' })
  const [cargandoDatos, setCargandoDatos] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [avatarFallo, setAvatarFallo] = useState(false)

  const superadmin = esSuperadmin(user?.email)

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

  async function guardar() {
    setGuardando(true)
    await guardarPerfil(user.uid, perfil)
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 1800)
  }

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
        </div>
      </div>
    )
  }

  // ----- Con sesión -----
  return (
    <div className="cuenta">
      <header className="cuenta-top">
        <Link to="/" className="cuenta-volver-chip">‹</Link>
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
          <span className="cuenta-rol-emoji">🏪</span>
          <div>
            <strong>Administrar {l.nombre}</strong>
            <span>Edita tu menú, precios, horario y más</span>
          </div>
          <span className="cuenta-rol-go">›</span>
        </Link>
      ))}

      {/* Favoritos */}
      {favoritos.length > 0 && (
        <section className="cuenta-favs">
          <h2>❤️ Mis favoritos</h2>
          <div className="cuenta-favs-lista">
            {favoritos.map(f => (
              <Link key={f.id} to={`/${f.slug}`} className="cuenta-fav">
                <div className="cuenta-fav-logo">
                  {f.logo ? <img src={f.logo} alt="" /> : <span>🍽️</span>}
                </div>
                <strong>{f.nombre}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Datos del cliente */}
      <section className="cuenta-datos">
        <h2>Tus datos</h2>
        <p className="cuenta-datos-hint">Los usamos para llenar tu pedido automáticamente. Solo tú los ves.</p>
        <label>Nombre
          <input value={perfil.nombre} onChange={e => setPerfil(p => ({ ...p, nombre: e.target.value }))} placeholder="Tu nombre" />
        </label>
        <label>WhatsApp / teléfono
          <input value={perfil.telefono} inputMode="tel" onChange={e => setPerfil(p => ({ ...p, telefono: e.target.value }))} placeholder="300 000 0000" />
        </label>
        <label>Dirección habitual
          <input value={perfil.direccion} onChange={e => setPerfil(p => ({ ...p, direccion: e.target.value }))} placeholder="Cra 10 #5-23, casa azul" />
        </label>
        <button className="btn btn-primary cuenta-guardar" onClick={guardar} disabled={guardando || cargandoDatos}>
          {guardando ? 'Guardando…' : guardado ? 'Guardado ✓' : 'Guardar mis datos'}
        </button>
      </section>
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
