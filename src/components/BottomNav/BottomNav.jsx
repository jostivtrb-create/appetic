import { useNavigate, useLocation } from 'react-router-dom'
import { useNavUI } from '../../contexts/NavUIContext'
import { localThemeVars } from '../../utils/theme'
import './BottomNav.css'

// 🧭 Barra inferior FIJA, la misma en toda la app:
//   Menú · Favoritos · [🛒 Pedido] · Buscar · Cuenta
// Se pinta con los colores del local mientras estás en su menú; en Buscar /
// Favoritos / Cuenta usa los colores de Appetic. Menú y el carrito apuntan al
// "local activo" aunque estés en otra pestaña.
export default function BottomNav() {
  const { activeLocal, cartCount, live } = useNavUI()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Nunca en paneles internos (admin del local, superadmin).
  if (/\/admin\/?$/.test(pathname) || pathname.startsWith('/superadmin')) return null

  // Estás DENTRO del menú de un local cuando ese menú está montado (live).
  const enLocal = Boolean(live)
  // Con una capa abierta (detalle, carrito, checkout) la barra se esconde.
  if (enLocal && live.oculta) return null

  const themed = enLocal && activeLocal
  const oscuro = themed && bgEsOscuro(activeLocal.tema?.bg)
  const style = themed
    ? { ...localThemeVars(activeLocal.tema), '--bnav-bg': activeLocal.tema?.bg || '#141014' }
    : undefined

  // Pestaña activa (resaltada).
  const activa = enLocal ? 'menu'
    : pathname === '/' ? 'buscar'
    : pathname.startsWith('/favoritos') ? 'favoritos'
    : (pathname.startsWith('/cuenta') || pathname.startsWith('/pedidos')) ? 'cuenta'
    : ''

  function irAMenu() {
    if (live) return live.onMenu()          // ya estás en el menú → sube arriba
    if (activeLocal) return navigate(`/${activeLocal.slug}`)
    navigate('/')                            // aún no has entrado a ningún local
  }
  function irACarrito() {
    if (live) return live.onCarrito()        // abre el carrito de este local
    if (activeLocal) return navigate(`/${activeLocal.slug}?pedido=1`)
    navigate('/')
  }

  return (
    <nav className={`bnav ${oscuro ? 'bnav--dark' : ''}`} style={style} aria-label="Navegación">
      <button className={`bnav-item ${activa === 'menu' ? 'is-active' : ''}`} onClick={irAMenu}>
        <IconMenu /><span>Menú</span>
      </button>
      <button className={`bnav-item ${activa === 'favoritos' ? 'is-active' : ''}`} onClick={() => navigate('/favoritos')}>
        <IconHeart /><span>Favoritos</span>
      </button>
      <button className="bnav-cart" onClick={irACarrito} aria-label="Ver pedido">
        <span className="bnav-cart-circle">
          <IconBag />
          {cartCount > 0 && <span className="bnav-cart-badge">{cartCount}</span>}
        </span>
        <span className="bnav-cart-label">Pedido</span>
      </button>
      <button className={`bnav-item ${activa === 'buscar' ? 'is-active' : ''}`} onClick={() => navigate('/')}>
        <IconSearch /><span>Buscar</span>
      </button>
      <button className={`bnav-item ${activa === 'cuenta' ? 'is-active' : ''}`} onClick={() => navigate('/cuenta')}>
        <IconUser /><span>Cuenta</span>
      </button>
    </nav>
  )
}

// ¿El "mundo" del local es oscuro? (para pintar la barra clara u oscura)
function bgEsOscuro(hex) {
  if (!hex || typeof hex !== 'string') return false
  const m = hex.replace('#', '')
  if (m.length < 6) return false
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return false
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45
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
  return <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path {...sw} d="M6 8h12l-1 11H7L6 8z" /><path {...sw} d="M9 8a3 3 0 0 1 6 0" /></svg>
}
function IconSearch() {
  return <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="M16.5 16.5 21 21" /></svg>
}
function IconUser() {
  return <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><circle {...sw} cx="12" cy="8" r="3.4" /><path {...sw} d="M5 20a7 7 0 0 1 14 0" /></svg>
}
