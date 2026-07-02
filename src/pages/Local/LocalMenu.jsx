import { useMemo, useState } from 'react'
import { localThemeVars } from '../../utils/theme'
import { useCart } from '../../contexts/CartContext'
import { estaAbierto } from '../../utils/horario'
import CategoryNav from '../../components/Menu/CategoryNav'
import ProductCard from '../../components/Menu/ProductCard'
import ProductModal from '../../components/Menu/ProductModal'
import ProductWizard from '../../components/Menu/ProductWizard'
import CartButton from '../../components/Cart/CartButton'
import CartDrawer from '../../components/Cart/CartDrawer'
import BotonFavorito from '../../components/Favorito/BotonFavorito'
import Checkout from '../Checkout/Checkout'
import './LocalSkinJet.css'

export default function LocalMenu({ local, productos }) {
  const { addItem } = useCart()
  const [modalProducto, setModalProducto] = useState(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [checkoutAbierto, setCheckoutAbierto] = useState(false)
  const [toast, setToast] = useState('')

  // Categorías: usar las del local o derivarlas de los productos
  const categorias = useMemo(() => {
    if (local.categorias?.length) return local.categorias
    const vistas = []
    for (const p of productos) {
      if (p.categoria && !vistas.find(c => c.id === p.categoria)) {
        vistas.push({ id: p.categoria, nombre: p.categoria })
      }
    }
    return vistas
  }, [local, productos])

  const [catActiva, setCatActiva] = useState(categorias[0]?.id)

  // 🔎 Buscador: aparece solo cuando hay muchos productos (menús largos).
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const buscando = q.length > 0
  const mostrarBuscador = productos.length > 12
  const resultados = useMemo(() => {
    if (!buscando) return []
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.descripcion || '').toLowerCase().includes(q)
    )
  }, [buscando, q, productos])

  // Horario (D25): fuera de horario se ve el menú pero no se puede pedir.
  const abierto = useMemo(() => estaAbierto(local.horario), [local.horario])

  // Productos agrupados por categoría
  const porCategoria = useMemo(() => {
    return categorias.map(cat => ({
      cat,
      items: productos.filter(p => p.categoria === cat.id),
    })).filter(g => g.items.length > 0)
  }, [categorias, productos])

  function seleccionarCategoria(id) {
    setCatActiva(id)
    const el = document.getElementById(`sec-${id}`)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 64
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  function pedirProducto(producto) {
    if (!abierto) {
      mostrarToast(`Cerrado ahora · abre a las ${local.horario?.abre}`)
      return
    }
    // Tocar la tarjeta SIEMPRE abre el panel de detalle (ver el producto más grande +
    // descripción). Nada se agrega al carrito por tocar: solo con el botón "Agregar" del
    // panel. Los productos con opciones o "arma tu X" usan el mismo panel con sus opciones.
    setModalProducto(producto)
  }

  function agregarDesdeModal(payload) {
    addItem(payload)
    setModalProducto(null)
    mostrarToast(`${payload.producto.nombre} agregado`)
  }

  function mostrarToast(msg) {
    setToast(msg)
    window.clearTimeout(mostrarToast._t)
    mostrarToast._t = window.setTimeout(() => setToast(''), 1800)
  }

  function irACheckout() {
    setDrawerAbierto(false)
    setCheckoutAbierto(true)
  }

  // Hero protagonizado por el logo (sobre crema, sin foto): para marcas cuyo
  // logo ya trae el nombre. Se activa con tema.hero === 'logo'.
  const heroLogo = local.tema?.hero === 'logo'
  const skinJet = local.tema?.skin === 'jet'

  return (
    <div className={`local-page ${skinJet ? 'local-skin-jet' : ''}`} style={localThemeVars(local.tema)}>
      <header className={`local-hero ${heroLogo ? 'local-hero--logo' : ''}`}>
        {heroLogo ? (
          <>
            <BotonFavorito local={local} variante="hero local-hero-fav local-hero-fav--light" />
            <div className="local-hero-content local-hero-content--logo">
              {local.logo && <img className="local-logo-full" src={local.logo} alt={local.nombre} />}
              {/* El nombre ya vive en el logo; lo dejamos accesible para lectores/SEO. */}
              <h1 className="local-name sr-only">{local.nombre}</h1>
              {local.descripcion && <p className="local-desc local-desc--ink">{local.descripcion}</p>}
            </div>
          </>
        ) : (
          <>
            {local.banner && <img className="local-banner" src={local.banner} alt="" />}
            <div className="local-hero-overlay" />
            <BotonFavorito local={local} variante="hero local-hero-fav" />
            <div className="local-hero-content">
              {local.logo && <img className="local-logo" src={local.logo} alt={local.nombre} />}
              <h1 className="local-name">{local.nombre}</h1>
              {local.descripcion && <p className="local-desc">{local.descripcion}</p>}
            </div>
          </>
        )}
      </header>

      {!abierto && (
        <div className="local-cerrado" role="status">
          😴 <strong>Cerrado ahora.</strong> Puedes ver el menú; abre a las {local.horario?.abre}.
        </div>
      )}

      {mostrarBuscador && (
        <div className="local-search">
          <div className="local-search-box">
            <svg className="local-search-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className="local-search-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar en el menú…"
              aria-label="Buscar en el menú"
            />
            {query && (
              <button className="local-search-clear" onClick={() => setQuery('')} aria-label="Limpiar búsqueda">✕</button>
            )}
          </div>
        </div>
      )}

      {!buscando && !local.ocultarNav && categorias.length > 1 && (
        <CategoryNav categorias={categorias} activa={catActiva} onSelect={seleccionarCategoria} />
      )}

      <main className="local-body local-menu">
        {buscando ? (
          resultados.length > 0 ? (
            <section className="menu-section">
              <h2 className="menu-section-title">Resultados · {resultados.length}</h2>
              <div className="menu-grid">
                {resultados.map(p => (
                  <ProductCard key={p.id} producto={p} onPedir={pedirProducto} />
                ))}
              </div>
            </section>
          ) : (
            <div className="local-search-empty">
              <span className="local-search-empty-icon">🔍</span>
              <p>No encontramos “<strong>{query}</strong>”.</p>
              <p className="local-search-empty-hint">Prueba con otra palabra.</p>
            </div>
          )
        ) : (
          porCategoria.map(({ cat, items }) => (
            <section key={cat.id} id={`sec-${cat.id}`} className="menu-section">
              <h2 className="menu-section-title">
                {cat.emoji && <span>{cat.emoji}</span>} {cat.nombre}
              </h2>
              <div className="menu-grid">
                {items.map(p => (
                  <ProductCard key={p.id} producto={p} onPedir={pedirProducto} />
                ))}
              </div>
            </section>
          ))
        )}
        <div className="menu-bottom-space" />
      </main>

      <CartButton onAbrir={() => setDrawerAbierto(true)} />

      {modalProducto && (
        modalProducto.modo === 'pasos'
          ? <ProductWizard
              producto={modalProducto}
              onCerrar={() => setModalProducto(null)}
              onAgregar={agregarDesdeModal}
            />
          : <ProductModal
              producto={modalProducto}
              onCerrar={() => setModalProducto(null)}
              onAgregar={agregarDesdeModal}
            />
      )}

      <CartDrawer
        abierto={drawerAbierto}
        onCerrar={() => setDrawerAbierto(false)}
        onCheckout={irACheckout}
      />

      {checkoutAbierto && (
        <Checkout local={local} abierto={abierto} onClose={() => setCheckoutAbierto(false)} />
      )}

      {toast && <div className="local-toast">{toast}</div>}
    </div>
  )
}
