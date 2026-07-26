import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getLocalBySlug } from '../../services/locales'
import { escucharPedidosDomicilio, buscarPedidoPorCodigo } from '../../services/pedidos'
import { puedeVerRepartos } from '../../config/roles'
import { cop } from '../../utils/money'
import { mapsUrl } from '../../utils/geo'
import { linkRespuestaCliente } from '../../utils/whatsapp'
import { normalizarCodigo } from '../../utils/codigoPedido'
import './Domiciliario.css'

// Hora corta legible del timestamp de Firestore (o null mientras el server lo resuelve).
function horaCorta(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : null)
    if (!d) return '—'
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

// Tarjeta de un pedido: cabecera siempre visible + detalle expandible.
function PedidoCard({ local, pedido, abierto, onToggle }) {
  const c = pedido.cliente || {}
  const telLink = c.telefono ? `tel:${String(c.telefono).replace(/[^\d+]/g, '')}` : ''
  const waLink = linkRespuestaCliente(local, pedido)
  const mapa = c.coord?.lat != null ? mapsUrl(c.coord) : ''
  return (
    <li className={`do-card ${abierto ? 'open' : ''}`}>
      <button className="do-card-head" onClick={onToggle}>
        <span className="do-codigo">{pedido.codigo || '—'}</span>
        <span className="do-card-mid">
          <strong>{c.nombre || 'Cliente'}</strong>
          <small>{horaCorta(pedido.createdAt)} · {pedido.cantidadItems || 0} ítem(s)</small>
        </span>
        <span className="do-card-total">{cop(pedido.total || 0)}</span>
        <span className="do-card-chevron">{abierto ? '▲' : '▼'}</span>
      </button>

      {abierto && (
        <div className="do-detalle">
          {/* Dirección + mapa */}
          <div className="do-row">
            <span className="do-ico">📍</span>
            <div>
              <div>{c.direccion || 'Sin dirección'}</div>
              {mapa && <a href={mapa} target="_blank" rel="noreferrer" className="do-link">Ver en el mapa →</a>}
              {pedido.domicilioAConvenir && <div className="do-warn">⚠️ Domicilio a convenir (no incluido en el total)</div>}
            </div>
          </div>

          {/* Contacto */}
          <div className="do-acciones">
            {waLink && <a className="do-btn do-btn-wa" href={waLink} target="_blank" rel="noreferrer">💬 WhatsApp</a>}
            {telLink && <a className="do-btn do-btn-call" href={telLink}>📞 Llamar</a>}
          </div>

          {/* Ítems (precio REAL de la base — no del mensaje de WhatsApp) */}
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

          {/* Totales */}
          <div className="do-totales">
            <div><span>Subtotal</span><span>{cop(pedido.subtotal || 0)}</span></div>
            <div><span>Domicilio</span><span>{pedido.domicilioAConvenir ? 'A convenir' : cop(pedido.domicilio || 0)}</span></div>
            <div className="do-total-final"><span>Total</span><span>{cop(pedido.total || 0)}</span></div>
          </div>

          {/* Pago */}
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
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, cargando: authCargando, entrar, salir } = useAuth()

  const [estado, setEstado] = useState('cargando') // cargando | ok | no-existe | error
  const [local, setLocal] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [cargandoPedidos, setCargandoPedidos] = useState(true)
  const [errPedidos, setErrPedidos] = useState(false)
  const [query, setQuery] = useState('')
  const [abiertoId, setAbiertoId] = useState(null)
  const [extra, setExtra] = useState(null) // resultado de búsqueda exacta (pedidos viejos)

  const permitido = puedeVerRepartos(user?.email, local)

  useEffect(() => {
    let activo = true
    getLocalBySlug(slug)
      .then(data => {
        if (!activo) return
        if (!data) { setEstado('no-existe'); return }
        setLocal(data); setEstado('ok')
      })
      .catch(() => { if (activo) setEstado('error') })
    return () => { activo = false }
  }, [slug])

  useEffect(() => {
    if (!local || !permitido) return
    setCargandoPedidos(true)
    const unsub = escucharPedidosDomicilio(
      local.id,
      arr => { setPedidos(arr); setCargandoPedidos(false); setErrPedidos(false) },
      () => { setErrPedidos(true); setCargandoPedidos(false) },
    )
    return () => { if (unsub) unsub() }
  }, [local, permitido])

  const filtrados = useMemo(() => {
    const q = normalizarCodigo(query)
    if (!q) return pedidos
    const qLower = query.trim().toLowerCase()
    return pedidos.filter(p =>
      (p.codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '').includes(q.replace(/[^A-Z0-9]/g, '')) ||
      (p.cliente?.nombre || '').toLowerCase().includes(qLower) ||
      (p.cliente?.direccion || '').toLowerCase().includes(qLower),
    )
  }, [pedidos, query])

  async function buscarEnTodos() {
    const cod = normalizarCodigo(query)
    if (!cod) return
    try {
      const res = await buscarPedidoPorCodigo(local.id, cod)
      setExtra(res.filter(p => p.entrega === 'domicilio'))
    } catch { setExtra([]) }
  }

  async function cerrarSesion() { await salir(); navigate('/') }

  // ---------- Estados / gates ----------
  if (estado === 'cargando' || authCargando) {
    return <div className="local-loading"><div className="local-spinner" /><p>Cargando…</p></div>
  }
  if (estado === 'no-existe') {
    return <div className="local-msg"><div className="local-msg-emoji">🔍</div><h2>Local no encontrado</h2><Link to="/" className="btn btn-ghost">Ir al inicio</Link></div>
  }
  if (estado === 'error') {
    return <div className="local-msg"><div className="local-msg-emoji">📡</div><h2>Error de conexión</h2><p>Intenta de nuevo.</p></div>
  }
  if (!user) {
    return (
      <div className="local-msg">
        <div className="local-msg-emoji">🛵</div>
        <h2>Panel del domiciliario</h2>
        <p>Inicia sesión con tu Google para ver los pedidos de <strong>{local.nombre}</strong>.</p>
        <button className="btn btn-primary" onClick={entrar}>Entrar con Google</button>
      </div>
    )
  }
  if (!permitido) {
    return (
      <div className="local-msg">
        <div className="local-msg-emoji">🚫</div>
        <h2>Sin acceso</h2>
        <p><strong>{user.email}</strong> no está registrado como domiciliario de {local.nombre}.</p>
        <p className="do-hint">Pídele al administrador que te agregue.</p>
        <button className="btn btn-ghost" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    )
  }

  // ---------- Panel ----------
  const hayBusqueda = query.trim().length > 0
  const mostrarExtra = hayBusqueda && filtrados.length === 0 && extra && extra.length > 0

  return (
    <div className="do">
      <header className="do-top">
        <div>
          <span className="do-eyebrow">🛵 Domiciliario</span>
          <h1>{local.nombre}</h1>
        </div>
        <button className="do-salir" onClick={cerrarSesion} aria-label="Salir">Salir</button>
      </header>

      <div className="do-search">
        <span>🔎</span>
        <input
          placeholder="Buscar por código (ej. FT-7K2Q) o cliente…"
          value={query}
          onChange={e => { setQuery(e.target.value); setExtra(null) }}
          autoCapitalize="characters"
        />
        {query && <button className="do-search-x" onClick={() => { setQuery(''); setExtra(null) }} aria-label="Limpiar">✕</button>}
      </div>

      <p className="do-tip">🔒 El precio de esta pantalla es el REAL del pedido. Si el WhatsApp del cliente muestra otro, vale este.</p>

      {errPedidos && (
        <div className="do-error">
          ⚠️ No se pudieron cargar los pedidos. Es probable que falten desplegar las reglas de Firestore.
        </div>
      )}

      {cargandoPedidos && !errPedidos && (
        <div className="do-skel-wrap">{[0, 1, 2].map(i => <div key={i} className="do-skel" />)}</div>
      )}

      {!cargandoPedidos && !errPedidos && (
        <>
          <div className="do-count">
            {hayBusqueda ? `${filtrados.length} resultado(s)` : `${pedidos.length} pedido(s) a domicilio`}
          </div>

          {filtrados.length === 0 && !mostrarExtra && (
            <div className="do-empty">
              <span>🛵</span>
              <p>{hayBusqueda ? 'Ningún pedido reciente con ese código.' : 'Aún no hay pedidos a domicilio.'}</p>
              {hayBusqueda && (
                <button className="btn btn-ghost do-buscar-todos" onClick={buscarEnTodos}>Buscar también en pedidos antiguos</button>
              )}
              {hayBusqueda && extra && extra.length === 0 && <p className="do-hint">Tampoco apareció en los antiguos.</p>}
            </div>
          )}

          <ul className="do-lista">
            {(mostrarExtra ? extra : filtrados).map(p => (
              <PedidoCard
                key={p.id}
                local={local}
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
