import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { esSuperadmin } from '../../config/roles'
import { listarTodosLocales, setSuscripcion, setAdminEmails, setEtiquetas, setPrioridad } from '../../services/superadmin'
import { CATEGORIAS_LOCALES } from '../../config/categoriasLocales'
import PanelMenuBoton from '../../components/BottomNav/PanelMenuBoton'
import DemoTarjeta from './DemoTarjeta'
import './Superadmin.css'

// 🗂️ Editor de ETIQUETAS (chips del inicio) + ⭐ prioridad de un local.
// Etiquetas: toggle sobre el catálogo curado, guarda al tocar (optimista).
// Prioridad: el boost sutil del inicio (badge "Recomendado"); normalmente solo
// el local bandera la tiene (10). Se edita aquí para no tocar código.
function EtiquetasEditor({ local, onChange }) {
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const etiquetas = local.etiquetas || []
  const prioridad = Number(local.prioridad) || 0

  async function toggle(id) {
    const next = etiquetas.includes(id) ? etiquetas.filter(x => x !== id) : [...etiquetas, id]
    setGuardando(true)
    onChange({ etiquetas: next }) // optimista
    try { await setEtiquetas(local.id, next) } catch { onChange({ etiquetas }) }
    setGuardando(false)
  }
  async function cambiarPrioridad(next) {
    const n = Math.max(0, next)
    setGuardando(true)
    onChange({ prioridad: n }) // optimista
    try { await setPrioridad(local.id, n) } catch { onChange({ prioridad } ) }
    setGuardando(false)
  }

  const nombres = etiquetas
    .map(id => CATEGORIAS_LOCALES.find(c => c.id === id))
    .filter(Boolean)

  return (
    <div className="sa-tags">
      <button className="sa-tags-head" onClick={() => setAbierto(a => !a)}>
        <span className="sa-admin-ico">🗂️</span>
        <span className="sa-tags-resumen">
          {nombres.length
            ? nombres.map(c => `${c.emoji} ${c.nombre}`).join(' · ')
            : 'Sin etiquetas (no sale en los chips del inicio)'}
          {prioridad > 0 && ` · ⭐ prioridad ${prioridad}`}
        </span>
        <span className="sa-tags-chevron">{abierto ? '▲' : '▼'}</span>
      </button>
      {abierto && (
        <div className="sa-tags-body">
          <div className="sa-tags-chips">
            {CATEGORIAS_LOCALES.map(c => (
              <button
                key={c.id}
                className={`sa-tag ${etiquetas.includes(c.id) ? 'on' : ''}`}
                onClick={() => toggle(c.id)}
                disabled={guardando}
              >{c.emoji} {c.nombre}</button>
            ))}
          </div>
          <label className="sa-prio">
            <span>⭐ Prioridad: sale de primeras en el inicio, SIN marca visible (0 = normal)</span>
            <div className="sa-prio-ctrl">
              <button onClick={() => cambiarPrioridad(prioridad - 5)} disabled={guardando || prioridad <= 0}>−</button>
              <strong>{prioridad}</strong>
              <button onClick={() => cambiarPrioridad(prioridad + 5)} disabled={guardando}>+</button>
            </div>
          </label>
        </div>
      )}
    </div>
  )
}

