import { useMemo, useState } from 'react'
import {
  PROMOS, nombrePlan, estadoPago, fechaCorta, calcularPago, calcularDiferencia,
  puedeSegundoGratis, quiereBuscador, paquetesDe, paquetesProximos, precioMes, nombresPaquetes,
} from '../../utils/plan'
import { PAQUETES, cotizar, limpiarPaquetes } from '../../utils/paquetes'
import { registrarPago, cambiarPaquetes, programarBajada, setEstadoLocal } from '../../services/superadmin'
import { cop } from '../../utils/money'
import { urlWhatsApp } from '../../utils/whatsapp'

// 💳 SUPERADMIN · Plan y pago de los locales (guía «Planes en la app» D1, D4, D12, D16, D17).
// 📦 Fase B (guía «Paquetes de Appetic»): se cobran y se cambian PAQUETES, no planes.
//   <ChipPago>      el estado en una etiqueta (al lado del nombre del local)
//   <PlanLocal>     dentro de cada local: plan, registrar pago, cambiar plan, estado e historial
//   <TableroCobros> arriba: «Vencen esta semana» con recordatorio por WhatsApp y lo cobrado por mes

const TXT = {
  cortesia: ['Cortesía', 'gris'],
  montaje: ['Montaje', 'azul'],
  'al-dia': ['Al día', 'verde'],
  'por-vencer': ['Por vencer', 'naranja'],
  gracia: ['En gracia', 'rojo'],
  cortado: ['Apagado', 'rojo'],
}

export function ChipPago({ local }) {
  const p = estadoPago(local)
  const [txt, color] = TXT[p.estado]
  return (
    <span className={`sp-chip sp-chip--${color}`}>
      {nombresPaquetes(paquetesDe(local))} · {txt}
    </span>
  )
}

function detalle(p) {
  if (p.estado === 'cortesia') return 'Sin vencimiento ni cobro.'
  if (p.estado === 'montaje') return `Le quedan ${p.dias} ${p.dias === 1 ? 'día' : 'días'} de montaje; sin pago se apaga solo.`
  if (p.estado === 'cortado') return p.vence ? `Venció el ${fechaCorta(p.vence)}. Apagado.` : 'Se acabó el montaje sin pago. Apagado.'
  if (p.estado === 'gracia') return `Venció el ${fechaCorta(p.vence)}: ${p.dias} ${p.dias === 1 ? 'día' : 'días'} de gracia.`
  return `Pagado hasta el ${fechaCorta(p.vence)}.`
}

