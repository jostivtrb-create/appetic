import { Fragment, useEffect, useMemo, useState } from 'react'
import { cop } from '../../utils/money'
import { ms } from '../../services/comandas'
import { motivoErrorCuentas, POR_PAGINA } from '../../services/cuentas'
import { jornadaDe, etiquetaJornada, horaCorta } from '../../utils/jornada'
import { cuentasDe, emojiCuenta } from '../../utils/cuentasDinero'
import Cobro from './Cobro'
import { ventanaSiHaceFalta } from './Impresora'
import { ticketDe } from '../../utils/impresora/documento'
import { motivoImpresora } from '../../utils/impresora/conexion'

// 🧾 VENTAS (Caja, guía «Cuentas del negocio» D23 — el historial de La Catrina, mejorado):
// la última primero, de a 20, con un encabezado pegajoso por día (con su total). Cada fila:
// hora · qué se vendió · quién · cómo pagó · total. Tocarla abre el detalle, y desde ahí se
// CAMBIA EL PAGO o se ELIMINA (con motivo obligatorio). Las eliminadas no se borran: salen en el
// filtro «Eliminadas» con quién y por qué. El cajero solo corrige las de hoy; el dueño, todas (S17).
export const primerNombre = p => String(p?.nombre || p?.email || '').trim().split(/[\s@]/)[0] || '—'
export const textoItems = items => (items || []).filter(it => it.productoId !== '_envio').map(it => `${it.cantidad} ${it.nombre}`).join(', ')
export function textoPago(v) {
  if (!v.pagos?.length) return v.descuento?.cortesia ? 'Cortesía' : '—'
  return v.pagos.length > 1 ? 'Dividido' : v.pagos[0].nombre
}

export default function CajaVentas({ local, cuentasApi, usuario, esAdmin, impresora = null }) {
  const [eliminadas, setEliminadas] = useState(false)
  const [n, setN] = useState(POR_PAGINA)
  const [lista, setLista] = useState(null)
  const [hayMas, setHayMas] = useState(false)
  const [error, setError] = useState('')
  const [abierta, setAbierta] = useState(null)
  useEffect(() => {
    setLista(null)
    return cuentasApi.escucharVentas((l, mas) => { setLista(l); setHayMas(mas); setError('') }, e => setError(motivoErrorCuentas(e)), { n, eliminadas })
  }, [cuentasApi, n, eliminadas])
  useEffect(() => { setN(POR_PAGINA) }, [eliminadas])

  const hoy = jornadaDe(Date.now(), local.horario)
  const totalesDia = useMemo(() => {
    const t = {}
    for (const v of lista || []) t[v.jornada] = (t[v.jornada] || 0) + (v.total || 0)
    return t
  }, [lista])
  const ventaViva = abierta && (lista || []).find(v => v.id === abierta.id)

  return (
    <div className="pv-panel">
      <div className="pv-panel-cab">
        <h2 className="pv-panel-titulo">🧾 Ventas</h2>
        <div className="cb-mini" role="radiogroup" aria-label="Filtro">
          <button role="radio" aria-checked={!eliminadas} className={!eliminadas ? 'on' : ''} onClick={() => setEliminadas(false)}>Válidas</button>
          <button role="radio" aria-checked={eliminadas} className={eliminadas ? 'on' : ''} onClick={() => setEliminadas(true)}>🗑 Eliminadas</button>
        </div>
      </div>
      {error && <p className="pv-error" role="alert">{error}</p>}

      <div className="pv-card pv-ventas">
        {lista === null ? <p className="pv-vacio">Cargando…</p>
          : !lista.length ? <p className="pv-vacio">{eliminadas ? 'No hay ventas eliminadas. 👌' : 'Todavía no hay ventas. Cobra la primera desde Vender.'}</p>
            : lista.map((v, i, arr) => {
              const nuevoDia = i === 0 || arr[i - 1].jornada !== v.jornada
              return (
                <Fragment key={v.id}>
                  {nuevoDia && <div className="pv-dia"><span>{etiquetaJornada(v.jornada, hoy)}</span>{!eliminadas && <b>{cop(totalesDia[v.jornada])}</b>}</div>}
                  <button type="button" className={`pv-venta${eliminadas ? ' eliminada' : ''}`} onClick={() => setAbierta(v)}>
                    <span className="pv-venta-hora">{horaCorta(ms(v.en))}</span>
                    <span className="pv-venta-info">
                      <b>{textoItems(v.items) || 'Venta'}</b>
                      <small>
                        {eliminadas
                          ? `Eliminada por ${primerNombre(v.eliminada?.por)} · ${v.eliminada?.motivo || ''}`
                          : `${primerNombre(v.por)} · ${textoPago(v)}${v.mesa ? ` · Mesa ${v.mesa}` : ''}${v.cambios?.length ? ' · ✏️' : ''}`}
                      </small>
                    </span>
                    <span className="pv-venta-total">{cop(v.total)}</span>
                  </button>
                </Fragment>
              )
            })}
        {lista?.length > 0 && (hayMas
          ? <button type="button" className="pv-ver-mas" onClick={() => setN(x => x + POR_PAGINA)}>Ver más</button>
          : <p className="pv-vacio pv-fin">Esas son todas ({lista.length}).</p>)}
      </div>

      {ventaViva && (
        <DetalleVenta local={local} venta={ventaViva} hoy={hoy} cuentasApi={cuentasApi} usuario={usuario} impresora={impresora}
          puedeCorregir={ventaViva.estado === 'ok' && (esAdmin || ventaViva.jornada === hoy)}
          onCerrar={() => setAbierta(null)} />
      )}
    </div>
  )
}

