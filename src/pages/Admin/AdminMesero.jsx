import { useEffect, useMemo, useRef, useState } from 'react'
import {
  comandasDe, etiquetaDestino, claveMesa, ms, motivoError,
} from '../../services/comandas'
import AdminEquipo from './AdminEquipo'
import ActivarAvisos from './ActivarAvisos'
import CorregirComanda, { Cuidado } from './CorregirComanda'
import PorConfirmar from './PorConfirmar'
import { pedidosDe } from '../../services/pedidos'
import { urlWhatsApp, normalizarTel, mensajeTotalCambio } from '../../utils/whatsapp'
import { useAhora, minutosSeg, nivelTiempo, umbralesDe, coloresComanda, itemsTxt, claseDestino } from './comandaUtils'
import './Mesero.css'
import './Cobro.css'
import './Caja.css'
import CajaVender from './CajaVender'

// 🧑‍🍳 PANTALLA DEL MESERO (guía «Mesero y Comandas», paso 1; estética de La Catrina desde la guía
// «Cuentas del negocio» D29).
//   • «Pedir»: la MISMA pantalla de la Caja (CajaVender, modo mesero): fichas de mesas abiertas,
//     cuadrícula con ⭐ Frecuentes, ticket a la derecha en el PC; los productos con opciones abren
//     el MISMO modal del cliente. Cada ítem lleva su nota para cocina. «Enviar a cocina» manda a la
//     mesa elegida o pregunta para dónde va (mesa por teclado, otro nombre o para llevar).
//   • «En curso»: todas las comandas vivas del local, por mesa, con lo que ya salió tachado.
//     Desde ahí se cancela una comanda. Cuando la cocina entrega una que mandó ESTE mesero,
//     aparece arriba un aviso que parpadea hasta que lo toca.
export default function AdminMesero({ local, productos, demo, usuario, esAdmin }) {
  const api = useMemo(() => comandasDe(local.id, { demo }), [local.id, demo])
  const [vista, setVista] = useState('tomar') // tomar | curso
  const [activas, setActivas] = useState([])
  const [recientes, setRecientes] = useState([])
  const [errorEscucha, setErrorEscucha] = useState('')

  useEffect(() => api.escucharActivas(l => { setActivas(l); setErrorEscucha('') }, e => setErrorEscucha(motivoError(e))), [api])
  useEffect(() => api.escucharRecientes(l => setRecientes(l), () => {}), [api])
  // Las cuentas abiertas (lo que falta cobrar) son las fichas de mesa de la pantalla de pedir.
  const [porCobrar, setPorCobrar] = useState(null)
  useEffect(() => api.escucharPorCobrar(setPorCobrar, () => {}), [api])

  const yo = (usuario?.email || '').toLowerCase()
  const listos = useListos(recientes, yo, local.id)

  return (
    <div className="pv ms-pv" style={coloresComanda(local).vars}>
      {!demo && !local.esDemo && <ActivarAvisos local={local} usuario={usuario} />}
      {esAdmin && (
        <div className="ms-admin">
          <AdminEquipo local={local} rol="mesero" demo={demo} />
        </div>
      )}

      {listos.pendientes.length > 0 && (
        <button className="ms-listo" onClick={() => { listos.marcarVistos(); setVista('curso') }}>
          <span className="ms-listo-campana" aria-hidden="true">🔔</span>
          <span>
            <strong>{listos.pendientes.length === 1 ? '¡Pedido listo!' : `¡${listos.pendientes.length} pedidos listos!`}</strong>
            {' '}{listos.pendientes.map(c => etiquetaDestino(c.destino)).join(' · ')}
          </span>
          <span className="ms-listo-ok">Entendido</span>
        </button>
      )}

      <PorConfirmar local={local} demo={demo} usuario={usuario} />

      {/* Guía «Cuentas del negocio» D29: el orden del POS de La Catrina (pestañas abajo en el
          celular, arriba en el PC) y la misma pantalla de pedir que la Caja, sin cobrar. */}
      <nav className="pv-vistas" aria-label="Secciones del mesero">
        <button type="button" className={vista === 'tomar' ? 'on' : ''} aria-current={vista === 'tomar' ? 'page' : undefined} onClick={() => setVista('tomar')}>
          <span className="pv-vistas-ico" aria-hidden="true">🛒</span><span>Pedir</span>
        </button>
        <button type="button" className={vista === 'curso' ? 'on' : ''} aria-current={vista === 'curso' ? 'page' : undefined} onClick={() => setVista('curso')}>
          <span className="pv-vistas-ico" aria-hidden="true">🔥{activas.length > 0 && <i>{activas.length}</i>}</span><span>En curso</span>
        </button>
      </nav>

      {errorEscucha && <p className="ms-aviso-red">{errorEscucha}</p>}

      {vista === 'tomar'
        ? <CajaVender modo="mesero" conPorConfirmar={false} local={local} productos={productos} api={api} demo={demo} usuario={usuario} porCobrar={porCobrar} />
        : <div className="ms ms-curso"><EnCurso local={local} productos={productos} api={api} activas={activas} recientes={recientes} usuario={usuario} demo={demo} /></div>}
    </div>
  )
}

