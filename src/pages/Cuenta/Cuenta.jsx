import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAdmin } from '../../contexts/AdminContext'
import { esSuperadmin } from '../../config/roles'
import { getPerfil } from '../../services/usuarios'
import AdminMetricas from '../Admin/AdminMetricas'
import logo from '../../assets/appetic-logo.png'
import './Cuenta.css'

export default function Cuenta() {
  const { user, cargando, entrar, salir } = useAuth()
  const { locales, cargando: adminCargando, esDueno, slug: adminSlug, localSel, setSlug } = useAdmin()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const debeElegir = params.get('elegir') === '1' && !adminSlug

  const [perfil, setPerfil] = useState({ nombre: '' })
  const [avatarFallo, setAvatarFallo] = useState(false)
  const [tab, setTab] = useState('cuenta') // cuenta | metricas (solo dueño)

  const superadmin = esSuperadmin(user?.email)

  useEffect(() => {
    if (!user) return
    let activo = true
    getPerfil(user.uid)
      .then(p => { if (activo) setPerfil({ nombre: p?.nombre || user.displayName || '' }) })
      .catch(() => {})
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
        {!adminCargando && !esDueno && <Link to="/" className="cuenta-volver-chip">‹</Link>}
        <h1>{esDueno ? 'Administración' : 'Mi cuenta'}</h1>
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

      {adminCargando ? null : esDueno ? (
        <>
          <nav className="cuenta-tabs">
            <button className={tab === 'cuenta' ? 'on' : ''} onClick={() => setTab('cuenta')}>🏪 Cuenta</button>
            <button className={tab === 'metricas' ? 'on' : ''} onClick={() => setTab('metricas')}>📊 Métricas</button>
          </nav>

          {tab === 'cuenta' && (
            <section className="cuenta-selector">
              <h2 className="cuenta-selector-titulo">{locales.length > 1 ? 'Elige el local a administrar' : 'Tu local'}</h2>
              {debeElegir && <p className="cuenta-selector-aviso">👆 Elige un local para administrar.</p>}
              <div className="cuenta-selector-lista">
                {locales.map(l => (
                  <button
                    key={l.id}
                    className={`cuenta-local ${adminSlug === l.slug ? 'on' : ''}`}
                    onClick={() => { setSlug(l.slug); navigate(`/${l.slug}/admin/catalogo`) }}
                  >
                    <span className="cuenta-local-logo">
                      {(l.icono || l.logo) ? <img src={l.icono || l.logo} alt="" loading="lazy" /> : <span>🏪</span>}
                    </span>
                    <div>
                      <strong>{l.nombre}</strong>
                      <span>Menú, precios, horario y más</span>
                    </div>
                    {adminSlug === l.slug ? <span className="cuenta-local-check" aria-label="Seleccionado">✓</span> : <span className="cuenta-rol-go">›</span>}
                  </button>
                ))}
              </div>
            </section>
          )}

          {tab === 'metricas' && (
            localSel
              ? <div className="cuenta-metricas"><AdminMetricas local={localSel} demo={false} /></div>
              : <p className="cuenta-selector-aviso">Elige un local en la pestaña «Cuenta» para ver sus métricas.</p>
          )}
        </>
      ) : (
        <>
          {/* Cliente: historial y datos personales */}
          <Link to="/pedidos" className="cuenta-rol cuenta-rol-pedidos">
            <span className="cuenta-rol-emoji">🧾</span>
            <div>
              <strong>Mis pedidos</strong>
              <span>Revisa lo que has pedido y vuelve a pedir</span>
            </div>
            <span className="cuenta-rol-go">›</span>
          </Link>
          <Link to="/datos" className="cuenta-rol cuenta-rol-datos">
            <span className="cuenta-rol-emoji">📇</span>
            <div>
              <strong>Mis datos</strong>
              <span>Nombre, teléfono y dirección para pedir más rápido</span>
            </div>
            <span className="cuenta-rol-go">›</span>
          </Link>
        </>
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
