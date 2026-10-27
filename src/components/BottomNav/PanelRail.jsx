import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdmin } from '../../contexts/AdminContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNavUI } from '../../contexts/NavUIContext'
import { listarTodosLocales } from '../../services/superadmin'
import logoAppetic from '../../assets/appetic-logo.png'
import './PanelRail.css'

// 🖥️ Barra lateral del PANEL (solo escritorio). Reemplaza en PC a la barra de
// administración del dueño y le da al superadmin la que nunca tuvo (antes se
// movía con pestañas arriba). Muestra SOLO lo que el usuario puede abrir:
//   • Selector de local: los suyos (dueño) o todos (superadmin).
//   • "Este local": Ver menú · Catálogo (con sus categorías desplegables) ·
//     Difundir · Configuración · Métricas.
//   • "Superadmin" (solo superadmin): Locales y planes · Domiciliarios · Repartos.
//   • Al pie: Cuenta y el buscador de Appetic.
// Los grupos son desplegables y recuerdan si los dejaste abiertos o cerrados.
// Reusa las clases .bnav/.bnav-item para heredar el rail de desktop.css (ancho,
// colores del local, el velo cuando hay una ventana abierta).

const GRUPOS_KEY = 'appetic_rail_grupos'
const SUPER_SLUG_KEY = 'appetic_super_slug'

// Una sola lectura de "todos los locales" por sesión, la compartan los montajes que sea.
let todosPromise = null
function cargarTodos() {
  if (!todosPromise) {
    todosPromise = listarTodosLocales().catch(() => { todosPromise = null; return [] })
  }
  return todosPromise
}

const SECCIONES = [
  { id: 'menu', label: 'Ver menú', Icon: IconMenu, ruta: s => `/${s}` },
  { id: 'catalogo', label: 'Catálogo', Icon: IconCatalogo, ruta: s => `/${s}/admin/catalogo` },
  { id: 'difundir', label: 'Difundir', Icon: IconDifundir, ruta: s => `/${s}/admin/difundir` },
  { id: 'config', label: 'Configuración', Icon: IconConfig, ruta: s => `/${s}/admin/config` },
  { id: 'metricas', label: 'Métricas', Icon: IconMetricas, ruta: s => `/${s}/admin/metricas` },
]