// ─────────────────────────────── En curso ───────────────────────────────

function EnCurso({ local, productos, api, activas, recientes, usuario, demo }) {
  const ahora = useAhora()
  const umbrales = umbralesDe(local)
  const colores = coloresComanda(local)
  const [cancelando, setCancelando] = useState(null)
  const [corrigiendo, setCorrigiendo] = useState(null)   // id de la comanda en corrección
  const [cuidadoCancelar, setCuidadoCancelar] = useState(null)
  const [guardada, setGuardada] = useState(false)
  const [totalCambio, setTotalCambio] = useState(null) // { pedido, total } tras corregir un pedido de la app (D34)
  const enCorreccion = corrigiendo ? activas.find(c => c.id === corrigiendo) : null

  // Agrupadas por mesa / nombre; dentro, por orden de llegada.
  const grupos = useMemo(() => {
    const m = new Map()
    for (const c of activas) {
      const k = claveMesa(c.destino) || `llevar:${c.id}`
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(c)
    }
    return [...m.values()]
  }, [activas])

  const entregadasHoy = recientes.filter(c => c.estado === 'entregada').slice(0, 8)

  // Cancelar una comanda que ya tiene algo hecho pasa por el CUIDADO (igual que corregir).
  function pedirCancelar(c) {
    if (c.items.some(it => it.hecho && !it.quitado)) setCuidadoCancelar(c)
    else setCancelando(c.id)
  }

  async function cancelar(c) {
    await api.cancelar(c, { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' })
    // Pedido de la app cancelado: el cliente lo ve como no atendido en «Mi pedido».
    if (c.pedidoId) pedidosDe(local.id, { demo }).cambiarEstado(c.pedidoId, 'rechazado').catch(() => {})
    setCancelando(null)
  }

  return (
    <div className="ms-curso" style={colores.vars}>
      {grupos.length === 0 && <p className="ms-vacio ms-vacio--grande">No hay pedidos en curso.</p>}
      {grupos.map(lista => (
        <section key={lista[0].id} className="ms-mesa">
          <h3 className={`ms-mesa-tit ${claseDestino(lista[0].destino)}`}>{etiquetaDestino(lista[0].destino)}</h3>
          {lista.map(c => {
            const vivos = c.items.filter(i => !i.quitado)
            const hechos = vivos.filter(i => i.hecho).length
            const seg = (ahora - (ms(c.creadaEn) || ahora)) / 1000
            const ultimo = c.cambios?.at(-1)
            const segCambio = c.cambiadaEn ? (ahora - ms(c.cambiadaEn)) / 1000 : 0
            return (
              <article key={c.id} className="ms-com">
                <div className="ms-com-cab">
                  <span className={`ms-reloj ${nivelTiempo(seg, umbrales)}`}>⏱ {minutosSeg(seg)}</span>
                  <span className="ms-com-prog">{hechos}/{vivos.length} listos</span>
                  {c.creadaPor?.nombre && <span className="ms-com-quien">La tomó {c.creadaPor.nombre.split(' ')[0]}</span>}
                </div>
                {/* ¿La cocina ya vio la corrección? (S18: lo que se está cocinando sin tachar no lo sabe el sistema) */}
                {c.cambioPendiente && (
                  <p className={`ms-cambio ${segCambio > 60 ? 'urgente' : ''}`}>
                    {segCambio > 60 ? '⚠️ La cocina no ha visto el cambio · ve a avisarle' : '⏳ Cocina aún no ha visto el cambio'}
                  </p>
                )}
                {!c.cambioPendiente && ultimo && (
                  <p className="ms-cambio visto">✓ Cocina vio el cambio · {ultimo.por?.nombre?.split(' ')[0] || 'alguien'} {ultimo.resumen}</p>
                )}
                <ul className="ms-com-items">
                  {vivos.map(it => (
                    <li key={it.uid} className={it.hecho ? 'hecho' : ''}>
                      <span>{it.hecho ? '✓' : '•'} {it.cantidad}× {it.nombre}</span>
                      {it.opciones && <small>{it.opciones}</small>}
                      {it.comentario && <em>💬 {it.comentario}</em>}
                    </li>
                  ))}
                </ul>
                {cancelando === c.id ? (
                  <div className="ms-cancelar-seguro">
                    <p>¿Cancelar la comanda de <strong>{etiquetaDestino(c.destino)}</strong>? La cocina la verá CANCELADA.</p>
                    <div>
                      <button className="btn ms-btn-peligro" onClick={() => cancelar(c)}>Sí, cancelar</button>
                      <button className="btn btn-ghost" onClick={() => setCancelando(null)}>No</button>
                    </div>
                  </div>
                ) : (
                  <div className="ms-com-acc">
                    <button className="ms-corregir" onClick={() => setCorrigiendo(c.id)}>✏️ Corregir</button>
                    <button className="ms-cancelar" onClick={() => pedirCancelar(c)}>Cancelar comanda</button>
                  </div>
                )}
              </article>
            )
          })}
        </section>
      ))}

      {guardada && <div className="ms-toast" role="status">✓ Corrección enviada a cocina</div>}

      {enCorreccion && (
        <CorregirComanda
          comanda={enCorreccion} productos={productos} api={api} usuario={usuario}
          onCerrar={async ok => {
            const c = enCorreccion
            setCorrigiendo(null)
            if (!ok) return
            setGuardada(true); setTimeout(() => setGuardada(false), 3000)
            // Pedido de la app: el pedido queda igual que la comanda (el domiciliario cobra lo
            // correcto) y, si cambió el total, se ofrece avisarle al cliente (D34, S25).
            if (c?.pedidoId) {
              try {
                const fresca = await api.obtener(c.id)
                if (!fresca) return
                const r = await pedidosDe(local.id, { demo }).sincronizarConComanda(fresca)
                if (r && r.antes !== r.ahora) setTotalCambio({ pedido: r.pedido, total: r.ahora })
              } catch { /* el pedido se puede actualizar a mano; la comanda ya quedó */ }
            }
          }}
        />
      )}
      {/* Si la comanda deja de estar en curso mientras se corrige (la entregaron), se cierra sola. */}
      {corrigiendo && !enCorreccion && <CerrarSolo onCerrar={() => setCorrigiendo(null)} />}

      {totalCambio && (
        <div className="ms-velo" onClick={() => setTotalCambio(null)}>
          <div className="cc-cuidado" role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <p className="cc-cuidado-tit">💲 EL TOTAL CAMBIÓ</p>
            <h3>Ahora es {'$' + Math.round(totalCambio.total).toLocaleString('es-CO')}</h3>
            <p>Avísale a {(totalCambio.pedido.cliente?.nombre || 'el cliente').split(' ')[0]} para que no haya sorpresas al pagar.</p>
            <button className="cc-ir" onClick={() => {
              const tel = normalizarTel(totalCambio.pedido.cliente?.telefono)
              if (tel) window.open(urlWhatsApp(tel, mensajeTotalCambio(local, totalCambio.pedido, totalCambio.total)), '_blank')
              setTotalCambio(null)
            }}>💬 Avisar por WhatsApp</button>
            <button className="cc-no" onClick={() => setTotalCambio(null)}>Ahora no</button>
          </div>
        </div>
      )}

      {cuidadoCancelar && (
        <Cuidado
          titulo={`${etiquetaDestino(cuidadoCancelar.destino)} ya tiene platos hechos`}
          onIr={() => { setCancelando(cuidadoCancelar.id); setCuidadoCancelar(null) }}
          onCancelar={() => setCuidadoCancelar(null)}
        />
      )}

      {entregadasHoy.length > 0 && (
        <>
          <h3 className="ms-sub">Entregadas hace poco</h3>
          <ul className="ms-entregadas">
            {entregadasHoy.map(c => (
              <li key={c.id}>
                <strong>{etiquetaDestino(c.destino)}</strong>
                <span>{itemsTxt(c.cantidadItems)} · {hora(c.entregadaEn)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function CerrarSolo({ onCerrar }) {
  useEffect(() => { onCerrar() }, [onCerrar])
  return null
}

// 🔔 Comandas de ESTE mesero que la cocina entregó y él todavía no ha visto.
// Lo «visto» se recuerda en el dispositivo para no avisar dos veces la misma.
function useListos(recientes, yo, localId) {
  const KEY = `appetic_mesero_vistos_${localId}`
  const [vistos, setVistos] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } })
  const desde = useRef(Date.now() - 30 * 60000) // solo avisos de la última media hora al abrir
  const pendientes = recientes.filter(c =>
    c.estado === 'entregada' && (c.creadaPor?.email === yo || c.origen === 'qr') && !vistos.includes(c.id)
    && (ms(c.entregadaEn) || Date.now()) >= desde.current)
  function marcarVistos() {
    const n = [...new Set([...vistos, ...pendientes.map(c => c.id)])].slice(-200)
    setVistos(n)
    try { localStorage.setItem(KEY, JSON.stringify(n)) } catch { /* nada */ }
  }
  return { pendientes, marcarVistos }
}

// ─────────────────────────────── utilidades ───────────────────────────────

function hora(t) {
  const m = ms(t)
  return m ? new Date(m).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : ''
}
