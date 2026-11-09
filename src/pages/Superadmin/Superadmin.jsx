import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { esSuperadmin } from '../../config/roles'
import { listarTodosLocales, listarPagos, setAdminEmails, setEtiquetas, setPrioridad } from '../../services/superadmin'
import { ChipPago, PlanLocal, TableroCobros } from './PlanSuper'
import { apareceEnBuscador, estadoPago } from '../../utils/plan'
import { PanelHero, PanelCuerpo, PanelLado, useEntrar } from '../Admin/PanelPagina'
import { CATEGORIAS_LOCALES } from '../../config/categoriasLocales'
import PanelMenuBoton from '../../components/BottomNav/PanelMenuBoton'
import { devSuper } from '../../components/BottomNav/PanelRail'
import DemoTarjeta from './DemoTarjeta'
import Solicitudes from './Solicitudes'
import Barberias from './Barberias'
import '../Admin/EditorProducto.css'
import './Superadmin.css'

// 🗂️ Editor de ETIQUETAS (chips del inicio) + ⭐ prioridad de un local.
// Etiquetas: toggle sobre el catálogo curado, guarda al tocar (optimista).
// Prioridad: el boost sutil del inicio (badge "Recomendado"); normalmente solo
// el local bandera la tiene (10). Se edita aquí para no tocar código.
function EtiquetasEditor({ local, onChange, abiertoInicial = false }) {
  const [abierto, setAbierto] = useState(abiertoInicial)
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
  // 🧪 DEV: /superadmin?super=1 lo muestra con locales de muestra y pagos inventados, sin iniciar
  // sesión (para revisar la pantalla; guardar falla porque no hay sesión). No existe en producción.
  const simulado = devSuper()
  const superadmin = simulado || esSuperadmin(user?.email)
  const { hash } = useLocation()

  // El router no baja solo a un ancla (#…): lo hacemos aquí (y arriba del todo sin ancla).
  // (Los domiciliarios globales se retiraron el 29-oct-2026: ahora cada local tiene los suyos.)
  // Diseño nuevo (guía «Diseño de pantallas del panel», 8-nov): una parte a la vez, elegida en la
  // lista de la izquierda (en el celular, lista que entra al detalle). El #… del link elige la parte.
  const navegar = useEntrar()
  const [parte, setParte] = useState(() => ({ '#barberias': 'barberias', '#solicitudes': 'solicitudes', '#cobros': 'cobros', '#demo': 'demo' }[window.location.hash] || 'locales'))
  const elegir = id => { setParte(id); navegar.abrir() }
  useEffect(() => {
    if (!superadmin) return
    const p = { '#barberias': 'barberias', '#solicitudes': 'solicitudes', '#cobros': 'cobros', '#demo': 'demo' }[hash]
    if (p) setParte(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [hash, superadmin])

  // 💈 Al tocar «Crear su barbería» en una solicitud de BarberIA, el formulario llega lleno.
  const [nuevaBarberia, setNuevaBarberia] = useState(null)
  const [estado, setEstado] = useState('cargando') // cargando | ok | error
  const [locales, setLocales] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [adminEdits, setAdminEdits] = useState({}) // localId -> [correo1, correo2] en edición
  const [adminMsg, setAdminMsg] = useState({})     // localId -> 'guardando' | 'ok' | 'err' | 'dup'
  // El local abierto en el panel lateral y su pestaña (diseño nuevo, 8-nov).
  const [abierto, setAbierto] = useState(null)
  const [pestana, setPestana] = useState('duenos')
  useEffect(() => { setPestana('duenos') }, [abierto])

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
    ;(simulado ? import('./superSimulado').then(m => m.localesSimulados()) : listarTodosLocales())
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

  // 🔎 El buscador ya no se prende aquí: lo decide el dueño en su Configuración y solo sale si está al
  // día (guía «Planes en la app» D6, D7). Aquí se maneja el plan y el pago de cada local.
  const enBuscador = useMemo(() => locales.filter(l => apareceEnBuscador(l)).length, [locales])

  // 💳 Historial de pagos de todos los locales (para el tablero y cada local).
  const [pagos, setPagos] = useState([])
  const cargarPagos = useCallback(() => {
    ;(simulado ? import('./superSimulado').then(m => m.pagosSimulados()) : listarPagos()).then(setPagos).catch(() => setPagos([]))
  }, [simulado])
  useEffect(() => { if (superadmin) cargarPagos() }, [superadmin, cargarPagos])
  const cambiarSuscripcion = (id, suscripcion) => setLocales(ls => ls.map(l => l.id === id ? { ...l, suscripcion } : l))

  if (cargando && !simulado) {
    return <div className="local-loading"><div className="local-spinner" /><p>Cargando…</p></div>
  }

  if (!user && !simulado) {
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

  const pagando = locales.filter(l => !l.esDemo && ['al-dia', 'por-vencer', 'gracia'].includes(estadoPago(l).estado))
  const PARTES = [
    { id: 'locales', icono: '🏪', nombre: 'Locales', nota: 'Dueños, planes y etiquetas', n: locales.length },
    { id: 'cobros', icono: '💳', nombre: 'Cobros', nota: 'Quién paga y quién vence' },
    { id: 'solicitudes', icono: '📋', nombre: 'Cotizaciones', nota: 'Las que llegan de la propuesta' },
    ...(!simulado ? [{ id: 'barberias', icono: '💈', nombre: 'BarberIA', nota: 'Las barberías de la plataforma' }] : []),
    { id: 'demo', icono: '🍔', nombre: 'Demo para clientes', nota: 'Visitas y reiniciar' },
  ]
  const actual = PARTES.find(x => x.id === parte) || PARTES[0]
  const localAbierto = locales.find(x => x.id === abierto)

  return (
    <div className={`sa sa2${navegar.abierto ? ' pp-dentro' : ''}`}>
      <div className="sa2-menu"><PanelMenuBoton /></div>
      <PanelHero miga="👑 Superadmin" icono="🏪" titulo="Locales y planes" sub="Todos los locales de Appetic, sus dueños, sus planes y lo que entra" chips={[
        { t: `🏪 ${locales.length} locales` },
        { t: `🔎 ${enBuscador} en el buscador` },
        { t: `💳 ${pagando.length} pagando`, tono: pagando.length ? 'ok' : null },
      ]} derecha={
        <a className="sa2-propuesta" href="https://switflysolutions.com/#proyectos" target="_blank" rel="noopener noreferrer">
          <span aria-hidden="true">📄</span><b>Propuesta de Appetic</b><small>En la web de Swiftfly ↗</small>
        </a>
      } />

      <PanelCuerpo entrar={navegar} titulo={actual.nombre} lado={
        <PanelLado icono="👑" titulo="Superadmin" sel={actual.id} onSel={elegir} grupos={[{ items: PARTES }]} />
      }>
      {actual.id === 'demo' && <DemoTarjeta />}

      {/* 📋 Cotizaciones que llegan de la propuesta web (switflysolutions.com/appetic → /api/solicitud) */}
      {actual.id === 'solicitudes' && <Solicitudes simulado={simulado} onCrearBarberia={(s) => {
        setNuevaBarberia({ nombre: s.local, whatsapp: s.celular, solicitudId: s.id, numero: s.numero, barberos: Number(s.desglose?.barberos || s.barberos) || 1, sedes: Number(s.desglose?.sedes || (s.sedes === '3+' ? 3 : s.sedes)) || 1 })
        setParte('barberias')
      }} />}

      {/* 💈 BarberIA: las barberías viven en su propio Firebase; aquí se manejan por su API. */}
      {actual.id === 'barberias' && !simulado && <Barberias prefill={nuevaBarberia} />}

      {actual.id === 'cobros' && estado === 'ok' && <TableroCobros locales={locales.filter(l => !l.esDemo)} pagos={pagos} />}

      {actual.id === 'locales' && <>
      <div className="sa-search">
        <span>🔎</span>
        <input placeholder="Buscar local…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {estado === 'cargando' && <div className="sa-skel-wrap">{[0,1,2].map(i => <div key={i} className="sa-skel" />)}</div>}
      {estado === 'error' && <div className="home-empty"><span className="home-empty-emoji">📡</span><p>No se pudieron cargar los locales.</p></div>}

      {estado === 'ok' && (
        <ul className="sa2-locales">
          {filtrados.map(l => {
            const n = normalizar(l.admins || []).length
            return (
              <li key={l.id}>
                <button type="button" className="sa2-local" onClick={() => setAbierto(l.id)}>
                  <span className="sa2-local-logo">{(l.icono || l.logo) ? <img src={l.icono || l.logo} alt="" /> : '🍽️'}</span>
                  <span className="sa2-local-txt">
                    <b>{l.nombre}</b>
                    <small>/{l.slug}</small>
                    <ChipPago local={l} />
                  </span>
                  <span className={`sa2-local-duenos${n ? '' : ' falta'}`}>{n ? `👤 ${n}` : '⚠️ Sin dueño'}</span>
                  <span className="sa2-local-flecha" aria-hidden="true">›</span>
                </button>
              </li>
            )
          })}
          {filtrados.length === 0 && <li className="sa-vacio">Sin resultados.</li>}
        </ul>
      )}

      {/* El detalle de un local, en un panel lateral con pestañas (como el editor del Catálogo). */}
      {localAbierto && (() => {
        const l = localAbierto
        const adminsActuales = normalizar(l.admins || [])
        const valoresAdmin = adminEdits[l.id] ?? casillas(l.admins)
        const cambiado = normalizar(valoresAdmin).join('|') !== adminsActuales.join('|')
        const msg = adminMsg[l.id]
        return createPortal(
          <div className="ed-fondo" onClick={() => setAbierto(null)}>
            <aside className="ed sa2-panel" role="dialog" aria-modal="true" aria-label={l.nombre} onClick={e => e.stopPropagation()}>
              <header className="ed-cab">
                <div className="ed-cab-foto" aria-hidden="true">{(l.icono || l.logo) ? <img src={l.icono || l.logo} alt="" /> : '🍽️'}</div>
                <div className="ed-cab-txt"><small>/{l.slug}</small><h2>{l.nombre}</h2></div>
                <button type="button" className="ed-x" onClick={() => setAbierto(null)} aria-label="Cerrar">✕</button>
              </header>
              <nav className="ed-tabs" role="tablist" aria-label="Partes del local">
                {[['duenos', '👤', 'Dueños'], ...(!l.esDemo ? [['plan', '💳', 'Plan y pagos']] : []), ['etiquetas', '🗂️', 'Etiquetas']].map(([id, ic, t]) => (
                  <button type="button" key={id} role="tab" aria-selected={pestana === id} className={pestana === id ? 'on' : ''} onClick={() => setPestana(id)}><span aria-hidden="true">{ic}</span>{t}</button>
                ))}
              </nav>
              <div className="ed-cuerpo">
                <section className="ed-sec"><ChipPago local={l} /></section>
                {pestana === 'duenos' && <section className="ed-sec">
                  <h3>Quién entra al panel de {l.nombre}</h3>
                  <p className="ed-ayuda">Hasta dos correos de Google: el dueño y, si quiere, su socio o encargado. Los dos mandan igual.</p>
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

</section>}
                {/* 💳 Plan, pagos e historial */}
                {pestana === 'plan' && !l.esDemo && (
                  <PlanLocal local={l} pagos={pagos.filter(x => x.localId === l.id)}
                    onCambio={sus => cambiarSuscripcion(l.id, sus)} onPago={cargarPagos} abiertoInicial />
                )}

                {/* 🗂️ Etiquetas del inicio + ⭐ prioridad */}
                {pestana === 'etiquetas' && <EtiquetasEditor abiertoInicial
                  local={l}
                  onChange={cambios => setLocales(ls => ls.map(x => x.id === l.id ? { ...x, ...cambios } : x))}
                />}
              </div>
              <footer className="ed-pie">
                <div className="ed-pie-izq" />
                <Link to={`/${l.slug}`} className="ed-btn">👀 Ver local</Link>
                <Link to={`/${l.slug}/admin`} className="ed-btn primario">✏️ Editar menú</Link>
              </footer>
            </aside>
          </div>, document.body)
      })()}
      </>}
      </PanelCuerpo>
    </div>
  )
}
