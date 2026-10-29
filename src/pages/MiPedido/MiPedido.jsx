import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAdmin } from '../../contexts/AdminContext'
import { getLocalBySlug } from '../../services/locales'
import { pedidosDe, YaAtendidoError } from '../../services/pedidos'
import { isDevSlug, getDevLocal } from '../../dev'
import { puedeAdministrarLocal } from '../../config/roles'
import { devSuper } from '../../components/BottomNav/PanelRail'
import { cop } from '../../utils/money'
import { mapsUrl } from '../../utils/geo'
import { urlWhatsApp, normalizarTel, mensajeRespuestaCliente, mensajeRechazo } from '../../utils/whatsapp'
import './MiPedido.css'

// 🧾 «MI PEDIDO» — /p/:slug/:pedidoId (guía «Mesero y Comandas», paso 3 · D28–D32).
//
// El link va en el WhatsApp que el cliente le manda al local, así que lo abren los dos:
//   • CLIENTE (o cualquiera con el link): resumen SIN teléfono ni dirección + en qué va su pedido,
//     en vivo (Recibido → En cocina → Listo / En camino → Entregado).
//   • MESERO o ADMIN del local (con su sesión): el pedido completo + «Confirmar pedido» (lo manda a
//     cocina) o «No podemos atenderlo». Después, un botón para avisarle al cliente por WhatsApp.
export default function MiPedido() {
  const { slug, pedidoId } = useParams()
  const { user, cargando: authCargando, entrar } = useAuth()
  const { rolesEn } = useAdmin()
  const demo = isDevSlug(slug)
  const [local, setLocal] = useState(undefined)

  useEffect(() => {
    let activo = true
    const cargar = demo ? getDevLocal(slug).then(d => d?.local || null) : getLocalBySlug(slug)
    cargar.then(l => { if (activo) setLocal(l || null) }).catch(() => { if (activo) setLocal(null) })
    return () => { activo = false }
  }, [slug, demo])

  const email = (user?.email || '').toLowerCase()
  const esPersonal = !!local && (puedeAdministrarLocal(email, local) || rolesEn(slug).includes('mesero') || (demo && devSuper()))

  if (local === undefined || (!demo && authCargando)) return <Centro>Cargando pedido…</Centro>
  if (!local) return <Centro>Este pedido no existe.</Centro>

  return (
    <div className="mp" style={{ '--mp-primary': local.tema?.primary || '#ED7D2B' }}>
      <header className="mp-cab">
        {(local.icono || local.logo) && <img src={local.icono || local.logo} alt="" />}
        <div>
          <small>Pedido en</small>
          <strong>{local.nombre}</strong>
        </div>
      </header>
      {esPersonal
        ? <VistaPersonal local={local} pedidoId={pedidoId} demo={demo} usuario={user} />
        : <VistaCliente local={local} pedidoId={pedidoId} demo={demo} user={user} entrar={entrar} />}
    </div>
  )
}

function Centro({ children }) {
  return <div className="mp-centro"><p>{children}</p><Link to="/">Ir a Appetic</Link></div>
}

// ─────────────────────────────── Cliente ───────────────────────────────

const PASOS_DOMI = [['nuevo', 'Recibido'], ['en-cocina', 'En cocina'], ['listo', 'Listo'], ['en-camino', 'En camino'], ['entregado', 'Entregado']]
const PASOS_RECOGER = [['nuevo', 'Recibido'], ['en-cocina', 'En cocina'], ['listo', 'Listo para recoger']]

function VistaCliente({ local, pedidoId, demo, user, entrar }) {
  const api = useMemo(() => pedidosDe(local.id, { demo }), [local.id, demo])
  const [p, setP] = useState(undefined)
  useEffect(() => api.escucharPublico(pedidoId, setP, () => setP(null)), [api, pedidoId])

  if (p === undefined) return <p className="mp-cargando">Cargando…</p>
  if (!p) return <p className="mp-cargando">No encontramos este pedido. Puede que ya haya pasado más de 2 días.</p>

  return (
    <>
      <section className="mp-tarjeta">
        <p className="mp-hola">{p.clienteNombre ? `¡Hola ${p.clienteNombre}!` : '¡Hola!'} Este es tu pedido <b>{p.codigo}</b></p>
        <Pasos pedido={p} />
      </section>
      <Resumen pedido={p} />
      {/* Por si quien lo abre es del local y no ha iniciado sesión. */}
      {!user && !demo && (
        <button className="mp-soydel" onClick={entrar}>¿Eres del local? Inicia sesión para confirmarlo</button>
      )}
    </>
  )
}