export function PlanLocal({ local, pagos, onCambio, onPago, abiertoInicial = false }) {
  const [abierto, setAbierto] = useState(abiertoInicial)
  const [modo, setModo] = useState('')          // '' | pago | plan
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const p = estadoPago(local)
  const mios = paquetesDe(local)
  const proximos = paquetesProximos(local)

  async function correr(fn) {
    setOcupado(true); setError('')
    try { await fn(); setModo('') } catch (e) { console.error(e); setError('No se pudo guardar. Revisa la conexión y las reglas.') }
    setOcupado(false)
  }

  return (
    <div className="sa-tags sp">
      <button className="sa-tags-head" onClick={() => setAbierto(a => !a)}>
        <span className="sa-admin-ico">💳</span>
        <span className="sa-tags-resumen">
          {nombresPaquetes(mios)} · {cop(precioMes(local))}/mes · {detalle(p)}{proximos ? ` · Desde el próximo pago: ${nombresPaquetes(proximos)}` : ''}
          {quiereBuscador(local) ? ' · 🔎 quiere buscador' : ''}
        </span>
        <span className="sa-tags-chevron">{abierto ? '▲' : '▼'}</span>
      </button>

      {abierto && (
        <div className="sa-tags-body sp-body">
          <div className="sp-botones">
            <button className={`sa-tag ${modo === 'pago' ? 'on' : ''}`} onClick={() => setModo(m => m === 'pago' ? '' : 'pago')}>💵 Registrar pago</button>
            <button className={`sa-tag ${modo === 'plan' ? 'on' : ''}`} onClick={() => setModo(m => m === 'plan' ? '' : 'plan')}>📦 Cambiar paquetes</button>
            {p.estado !== 'montaje' && p.estado !== 'al-dia' && p.estado !== 'por-vencer' && (
              <button className="sa-tag" disabled={ocupado}
                onClick={() => { if (window.confirm(`¿Poner ${local.nombre} en montaje? Funciona completo ${7} días desde hoy y, si no se registra el pago, se apaga solo.`)) correr(async () => onCambio(await setEstadoLocal(local, 'montaje'))) }}>
                🛠️ Montaje (7 días)
              </button>
            )}
            {p.estado !== 'cortesia' && (
              <button className="sa-tag" disabled={ocupado}
                onClick={() => { if (window.confirm(`¿Dejar ${local.nombre} en cortesía? No vence ni se le cobra.`)) correr(async () => onCambio(await setEstadoLocal(local, 'cortesia'))) }}>
                🎁 Cortesía
              </button>
            )}
          </div>

          {modo === 'pago' && <FormPago local={local} pagos={pagos} ocupado={ocupado}
            onGuardar={datos => correr(async () => { onCambio(await registrarPago(local, datos)); onPago() })} />}
          {modo === 'plan' && <FormPlan local={local} ocupado={ocupado}
            onSubir={(nuevo, monto) => correr(async () => { onCambio(await cambiarPaquetes(local, nuevo, monto)); if (monto > 0) onPago() })}
            onSinCobro={nuevo => correr(async () => onCambio(await cambiarPaquetes(local, nuevo, 0)))}
            onBajar={nuevo => correr(async () => onCambio(await programarBajada(local, nuevo)))} />}
          {error && <p className="sa-admin-hint warn">{error}</p>}

          <Historial pagos={pagos} />
        </div>
      )}
    </div>
  )
}

// Casillas de paquetes (la Base va siempre; Inventario arrastra a Contabilidad).
function ElegirPaquetes({ valor, onCambio }) {
  const alternar = id => {
    if (id === 'base') return
    const s = new Set(valor)
    if (s.has(id)) { s.delete(id); for (const p of PAQUETES) if ((p.requiere || []).includes(id)) s.delete(p.id) } else s.add(id)
    onCambio(limpiarPaquetes([...s]))
  }
  return (
    <div className="sp-paquetes">
      {PAQUETES.map(p => (
        <label key={p.id} className={`sp-paq${valor.includes(p.id) ? ' on' : ''}${p.id === 'base' ? ' fijo' : ''}`}>
          <input type="checkbox" checked={valor.includes(p.id)} disabled={p.id === 'base'} onChange={() => alternar(p.id)} />
          <span>{p.icono} {p.nombre.replace(/^Paquete /, '')}</span>
          <small>{cop(p.precio)}</small>
        </label>
      ))}
      <p className="sp-resultado">Al mes: <b>{cop(cotizar(valor).total)}</b></p>
    </div>
  )
}

function FormPago({ local, pagos, ocupado, onGuardar }) {
  const [paquetes, setPaquetes] = useState(paquetesProximos(local) || paquetesDe(local))
  const primerPago = pagos.filter(x => x.tipo === 'pago').length === 0
  const promos = Object.values(PROMOS).filter(x => x.id !== 'segundo-gratis' || puedeSegundoGratis(primerPago ? 0 : 1))
  const [promo, setPromo] = useState(promos.some(x => x.id === 'segundo-gratis') ? 'segundo-gratis' : 'mes')
  const calc = useMemo(() => calcularPago(local, { paquetes, promo }), [local, paquetes, promo])
  const [monto, setMonto] = useState(null)        // null = el calculado
  const valor = monto ?? calc.monto
  return (
    <div className="sp-form">
      <ElegirPaquetes valor={paquetes} onCambio={v => { setPaquetes(v); setMonto(null) }} />
      <div className="sp-promos">
        {promos.map(x => (
          <button key={x.id} type="button" className={`sa-tag ${promo === x.id ? 'on' : ''}`} onClick={() => { setPromo(x.id); setMonto(null) }}>{x.nombre}</button>
        ))}
      </div>
      <label>Recibido
        <input type="number" inputMode="numeric" min="0" step="100" value={valor} onChange={e => setMonto(Number(e.target.value) || 0)} />
      </label>
      <p className="sp-resultado">
        Cubre <b>{calc.meses} {calc.meses === 1 ? 'mes' : 'meses'}</b>: del {fechaCorta(calc.desde)} al <b>{fechaCorta(calc.hasta)}</b>.
        {calc.desde !== local.suscripcion?.pagadoHasta && local.suscripcion?.pagadoHasta ? ' Arranca hoy porque ya estaba apagado.' : ''}
      </p>
      <button className="sa-admin-save sp-guardar" disabled={ocupado} onClick={() => onGuardar({ paquetes, promo, monto: valor })}>
        {ocupado ? 'Guardando…' : `Registrar ${cop(valor)}`}
      </button>
    </div>
  )
}

