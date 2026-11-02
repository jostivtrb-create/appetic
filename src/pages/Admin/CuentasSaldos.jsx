import { Fragment, useEffect, useState } from 'react'
import { cop } from '../../utils/money'
import { ms } from '../../services/comandas'
import { motivoErrorCuentas } from '../../services/cuentas'
import { jornadaDe, etiquetaJornada, horaCorta } from '../../utils/jornada'
import { cuentasDe, emojiCuenta } from '../../utils/cuentasDinero'
import { primerNombre } from './CajaVentas'

// 💳 SALDOS (Cuentas, guía «Cuentas del negocio» D7, D24, D25): cuánto hay en cada cuenta. No se
// abre ni se cierra caja: cada venta suma y el dueño SACA (retiro), METE (ingreso) o MUEVE plata
// entre cuentas (consignar el efectivo al banco, que no es gasto). Abajo, todo lo que movió la
// plata sin ser venta, por día; equivocarse se arregla eliminando con motivo.
const ACCIONES = {
  retiro: { t: 'Sacar plata', ico: '➖', ayuda: 'Ej.: el dueño saca $120.000 de la caja. No cuenta como gasto del negocio.', concepto: '¿Para qué? (opcional)' },
  ingreso: { t: 'Meter plata', ico: '➕', ayuda: 'Ej.: la base para vueltas, o plata que entra sin ser venta.', concepto: '¿De dónde sale? (opcional)' },
  traslado: { t: 'Mover entre cuentas', ico: '🔁', ayuda: 'Ej.: consignar el efectivo en el banco. No es gasto ni venta.', concepto: 'Nota (opcional)' },
}
const ETIQUETA = { gasto: '💸 Gasto', nomina: '👥 Nómina', retiro: '➖ Retiro', ingreso: '➕ Ingreso', traslado: '🔁 Movimiento' }
const numero = t => Number(String(t).replace(/\D/g, '')) || 0