function Pasos({ pedido }) {
  if (pedido.estado === 'rechazado') {
    return <p className="mp-rechazado">El local no pudo atender este pedido. Si tienes dudas, escríbeles por WhatsApp.</p>
  }
  const pasos = pedido.entrega === 'domicilio' ? PASOS_DOMI : PASOS_RECOGER
  const i = Math.max(0, pasos.findIndex(([e]) => e === pedido.estado))
  return (
    <ol className="mp-pasos" aria-label="En qué va tu pedido">
      {pasos.map(([e, t], j) => (
        <li key={e} className={j < i ? 'hecho' : j === i ? 'ahora' : ''}>
          <span className="mp-punto" aria-hidden="true">{j < i ? '✓' : j + 1}</span>
          <span>{t}</span>
        </li>
      ))}
    </ol>
  )
}

function Resumen({ pedido }) {
  return (
    <section className="mp-tarjeta">
      <h2>{pedido.entrega === 'domicilio' ? '🛵 Domicilio' : '🛍️ Para recoger'}</h2>
      <ul className="mp-items">
        {(pedido.items || []).filter(it => !it.quitado).map((it, k) => (
          <li key={k}>
            <span className="mp-cant">{it.cantidad}×</span>
            <span className="mp-nom">{it.nombre}{it.opciones && <small>{it.opciones}</small>}{it.notas && <em>“{it.notas}”</em>}</span>
            <span>{cop(it.precio)}</span>
          </li>
        ))}
      </ul>
      <div className="mp-totales">
        <div><span>Subtotal</span><span>{cop(pedido.subtotal)}</span></div>
        {pedido.entrega === 'domicilio' && <div><span>Domicilio</span><span>{pedido.domicilioAConvenir ? 'A convenir' : cop(pedido.domicilio)}</span></div>}
        <div className="mp-total"><span>Total</span><span>{cop(pedido.total)}</span></div>
        {pedido.metodoPagoNombre && <p className="mp-pago">💳 {pedido.metodoPagoNombre}</p>}
      </div>
    </section>
  )
}

// ─────────────────────────────── Mesero / admin ───────────────────────────────

