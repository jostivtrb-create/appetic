import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { esSuperadmin } from '../../config/roles'
import { listarTodosLocales, setSuscripcion, setAdminEmail } from '../../services/superadmin'
import './Superadmin.css'

export default function Superadmin() {
  const { user, cargando, entrar } = useAuth()
  const superadmin = esSuperadmin(user?.email)

  const [estado, setEstado] = useState('cargando') // cargando | ok | error
  const [locales, setLocales] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [guardandoId, setGuardandoId] = useState(null)
  const [adminEdits, setAdminEdits] = useState({}) // localId -> correo en edición
  const [adminMsg, setAdminMsg] = useState({})     // localId -> 'guardando' | 'ok' | 'err'

  const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

  // Fuerza la DESCARGA del PDF (no solo abrirlo). Baja la copia same-origin
  // como blob y dispara el guardado con nombre. Si algo falla, abre la copia
  // de Firebase Hosting como respaldo.
  async function descargarPropuesta(e) {
    e.preventDefault()
    try {
      const res = await fetch('/propuesta-appetic.pdf', { cache: 'no-store' })
      const blob = await res.blob()
      if (!blob.type.includes('pdf')) throw new Error('no-pdf')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Propuesta-Appetic.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch {
      window.open('https://appetic-17477.web.app/propuesta-appetic.pdf', '_blank', 'noopener')
    }
  }

  async function guardarAdmin(local) {
    const actual = local.admins?.[0] || ''
    const correo = (adminEdits[local.id] ?? actual).trim().toLowerCase()
    if (!emailValido(correo)) {
      setAdminMsg(m => ({ ...m, [local.id]: 'err' }))
      return
    }
    setAdminMsg(m => ({ ...m, [local.id]: 'guardando' }))
    try {
      await setAdminEmail(local.id, correo)
      setLocales(ls => ls.map(l => l.id === local.id ? { ...l, admins: [correo] } : l))
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
        <Link to="/cuenta" className="cuenta-volver-chip">‹</Link>
        <div>
          <span className="sa-eyebrow">👑 Superadmin</span>
          <h1>Suscripciones</h1>
        </div>
      </header>

      <div className="sa-resumen">
        <strong>{activos}</strong> de <strong>{locales.length}</strong> locales activos en el buscador
      </div>

      <a
        className="sa-descarga"
        href="/propuesta-appetic.pdf"
        download="Propuesta-Appetic.pdf"
        onClick={descargarPropuesta}
      >
        <span className="sa-descarga-ico">⬇️</span>
        <span className="sa-descarga-txt">
          <strong>Descargar propuesta comercial</strong>
          <small>PDF · Suscripción $18.900/mes · 1er mes gratis</small>
        </span>
      </a>

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
            const adminActual = l.admins?.[0] || ''
            const valorAdmin = adminEdits[l.id] ?? adminActual
            const cambiado = valorAdmin.trim().toLowerCase() !== adminActual
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

                <div className="sa-admin">
                  <span className="sa-admin-ico">👤</span>
                  <input
                    className={`sa-admin-input ${msg === 'err' ? 'err' : ''}`}
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    placeholder="correo del dueño (Gmail)"
                    value={valorAdmin}
                    onChange={e => { setAdminEdits(m => ({ ...m, [l.id]: e.target.value })); setAdminMsg(m => ({ ...m, [l.id]: undefined })) }}
                  />
                  <button
                    className="sa-admin-save"
                    onClick={() => guardarAdmin(l)}
                    disabled={!cambiado || msg === 'guardando'}
                  >
                    {msg === 'guardando' ? '…' : msg === 'ok' ? '✓' : 'Guardar'}
                  </button>
                </div>
                {msg === 'err' && <p className="sa-admin-hint">Escribe un correo válido (ej. dueño@gmail.com).</p>}
                {msg === 'ok' && <p className="sa-admin-hint ok">Guardado. El dueño ya puede entrar a /{l.slug}/admin.</p>}
                {!adminActual && msg !== 'ok' && <p className="sa-admin-hint warn">Sin admin asignado.</p>}

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
