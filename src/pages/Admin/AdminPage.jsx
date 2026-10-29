import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getLocalBySlug } from '../../services/locales'
import { getProductos } from '../../services/productos'
import {
  agregarProducto, actualizarProducto, borrarProducto, actualizarLocal, guardarFotoExterna,
} from '../../services/adminLocal'
import { subirFotoProducto, subirFotoOpcion, subirBanner, subirFotoExterna } from '../../services/storage'
import AdminProductos from './AdminProductos'
import AdminFotosExternas from './AdminFotosExternas'
import AdminConfig from './AdminConfig'
import AdminMetricas from './AdminMetricas'
import AdminDifundir from './AdminDifundir'
import { isDevSlug, getDevLocal } from '../../dev'
import { computeDestacadosHome } from '../../utils/destacadosHome'
import { puedeAdministrarLocal, esSuperadmin } from '../../config/roles'
import { useAdmin } from '../../contexts/AdminContext'
import AdminMesero from './AdminMesero'
import AdminComandas from './AdminComandas'
import AdminDomicilios from './AdminDomicilios'
import AdminAjustes from './AdminAjustes'
import { EquipoEnLinea } from './AdminEquipo'
import { useNavUI } from '../../contexts/NavUIContext'
import PanelMenuBoton, { usePuedePanel } from '../../components/BottomNav/PanelMenuBoton'
import './Admin.css'

// Título de cada página del panel (va en el encabezado y en la pestaña del navegador).
const SECCIONES = {
  mesero: 'Mesero',
  comandas: 'Comandas',
  domicilios: 'Domicilios',
  catalogo: 'Catálogo',
  difundir: 'Difundir',
  config: 'Configuración',
  metricas: 'Métricas',
}

