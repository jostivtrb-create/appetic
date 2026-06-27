import { useMemo, useState } from 'react'
import { localThemeVars } from '../../utils/theme'
import { useCart } from '../../contexts/CartContext'
import { tieneOpciones } from '../../utils/price'
import CategoryNav from '../../components/Menu/CategoryNav'
import ProductCard from '../../components/Menu/ProductCard'
import ProductModal from '../../components/Menu/ProductModal'
import CartButton from '../../components/Cart/CartButton'
import CartDrawer from '../../components/Cart/CartDrawer'

export default function LocalMenu({ local, productos }) {
  const { addItem } = useCart()
  const [modalProducto, setModalProducto] = useState(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
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
    if (tieneOpciones(producto)) {
      setModalProducto(producto)
    } else {
      addItem({ producto, cantidad: 1 })
      mostrarToast(`${producto.nombre} agregado`)
    }
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
    // 🚧 El checkout llega en la Etapa 3
    mostrarToast('El pago/envío llega en el siguiente paso 🚧')
  }

  return (
    <div className="local-page" style={localThemeVars(local.tema)}>
      <header className="local-hero">
        {local.banner && <img className="local-banner" src={local.banner} alt="" />}
        <div className="local-hero-overlay" />
        <div className="local-hero-content">
          {local.logo && <img className="local-logo" src={local.logo} alt={local.nombre} />}
          <h1 className="local-name">{local.nombre}</h1>
          {local.descripcion && <p className="local-desc">{local.descripcion}</p>}
        </div>
      </header>

      <CategoryNav categorias={categorias} activa={catActiva} onSelect={seleccionarCategoria} />

      <main className="local-body local-menu">
        {porCategoria.map(({ cat, items }) => (
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
        ))}
        <div className="menu-bottom-space" />
      </main>

      <CartButton onAbrir={() => setDrawerAbierto(true)} />

      {modalProducto && (
        <ProductModal
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

      {toast && <div className="local-toast">{toast}</div>}
    </div>
  )
}