export default function Superadmin() {
  const { user, cargando, entrar } = useAuth()
  const superadmin = esSuperadmin(user?.email)
  const { hash } = useLocation()

  // El router no baja solo a un ancla (#…): lo hacemos aquí (y arriba del todo sin ancla).
  // (Los domiciliarios globales se retiraron el 29-oct-2026: ahora cada local tiene los suyos.)
  useEffect(() => {
    if (!superadmin) return
    const el = hash ? document.getElementById(hash.slice(1)) : null
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [hash, superadmin])

  const [estado, setEstado] = useState('cargando') // cargando | ok | error
  const [locales, setLocales] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [guardandoId, setGuardandoId] = useState(null)
  const [adminEdits, setAdminEdits] = useState({}) // localId -> [correo1, correo2] en edición
  const [adminMsg, setAdminMsg] = useState({})     // localId -> 'guardando' | 'ok' | 'err' | 'dup'

  const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

  // Un local admite HASTA DOS correos de admin (el dueño y su socio/encargado).
  // Siempre se pintan 2 casillas aunque el local tenga guardado 1 correo (o ninguno):
  // la 2ª va vacía y es opcional. Si un seed dejó MÁS de dos, se muestran todos en vez
  // de recortarlos en silencio (borrar un admin debe ser algo que se ve y se decide).
  const CUPOS_ADMIN = 2
  const casillas = (admins) =>
    Array.from({ length: Math.max(CUPOS_ADMIN, admins?.length || 0) }, (_, i) => admins?.[i] || '')
  // Normaliza lo escrito a la lista que se guardaría: minúsculas, sin vacíos ni repetidos.
  const normalizar = (valores) => [...new Set(
    valores.map(v => String(v || '').trim().toLowerCase()).filter(Boolean)
  )]

  // Guarda de una sola vez los correos de admin del local (1 ó 2). El 2º campo es
  // opcional: vacío = el local queda con un solo dueño. Se exige al menos uno válido
  // para no dejar el local sin nadie que pueda entrar a su panel.
  async function guardarAdmin(local) {
    const valores = adminEdits[local.id] ?? casillas(local.admins)
    const escritos = valores.map(v => String(v || '').trim().toLowerCase()).filter(Boolean)
    const correos = normalizar(valores)
    if (!correos.length || correos.some(c => !emailValido(c))) {
      setAdminMsg(m => ({ ...m, [local.id]: 'err' }))
      return
    }
    if (escritos.length !== correos.length) {
      setAdminMsg(m => ({ ...m, [local.id]: 'dup' }))
      return
    }
    setAdminMsg(m => ({ ...m, [local.id]: 'guardando' }))
    try {
      await setAdminEmails(local.id, correos)
      setLocales(ls => ls.map(l => l.id === local.id ? { ...l, admins: correos } : l))
      setAdminEdits(m => { const n = { ...m }; delete n[local.id]; return n })
      setAdminMsg(m => ({ ...m, [local.id]: 'ok' }))
      setTimeout(() => setAdminMsg(m => { const n = { ...m }; delete n[local.id]; return n }), 2200)
    } catch {
      setAdminMsg(m => ({ ...m, [local.id]: 'err' }))
    }
  }

  useEffect(() => {
    if (!superadmin) return
    let activo = true
    listarTodosLocales()
      .then(ls => { if (activo) { setLocales(ls); setEstado('ok') } })
      .catch(() => { if (activo) setEstado('error') })
    return () => { activo = false }
  }, [superadmin])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return locales
    return locales.filter(l =>
      l.nombre?.toLowerCase().includes(q) || l.slug?.toLowerCase().includes(q))
  }, [locales, busqueda])

  const activos = useMemo(() => locales.filter(l => l.suscripcion?.activa).length, [locales])

  async function alternar(local) {
    const nuevoValor = !local.suscripcion?.activa
    setGuardandoId(local.id)
    // Optimista
    setLocales(ls => ls.map(l => l.id === local.id
      ? { ...l, suscripcion: { ...(l.suscripcion || {}), activa: nuevoValor } }
      : l))
    try {
      await setSuscripcion(local.id, nuevoValor)
    } catch (err) {
      // Revertir si falla
      setLocales(ls => ls.map(l => l.id === local.id
        ? { ...l, suscripcion: { ...(l.suscripcion || {}), activa: !nuevoValor } }
        : l))
      alert('No se pudo guardar. Revisa que las reglas de Firestore estén desplegadas.')
    } finally {
      setGuardandoId(null)
    }
  }

  if (cargando) {
    return <div className="local-loading"><div className="local-spinner" /><p>Cargando…</p></div>
  }

  if (!user) {
    return (
      <div className="local-msg">
        <div className="local-msg-emoji">🔐</div>
        <h2>Panel de Appetic</h2>
        <p>Inicia sesión con el correo de superadmin.</p>
        <button className="btn btn-primary" onClick={entrar}>Entrar con Google</button>
      </div>
    )
  }

  if (!superadmin) {
    return (
      <div className="local-msg">
        <div className="local-msg-emoji">🚫</div>
        <h2>Sin acceso</h2>
        <p><strong>{user.email}</strong> no es superadmin de Appetic.</p>
        <Link to="/" className="btn btn-ghost">Ir al inicio</Link>
      </div>
    )
  }

  return (
    <div className="sa">
      <header className="sa-top">
        {/* En el celular el ☰ abre el cajón del panel (Cuenta incluida). En PC no
            se pinta: la barra ya está al lado. */}
        <PanelMenuBoton />
        <div>
          <span className="sa-eyebrow">👑 Superadmin</span>
          <h1>Suscripciones</h1>
        </div>
      </header>

      <div className="sa-resumen">
        <strong>{activos}</strong> de <strong>{locales.length}</strong> locales activos en el buscador
      </div>

      {/* La propuesta comercial ya no vive aquí: desde el 27-oct-2026 las propuestas
          de todos los productos se publican en la web de Swiftfly (decisión P9). */}
      <a
        className="sa-descarga"
        href="https://switflysolutions.com/#proyectos"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="sa-descarga-ico">📄</span>
        <span className="sa-descarga-txt">
          <strong>Propuesta de Appetic</strong>
          <small>Está en la web de Swiftfly Solutions, en la sección de proyectos.</small>
        </span>
      </a>

      <DemoTarjeta />

      <div className="sa-search">
        <span>🔎</span>
        <input placeholder="Buscar local…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {estado === 'cargando' && <div className="sa-skel-wrap">{[0,1,2].map(i => <div key={i} className="sa-skel" />)}</div>}
      {estado === 'error' && <div className="home-empty"><span className="home-empty-emoji">📡</span><p>No se pudieron cargar los locales.</p></div>}

      {estado === 'ok' && (
        <ul className="sa-lista">
          {filtrados.map(l => {
            const activa = !!l.suscripcion?.activa
            const adminsActuales = normalizar(l.admins || [])
            const valoresAdmin = adminEdits[l.id] ?? casillas(l.admins)
            const cambiado = normalizar(valoresAdmin).join('|') !== adminsActuales.join('|')
            const msg = adminMsg[l.id]
            return (
              <li key={l.id} className="sa-item">
                <div className="sa-item-main">
                  <div className="sa-item-logo">
                    {(l.icono || l.logo) ? <img src={l.icono || l.logo} alt="" /> : <span>🍽️</span>}
                  </div>
                  <div className="sa-item-info">
                    <strong>{l.nombre}</strong>
                    <span>/{l.slug}</span>
                  </div>
                  <button
                    className={`sa-toggle ${activa ? 'on' : ''}`}
                    onClick={() => alternar(l)}
                    disabled={guardandoId === l.id}
                    aria-label={activa ? 'Desactivar' : 'Activar'}
                  >
                    <span className="sa-toggle-knob" />
                  </button>
                </div>

                {/* 👤 Hasta DOS correos de admin: el dueño y (opcional) su socio o
                    encargado. Los dos mandan igual. Se guardan juntos con un botón. */}
                <div className="sa-admins">
                  {valoresAdmin.map((valor, i) => (
                    <div className="sa-admin" key={i}>
                      <span className="sa-admin-ico">{i === 0 ? '👤' : '👥'}</span>
                      <input
                        className={`sa-admin-input ${msg === 'err' || msg === 'dup' ? 'err' : ''}`}
                        type="email"
                        inputMode="email"
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck="false"
                        placeholder={i === 0 ? 'correo del dueño (Gmail)' : 'segundo correo (opcional)'}
                        value={valor}
                        onChange={e => {
                          const txt = e.target.value
                          setAdminEdits(m => {
                            const base = m[l.id] ?? casillas(l.admins)
                            return { ...m, [l.id]: base.map((v, j) => j === i ? txt : v) }
                          })
                          setAdminMsg(m => ({ ...m, [l.id]: undefined }))
                        }}
                      />
                      {i === 0 && (
                        <button
                          className="sa-admin-save"
                          onClick={() => guardarAdmin(l)}
                          disabled={!cambiado || msg === 'guardando'}
                        >
                          {msg === 'guardando' ? '…' : msg === 'ok' ? '✓' : 'Guardar'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {msg === 'err' && <p className="sa-admin-hint">Escribe al menos un correo válido (ej. dueño@gmail.com). El segundo puede quedar vacío.</p>}
                {msg === 'dup' && <p className="sa-admin-hint">Los dos correos son el mismo. Cambia uno o deja el segundo vacío.</p>}
                {msg === 'ok' && (
                  <p className="sa-admin-hint ok">
                    Guardado. {adminsActuales.length > 1 ? 'Los dos ya pueden' : 'El dueño ya puede'} entrar a /{l.slug}/admin.
                  </p>
                )}
                {!adminsActuales.length && msg !== 'ok' && <p className="sa-admin-hint warn">Sin admin asignado.</p>}

                {/* 🗂️ Etiquetas del inicio + ⭐ prioridad */}
                <EtiquetasEditor
                  local={l}
                  onChange={cambios => setLocales(ls => ls.map(x => x.id === l.id ? { ...x, ...cambios } : x))}
                />

                {/* Atajos: el superadmin administra cualquier local como si fuera el dueño
                    (roles.js → puedeAdministrarLocal + firestore.rules → puedeAdministrar). */}
                <div className="sa-acciones">
                  <Link to={`/${l.slug}/admin`} className="sa-accion sa-accion--editar">✏️ Editar menú</Link>
                  <Link to={`/${l.slug}`} className="sa-accion">👀 Ver local</Link>
                </div>
              </li>
            )
          })}
          {filtrados.length === 0 && <li className="sa-vacio">Sin resultados.</li>}
        </ul>
      )}
    </div>
  )
}