export default function AdminPage() {
  const { slug, panel, sub } = useParams()
  const { rolesEn } = useAdmin()
  // ¿Tiene la barra del panel (lateral en PC, cajón ☰ en el celular)? Dueños y superadmin sí.
  // Con barra, cada sección es su propia página y NO se repiten pestañas arriba.
  const { puede: tieneBarra } = usePuedePanel()
  const { setPanelCatalogo } = useNavUI()
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
  // En la vista previa demo, si se simula ser del equipo (?equipo=slug:mesero), se entra como ese
  // rol y no como admin, para revisar exactamente lo que ve el mesero o la cocina.
  const rolesSimulados = demo ? rolesEn(slug).filter(r => r !== 'admin') : []
  const esAdmin = demo ? rolesSimulados.length === 0 : puedeAdministrarLocal(usuario?.email, local)
  // Mesero / cocina de ESTE local (sin ser admin): solo entran a la sección de su rol.
  const rolesEquipo = esAdmin ? [] : rolesEn(slug)
  const seccionPorDefecto = esAdmin ? 'mesero' : rolesEquipo.includes('mesero') ? 'mesero' : rolesEquipo.includes('cocina') ? 'comandas' : 'domicilios'
  const seccion = panel || seccionPorDefecto // mesero | comandas | catalogo | difundir | config | metricas
  const puedeVerSeccion = esAdmin
    || (seccion === 'mesero' && rolesEquipo.includes('mesero'))
    || (seccion === 'comandas' && rolesEquipo.includes('cocina'))
    || (seccion === 'domicilios' && rolesEquipo.includes('domiciliario'))
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

  // 🖥️ La barra lateral del panel (PC) despliega estas categorías bajo
  // "Catálogo". Se publican EN VIVO para que crear, vaciar o reordenar una
  // categoría se vea al instante allá también. El menú externo no tiene categorías.
  useEffect(() => {
    if (estado !== 'ok' || !local || local.menuExterno) { setPanelCatalogo(null); return }
    const cuenta = {}
    for (const p of productos) cuenta[p.categoria] = (cuenta[p.categoria] || 0) + 1
    setPanelCatalogo({
      slug,
      categorias: (local.categorias || []).map(c => ({ id: c.id, nombre: c.nombre, emoji: c.emoji, count: cuenta[c.id] || 0 })),
    })
  }, [estado, local, productos, slug, setPanelCatalogo])
  useEffect(() => () => setPanelCatalogo(null), [setPanelCatalogo])

  // La pestaña del navegador dice en qué página del panel estás.
  useEffect(() => {
    if (!local?.nombre) return
    const antes = document.title
    document.title = `${SECCIONES[seccion] || SECCIONES.catalogo} · ${local.nombre}`
    return () => { document.title = antes }
  }, [seccion, local?.nombre])

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

  // 😋 Mantiene al día el resumen "Para antojarte" del INICIO (local.destacadosHome):
  // los fuertes CON foto del menú, denormalizados en el doc del local para que el
  // buscador cueste 1 sola lectura. Solo escribe si el cálculo cambió (best-effort).
  async function sincronizarDestacadosHome(prods) {
    try {
      const resumen = computeDestacadosHome(prods)
      if (JSON.stringify(resumen) === JSON.stringify(local?.destacadosHome || [])) return
      await updateLocal({ destacadosHome: resumen })
    } catch (err) { console.warn('destacadosHome no sincronizado:', err?.code || err) }
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
    await sincronizarDestacadosHome(nuevos)
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
    await sincronizarDestacadosHome(nuevos)
    // Si cambió de categoría, alguna pudo quedar vacía → que desaparezca.
    if ('categoria' in cambios) await podarCategoriasVacias(nuevos)
  }
  async function deleteProducto(id) {
    const nuevos = productos.filter(x => x.id !== id)
    setProductos(nuevos)
    if (!demo) await borrarProducto(local.id, id)
    await sincronizarDestacadosHome(nuevos)
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
  // 📸 Menú EXTERNO: la foto de un plato/opción que Appetic no guarda como producto.
  // Va a Storage y su URL a `local.fotosExternas[clave]`; el traductor la pega al
  // armar el menú. Con `null` se quita.
  async function subirFotoExternaYGuardar(clave, file) {
    const url = demo ? URL.createObjectURL(file) : await subirFotoExterna(local.id, clave, file)
    if (!demo) await guardarFotoExterna(local.id, clave, url)
    setLocal(l => ({ ...l, fotosExternas: { ...(l.fotosExternas || {}), [clave]: url } }))
    return url
  }
  async function quitarFotoExterna(clave) {
    if (!demo) await guardarFotoExterna(local.id, clave, null)
    setLocal(l => {
      const { [clave]: _, ...resto } = l.fotosExternas || {}
      return { ...l, fotosExternas: resto }
    })
  }
  // 🖼️ Sube el banner del local y lo guarda en local.banner (se ve en el inicio + hero).
  async function subirBannerYGuardar(file) {
    if (demo) { const url = URL.createObjectURL(file); await updateLocal({ banner: url }); return url }
    const url = await subirBanner(local.id, file)
    await updateLocal({ banner: url })
    return url
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

  // «Catálogo» vive ahora dentro de Configuración: los links viejos (/admin/catalogo#cat-…) se mudan.
  if (seccion === 'catalogo') {
    return <Navigate to={`/${slug}/admin/config/catalogo${location.search}${location.hash}`} replace />
  }

  // Del equipo pero en una sección que no es la suya → a la suya.
  if (!esAdmin && rolesEquipo.length && !puedeVerSeccion) {
    return <Navigate to={`/${slug}/admin/${seccionPorDefecto}`} replace />
  }

  // Logueado pero no autorizado para ESTE local
  if (!puedeVerSeccion) {
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

  // El catálogo (se muestra en Configuración → Catálogo).
  const catalogo = local.menuExterno ? (
                // El menú vive en la app del negocio: aquí no hay productos que
                // editar, solo fotos que ponerles.
                <AdminFotosExternas local={local} onFoto={subirFotoExternaYGuardar} onQuitarFoto={quitarFotoExterna} />
              ) : (
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
              )

  // ---------- Panel ----------
  return (
    <div className="admin">
      <header className="admin-top">
        <div className="admin-top-izq">
          <PanelMenuBoton />
          <div>
            <span className="admin-top-eyebrow">{local.nombre} · Panel</span>
            <h1 className="admin-top-nombre">{SECCIONES[seccion] || SECCIONES.catalogo}</h1>
          </div>
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

      {/* Dueños y superadmin navegan con la barra del panel: cada sección es una página.
          Solo la vista previa DEMO (sin barra) conserva estas pestañas para moverse. */}
      {!tieneBarra && (
        <nav className="admin-tabs">
          <button className={seccion === 'mesero' ? 'on' : ''} onClick={() => navigate(`/${slug}/admin/mesero${location.search}`)}>🧑‍🍳 Mesero</button>
          <button className={seccion === 'comandas' ? 'on' : ''} onClick={() => navigate(`/${slug}/admin/comandas${location.search}`)}>🧾 Comandas</button>
          <button className={seccion === 'domicilios' ? 'on' : ''} onClick={() => navigate(`/${slug}/admin/domicilios${location.search}`)}>🛵 Domicilios</button>
          <button className={seccion === 'difundir' ? 'on' : ''} onClick={() => navigate(`/${slug}/admin/difundir`)}>📣 Difundir</button>
          <button className={seccion === 'config' ? 'on' : ''} onClick={() => navigate(`/${slug}/admin/config/catalogo${location.search}`)}>⚙️ Configuración</button>
          <button className={seccion === 'metricas' ? 'on' : ''} onClick={() => navigate(`/${slug}/admin/metricas`)}>📊 Métricas</button>
        </nav>
      )}

      <main className="admin-body">
        {/* key={local.id}: al cambiar de local desde la barra, Mesero y Comandas arrancan de cero
            (sin esto el pedido a medio armar de un local se pasaba al otro). */}
        {seccion === 'mesero' ? <AdminMesero key={local.id} local={local} productos={productos} demo={demo} usuario={usuario} esAdmin={esAdmin} />
          : seccion === 'comandas' ? <AdminComandas key={local.id} local={local} demo={demo} esAdmin={esAdmin} onUpdateLocal={updateLocal} />
          : seccion === 'domicilios' ? <AdminDomicilios key={local.id} local={local} demo={demo} usuario={usuario} esAdmin={esAdmin} />
          : seccion === 'difundir' ? <AdminDifundir local={local} slug={slug} onUpdate={updateLocal} />
          : seccion === 'config' ? (
            <AdminAjustes slug={slug} sub={sub}>
              {vista => vista === 'catalogo' ? catalogo
                : vista === 'equipo' ? (
                  <div className="aj-equipo">
                    <EquipoEnLinea local={local} rol="mesero" demo={demo} />
                    <EquipoEnLinea local={local} rol="cocina" demo={demo} />
                    <EquipoEnLinea local={local} rol="domiciliario" demo={demo} />
                  </div>
                )
                : <AdminConfig local={local} onUpdate={updateLocal} onSubirBanner={subirBannerYGuardar} vista={vista} />}
            </AdminAjustes>
          )
            : seccion === 'metricas' ? <AdminMetricas local={local} demo={demo} />
              : catalogo}
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
