import { useEffect, useMemo, useRef, useState } from 'react'
import { pedidosDe, textoEstadoPedido } from '../../services/pedidos'
import { cop } from '../../utils/money'
import { mapsUrl } from '../../utils/geo'
import { urlWhatsApp, normalizarTel, mensajeEnCamino, isMobileBrowser } from '../../utils/whatsapp'
import AdminEquipo from './AdminEquipo'
import ActivarAvisos from './ActivarAvisos'
import { useAhora, minutosSeg } from './comandaUtils'
import { ms, usaCocina } from '../../services/comandas'
import { notificarListo } from '../../services/notificaciones'
import { conTope } from '../../utils/conTope'
import { avisarDemo } from '../../components/Demo/eventosDemo'
import { tocar } from '../../utils/sonido'
import './Domicilios.css'

// 🛵 PANEL DE DOMICILIOS del local (guía «Mesero y Comandas», paso 3 · D35–D41).
//
// Un solo panel para todos los domiciliarios del local (sin asignar). Cada domicilio aparece apenas
// el mesero/admin lo CONFIRMA, con toda su información:
//   • En cocina  → se prepara (solo se mira).
//   • Listo      → la cocina lo entregó: «🛵 Voy en camino» (abre WhatsApp: «tu pedido va en camino»).
//   • En camino  → «✓ Entregado» (con confirmación grande).
// Lo ven los domiciliarios y el admin (el mesero no). Suena cuando uno queda LISTO.
export default function AdminDomicilios({ local, demo, usuario, esAdmin }) {
  const api = useMemo(() => pedidosDe(local.id, { demo }), [local.id, demo])
  const [vivos, setVivos] = useState(null)
  const [entregados, setEntregados] = useState([])
  const [error, setError] = useState('')          // lo que falló al tocar un botón
  const [errorRed, setErrorRed] = useState('')    // la escucha en vivo (se borra sola al reconectar)
  const [entregar, setEntregar] = useState(null)
  const ahora = useAhora(15000)

  const motivoRed = e => e?.code === 'permission-denied' ? 'Esta cuenta no tiene permiso para ver los domicilios.' : 'Sin conexión. Reintentando…'
  useEffect(() => api.escucharDomicilios(l => { setVivos(l); setErrorRed('') }, e => setErrorRed(motivoRed(e))), [api])
  useEffect(() => api.escucharEntregados(l => { setEntregados(l); setErrorRed('') }, e => setErrorRed(motivoRed(e))), [api])
  // «Entregados hace poco» = los de hoy (el pedido vive 2 días y salían los de ayer).
  const hoy0 = new Date().setHours(0, 0, 0, 0)
  const entregadosHoy = entregados.filter(p => (ms(p.actualizadoEn) || 0) >= hoy0)

  // 🔔 Suena cuando un domicilio queda LISTO para salir (D39).
  const listosAntes = useRef(null)
  useEffect(() => {
    if (!vivos) return
    const listos = new Set(vivos.filter(p => p.estado === 'listo').map(p => p.id))
    if (listosAntes.current && [...listos].some(id => !listosAntes.current.has(id))) campanita()
    listosAntes.current = listos
  }, [vivos])

  const [ocupado, setOcupado] = useState(null)   // id del domicilio que se está marcando (un toque a la vez)
  const ocupadoRef = useRef(false)               // freno inmediato: dos toques llegan antes de pintar
  const tomar = id => { if (ocupadoRef.current) return false; ocupadoRef.current = true; setOcupado(id); return true }
  const soltar = () => { ocupadoRef.current = false; setOcupado(null) }

  // «Voy en camino»: solo si sigue «listo» (dos toques o dos domiciliarios no mandan dos WhatsApp).
  // En PC la pestaña de WhatsApp se abre EN EL TOQUE (si no, el navegador la bloquea) y se llena
  // después; si el domicilio ya había cambiado, se cierra.
  async function enCamino(p) {
    if (!tomar(p.id)) return
    setError('')
    const tel = normalizarTel(p.cliente?.telefono)
    const ventana = tel && !isMobileBrowser() ? window.open('', '_blank') : null
    try {
      await conTope(api.cambiarEstado(p.id, 'en-camino'))
      avisarDemo('en-camino')
      if (tel) {
        const url = urlWhatsApp(tel, mensajeEnCamino(local, p))
        if (isMobileBrowser()) window.location.href = url
        else if (ventana) ventana.location.href = url
        else window.open(url, '_blank')
      }
    } catch (e) {
      ventana?.close()
      setError(textoEstadoPedido(e) || 'No se pudo marcar. Revisa el internet e intenta de nuevo.')
    } finally { soltar() }
  }
  async function confirmarEntrega() {
    const p = entregar
    setEntregar(null); setError('')
    try { await conTope(api.cambiarEstado(p.id, 'entregado')); avisarDemo('domicilio-entregado') }
    catch (e) { setError(textoEstadoPedido(e) || 'No se pudo marcar como entregado. Revisa el internet.') }
  }
  // «Ya está listo»: sin pantalla de cocina (Comerciante) lo marca quien prepara o el domiciliario;
  // con cocina, el dueño lo usa si el domicilio se quedó pegado «En cocina». Suena y avisa a los
  // domiciliarios con la app cerrada.
  const marcaListo = !usaCocina(local) || esAdmin
  async function yaListo(p) {
    if (!tomar(p.id)) return
    setError('')
    try {
      await conTope(api.cambiarEstado(p.id, 'listo'))
      if (!demo && !local.esDemo) notificarListo(local.id, p.id)
    } catch (e) {
      setError(textoEstadoPedido(e) || 'No se pudo marcar. Revisa el internet e intenta de nuevo.')
    } finally { soltar() }
  }

  const grupo = e => (vivos || []).filter(p => p.estado === e)

  return (
    <div className="dm">
      {!demo && !local.esDemo && <ActivarAvisos local={local} usuario={usuario} />}
      {esAdmin && <div className="dm-admin"><AdminEquipo local={local} rol="domiciliario" demo={demo} /></div>}
      {errorRed && <p className="dm-error" role="alert">{errorRed}</p>}
      {error && <p className="dm-error" role="alert">{error}</p>}

      {vivos === null ? <p className="dm-vacio">Cargando domicilios…</p>
        : vivos.length === 0 ? (
          <div className="dm-vacio dm-vacio--grande">
            <span aria-hidden="true">🛵</span>
            <p>No hay domicilios en curso.</p>
            <small>{esAdmin ? 'Los que confirmes pasan aquí: en cocina, listos para salir y en camino.' : 'Aparecen aquí apenas se confirma un pedido a domicilio.'}</small>
          </div>
        ) : (
          <>
            <Grupo titulo="Listos para salir" lista={grupo('listo')} ahora={ahora}
              accion={p => <button className="dm-salir" disabled={!!ocupado} onClick={() => enCamino(p)}>{ocupado === p.id ? 'Marcando…' : '🛵 Voy en camino'}</button>} />
            <Grupo titulo="En camino" lista={grupo('en-camino')} ahora={ahora}
              accion={p => <button className="dm-entregado" disabled={!!ocupado} onClick={() => setEntregar(p)}>✓ Entregado</button>} />
            <Grupo titulo={usaCocina(local) ? 'En cocina' : 'En preparación'} lista={grupo('en-cocina')} ahora={ahora}
              accion={marcaListo ? p => <button className="dm-listo" disabled={!!ocupado} onClick={() => yaListo(p)}>{ocupado === p.id ? 'Marcando…' : '🔔 Ya está listo'}</button> : undefined} />
          </>
        )}

      {entregadosHoy.length > 0 && (
        <>
          <h3 className="dm-sub">Entregados hace poco</h3>
          <ul className="dm-hist">
            {entregadosHoy.map(p => (
              <li key={p.id}><strong>{p.codigo} · {primero(p.cliente?.nombre)}</strong><span>{cop(p.total)} · {hora(p.actualizadoEn)}</span></li>
            ))}
          </ul>
        </>
      )}

      {entregar && (
        <div className="km-velo" onClick={() => setEntregar(null)}>
          <div className="dm-confirma" role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <p className="dm-confirma-cod">{entregar.codigo}</p>
            <h2>¿Ya lo entregaste?</h2>
            <p>{entregar.cliente?.nombre} · {textoCobro(entregar)}</p>
            <button className="km-si" onClick={confirmarEntrega}>✓ Sí, entregado</button>
            <button className="km-no" onClick={() => setEntregar(null)}>No, volver</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Grupo({ titulo, lista, ahora, accion }) {
  if (!lista.length) return null
  return (
    <section className="dm-grupo">
      <h3 className="dm-sub">{titulo} · {lista.length}</h3>
      <div className="dm-grid">{lista.map(p => <Domicilio key={p.id} p={p} ahora={ahora} accion={accion} />)}</div>
    </section>
  )
}

// Un domicilio con toda su información (lo que mostraba el panel viejo, S23).
function Domicilio({ p, ahora, accion }) {
  const c = p.cliente || {}
  const tel = c.telefono ? String(c.telefono).replace(/[^\d+]/g, '') : ''
  const wa = normalizarTel(c.telefono)
  const mapa = c.coord?.lat != null ? mapsUrl(c.coord) : ''
  const desde = ms(p.createdAt)
  return (
    <article className={`dm-card e-${p.estado}`}>
      <header className="dm-card-cab">
        <span className="dm-cod">{p.codigo}</span>
        <strong>{c.nombre || 'Cliente'}</strong>
        <span className="dm-total">{cop(p.total)}</span>
      </header>
      <div className="dm-dir">
        <span aria-hidden="true">📍</span>
        <div>
          <p>{c.direccion || 'Sin dirección'}</p>
          {mapa && <a href={mapa} target="_blank" rel="noreferrer">Abrir en el mapa →</a>}
          {p.domicilioAConvenir && <p className="dm-warn">⚠️ Domicilio a convenir (no incluido en el total)</p>}
        </div>
      </div>
      <div className="dm-contacto">
        {tel && <a className="dm-btn" href={`tel:${tel}`}>📞 Llamar</a>}
        {wa && <a className="dm-btn dm-btn-wa" href={`https://api.whatsapp.com/send?phone=${wa}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>}
      </div>
      <ul className="dm-items">
        {(p.items || []).map((it, i) => (
          <li key={i}><b>{it.cantidad}×</b> {it.nombre}{it.opciones && <small> · {it.opciones}</small>}</li>
        ))}
      </ul>
      <div className="dm-cobro">
        <span>💳 {p.metodoPagoNombre || '—'} · {textoCobro(p)}</span>
        {p.efectivoCon > 0 && <span>paga con {cop(p.efectivoCon)} · <b>vueltas {cop(Math.max(0, p.efectivoCon - p.total))}</b></span>}
      </div>
      {p.notas && <p className="dm-nota">📝 {p.notas}</p>}
      <p className="dm-tiempo">Pedido hace {desde ? minutosSeg((ahora - desde) / 1000) : '—'}</p>
      {accion && accion(p)}
    </article>
  )
}

// Qué hace el domiciliario con la plata: si pagó por transferencia no se le cobra otra vez.
function textoCobro(p) {
  const extra = p.domicilioAConvenir ? ' + el domicilio acordado' : ''
  // Pagó con el link de pago del negocio: no se cobra, salvo que nunca subió el comprobante.
  if (p.pagoLink) return p.comprobanteUrl ? `pagó con link (🧾 comprobante enviado)${extra ? ': cobrar solo el domicilio acordado' : ''}` : `pagaría con link pero NO subió comprobante: confirma con el local antes de entregar`
  return p.metodoPagoTipo === 'transferencia'
    ? `pagó por ${p.metodoPagoNombre || 'transferencia'}: revisa que llegaron ${cop(p.total)}${extra}`
    : `cobrar ${cop(p.total)}${extra}`
}

const primero = n => String(n || '').trim().split(/\s+/)[0]
function hora(t) { const m = ms(t); return m ? new Date(m).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : '' }
const campanita = () => tocar([[784, 0], [1047, 0.18]], 0.3, 0.45)
