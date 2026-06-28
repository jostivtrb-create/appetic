import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getLocalBySlug } from '../../services/locales'
import { getProductos } from '../../services/productos'
import { registrarVisita } from '../../services/stats'
import { CartProvider } from '../../contexts/CartContext'
import LocalMenu from './LocalMenu'
import './LocalPage.css'

export default function LocalPage() {
  const { slug } = useParams()
  const [estado, setEstado] = useState('cargando') // cargando | ok | no-existe | error
  const [local, setLocal] = useState(null)
  const [productos, setProductos] = useState([])

  useEffect(() => {
    let activo = true
    setEstado('cargando')

    async function cargar() {
      // 🧪 Locales de desarrollo (solo en DEV: "demo", "perros-criollos", …)
      if (import.meta.env.DEV) {
        const { getDevLocal } = await import('../../dev')
        const dev = await getDevLocal(slug)
        if (dev) {
          if (!activo) return
          setLocal(dev.local)
          setProductos(dev.productos)
          setEstado('ok')
          return
        }
      }

      // 👀 Vista previa en vivo (?preview=1): arma el menú desde el código, sin
      // base de datos. Para revisar el diseño antes de sembrar el local.
      if (new URLSearchParams(window.location.search).has('preview')) {
        const { getPreviewLocal } = await import('../../preview')
        const prev = await getPreviewLocal(slug)
        if (prev) {
          if (!activo) return
          setLocal(prev.local)
          setProductos(prev.productos)
          setEstado('ok')
          return
        }
      }

      const data = await getLocalBySlug(slug)
      if (!activo) return
      if (!data) { setEstado('no-existe'); return }
      // Caché del menú por versión: si no cambió, no re-lee los productos.
      const prods = await getProductos(data.id, data.menuVersion)
      if (!activo) return
      setLocal(data)
      setProductos(prods)
      setEstado('ok')
      // Cuenta la visita (1 vez por sesión, best-effort, no bloquea la carga).
      registrarVisita(data.id)
    }

    cargar().catch(err => {
      console.error('Error cargando local:', err)
      if (activo) setEstado('error')
    })

    return () => { activo = false }
  }, [slug])

  if (estado === 'cargando') {
    return (
      <div className="local-loading">
        <div className="local-spinner" />
        <p>Cargando menú…</p>
      </div>
    )
  }

  if (estado === 'no-existe') {
    return (
      <div className="local-msg">
        <div className="local-msg-emoji">🤔</div>
        <h2>No encontramos este local</h2>
        <p>El link <strong>/{slug}</strong> no corresponde a ningún negocio (todavía).</p>
        <Link to="/" className="btn btn-ghost">Ir al inicio</Link>
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <div className="local-msg">
        <div className="local-msg-emoji">📡</div>
        <h2>Algo falló al cargar</h2>
        <p>Revisa tu conexión e inténtalo de nuevo.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    )
  }

  return (
    <CartProvider localId={local.id}>
      <LocalMenu local={local} productos={productos} />
    </CartProvider>
  )
}
