import { useEffect, useMemo, useRef, useState } from 'react'
import { pedidosDe } from '../../services/pedidos'
import { cop } from '../../utils/money'
import { ms } from '../../services/comandas'
import { useAhora, minutosSeg } from './comandaUtils'
import { VistaPersonal } from '../MiPedido/MiPedido'
import '../MiPedido/MiPedido.css'

// 📲 PEDIDOS DE LA APP POR CONFIRMAR (D29): en la pantalla del Mesero, para que cualquier mesero o
// el admin los confirme sin depender de quién tiene el WhatsApp del local. Suena al llegar uno.
// Tocar uno abre la MISMA vista de «Mi pedido» del personal (Confirmar / No podemos atenderlo).
export default function PorConfirmar({ local, demo, usuario }) {
  const api = useMemo(() => pedidosDe(local.id, { demo }), [local.id, demo])
  const [lista, setLista] = useState([])
  const [abierto, setAbierto] = useState(null)
  const ahora = useAhora(15000)
  useEffect(() => api.escucharPorConfirmar(setLista, () => {}), [api])

  const antes = useRef(null)
  useEffect(() => {
    const ids = new Set(lista.map(p => p.id))
    if (antes.current && [...ids].some(id => !antes.current.has(id))) timbre()
    antes.current = ids
  }, [lista])

  if (!lista.length && !abierto) return null
  return (
    <>
      {lista.length > 0 && (
        <section className="pc">
          <h3 className="pc-tit"><span className="pc-punto" aria-hidden="true" /> Pedidos de la app por confirmar · {lista.length}</h3>
          <ul>
            {lista.map(p => (
              <li key={p.id}>
                <button className="pc-item" onClick={() => setAbierto(p.id)}>
                  <span className={`pc-tipo ${p.entrega}`}>{p.entrega === 'domicilio' ? '🛵 Domicilio' : '🛍️ Recoger'}</span>
                  <span className="pc-txt">
                    <strong>{(p.cliente?.nombre || 'Cliente').split(' ')[0]} · {p.codigo}</strong>
                    <small>{p.cantidadItems} ítems · {cop(p.total)} · hace {minutosSeg((ahora - (ms(p.createdAt) || ahora)) / 1000)}</small>
                  </span>
                  <span className="pc-ver">Ver ›</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {abierto && (
        <div className="ms-velo" onClick={() => setAbierto(null)}>
          <div className="ms-hoja pc-hoja" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <header className="ms-hoja-cab">
              <h2>Pedido de la app</h2>
              <button className="ms-x" onClick={() => setAbierto(null)} aria-label="Cerrar">✕</button>
            </header>
            <div className="mp" style={{ padding: 0, '--mp-primary': local.tema?.primary || '#ED7D2B' }}>
              <VistaPersonal local={local} pedidoId={abierto} demo={demo} usuario={usuario} compacta />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function timbre() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const t0 = ctx.currentTime
    ;[[659, 0], [880, 0.15], [1175, 0.3]].forEach(([f, d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t0 + d)
      g.gain.exponentialRampToValueAtTime(0.28, t0 + d + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.35)
      o.connect(g).connect(ctx.destination)
      o.start(t0 + d); o.stop(t0 + d + 0.4)
    })
    setTimeout(() => ctx.close().catch(() => {}), 1000)
  } catch { /* sin audio */ }
}
