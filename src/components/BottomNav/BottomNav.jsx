import { useNavigate, useLocation } from 'react-router-dom'
import { useNavUI } from '../../contexts/NavUIContext'
import { useAdmin } from '../../contexts/AdminContext'
import { useAuth } from '../../contexts/AuthContext'
import { esColorOscuro, localThemeVars } from '../../utils/theme'
import './BottomNav.css'

// 🧭 Barra inferior FIJA. Tiene DOS modos:
//   • Cliente:  Menú · Cuenta · [🛒 Pedido] · Favoritos · Buscar
//   • Dueño:    Menú · Catálogo · Difundir · Configuración · Cuenta
// El dueño de un local ve SIEMPRE la barra de administración (no usa la app
// como cliente). Se pinta con los colores del local que está administrando.
export default function BottomNav() {
  const { activeLocal, cartCount, live } = useNavUI()
  const { esDueno, slug: adminSlug, localSel, cargando: adminCargando } = useAdmin()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const enAdminRoute = /\/admin(\/|$)/.test(pathname)

  // Superadmin vive en su propio panel, sin barra.
  if (pathname.startsWith('/superadmin')) return null
  // Mientras se sabe si es dueño (usuario con sesión), no parpadeamos la barra.
  if (user && adminCargando) return null

  // ---------- MODO DUEÑO (barra de administración) ----------
  if (esDueno) {
    const oscuro = localSel && esColorOscuro(localSel.tema?.bg)
    const style = localSel
      ? { ...localThemeVars(localSel.tema), '--bnav-bg': localSel.tema?.bg || '#141014' }
      : undefined

    const activa = enAdminRoute
      ? (pathname.includes('/difundir') ? 'difundir' : pathname.includes('/config') ? 'config' : 'catalogo')
      : (adminSlug && pathname === `/${adminSlug}`) ? 'menu'
        : pathname.startsWith('/cuenta') ? 'cuenta'
          : ''

    // Sin local seleccionado (varios locales, ninguno elegido) → a Cuenta a elegir.
    const irAdmin = (destino) => {
      if (!adminSlug) { navigate('/cuenta?elegir=1'); return }
      navigate(destino(adminSlug))
    }

    return (
      <nav className={`bnav ${oscuro ? 'bnav--dark' : ''}`} style={style} aria-label="Administración">
        <button className={`bnav-item ${activa === 'menu' ? 'is-active' : ''}`} onClick={() => irAdmin(s => `/${s}`)}>
          <IconMenu /><span>Menú</span>
        </button>
        <button className={`bnav-item ${activa === 'catalogo' ? 'is-active' : ''}`} onClick={() => irAdmin(s => `/${s}/admin/catalogo`)}>
          <IconCatalogo /><span>Catálogo</span>
        </button>
        <button className={`bnav-item ${activa === 'difundir' ? 'is-active' : ''}`} onClick={() => irAdmin(s => `/${s}/admin/difundir`)}>
          <IconDifundir /><span>Difundir</span>
        </button>
        <button className={`bnav-item ${activa === 'config' ? 'is-active' : ''}`} onClick={() => irAdmin(s => `/${s}/admin/config`)}>
          <IconConfig /><span>Config</span>
        </button>
        <button className={`bnav-item ${activa === 'cuenta' ? 'is-active' : ''}`} onClick={() => navigate('/cuenta')}>
          <IconUser /><span>Cuenta</span>
        </button>
      </nav>
    )
  }

  // No dueño dentro de una ruta de admin (superadmin/demo): sin barra (como hoy).
  if (enAdminRoute) return null

  // ---------- MODO CLIENTE ----------
  const enLocal = Boolean(live)
  if (enLocal && live.oculta) return null

  const oscuro = activeLocal && esColorOscuro(activeLocal.tema?.bg)
  const activa = enLocal ? 'menu'
    : pathname === '/' ? 'buscar'
      : pathname.startsWith('/favoritos') ? 'favoritos'
        : (pathname.startsWith('/cuenta') || pathname.startsWith('/pedidos') || pathname.startsWith('/datos')) ? 'cuenta'
          : ''

  function irAMenu() {
    if (live) return live.onMenu()
    if (activeLocal) return navigate(`/${activeLocal.slug}`)
    navigate('/')
  }
  function irACarrito() {
    if (live) return live.onCarrito()
    if (activeLocal) return navigate(`/${activeLocal.slug}?pedido=1`)
    navigate('/')
  }

  return (
    <nav className={`bnav ${oscuro ? 'bnav--dark' : ''}`} aria-label="Navegación">
      <button className={`bnav-item ${activa === 'menu' ? 'is-active' : ''}`} onClick={irAMenu}>
        <IconMenu /><span>Menú</span>
      </button>
      <button className={`bnav-item ${activa === 'cuenta' ? 'is-active' : ''}`} onClick={() => navigate('/cuenta')}>
        <IconUser /><span>Cuenta</span>
      </button>
      <button className="bnav-cart" onClick={irACarrito} aria-label="Ver pedido">
        <span className="bnav-cart-circle">
          <IconBag />
          {cartCount > 0 && <span className="bnav-cart-badge">{cartCount}</span>}
        </span>
        <span className="bnav-cart-label">Pedido</span>
      </button>
      <button className={`bnav-item ${activa === 'favoritos' ? 'is-active' : ''}`} onClick={() => navigate('/favoritos')}>
        <IconHeart /><span>Favoritos</span>
      </button>
      <button className={`bnav-item ${activa === 'buscar' ? 'is-active' : ''}`} onClick={() => navigate('/')}>
        <IconSearch /><span>Buscar</span>
      </button>
    </nav>
  )
}

