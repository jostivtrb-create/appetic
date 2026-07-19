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
import AdminDifundir from './AdminDifundir'
import { isDevSlug, getDevLocal } from '../../dev'
import { puedeAdministrarLocal, esSuperadmin } from '../../config/roles'
import { useAdmin } from '../../contexts/AdminContext'
import './Admin.css'

export default function AdminPage() {
  const { slug, panel } = useParams()
  const seccion = panel || 'catalogo' // catalogo | difundir | config | metricas
  const { esDueno } = useAdmin()
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
  const [avatarFallo, setAvatarFallo] = useState(false)

  // Usuario efectivo (en demo, admin falso)
  const usuario = demo ? { email: 'demo@appetic.app', displayName: 'Admin Demo' } : user
  // Entra el dueño (su correo en local.admins) y también el superadmin, que administra
  // cualquier local como si fuera suyo (mismos permisos en firestore.rules).
  const esAdmin = demo || puedeAdministrarLocal(usuario?.email, local)
  const entraComoSuperadmin = !demo && esSuperadmin(usuario?.email) && !local?.admins?.includes(usuario?.email)

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
  // ⭐ "Nuestro fuerte" es UNO por categoría: al marcar uno, desmarca los demás de
  // esa misma categoría (en Firestore y en el estado). Devuelve la lista corregida.
  async function desmarcarFuertesDeCategoria(lista, categoria, exceptoId) {
    const otros = lista.filter(x => x.id !== exceptoId && x.categoria === categoria && x.destacado)
    if (!otros.length) return lista
    if (!demo) for (const p of otros) await actualizarProducto(local.id, p.id, { destacado: false })
    const ids = new Set(otros.map(x => x.id))
    return lista.map(x => ids.has(x.id) ? { ...x, destacado: false } : x)
  }

  async function addProducto(data) {
    // Asignamos `orden` (al final del menú) al crear. Sin este campo, la lectura
    // del menú omitía el producto y "desaparecía" al recargar.
    const orden = productos.reduce((m, p) => Math.max(m, p.orden ?? 0), 0) + 1
    const conOrden = { ...data, orden }
    const id = demo ? 'tmp-' + Date.now() : await agregarProducto(local.id, conOrden)
    let nuevos = [...productos, { ...conOrden, id }]
    if (conOrden.destacado === true) nuevos = await desmarcarFuertesDeCategoria(nuevos, conOrden.categoria, id)
    setProductos(nuevos)
    return id
  }
  async function updateProducto(id, cambios) {
    let nuevos = productos.map(x => x.id === id ? { ...x, ...cambios } : x)
    if (cambios.destacado === true) {
      const cat = nuevos.find(x => x.id === id)?.categoria
      nuevos = await desmarcarFuertesDeCategoria(nuevos, cat, id)
    }
    setProductos(nuevos)
    if (!demo) await actualizarProducto(local.id, id, cambios)
    // Si cambió de categoría, alguna pudo quedar vacía → que desaparezca.
    if ('categoria' in cambios) await podarCategoriasVacias(nuevos)
  }
  async function deleteProducto(id) {
    const nuevos = productos.filter(x => x.id !== id)
    setProductos(nuevos)
    if (!demo) await borrarProducto(local.id, id)
    await podarCategoriasVacias(nuevos)
  }
  async function updateLocal(cambios) {
    setLocal(l => ({ ...l, ...cambios }))
    if (!demo) await actualizarLocal(local.id, cambios)
  }

  // Crea una categoría nueva (nombre + emoji opcional) y la agrega al local.
  // Devuelve su id para asignársela al producto que la está creando.
  async function addCategoria(nombre, emoji) {
    const nom = (nombre || '').trim()
    if (!nom) return null
    // id ascii-safe desde el nombre (NFD + quitar no alfanuméricos = sin acentos).
    const base = nom.toLowerCase().normalize('NFD')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cat'
    const existentes = new Set((local.categorias || []).map(c => c.id))
    let id = base, n = 2
    while (existentes.has(id)) id = `${base}-${n++}`
    const categorias = [...(local.categorias || []), { id, nombre: nom, emoji: (emoji || '').trim() }]
    await updateLocal({ categorias })
    return id
  }

  // Reordena las categorías del local (el orden manda en el menú del cliente).
  async function reordenarCategorias(nuevas) {
    await updateLocal({ categorias: nuevas })
  }

  // Quita del local las categorías que ya no tiene ningún producto (que desaparezcan).
  async function podarCategoriasVacias(prods) {
    const cats = local.categorias
    if (!cats?.length) return
    const usadas = new Set(prods.map(p => p.categoria).filter(Boolean))
    const filtradas = cats.filter(c => usadas.has(c.id))
    if (filtradas.length !== cats.length) await updateLocal({ categorias: filtradas })
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
        {!demo && (
          <Link to="/cuenta" className="admin-perfil" title="Mi perfil y locales" aria-label="Mi perfil y locales">
            {usuario?.photoURL && !avatarFallo
              ? <img className="admin-perfil-avatar" src={usuario.photoURL} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFallo(true)} />
              : <span className="admin-perfil-avatar admin-perfil-avatar-fb">{(usuario?.displayName || usuario?.email || '?')[0]?.toUpperCase()}</span>}
            <span className="admin-perfil-g" aria-hidden="true"><GoogleG /></span>
          </Link>
        )}
        {demo && <span className="admin-demo-badge">DEMO</span>}
      </header>

      {/* Soporte: dejar claro que NO eres el dueño de este local, para no editar el equivocado. */}
      {entraComoSuperadmin && (
        <div className="admin-super-aviso">
          👑 Entraste como <strong>superadmin</strong>, no como el dueño. Los cambios que guardes aquí
          los verá <strong>{local.nombre}</strong>.
        </div>
      )}

      {/* Los dueños navegan con la barra inferior; el superadmin/demo (que no la
          ven) conservan estas pestañas internas para moverse entre secciones. */}
      {!esDueno && (
        <nav className="admin-tabs">
          <button className={seccion === 'catalogo' ? 'on' : ''} onClick={() => navigate(`/${slug}/admin/catalogo`)}>🍔 Catálogo</button>
          <button className={seccion === 'difundir' ? 'on' : ''} onClick={() => navigate(`/${slug}/admin/difundir`)}>📣 Difundir</button>
          <button className={seccion === 'config' ? 'on' : ''} onClick={() => navigate(`/${slug}/admin/config`)}>⚙️ Configuración</button>
          <button className={seccion === 'metricas' ? 'on' : ''} onClick={() => navigate(`/${slug}/admin/metricas`)}>📊 Métricas</button>
        </nav>
      )}

      <main className="admin-body">
        {seccion === 'difundir' ? <AdminDifundir local={local} slug={slug} />
          : seccion === 'config' ? <AdminConfig local={local} onUpdate={updateLocal} />
            : seccion === 'metricas' ? <AdminMetricas local={local} demo={demo} />
              : (
                <AdminProductos
                  local={local}
                  slug={slug}
                  productos={productos}
                  onAdd={addProducto}
                  onUpdate={updateProducto}
                  onDelete={deleteProducto}
                  onFoto={subirFoto}
                  onFotoOpcion={subirFotoDeOpcion}
                  onAddCategoria={addCategoria}
                  onReorderCategorias={reordenarCategorias}
                />
              )}
      </main>
    </div>
  )
}

// Mini logo de Google (para el badge del avatar del perfil).
function GoogleG() {
  return (
    <svg width="12" height="12" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}