export default function PanelRail({ esSuper, className = '', style }) {
  const { locales: misLocales, esDueno, slug: adminSlug, setSlug } = useAdmin()
  const { user } = useAuth()
  const { panelCatalogo } = useNavUI()
  const navigate = useNavigate()
  const { pathname, hash } = useLocation()

  const [todos, setTodos] = useState([])
  useEffect(() => {
    if (!esSuper) return
    let activo = true
    cargarTodos().then(ls => { if (activo) setTodos(ls) })
    return () => { activo = false }
  }, [esSuper])

  // Locales que puede elegir: los suyos + (si es superadmin) todos, sin repetir.
  const elegibles = useMemo(() => {
    const porSlug = new Map()
    for (const l of [...misLocales, ...(esSuper ? todos : [])]) if (l?.slug && !porSlug.has(l.slug)) porSlug.set(l.slug, l)
    return [...porSlug.values()].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
  }, [misLocales, todos, esSuper])

  // ¿Qué local está "en curso"? El de la URL si estás en su panel; si no, el
  // seleccionado del dueño o el último que abrió el superadmin.
  const mAdmin = pathname.match(/^\/([^/]+)\/admin(\/([^/]+))?/)
  const slugRuta = mAdmin?.[1] || null
  const seccionRuta = mAdmin ? (mAdmin[3] || 'catalogo') : null
  const [superSlug, setSuperSlug] = useState(() => { try { return localStorage.getItem(SUPER_SLUG_KEY) } catch { return null } })
  useEffect(() => {
    if (!slugRuta || !esSuper) return
    setSuperSlug(slugRuta)
    try { localStorage.setItem(SUPER_SLUG_KEY, slugRuta) } catch { /* nada */ }
  }, [slugRuta, esSuper])

  const slugActual = slugRuta || (esDueno ? adminSlug : null) || (esSuper ? superSlug : null)
  const localActual = elegibles.find(l => l.slug === slugActual) || null

  // Categorías bajo "Catálogo": en vivo desde el panel abierto; si no estás en
  // él, las que trae el local (sin conteo).
  const categorias = (panelCatalogo?.slug === slugActual ? panelCatalogo.categorias : localActual?.categorias) || []
  const catActiva = seccionRuta === 'catalogo' && hash.startsWith('#cat-') ? decodeURIComponent(hash.slice(5)) : null

  const activa = seccionRuta
    || (slugActual && pathname === `/${slugActual}` ? 'menu' : '')
    || (pathname.startsWith('/superadmin') ? (hash === '#domiciliarios' ? 'sa-domis' : 'sa-locales') : '')
    || (pathname.startsWith('/domiciliario') ? 'sa-repartos' : '')
    || (pathname.startsWith('/cuenta') ? 'cuenta' : '')

  // ---- Grupos desplegables (recordados) ----
  const [abiertos, setAbiertos] = useState(() => {
    try { return { local: true, super: true, ...JSON.parse(localStorage.getItem(GRUPOS_KEY) || '{}') } } catch { return { local: true, super: true } }
  })
  function alternar(id) {
    setAbiertos(a => {
      const n = { ...a, [id]: !a[id] }
      try { localStorage.setItem(GRUPOS_KEY, JSON.stringify(n)) } catch { /* nada */ }
      return n
    })
  }
  // El grupo de la pantalla en la que estás siempre se ve abierto.
  const grupoActivo = activa.startsWith('sa-') ? 'super' : SECCIONES.some(s => s.id === activa) ? 'local' : null
  const estaAbierto = id => abiertos[id] || grupoActivo === id
  // Las categorías arrancan abiertas estando en Catálogo, pero se pueden plegar.
  const catsAbiertas = abiertos.cats ?? (activa === 'catalogo')

  function alternarCats() {
    setAbiertos(a => {
      const n = { ...a, cats: !catsAbiertas }
      try { localStorage.setItem(GRUPOS_KEY, JSON.stringify(n)) } catch { /* nada */ }
      return n
    })
  }

  function elegirLocal(l) {
    if (misLocales.some(m => m.slug === l.slug)) setSlug(l.slug)
    if (esSuper) {
      setSuperSlug(l.slug)
      try { localStorage.setItem(SUPER_SLUG_KEY, l.slug) } catch { /* nada */ }
    }
    // Te quedas en la misma sección, pero del otro local.
    const sec = SECCIONES.find(s => s.id === activa) || SECCIONES[1]
    navigate(sec.ruta(l.slug))
  }

  const brandLogo = localActual?.logo || localActual?.icono || logoAppetic

  return (
    <nav className={`bnav bnav--admin bnav--panel ${className}`} style={style} aria-label="Panel">
      <button className="bnav-brand" onClick={() => navigate(esSuper ? '/superadmin' : (slugActual ? `/${slugActual}/admin/catalogo` : '/cuenta'))} tabIndex={-1} aria-hidden="true">
        <img className="bnav-brand-logo" src={logoAppetic} alt="" />
        <span className="bnav-brand-texto">
          <span className="bnav-brand-nombre">Appetic</span>
          <span className="bnav-brand-rol">{esSuper ? '👑 Superadmin' : 'Panel del local'}</span>
        </span>
      </button>

      {(elegibles.length > 1 || (esSuper && elegibles.length > 0) || !localActual) && (
        <SelectorLocal
          locales={elegibles}
          actual={localActual}
          slugActual={slugActual}
          logo={brandLogo}
          onElegir={elegirLocal}
        />
      )}

      <Grupo id="local" titulo={localActual ? localActual.nombre : 'Este local'} abierto={estaAbierto('local')} onAlternar={alternar}>
        {slugActual ? SECCIONES.map(({ id, label, Icon, ruta }) => (id === 'catalogo' && categorias.length > 0) ? (
          <div key={id} className={`prail-sub ${catsAbiertas ? 'is-open' : ''}`}>
            <div className="prail-sub-row">
              <button className={`bnav-item prail-item ${activa === id && !catActiva ? 'is-active' : ''}`} onClick={() => navigate(ruta(slugActual))}>
                <Icon /><span>{label}</span>
              </button>
              <button
                className="prail-sub-toggle"
                onClick={() => alternarCats()}
                aria-expanded={catsAbiertas}
                aria-label={catsAbiertas ? 'Ocultar categorías' : 'Ver categorías'}
                title={catsAbiertas ? 'Ocultar categorías' : 'Ver categorías'}
              >
                <IconChevron />
              </button>
            </div>
            <div className="prail-grupo-body">
              <ul className="prail-grupo-inner prail-cats">
                {categorias.map(c => (
                  <li key={c.id}>
                    <button
                      className={`prail-cat ${catActiva === c.id ? 'is-active' : ''}`}
                      onClick={() => navigate(`${ruta(slugActual)}#cat-${encodeURIComponent(c.id)}`)}
                    >
                      <span className="prail-cat-emoji" aria-hidden="true">{c.emoji || '•'}</span>
                      <span className="prail-cat-nombre">{c.nombre}</span>
                      {typeof c.count === 'number' && <span className="prail-cat-count">{c.count}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <button key={id} className={`bnav-item prail-item ${activa === id ? 'is-active' : ''}`} onClick={() => navigate(ruta(slugActual))}>
            <Icon /><span>{label}</span>
          </button>
        )) : <p className="prail-hint">Elige un local arriba para administrarlo.</p>}
      </Grupo>

      {esSuper && (
        <Grupo id="super" titulo="Superadmin" abierto={estaAbierto('super')} onAlternar={alternar}>
          <button className={`bnav-item prail-item ${activa === 'sa-locales' ? 'is-active' : ''}`} onClick={() => navigate('/superadmin')}>
            <IconTienda /><span>Locales y planes</span>
          </button>
          <button className={`bnav-item prail-item ${activa === 'sa-domis' ? 'is-active' : ''}`} onClick={() => navigate('/superadmin#domiciliarios')}>
            <IconEquipo /><span>Domiciliarios</span>
          </button>
          <button className={`bnav-item prail-item ${activa === 'sa-repartos' ? 'is-active' : ''}`} onClick={() => navigate('/domiciliario')}>
            <IconMoto /><span>Repartos</span>
          </button>
        </Grupo>
      )}

      <div className="prail-pie">
        <button className="bnav-item prail-item" onClick={() => navigate('/')}>
          <IconSearch /><span>Ir al buscador</span>
        </button>
        <button className={`bnav-item prail-item prail-cuenta ${activa === 'cuenta' ? 'is-active' : ''}`} onClick={() => navigate('/cuenta')}>
          {user?.photoURL
            ? <img className="prail-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            : <IconUser />}
          <span className="prail-cuenta-txt">
            <span>Cuenta</span>
            {user?.email && <small>{user.email}</small>}
          </span>
        </button>
      </div>
    </nav>
  )
}

// Grupo con cabecera que pliega/despliega su contenido.
function Grupo({ id, titulo, abierto, onAlternar, children }) {
  return (
    <div className={`prail-grupo ${abierto ? 'is-open' : ''}`}>
      <button className="prail-grupo-head" onClick={() => onAlternar(id)} aria-expanded={abierto}>
        <span className="prail-grupo-titulo">{titulo}</span>
        <IconChevron />
      </button>
      <div className="prail-grupo-body">
        <div className="prail-grupo-inner">{children}</div>
      </div>
    </div>
  )
}

// Desplegable para cambiar de local (con buscador si son muchos).
function SelectorLocal({ locales, actual, slugActual, logo, onElegir }) {
  const [abierto, setAbierto] = useState(false)
  const [q, setQ] = useState('')
  const caja = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const fuera = e => { if (caja.current && !caja.current.contains(e.target)) setAbierto(false) }
    const esc = e => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', esc) }
  }, [abierto])

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? locales.filter(l => l.nombre?.toLowerCase().includes(t) || l.slug?.includes(t)) : locales
  }, [locales, q])

  return (
    <div className={`prail-sel ${abierto ? 'is-open' : ''}`} ref={caja}>
      <button className="prail-sel-btn" onClick={() => setAbierto(a => !a)} aria-expanded={abierto} aria-haspopup="listbox">
        <img className="prail-sel-logo" src={logo} alt="" />
        <span className="prail-sel-txt">
          <small>Local</small>
          <strong>{actual?.nombre || slugActual || 'Elegir local…'}</strong>
        </span>
        <IconChevron />
      </button>
      {abierto && (
        <div className="prail-sel-pop" role="listbox">
          {locales.length > 6 && (
            <input className="prail-sel-q" autoFocus placeholder="Buscar local…" value={q} onChange={e => setQ(e.target.value)} />
          )}
          <ul>
            {filtrados.map(l => (
              <li key={l.slug}>
                <button
                  className={`prail-sel-op ${actual?.slug === l.slug ? 'is-active' : ''}`}
                  onClick={() => { setAbierto(false); setQ(''); onElegir(l) }}
                  role="option"
                  aria-selected={actual?.slug === l.slug}
                >
                  <img src={l.logo || l.icono || logoAppetic} alt="" />
                  <span>{l.nombre || l.slug}</span>
                </button>
              </li>
            ))}
            {!filtrados.length && <li className="prail-hint">{locales.length ? 'Sin resultados.' : 'Cargando locales…'}</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

// ---- Iconos (mismo trazo que los de BottomNav) ----
const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }
function IconChevron() {
  return <svg className="prail-chev" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path {...sw} d="m6 9 6 6 6-6" /></svg>
}
function IconMenu() {
  return <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path {...sw} d="M4 6h16" /><path {...sw} d="M4 12h16" /><path {...sw} d="M4 18h10" /></svg>
}
function IconCatalogo() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">
      <rect {...sw} x="4" y="4" width="7" height="7" rx="1.6" /><rect {...sw} x="13" y="4" width="7" height="7" rx="1.6" />
      <rect {...sw} x="4" y="13" width="7" height="7" rx="1.6" /><rect {...sw} x="13" y="13" width="7" height="7" rx="1.6" />
    </svg>
  )
}
function IconDifundir() {
  return <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path {...sw} d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1z" /><path {...sw} d="M17.5 8.5a5 5 0 0 1 0 7" /></svg>
}
function IconConfig() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">
      <path {...sw} d="M4 7h9" /><path {...sw} d="M18 7h2" /><circle {...sw} cx="15.5" cy="7" r="2.1" />
      <path {...sw} d="M4 17h4" /><path {...sw} d="M12.5 17h7.5" /><circle {...sw} cx="9.5" cy="17" r="2.1" />
    </svg>
  )
}
function IconMetricas() {
  return <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path {...sw} d="M4 20h16" /><path {...sw} d="M7 16v-5" /><path {...sw} d="M12 16V7" /><path {...sw} d="M17 16v-8" /></svg>
}
function IconTienda() {
  return <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path {...sw} d="M4 9 5.5 4h13L20 9" /><path {...sw} d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /><path {...sw} d="M5.5 12v8h13v-8" /><path {...sw} d="M10 20v-4h4v4" /></svg>
}
function IconEquipo() {
  return <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><circle {...sw} cx="9" cy="8.5" r="3" /><path {...sw} d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path {...sw} d="M15.5 6a3 3 0 0 1 0 5.6" /><path {...sw} d="M17.5 14.2A5.5 5.5 0 0 1 20.5 19" /></svg>
}
function IconMoto() {
  return <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><circle {...sw} cx="6" cy="17" r="3" /><circle {...sw} cx="18" cy="17" r="3" /><path {...sw} d="M9 17h5l2-6h-4" /><path {...sw} d="M14 6h2.5l1.5 5" /><path {...sw} d="M6 14l3-4h3" /></svg>
}
function IconSearch() {
  return <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="M16.5 16.5 21 21" /></svg>
}
function IconUser() {
  return <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><circle {...sw} cx="12" cy="8" r="3.4" /><path {...sw} d="M5 20a7 7 0 0 1 14 0" /></svg>
}
