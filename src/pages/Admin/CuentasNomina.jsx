import { useEffect, useMemo, useState } from 'react'
import { cop } from '../../utils/money'
import { motivoErrorCuentas } from '../../services/cuentas'
import { jornadaDe, sumarDias, mesDe, mesAnterior, diasDelMes, nombreMes, nombreMesCorto } from '../../utils/jornada'
import { cuentasDe, cuentaEfectivo, emojiCuenta } from '../../utils/cuentasDinero'

// 👥 NÓMINA (Cuentas, guía «Cuentas del negocio» D10 + S13/S14): la lista de la gente a la que se
// le paga (use o no la app) y cada pago con LOS DÍAS QUE CUBRE, marcados en un calendario. La app
// no calcula sueldos (sirve igual por horas, turnos o días): el dueño pone cuánto y por qué días,
// y queda el registro de a quién se le pagó y qué días. El pago resta de la ganancia y de la
// cuenta de donde salió.
const numero = t => Number(String(t).replace(/\D/g, '')) || 0
const SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// ['2026-11-01','2026-11-02','2026-11-05'] → «1–2 y 5 nov»
export function rangoDias(dias) {
  if (!dias?.length) return ''
  const l = [...dias].sort()
  const tramos = []
  let ini = l[0], fin = l[0]
  for (const d of l.slice(1)) {
    if (d === sumarDias(fin, 1)) fin = d
    else { tramos.push([ini, fin]); ini = fin = d }
  }
  tramos.push([ini, fin])
  const txt = ([a, b]) => {
    const da = Number(a.slice(8)), db = Number(b.slice(8))
    if (a === b) return `${da} ${nombreMesCorto(mesDe(a))}`
    return mesDe(a) === mesDe(b) ? `${da}–${db} ${nombreMesCorto(mesDe(b))}` : `${da} ${nombreMesCorto(mesDe(a))}–${db} ${nombreMesCorto(mesDe(b))}`
  }
  const partes = tramos.map(txt)
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}` : partes[0]
}

export default function CuentasNomina({ local, api, usuario }) {
  const [gente, setGente] = useState(null)
  const [pagos, setPagos] = useState([])
  const [nuevo, setNuevo] = useState('')
  const [pagando, setPagando] = useState(null)
  const [abierto, setAbierto] = useState(null)
  const [verInactivos, setVerInactivos] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => api.escucharTrabajadores(setGente, e => setError(motivoErrorCuentas(e))), [api])
  useEffect(() => api.escucharMovimientos(l => setPagos(l.filter(m => m.estado === 'ok')), () => {}, { tipo: 'nomina', n: 400 }), [api])
  const mes = mesDe(jornadaDe(Date.now(), local.horario))
  const pagosDe = id => pagos.filter(p => p.trabajadorId === id)
  const activos = (gente || []).filter(t => t.activo !== false)
  const inactivos = (gente || []).filter(t => t.activo === false)
  const totalMes = pagos.filter(p => mesDe(p.jornada) === mes).reduce((s, p) => s + p.monto, 0)

  async function agregar(e) {
    e.preventDefault()
    if (!nuevo.trim()) return
    try { await api.guardarTrabajador({ nombre: nuevo }); setNuevo('') } catch (err) { setError(motivoErrorCuentas(err)) }
  }

  const tarjeta = t => {
    const suyos = pagosDe(t.id)
    const ult = suyos[0]
    const esteMes = suyos.filter(p => mesDe(p.jornada) === mes).reduce((s, p) => s + p.monto, 0)
    const abiertoEste = abierto === t.id
    return (
      <article key={t.id} className={`pv-card cu-persona${t.activo === false ? ' inactiva' : ''}`}>
        <button type="button" className="cu-persona-cab" onClick={() => setAbierto(abiertoEste ? null : t.id)} aria-expanded={abiertoEste}>
          <span className="cu-avatar" aria-hidden="true">{t.nombre[0]?.toUpperCase()}</span>
          <span className="cu-persona-txt">
            <b>{t.nombre}</b>
            <small>{ult ? `Último pago: ${rangoDias(ult.dias) || ult.jornada} · ${cop(ult.monto)}` : 'Sin pagos todavía'}</small>
          </span>
          <span className="cu-persona-mes"><small>{nombreMesCorto(mes)}</small><b>{cop(esteMes)}</b></span>
        </button>
        {t.activo !== false && <button type="button" className="pv-cobrar cu-pagar" onClick={() => setPagando(t)}>Pagar</button>}
        {abiertoEste && (
          <div className="cu-persona-hist">
            {suyos.length ? (
              <ul>{suyos.slice(0, 12).map(p => <li key={p.id}><span>{rangoDias(p.dias) || p.jornada}<small>{p.dias?.length ? ` · ${p.dias.length} ${p.dias.length === 1 ? 'día' : 'días'}` : ''}{p.concepto ? ` · ${p.concepto}` : ''}</small></span><b>{cop(p.monto)}</b></li>)}</ul>
            ) : <p className="pv-nota">Todavía no le has pagado.</p>}
            <button type="button" className="pv-link" onClick={() => api.guardarTrabajador({ id: t.id, nombre: t.nombre, activo: t.activo === false })}>
              {t.activo === false ? 'Volver a activar' : 'Ya no trabaja aquí'}
            </button>
          </div>
        )}
      </article>
    )
  }

  return (
    <div className="pv-panel cu-panel">
      <div className="pv-panel-cab">
        <h2 className="pv-panel-titulo">👥 Tu gente</h2>
        <span className="cu-total-mes">Nómina de {nombreMes(mes)}: <b>{cop(totalMes)}</b></span>
      </div>
      {error && <p className="pv-error" role="alert">{error}</p>}
      <form className="cu-nuevo" onSubmit={agregar}>
        <input placeholder="Nombre de alguien de tu equipo" maxLength={40} value={nuevo} onChange={e => setNuevo(e.target.value)} />
        <button className="pv-mandar" disabled={!nuevo.trim()}>＋ Agregar</button>
      </form>
      {gente === null ? <p className="pv-vacio">Cargando…</p>
        : !activos.length ? <p className="pv-vacio">Agrega a la gente a la que le pagas (use la app o no): el ayudante, el de la plancha, quien lava…</p>
          : <div className="cu-gente">{activos.map(tarjeta)}</div>}
      {inactivos.length > 0 && (
        <>
          <button type="button" className="pv-link" onClick={() => setVerInactivos(v => !v)}>{verInactivos ? 'Ocultar' : 'Ver'} los que ya no trabajan ({inactivos.length})</button>
          {verInactivos && <div className="cu-gente">{inactivos.map(tarjeta)}</div>}
        </>
      )}

      {pagando && (
        <PagarNomina local={local} api={api} usuario={usuario} trabajador={pagando} pagados={pagosDe(pagando.id)} onCerrar={() => setPagando(null)} />
      )}
    </div>
  )
}

function PagarNomina({ local, api, usuario, trabajador, pagados, onCerrar }) {
  const hoy = jornadaDe(Date.now(), local.horario)
  const cuentas = cuentasDe(local)
  const [mes, setMes] = useState(mesDe(hoy))
  const [dias, setDias] = useState(() => new Set())
  const [monto, setMonto] = useState('')
  const [cuenta, setCuenta] = useState(cuentaEfectivo(local).id)
  const [nota, setNota] = useState('')
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  // Día → cuándo se pagó (para marcarlo en el calendario).
  const yaPagado = useMemo(() => {
    const m = new Map()
    for (const p of pagados) for (const d of p.dias || []) m.set(d, p)
    return m
  }, [pagados])
  const celdas = useMemo(() => {
    const l = diasDelMes(mes)
    const primero = (new Date(`${l[0]}T12:00:00Z`).getUTCDay() + 6) % 7   // lunes = 0
    return [...Array(primero).fill(null), ...l]
  }, [mes])
  const toggle = d => setDias(s => { const n = new Set(s); n.has(d) ? n.delete(d) : n.add(d); return n })
  const marcar = lista => setDias(new Set(lista.filter(d => d <= hoy)))
  const repetidos = [...dias].filter(d => yaPagado.has(d))
  // Atajos: esta semana (lunes a hoy) · quincena en curso · lo que falta por pagar desde el último pago.
  const lunes = sumarDias(hoy, -((new Date(`${hoy}T12:00:00Z`).getUTCDay() + 6) % 7))
  const semana = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i))
  const dHoy = Number(hoy.slice(8))
  const quincena = diasDelMes(mesDe(hoy)).filter(d => (dHoy <= 15 ? Number(d.slice(8)) <= 15 : Number(d.slice(8)) > 15))
  const ultimoPagado = [...yaPagado.keys()].sort().at(-1)
  const desdeUltimo = ultimoPagado && ultimoPagado < hoy
    ? Array.from({ length: Math.min(31, Math.round((Date.parse(hoy) - Date.parse(ultimoPagado)) / 86400000)) }, (_, i) => sumarDias(ultimoPagado, i + 1))
    : []

  async function pagar() {
    if (!numero(monto) || !dias.size) return
    setEstado('guardando'); setError('')
    try {
      await api.registrarMovimiento({
        tipo: 'nomina', cuenta, monto: numero(monto), concepto: nota,
        trabajadorId: trabajador.id, trabajador: trabajador.nombre, dias: [...dias],
      }, { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' }, local)
      onCerrar()
    } catch (e) { setEstado(''); setError(motivoErrorCuentas(e)) }
  }

  return (
    <div className="pv-hoja-fondo centro" onClick={onCerrar}>
      <div className="pv-hoja pv-detalle cu-pagar-hoja" role="dialog" aria-modal="true" aria-label={`Pagar a ${trabajador.nombre}`} onClick={e => e.stopPropagation()}>
        <button type="button" className="pv-hoja-x" aria-label="Cerrar" onClick={onCerrar}>✕</button>
        <h2>Pagar a {trabajador.nombre}</h2>

        <div className="cb-sec">
          <h3>¿Qué días le pagas?</h3>
          <div className="cu-atajos">
            <button type="button" onClick={() => marcar(semana)}>Esta semana</button>
            <button type="button" onClick={() => marcar(quincena)}>{dHoy <= 15 ? '1–15' : `16–${diasDelMes(mesDe(hoy)).length}`} {nombreMesCorto(mesDe(hoy))}</button>
            {desdeUltimo.length > 0 && <button type="button" onClick={() => marcar(desdeUltimo)}>Desde el último pago</button>}
            {dias.size > 0 && <button type="button" className="limpiar" onClick={() => setDias(new Set())}>Limpiar</button>}
          </div>
          <div className="cu-cal">
            <div className="cu-cal-cab">
              <button type="button" onClick={() => setMes(mesAnterior)} aria-label="Mes anterior">‹</button>
              <b>{nombreMes(mes)} {mes.slice(0, 4)}</b>
              <button type="button" onClick={() => setMes(m => { const [y, n] = m.split('-').map(Number); return n === 12 ? `${y + 1}-01` : `${y}-${String(n + 1).padStart(2, '0')}` })} disabled={mes >= mesDe(hoy)} aria-label="Mes siguiente">›</button>
            </div>
            <div className="cu-cal-grid">
              {SEMANA.map((d, i) => <span key={i} className="cu-cal-dow">{d}</span>)}
              {celdas.map((d, i) => d === null ? <span key={`v${i}`} /> : (
                <button type="button" key={d} disabled={d > hoy}
                  className={`cu-cal-dia${dias.has(d) ? ' on' : ''}${yaPagado.has(d) ? ' pagado' : ''}${d === hoy ? ' hoy' : ''}`}
                  onClick={() => toggle(d)} aria-pressed={dias.has(d)}
                  title={yaPagado.has(d) ? 'Este día ya se le pagó' : undefined}>
                  {Number(d.slice(8))}
                </button>
              ))}
            </div>
            <p className="cu-cal-ley"><i className="on" /> Lo que pagas ahora <i className="pagado" /> Ya pagado</p>
          </div>
          {dias.size > 0 && <p className="cu-dias-txt"><b>{dias.size} {dias.size === 1 ? 'día' : 'días'}</b> · {rangoDias([...dias])}</p>}
          {repetidos.length > 0 && <p className="cb-aviso">⚠️ {repetidos.length === 1 ? 'Un día ya estaba pagado' : `${repetidos.length} días ya estaban pagados`}: {rangoDias(repetidos)}.</p>}
        </div>

        <input className="cu-monto" inputMode="numeric" placeholder="¿Cuánto le pagas? $0" value={monto ? cop(numero(monto)) : ''} onChange={e => setMonto(e.target.value)} />
        {cuentas.length > 1 && (
          <div className="cb-sec">
            <h3>Sale de</h3>
            <div className="cb-cuentas">
              {cuentas.map(c => <button type="button" key={c.id} className={cuenta === c.id ? 'on' : ''} onClick={() => setCuenta(c.id)}><span aria-hidden="true">{emojiCuenta(c)}</span>{c.nombre}</button>)}
            </div>
          </div>
        )}
        <input className="cb-motivo" maxLength={60} placeholder="Nota (opcional): horas extra, adelanto…" value={nota} onChange={e => setNota(e.target.value)} />
        {error && <p className="pv-error" role="alert">⚠️ {error}</p>}
        <button type="button" className="pv-cobrar" disabled={!numero(monto) || !dias.size || estado === 'guardando'} onClick={pagar}>
          {estado === 'guardando' ? 'Guardando…' : !dias.size ? 'Marca los días en el calendario' : !numero(monto) ? 'Escribe cuánto le pagas' : `Pagar ${cop(numero(monto))} · ${dias.size} ${dias.size === 1 ? 'día' : 'días'}`}
        </button>
      </div>
    </div>
  )
}