export function VistaPersonal({ local, pedidoId, demo, usuario, compacta = false, onListo }) {
  const api = useMemo(() => pedidosDe(local.id, { demo }), [local.id, demo])
  const [p, setP] = useState(undefined)
  const [estado, setEstado] = useState('')       // '' | confirmando | rechazando | error
  const [hecho, setHecho] = useState(null)       // { tipo: 'confirmado'|'rechazado', pedido }
  const [ya, setYa] = useState(null)             // lo atendió otra persona
  const [seguroRechazo, setSeguroRechazo] = useState(false)
  useEffect(() => api.escucharPedido(pedidoId, setP, () => setP(null)), [api, pedidoId])
  const por = { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || (demo ? 'Admin Demo' : '') }

  async function confirmar() {
    setEstado('confirmando')
    try {
      const pedido = await api.confirmar(pedidoId, por)
      setHecho({ tipo: 'confirmado', pedido })
      setEstado('')
      abrirWhatsApp(pedido, mensajeRespuestaCliente(local, pedido), true)
      onListo?.()
    } catch (e) {
      if (e instanceof YaAtendidoError) { setYa(e.pedido); setEstado(''); return }
      setEstado('error')
    }
  }
  async function rechazar() {
    setSeguroRechazo(false)
    setEstado('rechazando')
    try {
      const pedido = await api.rechazar(pedidoId, por)
      setHecho({ tipo: 'rechazado', pedido })
      setEstado('')
      onListo?.()
    } catch (e) {
      if (e instanceof YaAtendidoError) { setYa(e.pedido); setEstado(''); return }
      setEstado('error')
    }
  }

  if (p === undefined) return <p className="mp-cargando">Cargando…</p>
  if (!p) return <p className="mp-cargando">No encontramos este pedido (o ya pasó más de 2 días).</p>
  const c = p.cliente || {}
  const tel = c.telefono ? String(c.telefono).replace(/[^\d+]/g, '') : ''
  const mapa = c.coord?.lat != null ? mapsUrl(c.coord) : ''
  const quienYa = (ya || p).confirmadoPor?.nombre || (ya || p).rechazadoPor?.nombre || ''

  return (
    <>
      {hecho && (
        <section className={`mp-tarjeta mp-hecho ${hecho.tipo}`}>
          <p className="mp-hecho-tit">{hecho.tipo === 'confirmado' ? '✓ Enviado a cocina' : 'Pedido rechazado'}</p>
          <button className="mp-wa" onClick={() => abrirWhatsApp(hecho.pedido, hecho.tipo === 'confirmado' ? mensajeRespuestaCliente(local, hecho.pedido) : mensajeRechazo(local, hecho.pedido))}>
            💬 Avisar a {primero(c.nombre) || 'el cliente'} por WhatsApp
          </button>
        </section>
      )}
      {!hecho && ya && (
        <section className="mp-tarjeta mp-hecho ya"><p className="mp-hecho-tit">Este pedido ya lo atendió {quienYa || 'otra persona'}.</p></section>
      )}

      <section className="mp-tarjeta">
        <div className="mp-fila-tit">
          <h2>{p.entrega === 'domicilio' ? '🛵 Domicilio' : '🛍️ Para recoger'} · <b>{p.codigo}</b></h2>
          <span className={`mp-estado e-${p.estado}`}>{ESTADO_TXT[p.estado] || p.estado}</span>
        </div>
        <div className="mp-cliente">
          <strong>{c.nombre || 'Cliente'}</strong>
          {tel && <a href={`tel:${tel}`}>📞 {c.telefono}</a>}
          {p.entrega === 'domicilio' && (
            <p>📍 {c.direccion || 'Sin dirección'} {mapa && <a href={mapa} target="_blank" rel="noreferrer">Ver mapa →</a>}</p>
          )}
          {p.notas && <p className="mp-nota">📝 {p.notas}</p>}
        </div>
        {!compacta && <Pasos pedido={p} />}
      </section>

      <Resumen pedido={p} />
      {p.efectivoCon > 0 && <p className="mp-vueltas">Paga con {cop(p.efectivoCon)} · vueltas {cop(Math.max(0, p.efectivoCon - p.total))}</p>}

      {p.estado === 'nuevo' && !hecho && (
        <div className="mp-acciones">
          {estado === 'error' && <p className="mp-error">⚠️ No se pudo. Revisa el internet e intenta de nuevo.</p>}
          <button className="mp-confirmar" onClick={confirmar} disabled={!!estado}>{estado === 'confirmando' ? 'Enviando a cocina…' : '✓ Confirmar pedido'}</button>
          {seguroRechazo ? (
            <div className="mp-seguro">
              <p>¿Seguro que no pueden atenderlo? Se le avisará al cliente.</p>
              <div>
                <button className="mp-rechazar-si" onClick={rechazar} disabled={!!estado}>Sí, no podemos</button>
                <button onClick={() => setSeguroRechazo(false)}>Volver</button>
              </div>
            </div>
          ) : (
            <button className="mp-rechazar" onClick={() => setSeguroRechazo(true)} disabled={!!estado}>No podemos atenderlo</button>
          )}
        </div>
      )}
    </>
  )
}

const ESTADO_TXT = { nuevo: 'Por confirmar', 'en-cocina': 'En cocina', listo: 'Listo', 'en-camino': 'En camino', entregado: 'Entregado', rechazado: 'Rechazado' }
const primero = n => String(n || '').trim().split(/\s+/)[0]

// Abre WhatsApp con el mensaje para el cliente. `auto`: solo se intenta solo en el celular (en PC el
// navegador bloquea ventanas que no salen de un toque; ahí queda el botón).
function abrirWhatsApp(pedido, texto, auto = false) {
  const tel = normalizarTel(pedido?.cliente?.telefono)
  if (!tel) return
  const url = urlWhatsApp(tel, texto)
  const movil = /android|iphone|ipad/i.test(navigator.userAgent)
  if (auto && !movil) return
  if (movil) window.location.href = url
  else window.open(url, '_blank')
}
