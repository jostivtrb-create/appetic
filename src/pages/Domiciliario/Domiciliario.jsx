import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getDomiciliariosGlobal } from '../../services/domiciliarios'
import { escucharTodosDomicilios, buscarPedidoGlobalPorCodigo } from '../../services/pedidos'
import { puedeVerRepartos } from '../../config/roles'
import { cop } from '../../utils/money'
import { mapsUrl } from '../../utils/geo'
import { linkRespuestaCliente } from '../../utils/whatsapp'
import { normalizarCodigo } from '../../utils/codigoPedido'
import './Domiciliario.css'

function horaCorta(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : null)
    if (!d) return 'ahora'
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

// Tarjeta de un pedido a domicilio (cabecera + detalle expandible).
function PedidoCard({ pedido, abierto, onToggle }) {
  const c = pedido.cliente || {}
  const localMin = { nombre: pedido.localNombre || '' }
  const telLink = c.telefono ? `tel:${String(c.telefono).replace(/[^\d+]/g, '')}` : ''
  const waLink = linkRespuestaCliente(localMin, pedido)
  const mapa = c.coord?.lat != null ? mapsUrl(c.coord) : ''
  return (
    <li className={`do-card ${abierto ? 'open' : ''}`}>
      <button className="do-card-head" onClick={onToggle}>
        <span className="do-codigo">{pedido.codigo || '—'}</span>
        <span className="do-card-mid">
          <strong>{c.nombre || 'Cliente'}</strong>
          <small>
            {pedido.localIcono ? <img className="do-local-ico" src={pedido.localIcono} alt="" /> : '🏪 '}
            {pedido.localNombre || 'Local'} · {horaCorta(pedido.createdAt)}
          </small>
        </span>
        <span className="do-card-total">{cop(pedido.total || 0)}</span>
        <span className="do-card-chevron">{abierto ? '▲' : '▼'}</span>
      </button>

      {abierto && (
        <div className="do-detalle">
          <div className="do-row">
            <span className="do-ico">📍</span>
            <div>
              <div>{c.direccion || 'Sin dirección'}</div>
              {mapa && <a href={mapa} target="_blank" rel="noreferrer" className="do-link">Ver en el mapa →</a>}
              {pedido.domicilioAConvenir && <div className="do-warn">⚠️ Domicilio a convenir (no incluido en el total)</div>}
            </div>
          </div>

          <div className="do-acciones">
            {waLink && <a className="do-btn do-btn-wa" href={waLink} target="_blank" rel="noreferrer">💬 WhatsApp</a>}
            {telLink && <a className="do-btn do-btn-call" href={telLink}>📞 Llamar</a>}
          </div>

          <ul className="do-items">
            {(pedido.items || []).map((it, i) => (
              <li key={i}>
                <span className="do-item-cant">{it.cantidad}×</span>
                <span className="do-item-nombre">
                  {it.nombre}
                  {it.opciones ? <small> · {it.opciones}</small> : null}
                  {it.notas ? <em> “{it.notas}”</em> : null}
                </span>
                <span className="do-item-precio">{cop(it.precio || 0)}</span>
              </li>
            ))}
          </ul>

          <div className="do-totales">
            <div><span>Subtotal</span><span>{cop(pedido.subtotal || 0)}</span></div>
            <div><span>Domicilio</span><span>{pedido.domicilioAConvenir ? 'A convenir' : cop(pedido.domicilio || 0)}</span></div>
            <div className="do-total-final"><span>Total</span><span>{cop(pedido.total || 0)}</span></div>
          </div>

          <div className="do-pago">
            💳 {pedido.metodoPagoNombre || pedido.metodoPago || '—'}
            {pedido.efectivoCon > 0 && (
              <span> · paga con {cop(pedido.efectivoCon)} (cambio {cop(Math.max(0, pedido.efectivoCon - (pedido.total || 0)))})</span>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

export default function Domiciliario() {
  const navigate = useNavigate()
  const { user, cargando: authCargando, entrar, salir } = useAuth()

  const [lista, setLista] = useState(null)      // lista global de correos (null = cargando)
  const [pedidos, setPedidos] = useState([])
  const [cargandoPedidos, setCargandoPedidos] = useState(true)
  const [errPedidos, setErrPedidos] = useState(false)
  const [query, setQuery] = useState('')
  const [abiertoId, setAbiertoId] = useState(null)
  const [extra, setExtra] = useState(null)      // resultado de búsqueda global exacta
  const [sonido, setSonido] = useState(true)
  const [toast, setToast] = useState(null)      // { codigo, local }

  const permitido = user && lista && puedeVerRepartos(user.email, lista)

  // Notificación: contexto de audio (se activa con el primer toque del usuario) + refs de control.
  const audioRef = useRef(null)
  const vistosRef = useRef(new Set())
  const iniciadoRef = useRef(false)
  const sonidoRef = useRef(sonido)
  useEffect(() => { sonidoRef.current = sonido }, [sonido])

  useEffect(() => {
    // Desbloquea el audio en el primer gesto del usuario (política de autoplay).
    function primeAudio() {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (!audioRef.current && Ctx) audioRef.current = new Ctx()
        audioRef.current?.resume?.()
      } catch { /* nada */ }
    }
    window.addEventListener('pointerdown', primeAudio, { once: true })
    // Permiso de notificaciones del sistema (para cuando la pestaña está en 2º plano).
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
    return () => window.removeEventListener('pointerdown', primeAudio)
  }, [])

  function beep() {
    try {
      const ctx = audioRef.current
      if (!ctx) return
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'; o.frequency.value = 880
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
      o.start(); o.stop(ctx.currentTime + 0.42)
      // segundo tono (ding-dong)
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain()
      o2.connect(g2); g2.connect(ctx.destination)
      o2.type = 'sine'; o2.frequency.value = 1174
      g2.gain.setValueAtTime(0.0001, ctx.currentTime + 0.18)
      g2.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.2)
      g2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55)
      o2.start(); o2.stop(ctx.currentTime + 0.57)
    } catch { /* nada */ }
  }

  function avisarNuevo(nuevos) {
    const cod = nuevos[0]?.codigo || ''
    const loc = nuevos[0]?.localNombre || ''
    if (sonidoRef.current) beep()
    setToast({ codigo: cod, local: loc, n: nuevos.length })
    setTimeout(() => setToast(null), 6000)
    try {
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        const titulo = nuevos.length > 1 ? `${nuevos.length} nuevos domicilios` : `Nuevo domicilio ${cod}`
        new Notification(titulo, { body: loc ? `Local: ${loc}` : 'Appetic', tag: 'appetic-domi' })
      }
    } catch { /* nada */ }
  }

  // Cargar la lista global de domiciliarios (para el gate).
  useEffect(() => {
    let activo = true
    getDomiciliariosGlobal().then(l => { if (activo) setLista(l || []) }).catch(() => activo && setLista([]))
    return () => { activo = false }
  }, [])

  // Escuchar TODOS los domicilios en vivo (solo si tiene permiso).
  useEffect(() => {
    if (!permitido) return
    setCargandoPedidos(true)
    const unsub = escucharTodosDomicilios(
      arr => {
        // Detectar pedidos nuevos (después de la primera carga) para avisar.
        const nuevos = arr.filter(p => !vistosRef.current.has(p.id))
        arr.forEach(p => vistosRef.current.add(p.id))
        if (iniciadoRef.current && nuevos.length > 0) avisarNuevo(nuevos)
        iniciadoRef.current = true
        setPedidos(arr); setCargandoPedidos(false); setErrPedidos(false)
      },
      () => { setErrPedidos(true); setCargandoPedidos(false) },
    )
    return () => { if (unsub) unsub() }
  }, [permitido])

  const filtrados = useMemo(() => {
    const q = normalizarCodigo(query).replace(/[^A-Z0-9]/g, '')
    if (!q && !query.trim()) return pedidos
    const qLower = query.trim().toLowerCase()
    return pedidos.filter(p =>
      (p.codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '').includes(q) ||
      (p.cliente?.nombre || '').toLowerCase().includes(qLower) ||
      (p.localNombre || '').toLowerCase().includes(qLower) ||
      (p.cliente?.direccion || '').toLowerCase().includes(qLower),
    )
  }, [pedidos, query])

  async function buscarEnTodos() {
    const cod = normalizarCodigo(query)
    if (!cod) return
    try { setExtra(await buscarPedidoGlobalPorCodigo(cod)) } catch { setExtra([]) }
  }

  async function cerrarSesion() { await salir(); navigate('/') }

  // ---------- Gates ----------
  if (authCargando || lista === null) {
    return <div className="local-loading"><div className="local-spinner" /><p>Cargando…</p></div>
  }
  if (!user) {
    return (
      <div className="local-msg">
        <div className="local-msg-emoji">🛵</div>
        <h2>Panel del domiciliario</h2>
        <p>Inicia sesión con tu Google para ver los pedidos a domicilio.</p>
        <button className="btn btn-primary" onClick={entrar}>Entrar con Google</button>
      </div>
    )
  }
  if (!permitido) {
    return (
      <div className="local-msg">
        <div className="local-msg-emoji">🚫</div>
        <h2>Sin acceso</h2>
        <p><strong>{user.email}</strong> no está en la lista de domiciliarios de Appetic.</p>
        <p className="do-hint">Pídele al administrador que te agregue desde el panel de superadmin.</p>
        <button className="btn btn-ghost" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    )
  }

  // ---------- Panel ----------
  const hayBusqueda = query.trim().length > 0
  const mostrarExtra = hayBusqueda && filtrados.length === 0 && extra && extra.length > 0

  return (
    <div className="do">
      {toast && (
        <div className="do-toast" onClick={() => setToast(null)}>
          🔔 {toast.n > 1 ? `${toast.n} nuevos domicilios` : `Nuevo domicilio ${toast.codigo}`}
          {toast.local ? ` · ${toast.local}` : ''}
        </div>
      )}

      <header className="do-top">
        <div>
          <span className="do-eyebrow">🛵 Domiciliarios</span>
          <h1>Pedidos a domicilio</h1>
        </div>
        <div className="do-top-actions">
          <button
            className={`do-sonido ${sonido ? 'on' : ''}`}
            onClick={() => setSonido(s => !s)}
            aria-label="Sonido de aviso"
            title="Aviso sonoro de nuevos pedidos"
          >{sonido ? '🔔' : '🔕'}</button>
          <button className="do-salir" onClick={cerrarSesion}>Salir</button>
        </div>
      </header>

      <div className="do-search">
        <span>🔎</span>
        <input
          placeholder="Buscar por código (ej. FT-7K2Q), cliente o local…"
          value={query}
          onChange={e => { setQuery(e.target.value); setExtra(null) }}
          autoCapitalize="characters"
        />
        {query && <button className="do-search-x" onClick={() => { setQuery(''); setExtra(null) }} aria-label="Limpiar">✕</button>}
      </div>

      <p className="do-tip">🔒 El precio de esta pantalla es el REAL del pedido. Si el WhatsApp muestra otro, vale este.</p>

      {errPedidos && (
        <div className="do-error">⚠️ No se pudieron cargar los pedidos. Es probable que falten desplegar las reglas de Firestore.</div>
      )}

      {cargandoPedidos && !errPedidos && (
        <div className="do-skel-wrap">{[0, 1, 2].map(i => <div key={i} className="do-skel" />)}</div>
      )}

      {!cargandoPedidos && !errPedidos && (
        <>
          <div className="do-count">
            {hayBusqueda ? `${filtrados.length} resultado(s)` : `${pedidos.length} domicilio(s) · últimos 2 días`}
          </div>

          {filtrados.length === 0 && !mostrarExtra && (
            <div className="do-empty">
              <span>🛵</span>
              <p>{hayBusqueda ? 'Ningún domicilio reciente con ese código.' : 'Aún no hay pedidos a domicilio.'}</p>
              {hayBusqueda && <button className="btn btn-ghost do-buscar-todos" onClick={buscarEnTodos}>Buscar también en pedidos antiguos</button>}
              {hayBusqueda && extra && extra.length === 0 && <p className="do-hint">Tampoco apareció en los antiguos.</p>}
            </div>
          )}

          <ul className="do-lista">
            {(mostrarExtra ? extra : filtrados).map(p => (
              <PedidoCard
                key={p.id}
                pedido={p}
                abierto={abiertoId === p.id}
                onToggle={() => setAbiertoId(abiertoId === p.id ? null : p.id)}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
