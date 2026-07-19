import { useNavigate, useLocation } from 'react-router-dom'
import { useNavUI } from '../../contexts/NavUIContext'
import { esColorOscuro } from '../../utils/theme'
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

  // Los colores del tema los hereda de :root (App transforma toda la app con el
  // local activo). Aquí solo decidimos si la barra va oscura.
  const oscuro = activeLocal && esColorOscuro(activeLocal.tema?.bg)

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
  // Carrito de compras (antes parecía una caneca de basura).
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