// Cambiar paquetes: si sube el precio con el pago vigente, se activa YA y se cobra la diferencia de
// los días que faltan; si baja, queda para el próximo pago (no se devuelve plata). Sin pago vigente
// (montaje, cortesía, apagado), cambia ya sin cobro.
function FormPlan({ local, ocupado, onSubir, onSinCobro, onBajar }) {
  const actual = paquetesDe(local)
  const p = estadoPago(local)
  const [nuevo, setNuevo] = useState(actual)
  const proximos = paquetesProximos(local)
  const pagando = ['al-dia', 'por-vencer', 'gracia'].includes(p.estado)
  const igual = nuevo.join() === actual.join()
  const precioNuevo = cotizar(nuevo).total, precioActual = precioMes(local)
  const sube = !igual && precioNuevo >= precioActual
  const baja = !igual && precioNuevo < precioActual
  const dif = useMemo(() => calcularDiferencia(local, nuevo), [local, nuevo])
  const [monto, setMonto] = useState(null)
  const valor = monto ?? dif.monto
  return (
    <div className="sp-form">
      <ElegirPaquetes valor={nuevo} onCambio={v => { setNuevo(v); setMonto(null) }} />
      {proximos && <p className="sp-resultado">Tiene programado quedar con <b>{nombresPaquetes(proximos)}</b> desde el próximo pago. <button type="button" className="sp-link" disabled={ocupado} onClick={() => onBajar(null)}>Cancelar</button></p>}
      {!igual && !pagando && (
        <>
          <p className="sp-resultado">Está en {TXT[p.estado][0].toLowerCase()}: cambia ya, sin cobro.</p>
          <button className="sa-admin-save sp-guardar" disabled={ocupado} onClick={() => onSinCobro(nuevo)}>Guardar paquetes</button>
        </>
      )}
      {sube && pagando && (
        <>
          <p className="sp-resultado">Se activa ya. Le faltan <b>{dif.dias} {dif.dias === 1 ? 'día' : 'días'}</b> de lo pagado: diferencia de {cop(precioNuevo - precioActual)}/mes ÷ 30 × {dif.dias}.</p>
          <label>Diferencia a cobrar
            <input type="number" inputMode="numeric" min="0" step="100" value={valor} onChange={e => setMonto(Number(e.target.value) || 0)} />
          </label>
          <button className="sa-admin-save sp-guardar" disabled={ocupado} onClick={() => onSubir(nuevo, valor)}>
            {valor > 0 ? `Activar y registrar ${cop(valor)}` : 'Activar sin cobrar diferencia'}
          </button>
        </>
      )}
      {baja && pagando && (
        <>
          <p className="sp-resultado">Sigue con lo de hoy hasta el {fechaCorta(p.vence)}; el próximo pago ya es de {nombresPaquetes(nuevo)} ({cop(precioNuevo)}/mes). No se devuelve plata.</p>
          <button className="sa-admin-save sp-guardar" disabled={ocupado} onClick={() => onBajar(nuevo)}>Programar para el próximo pago</button>
        </>
      )}
    </div>
  )
}

