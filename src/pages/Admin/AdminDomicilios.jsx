import { useEffect, useMemo, useRef, useState } from 'react'
import { pedidosDe } from '../../services/pedidos'
import { cop } from '../../utils/money'
import { mapsUrl } from '../../utils/geo'
import { urlWhatsApp, normalizarTel, mensajeEnCamino } from '../../utils/whatsapp'
import AdminEquipo from './AdminEquipo'
import ActivarAvisos from './ActivarAvisos'
import { useAhora, minutosSeg } from './comandaUtils'
import { ms } from '../../services/comandas'
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
  const [error, setError] = useState('')
  const [entregar, setEntregar] = useState(null)
  const ahora = useAhora(15000)

  useEffect(() => api.escucharDomicilios(l => { setVivos(l); setError('') }, e => setError(e?.code === 'permission-denied' ? 'Esta cuenta no tiene permiso para ver los domicilios.' : 'Sin conexión. Reintentando…')), [api])
  useEffect(() => api.escucharEntregados(setEntregados, () => {}), [api])

  // 🔔 Suena cuando un domicilio queda LISTO para salir (D39).
  const listosAntes = useRef(null)
  useEffect(() => {
    if (!vivos) return
    const listos = new Set(vivos.filter(p => p.estado === 'listo').map(p => p.id))
    if (listosAntes.current && [...listos].some(id => !listosAntes.current.has(id))) campanita()
    listosAntes.current = listos
  }, [vivos])

  async function enCamino(p) {
    try {
      await api.cambiarEstado(p.id, 'en-camino')
      const tel = normalizarTel(p.cliente?.telefono)
      if (tel) {
        const url = urlWhatsApp(tel, mensajeEnCamino(local, p))
        if (/android|iphone|ipad/i.test(navigator.userAgent)) window.location.href = url
        else window.open(url, '_blank')
      }
    } catch { setError('No se pudo marcar. Intenta de nuevo.') }
  }
  async function confirmarEntrega() {
    const p = entregar
    setEntregar(null)
    try { await api.cambiarEstado(p.id, 'entregado') } catch { setError('No se pudo marcar como entregado.') }
  }

  const grupo = e => (vivos || []).filter(p => p.estado === e)

  return (
    <div className="dm">
      {!demo && !local.esDemo && <ActivarAvisos local={local} usuario={usuario} />}
      {esAdmin && <div className="dm-admin"><AdminEquipo local={local} rol="domiciliario" demo={demo} /></div>}
      {error && <p className="dm-error" role="alert">{error}</p>}

      {vivos === null ? <p className="dm-vacio">Cargando domicilios…</p>
        : vivos.length === 0 ? (
          <div className="dm-vacio dm-vacio--grande">
            <span aria-hidden="true">🛵</span>
            <p>No hay domicilios en curso.</p>
            <small>Aparecen aquí apenas se confirma un pedido a domicilio.</small>
          </div>
        ) : (
          <>
            <Grupo titulo="Listos para salir" lista={grupo('listo')} ahora={ahora}
              accion={p => <button className="dm-salir" onClick={() => enCamino(p)}>🛵 Voy en camino</button>} />
            <Grupo titulo="En camino" lista={grupo('en-camino')} ahora={ahora}
              accion={p => <button className="dm-entregado" onClick={() => setEntregar(p)}>✓ Entregado</button>} />
            <Grupo titulo="En cocina" lista={grupo('en-cocina')} ahora={ahora} />
          </>
        )}

      {entregados.length > 0 && (
        <>
          <h3 className="dm-sub">Entregados hace poco</h3>
          <ul className="dm-hist">
            {entregados.map(p => (
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
            <p>{entregar.cliente?.nombre} · cobrar {cop(entregar.total)}</p>
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
        <span>💳 {p.metodoPagoNombre || '—'}</span>
        {p.efectivoCon > 0 && <span>paga con {cop(p.efectivoCon)} · <b>vueltas {cop(Math.max(0, p.efectivoCon - p.total))}</b></span>}
      </div>
      {p.notas && <p className="dm-nota">📝 {p.notas}</p>}
      <p className="dm-tiempo">Pedido hace {desde ? minutosSeg((ahora - desde) / 1000) : '—'}</p>
      {accion && accion(p)}
    </article>
  )
}

const primero = n => String(n || '').trim().split(/\s+/)[0]
function hora(t) { const m = ms(t); return m ? new Date(m).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : '' }
function campanita() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const t0 = ctx.currentTime
    ;[[784, 0], [1047, 0.18]].forEach(([f, d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t0 + d)
      g.gain.exponentialRampToValueAtTime(0.3, t0 + d + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.45)
      o.connect(g).connect(ctx.destination)
      o.start(t0 + d); o.stop(t0 + d + 0.5)
    })
    setTimeout(() => ctx.close().catch(() => {}), 1000)
  } catch { /* sin audio */ }
}