export default function CuentasSaldos({ local, api, saldos, usuario }) {
  const cuentas = cuentasDe(local)
  const [accion, setAccion] = useState(null)     // { tipo, cuenta }
  const [lista, setLista] = useState(null)
  const [hayMas, setHayMas] = useState(false)
  const [n, setN] = useState(30)
  const [borrando, setBorrando] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const por = { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' }
  useEffect(() => api.escucharMovimientos((l, mas) => { setLista(l); setHayMas(mas) }, e => setError(motivoErrorCuentas(e)), { n }), [api, n])
  const hoy = jornadaDe(Date.now(), local.horario)
  const nombre = id => cuentas.find(c => c.id === id)?.nombre || 'Cuenta borrada'

  async function eliminar() {
    if (!motivo.trim()) return
    try { await api.eliminarMovimiento(borrando, por, motivo); setBorrando(null); setMotivo('') } catch (e) { setError(motivoErrorCuentas(e)) }
  }

  return (
    <div className="pv-panel cu-panel">
      <div className="cu-saldos">
        {cuentas.map(c => (
          <article key={c.id} className="pv-card cu-saldo">
            <header><span aria-hidden="true">{emojiCuenta(c)}</span><b>{c.nombre}</b></header>
            <strong className={(saldos[c.id] || 0) < 0 ? 'neg' : ''}>{cop(saldos[c.id] || 0)}</strong>
            <div className="cu-saldo-acc">
              <button type="button" onClick={() => setAccion({ tipo: 'ingreso', cuenta: c.id })}>➕ Meter</button>
              <button type="button" onClick={() => setAccion({ tipo: 'retiro', cuenta: c.id })}>➖ Sacar</button>
              {cuentas.length > 1 && <button type="button" onClick={() => setAccion({ tipo: 'traslado', cuenta: c.id })}>🔁 Mover</button>}
            </div>
          </article>
        ))}
      </div>
      <p className="pv-nota">Las ventas suman solas en la cuenta con que se pagó; los gastos y la nómina restan de la cuenta de donde salieron. Si un saldo no coincide con la realidad, ajústalo con «Meter» o «Sacar».</p>
      {error && <p className="pv-error" role="alert">{error}</p>}

      <h2 className="pv-panel-titulo">Movimientos de plata</h2>
      <div className="pv-card pv-ventas">
        {lista === null ? <p className="pv-vacio">Cargando…</p>
          : !lista.length ? <p className="pv-vacio">Todavía no hay movimientos.</p>
            : lista.map((m, i, arr) => (
              <Fragment key={m.id}>
                {(i === 0 || arr[i - 1].jornada !== m.jornada) && <div className="pv-dia"><span>{etiquetaJornada(m.jornada, hoy)}</span></div>}
                <div className={`pv-venta pv-gasto-fila${m.estado !== 'ok' ? ' eliminada' : ''}`}>
                  <span className="pv-venta-hora">{horaCorta(ms(m.en))}</span>
                  <span className="pv-venta-info">
                    <b>{ETIQUETA[m.tipo]}{m.tipo === 'nomina' ? ` · ${m.trabajador || ''}` : m.concepto ? ` · ${m.concepto}` : ''}</b>
                    <small>{m.estado !== 'ok'
                      ? `Eliminado por ${primerNombre(m.eliminado?.por)} · ${m.eliminado?.motivo || ''}`
                      : `${primerNombre(m.por)} · ${m.tipo === 'traslado' ? `${nombre(m.cuenta)} → ${nombre(m.cuentaDestino)}` : nombre(m.cuenta)}`}</small>
                  </span>
                  <span className={`pv-venta-total${m.tipo === 'ingreso' ? ' cu-mas' : ''}`}>{m.tipo === 'ingreso' ? '+' : m.tipo === 'traslado' ? '' : '−'} {cop(m.monto)}</span>
                  {m.estado === 'ok' && <button type="button" className="pv-x-mini" aria-label="Eliminar movimiento" onClick={() => { setBorrando(m); setMotivo('') }}>🗑</button>}
                </div>
              </Fragment>
            ))}
        {hayMas && <button type="button" className="pv-ver-mas" onClick={() => setN(x => x + 30)}>Ver más</button>}
      </div>

      {accion && <Movimiento local={local} api={api} por={por} accion={accion} saldos={saldos} onCerrar={() => setAccion(null)} />}

      {borrando && (
        <div className="pv-hoja-fondo centro" onClick={() => setBorrando(null)}>
          <div className="pv-hoja pv-detalle" role="dialog" aria-modal="true" aria-label="Eliminar movimiento" onClick={e => e.stopPropagation()}>
            <button type="button" className="pv-hoja-x" aria-label="Cerrar" onClick={() => setBorrando(null)}>✕</button>
            <h2>Eliminar movimiento</h2>
            <p className="pv-nota">{ETIQUETA[borrando.tipo]} · {cop(borrando.monto)}. La plata vuelve a como estaba y queda tachado con tu nombre.</p>
            <textarea className="pv-motivo" autoFocus maxLength={140} placeholder="¿Por qué se elimina? (obligatorio)" value={motivo} onChange={e => setMotivo(e.target.value)} />
            <div className="pv-eliminar-acc">
              <button type="button" className="pv-link" onClick={() => setBorrando(null)}>Volver</button>
              <button type="button" className="pv-peligro" disabled={!motivo.trim()} onClick={eliminar}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Movimiento({ local, api, por, accion, saldos, onCerrar }) {
  const cuentas = cuentasDe(local)
  const a = ACCIONES[accion.tipo]
  const [cuenta, setCuenta] = useState(accion.cuenta)
  const [destino, setDestino] = useState(cuentas.find(c => c.id !== accion.cuenta)?.id)
  const [monto, setMonto] = useState('')
  const [concepto, setConcepto] = useState('')
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  const sale = accion.tipo !== 'ingreso'
  const queda = (saldos[cuenta] || 0) + (sale ? -numero(monto) : numero(monto))
  const listo = numero(monto) > 0 && (accion.tipo !== 'traslado' || (destino && destino !== cuenta)) && estado !== 'guardando'

  async function guardar(e) {
    e.preventDefault()
    if (!listo) return
    setEstado('guardando'); setError('')
    try {
      await api.registrarMovimiento({ tipo: accion.tipo, cuenta, cuentaDestino: accion.tipo === 'traslado' ? destino : undefined, monto: numero(monto), concepto }, por, local)
      onCerrar()
    } catch (err) { setEstado(''); setError(motivoErrorCuentas(err)) }
  }
  const Chips = ({ valor, onCambio, excluir }) => (
    <div className="cb-cuentas">
      {cuentas.filter(c => c.id !== excluir).map(c => (
        <button type="button" key={c.id} className={valor === c.id ? 'on' : ''} onClick={() => onCambio(c.id)}><span aria-hidden="true">{emojiCuenta(c)}</span>{c.nombre}</button>
      ))}
    </div>
  )

  return (
    <div className="pv-hoja-fondo centro" onClick={onCerrar}>
      <form className="pv-hoja pv-detalle" role="dialog" aria-modal="true" aria-label={a.t} onClick={e => e.stopPropagation()} onSubmit={guardar}>
        <button type="button" className="pv-hoja-x" aria-label="Cerrar" onClick={onCerrar}>✕</button>
        <h2>{a.ico} {a.t}</h2>
        <p className="pv-nota">{a.ayuda}</p>
        <div className="cb-sec">
          <h3>{accion.tipo === 'ingreso' ? 'A qué cuenta' : 'De qué cuenta'}</h3>
          <Chips valor={cuenta} onCambio={id => { setCuenta(id); if (id === destino) setDestino(cuentas.find(c => c.id !== id)?.id) }} />
        </div>
        {accion.tipo === 'traslado' && (
          <div className="cb-sec">
            <h3>A qué cuenta</h3>
            <Chips valor={destino} onCambio={setDestino} excluir={cuenta} />
          </div>
        )}
        <input className="cu-monto" inputMode="numeric" autoFocus placeholder="$0" value={monto ? cop(numero(monto)) : ''} onChange={e => setMonto(e.target.value)} />
        <input className="cb-motivo" maxLength={60} placeholder={a.concepto} value={concepto} onChange={e => setConcepto(e.target.value)} />
        {numero(monto) > 0 && <p className="pv-nota">En {cuentas.find(c => c.id === cuenta)?.nombre} quedarían <b className={queda < 0 ? 'cu-neg' : ''}>{cop(queda)}</b>{queda < 0 ? ' (más de lo que hay)' : ''}.</p>}
        {error && <p className="pv-error" role="alert">⚠️ {error}</p>}
        <button className="pv-cobrar" disabled={!listo}>{estado === 'guardando' ? 'Guardando…' : `${a.t}${numero(monto) ? ` · ${cop(numero(monto))}` : ''}`}</button>
      </form>
    </div>
  )
}
