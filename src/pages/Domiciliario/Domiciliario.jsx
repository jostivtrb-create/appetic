import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getDomiciliariosGlobal } from '../../services/domiciliarios'
import { buscarPedidoGlobalPorCodigo } from '../../services/pedidos'
import { puedeVerRepartos } from '../../config/roles'
import { cop } from '../../utils/money'
import { mapsUrl } from '../../utils/geo'
import { linkRespuestaCliente } from '../../utils/whatsapp'
import './Domiciliario.css'

// 🛵 Panel del domiciliario: SOLO un buscador por código.
//
// El flujo real: el cliente hace el pedido → el LOCAL lo confirma y se lo reenvía por
// WhatsApp al domiciliario a cargo → el domiciliario copia el código (ej. FT-7K2Q),
// entra aquí, lo escribe y la app le muestra el pedido completo con el precio REAL
// de la base (anti-manipulación del mensaje).
//
// A propósito NO hay lista ni avisos de pedidos: con varios domiciliarios, cada uno
// solo ve lo que le reenviaron. Cero lecturas hasta que busca (1 consulta por código).

function horaCorta(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : null)
    if (!d) return 'ahora'
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

// Detalle COMPLETO del pedido (el resultado de la búsqueda, siempre abierto).
function PedidoDetalle({ pedido }) {
  const c = pedido.cliente || {}
  const localMin = { nombre: pedido.localNombre || '' }
  const telLink = c.telefono ? `tel:${String(c.telefono).replace(/[^\d+]/g, '')}` : ''
  const waLink = linkRespuestaCliente(localMin, pedido)
  const mapa = c.coord?.lat != null ? mapsUrl(c.coord) : ''
  return (
    <div className="do-card open do-resultado">
      <div className="do-card-head do-card-head--static">
        <span className="do-codigo">{pedido.codigo || '—'}</span>
        <span className="do-card-mid">
          <strong>{c.nombre || 'Cliente'}</strong>
          <small>
            {pedido.localIcono ? <img className="do-local-ico" src={pedido.localIcono} alt="" /> : '🏪 '}
            {pedido.localNombre || 'Local'} · {horaCorta(pedido.createdAt)}
          </small>
        </span>
        <span className="do-card-total">{cop(pedido.total || 0)}</span>
      </div>

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
    </div>
  )
}

export default function Domiciliario() {
  const navigate = useNavigate()
  const { user, cargando: authCargando, entrar, salir } = useAuth()

  const [lista, setLista] = useState(null)     // lista global de correos (null = cargando)
  const [codigo, setCodigo] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState(null) // null = sin búsqueda · [] = no encontrado · [p...]
  const [errBusqueda, setErrBusqueda] = useState(false)
  const inputRef = useRef(null)

  const permitido = user && lista && puedeVerRepartos(user.email, lista)

  // Cargar la lista global de domiciliarios (para el gate).
  useEffect(() => {
    let activo = true
    getDomiciliariosGlobal().then(l => { if (activo) setLista(l || []) }).catch(() => activo && setLista([]))
    return () => { activo = false }
  }, [])

  async function buscar() {
    const c = codigo.trim()
    if (!c || buscando) return
    setBuscando(true)
    setErrBusqueda(false)
    try {
      setResultado(await buscarPedidoGlobalPorCodigo(c))
    } catch {
      setResultado(null)
      setErrBusqueda(true)
    }
    setBuscando(false)
  }

  function limpiar() {
    setCodigo('')
    setResultado(null)
    setErrBusqueda(false)
    inputRef.current?.focus()
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
        <p>Inicia sesión con tu Google para buscar los pedidos a domicilio.</p>
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
        <p className="do-hint">Pídele al administrador que te agregue.</p>
        <button className="btn btn-ghost" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    )
  }

  // ---------- Panel: SOLO buscador por código ----------
  return (
    <div className="do">
      <header className="do-top">
        <div>
          <span className="do-eyebrow">🛵 Domiciliarios</span>
          <h1>Buscar pedido</h1>
        </div>
        <div className="do-top-actions">
          <button className="do-salir" onClick={cerrarSesion}>Salir</button>
        </div>
      </header>

      <p className="do-instruccion">
        Copia el <strong>código del pedido</strong> que te reenviaron por WhatsApp
        (ej. <strong>FT-7K2Q</strong>), escríbelo aquí y te mostramos el domicilio con su
        <strong> precio real</strong>.
      </p>

      <div className="do-buscador">
        <input
          ref={inputRef}
          className="do-buscador-input"
          placeholder="Código · ej. FT-7K2Q"
          value={codigo}
          onChange={e => { setCodigo(e.target.value.toUpperCase()); setErrBusqueda(false) }}
          onKeyDown={e => { if (e.key === 'Enter') buscar() }}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck="false"
          autoFocus
        />
        <button className="do-buscador-btn" onClick={buscar} disabled={!codigo.trim() || buscando}>
          {buscando ? '…' : 'Buscar'}
        </button>
      </div>

      {errBusqueda && (
        <div className="do-error">⚠️ No se pudo buscar. Revisa la conexión (o que las reglas de Firestore estén desplegadas).</div>
      )}

      {resultado && resultado.length === 0 && !errBusqueda && (
        <div className="do-empty">
          <span>🔍</span>
          <p>Ningún domicilio con ese código.</p>
          <p className="do-hint">Revisa el código en el mensaje de WhatsApp (los pedidos se borran a los 2 días).</p>
          <button className="btn btn-ghost do-buscar-todos" onClick={limpiar}>Buscar otro</button>
        </div>
      )}

      {resultado && resultado.length > 0 && (
        <>
          <p className="do-tip">🔒 Este es el precio REAL del pedido. Si el WhatsApp muestra otro, vale este.</p>
          {resultado.map(p => <PedidoDetalle key={p.id} pedido={p} />)}
          <button className="btn btn-ghost do-otra" onClick={limpiar}>Buscar otro pedido</button>
        </>
      )}
    </div>
  )
}