function DetalleVenta({ local, venta: v, hoy, cuentasApi, usuario, puedeCorregir, onCerrar, impresora }) {
  const [imprimiendo, setImprimiendo] = useState('')
  async function imprimirTicket() {
    if (imprimiendo === '…') return
    setImprimiendo('…')
    const ventana = ventanaSiHaceFalta()
    try { await impresora.imprimir(ticketDe(v, local), { ventana }); setImprimiendo('') }
    catch (e) { setImprimiendo(motivoImpresora(e)) }
  }
  const [paso, setPaso] = useState('')        // '' | cambiar | eliminar
  const [motivo, setMotivo] = useState('')
  const [devolver, setDevolver] = useState(null)   // con comandas: ¿la cuenta sigue pendiente?
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  const por = { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' }
  const cuentas = cuentasDe(local)
  const emoji = id => emojiCuenta(cuentas.find(c => c.id === id))
  const esEfectivo = id => cuentas.find(c => c.id === id)?.tipo === 'efectivo'
  // Lo que entró en efectivo (con la propina si fue ahí): solo entonces tiene sentido «pagó con».
  const efectivo = (v.pagos || []).filter(p => esEfectivo(p.cuenta)).reduce((s, p) => s + p.monto, 0)
    + (v.propina && esEfectivo(v.propina.cuenta) ? v.propina.valor : 0)
  const conComandas = v.comandaIds?.length > 0

  async function eliminar() {
    if (!motivo.trim() || (conComandas && devolver === null)) return
    setEstado('guardando'); setError('')
    try { await cuentasApi.eliminarVenta(v, por, motivo, { devolverComandas: !!devolver }); onCerrar() } catch (e) { setEstado(''); setError(motivoErrorCuentas(e)) }
  }

  if (paso === 'cambiar') {
    return (
      <Cobro local={local} modo="cambiar" titulo={`Venta · ${cop(v.total)}`} total={v.total} pagosIniciales={v.pagos}
        onCerrar={() => setPaso('')}
        onConfirmar={async d => { await cuentasApi.cambiarPago(v, d, por, d.motivo || ''); setPaso('') }} />
    )
  }

  return (
    <div className="pv-hoja-fondo centro" onClick={onCerrar}>
      <div className="pv-hoja pv-detalle" role="dialog" aria-modal="true" aria-label={`Venta de ${cop(v.total)}`} onClick={e => e.stopPropagation()}>
        <button type="button" className="pv-hoja-x" aria-label="Cerrar" onClick={onCerrar}>✕</button>
        <h2>Venta · {cop(v.total)}</h2>
        <div className="pv-detalle-meta">
          <span>🕒 {etiquetaJornada(v.jornada, hoy)}, {horaCorta(ms(v.en))}</span>
          <span>👤 {v.por?.nombre || v.por?.email || 'Sin registro'}</span>
          {v.mesa && <span>🪑 Mesa {v.mesa}</span>}
        </div>
        {v.estado === 'eliminada' && (
          <p className="pv-eliminada">🗑 Eliminada por <b>{v.eliminada?.por?.nombre || v.eliminada?.por?.email}</b> · {horaCorta(v.eliminada?.en)}<br />«{v.eliminada?.motivo}»</p>
        )}
        <ul className="pv-detalle-items">
          {(v.items || []).map((it, k) => (
            <li key={k}>
              <b className="pv-pedido-n">{it.cantidad}</b>
              <span className="pv-pedido-nombre">{it.nombre}{it.opciones ? <small>{it.opciones}</small> : null}</span>
              <span className="pv-pedido-puntos" aria-hidden="true" />
              <span className="pv-pedido-valor">{cop(it.precio)}</span>
            </li>
          ))}
        </ul>
        <div className="pv-detalle-pago">
          {v.descuento && <div><span>{v.descuento.cortesia ? '🎁 Cortesía' : '🏷️ Descuento'}{v.descuento.motivo ? ` · ${v.descuento.motivo}` : ''}</span><b>− {cop(v.descuento.valor)}</b></div>}
          {(v.pagos || []).map((p, k) => <div key={k}><span>{emoji(p.cuenta)} {p.nombre}</span><b>{cop(p.monto)}</b></div>)}
          {v.propina && <div><span>🙌 Propina · {v.propina.nombre}</span><b>{cop(v.propina.valor)}</b></div>}
          {v.recibido > 0 && efectivo > 0 && <div className="suave"><span>Pagó con {cop(v.recibido)}</span><b>vueltas {cop(Math.max(0, v.recibido - efectivo))}</b></div>}
          <div className="total"><span>Total</span><b>{cop(v.total)}</b></div>
        </div>
        {v.cambios?.length > 0 && (
          <ul className="pv-cambios">
            {v.cambios.map((c, k) => (
              <li key={k}>✏️ {primerNombre(c.por)} cambió el pago ({c.antes.map(p => p.nombre).join(' + ')} → {c.despues.map(p => p.nombre).join(' + ')}){c.motivo ? ` · «${c.motivo}»` : ''}</li>
            ))}
          </ul>
        )}

        {impresora?.activa && v.estado === 'ok' && paso === '' && (
          <div className="pv-detalle-acc">
            <button type="button" className="pv-mandar" disabled={imprimiendo === '…'} onClick={imprimirTicket}>{imprimiendo === '…' ? 'Imprimiendo…' : '🖨️ Imprimir ticket'}</button>
            {imprimiendo && imprimiendo !== '…' && <p className="pv-error" role="alert">⚠️ {imprimiendo}</p>}
          </div>
        )}
        {puedeCorregir && paso === '' && (
          <div className="pv-detalle-acc">
            {v.pagos?.length > 0 && <button type="button" className="pv-mandar" onClick={() => setPaso('cambiar')}>✏️ Cambiar el pago</button>}
            <button type="button" className="pv-link peligro" onClick={() => setPaso('eliminar')}>Eliminar venta</button>
          </div>
        )}
        {paso === 'eliminar' && (
          <div className="pv-eliminar">
            <p>La plata sale de su cuenta y la venta deja de contar. Queda a la vista en «Eliminadas» con tu nombre.</p>
            {conComandas && (
              <div className="pv-elim-q" role="radiogroup" aria-label="¿La cuenta sigue pendiente?">
                <b>¿La cuenta sigue pendiente de pago?</b>
                <button type="button" role="radio" aria-checked={devolver === true} className={devolver === true ? 'on' : ''} onClick={() => setDevolver(true)}>
                  Sí, se cobró mal<small>Vuelve a «por cobrar» para cobrarla bien</small>
                </button>
                <button type="button" role="radio" aria-checked={devolver === false} className={devolver === false ? 'on' : ''} onClick={() => setDevolver(false)}>
                  No, estaba repetida<small>Se queda cerrada, sin cobrar de nuevo</small>
                </button>
              </div>
            )}
            <textarea autoFocus maxLength={140} placeholder="¿Por qué se elimina? (obligatorio)" value={motivo} onChange={e => setMotivo(e.target.value)} />
            {error && <p className="pv-error" role="alert">⚠️ {error}</p>}
            <div className="pv-eliminar-acc">
              <button type="button" className="pv-link" onClick={() => { setPaso(''); setMotivo('') }}>Volver</button>
              <button type="button" className="pv-peligro" disabled={!motivo.trim() || (conComandas && devolver === null) || estado === 'guardando'} onClick={eliminar}>
                {estado === 'guardando' ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
        {!puedeCorregir && v.estado === 'ok' && <p className="pv-nota">Solo el dueño puede corregir ventas de otros días.</p>}
      </div>
    </div>
  )
}
