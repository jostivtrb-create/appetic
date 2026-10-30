import { useEffect, useMemo, useState } from 'react'
import { comandasDe, etiquetaDestino, ms, motivoError } from '../../services/comandas'
import { pedidosDe } from '../../services/pedidos'
import { cop } from '../../utils/money'
import { useAhora, minutosSeg, coloresComanda, claseDestino, palabraDestino } from './comandaUtils'
import './Caja.css'

// 💵 CAJA (guía «Cuenta por mesa»): el admin sigue el RECORRIDO de cada comanda —mesero o cliente →
// cocina → entregada (y en domicilio: → domiciliario → entregado)— y, cuando termina, la marca
// «Ya se cobró». Una por una (D15), sin medios de pago ni cuentas (D7). Las cobradas pasan al
// historial (D14) y se pueden deshacer por si fue un toque de más.
export default function AdminCaja({ local, demo, usuario }) {
  const api = useMemo(() => comandasDe(local.id, { demo }), [local.id, demo])
  const pedidos = useMemo(() => pedidosDe(local.id, { demo }), [local.id, demo])
  const [pestana, setPestana] = useState('cobrar')
  const [porCobrar, setPorCobrar] = useState(null)
  const [cobradas, setCobradas] = useState([])
  const [domis, setDomis] = useState({})     // pedidoId → estado del domicilio vivo (listo / en-camino)
  const [error, setError] = useState('')
  const [deshacer, setDeshacer] = useState(null)
  const ahora = useAhora(15000)
  const por = { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' }

  useEffect(() => api.escucharPorCobrar(l => { setPorCobrar(l); setError('') }, e => setError(motivoError(e))), [api])
  useEffect(() => api.escucharCobradas(setCobradas, () => {}), [api])
  useEffect(() => pedidos.escucharDomicilios(l => setDomis(Object.fromEntries(l.map(p => [p.id, p.estado]))), () => {}), [pedidos])
  useEffect(() => {
    if (!deshacer) return
    const t = setTimeout(() => setDeshacer(null), 8000)
    return () => clearTimeout(t)
  }, [deshacer])

  // ¿En qué va? y ¿ya terminó su recorrido? (solo entonces se cobra)
  function etapa(c) {
    const vivos = (c.items || []).filter(it => !it.quitado)
    if (c.estado === 'activa') {
      const hechos = vivos.filter(it => it.hecho).length
      return { fin: false, txt: hechos ? `🔥 En cocina · ${hechos} de ${vivos.length} listos` : '🔥 En cocina' }
    }
    if (c.destino?.tipo === 'domicilio' && c.pedidoId) {
      const e = domis[c.pedidoId]
      if (e === 'listo') return { fin: false, txt: '🛵 Listo, esperando al domiciliario' }
      if (e === 'en-camino') return { fin: false, txt: '🛵 En camino' }
      return { fin: true, txt: '✅ Entregado al cliente' }
    }
    return { fin: true, txt: '✅ Entregada' }
  }

  const lista = porCobrar || []
  const conEtapa = lista.map(c => ({ c, e: etapa(c) }))
  const listas = conEtapa.filter(x => x.e.fin)
  const enProceso = conEtapa.filter(x => !x.e.fin)
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const viejas = lista.filter(c => (ms(c.creadaEn) || ahora) < hoy.getTime()).length

  async function cobrar(c) {
    try { await api.cobrar(c, por); setDeshacer(c) } catch { setError('No se pudo marcar. Revisa el internet e intenta de nuevo.') }
  }
  async function descobrar(c) {
    setDeshacer(null)
    try { await api.descobrar(c) } catch { setError('No se pudo deshacer.') }
  }

  return (
    <div className="cj" style={coloresComanda(local).vars}>
      <div className="cj-tabs" role="tablist">
        <button role="tab" aria-selected={pestana === 'cobrar'} className={pestana === 'cobrar' ? 'on' : ''} onClick={() => setPestana('cobrar')}>
          Por cobrar {lista.length > 0 && <span className="cj-n">{lista.length}</span>}
        </button>
        <button role="tab" aria-selected={pestana === 'cobradas'} className={pestana === 'cobradas' ? 'on' : ''} onClick={() => setPestana('cobradas')}>Cobradas</button>
      </div>

      {error && <p className="cj-error" role="alert">{error}</p>}

      {pestana === 'cobrar' ? (
        porCobrar === null ? <p className="cj-vacio">Cargando…</p>
          : lista.length === 0 ? (
            <div className="cj-vacio cj-vacio--grande">
              <span aria-hidden="true">💵</span>
              <p>No hay nada por cobrar.</p>
              <small>Cada comanda aparece aquí apenas sale hacia la cocina, y cuando termina su recorrido le sale «Ya se cobró».</small>
            </div>
          ) : (
            <>
              {viejas > 0 && (
                <p className="cj-viejas" role="alert">⚠️ Hay <b>{viejas}</b> {viejas === 1 ? 'comanda' : 'comandas'} sin cobrar de días anteriores. Revísalas para que no se mezclen con las de hoy.</p>
              )}
              <Grupo titulo="Listas para cobrar" lista={listas} ahora={ahora} hoy={hoy} onCobrar={cobrar} />
              <Grupo titulo="En proceso" lista={enProceso} ahora={ahora} hoy={hoy} />
            </>
          )
      ) : (
        cobradas.length === 0 ? <p className="cj-vacio">Todavía no has cobrado ninguna.</p> : (
          <ul className="cj-hist">
            {cobradas.map(c => (
              <li key={c.id}>
                <span className={`cj-chip t-${claseDestino(c.destino)}`}>{palabraDestino(c.destino)}</span>
                <span className="cj-hist-txt"><b>{etiquetaDestino(c.destino)}</b><small>Cobrada {hora(c.cobradaEn)}{c.cobradaPor?.nombre ? ` · ${c.cobradaPor.nombre}` : ''}</small></span>
                <span className="cj-hist-total">{cop(totalDe(c))}</span>
                <button className="cj-btn-txt" onClick={() => descobrar(c)}>Deshacer</button>
              </li>
            ))}
          </ul>
        )
      )}

      {deshacer && (
        <div className="cj-toast" role="status">
          <span>✓ {etiquetaDestino(deshacer.destino)} cobrada · {cop(totalDe(deshacer))}</span>
          <button onClick={() => descobrar(deshacer)}>Deshacer</button>
        </div>
      )}
    </div>
  )
}

function Grupo({ titulo, lista, ahora, hoy, onCobrar }) {
  if (!lista.length) return null
  return (
    <section className="cj-grupo">
      <h3 className="cj-sub">{titulo} · {lista.length}</h3>
      <div className="cj-grid">
        {lista.map(({ c, e }) => {
          const desde = ms(c.creadaEn)
          const vieja = desde && desde < hoy.getTime()
          const vivos = (c.items || []).filter(it => !it.quitado)
          return (
            <article key={c.id} className={`cj-card t-${claseDestino(c.destino)} ${e.fin ? 'is-fin' : ''} ${vieja ? 'is-vieja' : ''}`}>
              <header className="cj-card-cab">
                <span className="cj-dest">{palabraDestino(c.destino)}<b>{c.destino?.mesa || c.destino?.nombre || ''}</b></span>
                <span className="cj-cod">{c.codigo || (vieja ? new Date(desde).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '')}</span>
              </header>
              <div className="cj-card-cuerpo">
                <p className="cj-etapa">{e.txt}</p>
                <ul className="cj-items">
                  {vivos.map(it => <li key={it.uid}><b>{it.cantidad}×</b> {it.nombre}{it.opciones ? <small> · {it.opciones}</small> : null}</li>)}
                </ul>
                {c.envio > 0 && <p className="cj-envio">+ envío {cop(c.envio)}</p>}
                <div className="cj-pie">
                  <span className="cj-total">{cop(totalDe(c))}</span>
                  <small>hace {desde ? minutosSeg((ahora - desde) / 1000) : '—'}{c.creadaPor?.nombre ? ` · ${c.creadaPor.nombre}` : ''}</small>
                </div>
                {e.fin
                  ? <button className="cj-cobrar" onClick={() => onCobrar(c)}>💵 Ya se cobró</button>
                  : <p className="cj-espera">Se cobra cuando termine su recorrido</p>}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const totalDe = c => (Number(c.total) || 0) + (Number(c.envio) || 0)
function hora(t) { const m = ms(t); return m ? new Date(m).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : '' }
