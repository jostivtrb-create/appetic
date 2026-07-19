import { useNavigate, useLocation } from 'react-router-dom'
import { useNavUI } from '../../contexts/NavUIContext'
import { useFavoritos } from '../../contexts/FavoritosContext'
import { localThemeVars } from '../../utils/theme'
import './BottomNav.css'

// 🧭 Barra inferior de navegación, presente en toda la app.
//  • Dentro de un local: Menú · Favorito · [🛒 Pedido] · Pedidos · Cuenta,
//    pintada con LOS COLORES de ese local (hereda su tema).
//  • En Inicio / Pedidos / Cuenta: Inicio · Pedidos · Cuenta, con los colores
//    de Appetic.
// El estado del local (tema + carrito) llega por NavUIContext, que LocalMenu
// publica. Así el carrito del centro sabe cuántos items hay y cómo abrirse.
export default function BottomNav() {
  const { barra } = useNavUI()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { esFavorito, toggleFavorito } = useFavoritos()

  // Nunca en paneles internos (admin del local, superadmin).
  if (/\/admin\/?$/.test(pathname) || pathname.startsWith('/superadmin')) return null

  const local = barra?.local
  const dentroLocal = Boolean(local)

  // Con una capa abierta (detalle, carrito, checkout) la barra se esconde.
  if (dentroLocal && barra.oculta) return null

  // ---------- Dentro de un local ----------
  if (dentroLocal) {
    const fav = esFavorito(local.id)
    const oscuro = bgEsOscuro(local.tema?.bg)
    const style = { ...localThemeVars(local.tema), '--bnav-bg': local.tema?.bg || '#141014' }
    return (
      <nav className={`bnav bnav--local ${oscuro ? 'bnav--dark' : ''}`} style={style} aria-label="Navegación">
        <button className="bnav-item is-active" onClick={barra.onMenu}>
          <IconMenu /><span>Menú</span>
        </button>
        <button
          className={`bnav-item ${fav ? 'is-fav' : ''}`}
          onClick={() => { if (toggleFavorito(local) === null) navigate('/cuenta') }}
          aria-pressed={fav}
        >
          <IconHeart lleno={fav} /><span>Favorito</span>
        </button>
        <button className="bnav-cart" onClick={barra.onCarrito} aria-label="Ver pedido">
          <span className="bnav-cart-circle">
            <IconBag />
            {barra.cartCount > 0 && <span className="bnav-cart-badge">{barra.cartCount}</span>}
          </span>
          <span className="bnav-cart-label">Pedido</span>
        </button>
        <button className="bnav-item" onClick={() => navigate('/pedidos')}>
          <IconReceipt /><span>Pedidos</span>
        </button>
        <button className="bnav-item" onClick={() => navigate('/cuenta')}>
          <IconUser /><span>Cuenta</span>
        </button>
      </nav>
    )
  }

  // ---------- Fuera de un local (Inicio / Pedidos / Cuenta) ----------
  const rutaGlobal = pathname === '/' || pathname.startsWith('/pedidos') || pathname.startsWith('/cuenta')
  if (!rutaGlobal) return null // en un /:slug aún cargando, no parpadea la barra global

  const activo = pathname === '/' ? 'inicio' : pathname.startsWith('/pedidos') ? 'pedidos' : 'cuenta'
  return (
    <nav className="bnav bnav--global" aria-label="Navegación">
      <button className={`bnav-item ${activo === 'inicio' ? 'is-active' : ''}`} onClick={() => navigate('/')}>
        <IconHome /><span>Inicio</span>
      </button>
      <button className={`bnav-item ${activo === 'pedidos' ? 'is-active' : ''}`} onClick={() => navigate('/pedidos')}>
        <IconReceipt /><span>Pedidos</span>
      </button>
      <button className={`bnav-item ${activo === 'cuenta' ? 'is-active' : ''}`} onClick={() => navigate('/cuenta')}>
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
function IconHome() {
  return <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path {...sw} d="M4 11l8-6 8 6" /><path {...sw} d="M6 10v9h12v-9" /></svg>
}
function IconMenu() {
  return <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path {...sw} d="M4 6h16" /><path {...sw} d="M4 12h16" /><path {...sw} d="M4 18h10" /></svg>
}
function IconHeart({ lleno }) {
  return <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path {...sw} fill={lleno ? 'currentColor' : 'none'} d="M12 20s-7-4.6-7-9.4A3.6 3.6 0 0 1 12 8a3.6 3.6 0 0 1 7 2.6C19 15.4 12 20 12 20z" /></svg>
}
function IconBag() {
  return <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path {...sw} d="M6 8h12l-1 11H7L6 8z" /><path {...sw} d="M9 8a3 3 0 0 1 6 0" /></svg>
}
function IconReceipt() {
  return <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path {...sw} d="M6 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1-2-1z" /><path {...sw} d="M9 8h6M9 12h6" /></svg>
}
function IconUser() {
  return <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><circle {...sw} cx="12" cy="8" r="3.4" /><path {...sw} d="M5 20a7 7 0 0 1 14 0" /></svg>
}
