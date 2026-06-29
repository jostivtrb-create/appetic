import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getLocalBySlug } from '../../services/locales'
import { getProductos } from '../../services/productos'
import {
  agregarProducto, actualizarProducto, borrarProducto, actualizarLocal,
} from '../../services/adminLocal'
import { subirFotoProducto, subirFotoOpcion } from '../../services/storage'
import AdminProductos from './AdminProductos'
import AdminConfig from './AdminConfig'
import AdminMetricas from './AdminMetricas'
import { isDevSlug, getDevLocal } from '../../dev'
import './Admin.css'

export default function AdminPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, cargando: authCargando, entrar, salir } = useAuth()
  const demo = isDevSlug(slug) // previsualización de local en DEV (no escribe en Firestore)

  // Al cerrar sesión en el panel, volver al inicio (no quedar en la pantalla
  // de login/bloqueo del local).
  async function cerrarSesion() {
    await salir()
    navigate('/')
  }

  const [estado, setEstado] = useState('cargando') // cargando | ok | no-existe | error
  const [local, setLocal] = useState(null)
  const [productos, setProductos] = useState([])
  const [tab, setTab] = useState('productos')

  // Usuario efectivo (en demo, admin falso)
  const usuario = demo ? { email: 'demo@appetic.app', displayName: 'Admin Demo' } : user
  const esAdmin = demo || (local?.admins?.includes(usuario?.email))

  useEffect(() => {
    let activo = true
    async function cargar() {
      if (demo) {
        const dev = await getDevLocal(slug)
        if (!activo || !dev) return
        // Admin falso en DEV: forzamos el correo demo en admins para entrar al panel.
        setLocal({ ...dev.local, admins: ['demo@appetic.app'] })
        setProductos(dev.productos.map(p => ({ ...p })))
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
    cargar().catch(err => { console.error(err); if (activo) setEstado('error') })
    return () => { activo = false }
  }, [slug, demo])

  // ---- Operaciones (en demo solo tocan el estado; en real, Firestore + estado) ----
  async function addProducto(data) {
    if (demo) { const id = 'tmp-' + Date.now(); setProductos(p => [...p, { ...data, id }]); return id }
    const id = await agregarProducto(local.id, data)
    setProductos(p => [...p, { ...data, id }])
    return id
  }
  async function updateProducto(id, cambios) {
    setProductos(p => p.map(x => x.id === id ? { ...x, ...cambios } : x))
    if (!demo) await actualizarProducto(local.id, id, cambios)
  }
  async function deleteProducto(id) {
    setProductos(p => p.filter(x => x.id !== id))
    if (!demo) await borrarProducto(local.id, id)
  }
  async function updateLocal(cambios) {
    setLocal(l => ({ ...l, ...cambios }))
    if (!demo) await actualizarLocal(local.id, cambios)
  }
  async function subirFoto(productoId, file) {
    if (demo) { const url = URL.createObjectURL(file); await updateProducto(productoId, { foto: url }); return url }
    const url = await subirFotoProducto(local.id, productoId, file)
    await updateProducto(productoId, { foto: url })
    return url
  }
  // Sube la foto de una opción (topping/salsa) y devuelve su URL (no toca Firestore
  // aquí: el editor la guarda dentro de gruposOpciones al pulsar "Guardar").
  async function subirFotoDeOpcion(grupoId, opcId, file) {
    if (demo) return URL.createObjectURL(file)
    return await subirFotoOpcion(local.id, grupoId, opcId, file)
  }

  // ---------- Estados de carga / acceso ----------
  if (estado === 'cargando' || (!demo && authCargando)) {
    return <div className="local-loading"><div className="local-spinner" /><p>Cargando panel…</p></div>
  }
  if (estado === 'no-existe') {
    return <div className="local-msg"><div className="local-msg-emoji">🤔</div><h2>Local no encontrado</h2><Link to="/" className="btn btn-ghost">Inicio</Link></div>
  }
  if (estado === 'error') {
    return <div className="local-msg"><div className="local-msg-emoji">📡</div><h2>Error al cargar</h2><button className="btn btn-primary" onClick={() => location.reload()}>Reintentar</button></div>
  }

  // No logueado → pantalla de login
  if (!usuario) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <div className="admin-login-emoji">🔐</div>
          <h1>Panel de {local.nombre}</h1>
          <p>Inicia sesión con el correo autorizado de tu negocio para administrar tu menú.</p>
          <button className="btn btn-primary admin-google" onClick={entrar}>
            Entrar con Google
          </button>
        </div>
      </div>
    )
  }

  // Logueado pero no autorizado para ESTE local
  if (!esAdmin) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <div className="admin-login-emoji">🚫</div>
          <h1>Sin acceso</h1>
          <p>El correo <strong>{usuario.email}</strong> no está autorizado para administrar <strong>{local.nombre}</strong>.</p>
          <button className="btn btn-ghost" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </div>
    )
  }

  // ---------- Panel ----------
  return (
    <div className="admin">
      <header className="admin-top">
        <div>
          <span className="admin-top-eyebrow">Panel · Appetic</span>
          <h1 className="admin-top-nombre">{local.nombre}</h1>
        </div>
        {!demo && <button className="admin-salir" onClick={cerrarSesion}>Salir</button>}
        {demo && <span className="admin-demo-badge">DEMO</span>}
      </header>

      <nav className="admin-tabs">
        <button className={tab === 'productos' ? 'on' : ''} onClick={() => setTab('productos')}>🍔 Menú</button>
        <button className={tab === 'config' ? 'on' : ''} onClick={() => setTab('config')}>⚙️ Configuración</button>
        <button className={tab === 'metricas' ? 'on' : ''} onClick={() => setTab('metricas')}>📊 Métricas</button>
      </nav>

      <main className="admin-body">
        {tab === 'productos' && (
          <AdminProductos
            local={local}
            productos={productos}
            onAdd={addProducto}
            onUpdate={updateProducto}
            onDelete={deleteProducto}
            onFoto={subirFoto}
            onFotoOpcion={subirFotoDeOpcion}
          />
        )}
        {tab === 'config' && <AdminConfig local={local} onUpdate={updateLocal} />}
        {tab === 'metricas' && <AdminMetricas local={local} demo={demo} />}
      </main>

      <Link to={`/${slug}`} className="admin-ver-menu">👁️ Ver mi menú</Link>
    </div>
  )
}