// ---- Iconos (SVG, heredan el color con currentColor) ----
const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }
function IconMenu() {
  return <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path {...sw} d="M4 6h16" /><path {...sw} d="M4 12h16" /><path {...sw} d="M4 18h10" /></svg>
}
function IconHeart() {
  return <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path {...sw} d="M12 20s-7-4.6-7-9.4A3.6 3.6 0 0 1 12 8a3.6 3.6 0 0 1 7 2.6C19 15.4 12 20 12 20z" /></svg>
}
function IconBag() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path {...sw} d="M3.5 4h1.7l2.1 10.4a1.2 1.2 0 0 0 1.2 1h7.3a1.2 1.2 0 0 0 1.2-.95L20 7.5H6" />
      <circle {...sw} cx="9.5" cy="19" r="1.4" />
      <circle {...sw} cx="16.5" cy="19" r="1.4" />
    </svg>
  )
}
function IconSearch() {
  return <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="M16.5 16.5 21 21" /></svg>
}
function IconUser() {
  return <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><circle {...sw} cx="12" cy="8" r="3.4" /><path {...sw} d="M5 20a7 7 0 0 1 14 0" /></svg>
}
// Catálogo: rejilla de productos
function IconCatalogo() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect {...sw} x="4" y="4" width="7" height="7" rx="1.6" />
      <rect {...sw} x="13" y="4" width="7" height="7" rx="1.6" />
      <rect {...sw} x="4" y="13" width="7" height="7" rx="1.6" />
      <rect {...sw} x="13" y="13" width="7" height="7" rx="1.6" />
    </svg>
  )
}
// Difundir: megáfono
function IconDifundir() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <path {...sw} d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1z" />
      <path {...sw} d="M17.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  )
}
// Configuración: controles / sliders
function IconConfig() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path {...sw} d="M4 7h9" /><path {...sw} d="M18 7h2" /><circle {...sw} cx="15.5" cy="7" r="2.1" />
      <path {...sw} d="M4 17h4" /><path {...sw} d="M12.5 17h7.5" /><circle {...sw} cx="9.5" cy="17" r="2.1" />
    </svg>
  )
}