function Historial({ pagos }) {
  if (!pagos.length) return <p className="sa-admin-hint">Sin pagos registrados.</p>
  return (
    <ul className="sp-historial">
      {pagos.slice(0, 8).map(x => (
        <li key={x.id}>
          <span>{fechaCorta(x.fecha)}</span>
          <span>{x.tipo === 'diferencia' ? `Diferencia → ${x.paquetes ? nombresPaquetes(x.paquetes) : nombrePlan(x.plan)}` : `${x.paquetes ? nombresPaquetes(x.paquetes) : nombrePlan(x.plan)} · ${PROMOS[x.promo]?.nombre || `${x.meses} meses`}`}</span>
          <b>{cop(x.monto)}</b>
        </li>
      ))}
    </ul>
  )
}

// ─────────────────────────────── Arriba de la lista ───────────────────────────────

const recordatorio = (l, p) => {
  const ids = paquetesProximos(l) || paquetesDe(l)
  const cuando = p.estado === 'por-vencer' ? `vence el ${fechaCorta(p.vence)}`
    : p.estado === 'gracia' ? `venció el ${fechaCorta(p.vence)} y en ${p.dias} ${p.dias === 1 ? 'día' : 'días'} se apaga el menú`
      : p.estado === 'cortado' ? 'está vencido y el menú está apagado'
        : `está en montaje y le quedan ${p.dias} ${p.dias === 1 ? 'día' : 'días'}`
  return `¡Hola! Te escribimos de Appetic 👋 El plan de ${l.nombre} (${nombresPaquetes(ids)}) ${cuando}. El valor del mes es ${cop(cotizar(ids).total)}. ¿Te mandamos los datos para pagar?`
}

export function TableroCobros({ locales, pagos }) {
  const pendientes = locales
    .map(l => ({ l, p: estadoPago(l) }))
    // Los apagados salen 15 días; después ya no es un cobro de esta semana sino un cliente que se fue.
    .filter(({ p }) => ['por-vencer', 'gracia'].includes(p.estado) || (p.estado === 'montaje' && p.dias <= 3)
      || (p.estado === 'cortado' && (p.corte == null || Date.now() - p.corte < 15 * 86400000)))
    .sort((a, b) => (a.p.corte ?? 0) - (b.p.corte ?? 0))

  const porMes = useMemo(() => {
    const m = {}
    for (const x of pagos) { const k = String(x.fecha || '').slice(0, 7); if (k) m[k] = (m[k] || 0) + (Number(x.monto) || 0) }
    return Object.entries(m).sort(([a], [b]) => b.localeCompare(a)).slice(0, 6)
  }, [pagos])
  const activos = locales.filter(l => ['al-dia', 'por-vencer', 'gracia'].includes(estadoPago(l).estado))
  const alMes = activos.reduce((s, l) => s + precioMes(l), 0)

  return (
    <section className="sp-tablero">
      <div className="sp-cifras">
        <div><small>Pagando</small><strong>{activos.length}</strong><span>{cop(alMes)} al mes</span></div>
        {porMes.slice(0, 2).map(([mes, total]) => (
          <div key={mes}><small>Cobrado {nombreMes(mes)}</small><strong>{cop(total)}</strong></div>
        ))}
      </div>

      {porMes.length > 2 && (
        <p className="sa-admin-hint">Antes: {porMes.slice(2).map(([mes, t]) => `${nombreMes(mes)} ${cop(t)}`).join(' · ')}</p>
      )}

      <h3>📅 Por cobrar esta semana</h3>
      {pendientes.length === 0 ? <p className="sa-admin-hint">Nadie vence en los próximos días. 🎉</p> : (
        <ul className="sp-vencen">
          {pendientes.map(({ l, p }) => (
            <li key={l.id}>
              <span className={`sp-chip sp-chip--${TXT[p.estado][1]}`}>{TXT[p.estado][0]}</span>
              <span className="sp-vencen-txt"><b>{l.nombre}</b><small>{detalle(p)}</small></span>
              {l.whatsapp
                ? <a className="sa-admin-save" href={urlWhatsApp(l.whatsapp, recordatorio(l, p))} target="_blank" rel="noopener noreferrer">💬 Recordar</a>
                : <span className="sa-admin-hint">Sin WhatsApp</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const nombreMes = k => MESES[Number(k.slice(5, 7)) - 1] || k
