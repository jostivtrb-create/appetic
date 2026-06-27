import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getLocalBySlug } from '../../services/locales'
import { getProductos } from '../../services/productos'
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
      // 🧪 Local de desarrollo (solo en DEV, slug "demo")
      if (import.meta.env.DEV && slug === 'demo') {
        const { MOCK_LOCAL, MOCK_PRODUCTOS } = await import('../../dev/mockLocal')
        if (!activo) return
        setLocal(MOCK_LOCAL)
        setProductos(MOCK_PRODUCTOS)
        setEstado('ok')
        return
      }

      const data = await getLocalBySlug(slug)
      if (!activo) return
      if (!data) { setEstado('no-existe'); return }
      const prods = await getProductos(data.id)
      if (!activo) return
      setLocal(data)
      setProductos(prods)
      setEstado('ok')
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
