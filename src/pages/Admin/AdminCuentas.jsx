import { useEffect, useMemo, useState } from 'react'
import { cuentasNegocioDe } from '../../services/cuentas'
import { sembrarSiVacio } from '../../services/cuentasEjemplo'
import { estadisticasEntre } from '../../services/stats'
import { cop } from '../../utils/money'
import {
  jornadaDe, sumarDias, mesDe, mesAnterior, etiquetaJornada, nombreMes, nombreMesCorto, diasDelMes,
} from '../../utils/jornada'
import { sumarEn } from '../../utils/cuentasCalculo.js'
import { cuentasDe, emojiCuenta } from '../../utils/cuentasDinero'
import { urlWhatsApp } from '../../utils/whatsapp'
import { coloresComanda } from './comandaUtils'
import { descargarExcel, descargarPdf } from './exportarMes'
import CuentasSaldos from './CuentasSaldos'
import CuentasNomina from './CuentasNomina'
import './Cobro.css'
import './Caja.css'
import './Cuentas.css'

// 📊 CUENTAS (solo el dueño — guía «Cuentas del negocio» D12, D15, D22, D27):
//   📅 Hoy    → vendiste − gastaste − nómina = te quedó (como la propuesta), por cuenta, y el
//               resumen del día por WhatsApp. Con ‹ › se mira cualquier otro día.
//   🗓️ Mes    → ganancia y comparación con el mes anterior, gráfica de los últimos 6 meses,
//               ticket promedio, platos más vendidos, horas pico y el movimiento de la app
//               (lo que era «Métricas»). Descarga en Excel o PDF.
//   💳 Saldos → cuánto hay en cada cuenta; meter, sacar y mover plata.
//   👥 Nómina → la gente y sus pagos con calendario.
// Todo sale de los resúmenes (resumen/d_… y m_…): leer un mes cuesta un documento.
const VISTAS = [
  { id: 'hoy', ico: '📅', label: 'Día' },
  { id: 'mes', ico: '🗓️', label: 'Mes' },
  { id: 'saldos', ico: '💳', label: 'Saldos' },
  { id: 'nomina', ico: '👥', label: 'Nómina' },
]
const ganancia = r => (r?.ventas || 0) - (r?.gastos || 0) - (r?.nomina || 0)

export default function AdminCuentas({ local, productos, demo, usuario }) {
  const api = useMemo(() => cuentasNegocioDe(local.id, { demo }), [local.id, demo])
  useMemo(() => { if (demo) sembrarSiVacio(api, local, productos) }, [demo, api]) // eslint-disable-line react-hooks/exhaustive-deps
  const [vista, setVista] = useState('hoy')
  const [saldos, setSaldos] = useState({})
  useEffect(() => api.escucharSaldos(setSaldos, () => {}), [api])
  const cuentas = cuentasDe(local)
  const totalPlata = cuentas.reduce((s, c) => s + (saldos[c.id] || 0), 0)

  return (
    <div className="pv cu" style={coloresComanda(local).vars}>
      <header className="pv-top">
        <div className="pv-marca">
          <span className="pv-marca-logo" aria-hidden="true">{local.icono || local.logo ? <img src={local.icono || local.logo} alt="" /> : '📊'}</span>
          <div>
            <b>{local.nombre}</b>
            <small>Cuentas del negocio</small>
          </div>
        </div>
        <div className="pv-caja">
          {cuentas.slice(0, 2).map(c => <div key={c.id}><small>{c.tipo === 'efectivo' ? 'En caja' : c.nombre}</small><b>{cop(saldos[c.id] || 0)}</b></div>)}
          <div><small>Plata del negocio</small><b>{cop(totalPlata)}</b></div>
        </div>
      </header>

      <nav className="pv-vistas" aria-label="Secciones de cuentas">
        {VISTAS.map(t => (
          <button key={t.id} type="button" className={vista === t.id ? 'on' : ''} aria-current={vista === t.id ? 'page' : undefined}
            onClick={() => { setVista(t.id); window.scrollTo?.({ top: 0, behavior: 'smooth' }) }}>
            <span className="pv-vistas-ico" aria-hidden="true">{t.ico}</span><span>{t.label}</span>
          </button>
        ))}
      </nav>

      {vista === 'hoy' && <Dia local={local} api={api} />}
      {vista === 'mes' && <Mes local={local} api={api} demo={demo} />}
      {vista === 'saldos' && <CuentasSaldos local={local} api={api} saldos={saldos} usuario={usuario} />}
      {vista === 'nomina' && <CuentasNomina local={local} api={api} usuario={usuario} />}
    </div>
  )
}

// ─────────────────────────────── El día ───────────────────────────────

function Dia({ local, api }) {
  const hoy = jornadaDe(Date.now(), local.horario)
  const [dia, setDia] = useState(hoy)
  const [r, setR] = useState(undefined)
  const [errorDia, setErrorDia] = useState(false)
  const [movs, setMovs] = useState([])
  // El día = lo de la caja (`d_`) + lo privado del dueño (`dp_`: nómina, retiros, ingresos).
  useEffect(() => {
    setR(undefined); setErrorDia(false)
    const partes = { d: undefined, dp: undefined }
    const juntar = () => { if (partes.d !== undefined && partes.dp !== undefined) setR(partes.d || partes.dp ? sumarEn(partes.d || {}, partes.dp || {}) : null) }
    const falla = () => setErrorDia(true)
    const u1 = api.escucharResumen(`d_${dia}`, x => { partes.d = x; setErrorDia(false); juntar() }, falla)
    const u2 = api.escucharResumen(`dp_${dia}`, x => { partes.dp = x; juntar() }, falla)
    return () => { u1(); u2() }
  }, [api, dia])
  // El detalle de gastos y nómina del día (pocos documentos).
  useEffect(() => { let vivo = true; api.movimientosEntre(dia, dia).then(l => { if (vivo) setMovs(l) }).catch(() => {}); return () => { vivo = false } }, [api, dia, r])
  const cuentas = cuentasDe(local)
  const gastos = movs.filter(m => m.estado === 'ok' && (m.tipo === 'gasto' || m.tipo === 'nomina'))
  const vendido = r?.ventas || 0
  const gastado = (r?.gastos || 0) + (r?.nomina || 0)
  const quedo = vendido - gastado

  function resumenWhatsApp() {
    const lineas = [
      `📊 *${local.nombre}* · ${etiquetaJornada(dia, hoy)} (${dia})`,
      '',
      `➕ Vendiste: *${cop(vendido)}* (${r?.nVentas || 0} ventas)`,
      ...cuentas.filter(c => r?.porCuenta?.[c.id]).map(c => `   ${emojiCuenta(c)} ${c.nombre}: ${cop(r.porCuenta[c.id])}`),
      `➖ Gastaste: *${cop(gastado)}*`,
      ...gastos.map(g => `   • ${g.tipo === 'nomina' ? `Nómina ${g.trabajador || ''}` : g.concepto}: ${cop(g.monto)}`),
      `🟰 Te quedó: *${cop(quedo)}*`,
      ...(r?.propinas ? [`🙌 Propinas aparte: ${cop(r.propinas)}`] : []),
      '',
      '_Hecho con Appetic_',
    ]
    window.open(urlWhatsApp('', lineas.join('\n')), '_blank')
  }

  return (
    <div className="pv-panel cu-panel">
      <div className="cu-nav">
        <button type="button" onClick={() => setDia(d => sumarDias(d, -1))} aria-label="Día anterior">‹</button>
        <b>{etiquetaJornada(dia, hoy)}{dia !== hoy && dia !== sumarDias(hoy, -1) && dia !== sumarDias(hoy, -2) ? '' : ` · ${dia.slice(8)} ${nombreMesCorto(mesDe(dia))}`}</b>
        <button type="button" onClick={() => setDia(d => sumarDias(d, 1))} disabled={dia >= hoy} aria-label="Día siguiente">›</button>
      </div>

      {errorDia ? <p className="pv-vacio">No se pudo cargar el día. Revisa el internet.</p>
        : r === undefined ? <p className="pv-vacio">Cargando…</p> : (
        <div className="cu-dia">
          <section className="cu-bloque mas">
            <h3><span>+</span> Vendiste</h3>
            <b className="cu-grande">{cop(vendido)}</b>
            <small>{r?.nVentas || 0} {r?.nVentas === 1 ? 'venta' : 'ventas'}{r?.descuentos ? ` · descuentos ${cop(r.descuentos)}` : ''}</small>
            <ul>
              {cuentas.filter(c => r?.porCuenta?.[c.id]).map(c => <li key={c.id}><span>{emojiCuenta(c)} {c.nombre}</span><b>{cop(r.porCuenta[c.id])}</b></li>)}
            </ul>
          </section>
          <section className="cu-bloque menos">
            <h3><span>−</span> Gastaste</h3>
            <b className="cu-grande">{cop(gastado)}</b>
            <ul>
              {gastos.length ? gastos.map(g => (
                <li key={g.id}><span>{g.tipo === 'nomina' ? `👥 Nómina · ${g.trabajador || ''}` : `• ${g.concepto}`}</span><b>{cop(g.monto)}</b></li>
              )) : <li className="cu-nada">Sin gastos anotados</li>}
            </ul>
          </section>
          <section className={`cu-bloque igual${quedo < 0 ? ' neg' : ''}`}>
            <h3><span>=</span> Te quedó</h3>
            <b className="cu-grande">{cop(quedo)}</b>
            <small>Sin sumar a mano ni un solo peso.</small>
            {r?.propinas > 0 && <p className="cu-propinas">🙌 Propinas aparte: <b>{cop(r.propinas)}</b> (no cuentan como venta)</p>}
          </section>
        </div>
      )}
      <button type="button" className="pv-mandar cu-wa" onClick={resumenWhatsApp} disabled={!r}>📲 Mandar el resumen del día por WhatsApp</button>
      <p className="pv-nota cu-dian">Son tus cuentas, para ti. No es facturación electrónica ni trámites con la DIAN.</p>
    </div>
  )
}

// ─────────────────────────────── El mes ───────────────────────────────

function Mes({ local, api, demo }) {
  const actual = mesDe(jornadaDe(Date.now(), local.horario))
  const [mes, setMes] = useState(actual)
  const [res, setRes] = useState(null)        // { m_…: resumen } de los últimos 6 meses ('error' si no cargó)
  const [antParcial, setAntParcial] = useState(null)  // mes en curso: el anterior, solo del día 1 al de hoy
  const [app, setApp] = useState(null)        // visitas y pedidos por la app
  const [bajando, setBajando] = useState('')
  const meses = useMemo(() => { const l = [mes]; for (let i = 0; i < 5; i++) l.unshift(mesAnterior(l[0])); return l }, [mes])
  useEffect(() => {
    let vivo = true
    setRes(null)
    api.resumenesEntre(`m_${meses[0]}`, `m_${mes}`).then(x => { if (vivo) setRes(x) }).catch(() => { if (vivo) setRes('error') })
    return () => { vivo = false }
  }, [api, meses, mes])
  // 📊 El mes que va corriendo se compara con LOS MISMOS DÍAS del anterior (el 3-nov contra el 1–3
  // oct), no con el mes completo: antes salía «▼ 88%» todos los primeros días de cada mes.
  const diaHoy = Number(jornadaDe(Date.now(), local.horario).slice(8, 10))
  useEffect(() => {
    let vivo = true
    setAntParcial(null)
    if (mes !== actual) return
    const prev = mesAnterior(mes)
    const hasta = `${prev}-${String(Math.min(diaHoy, diasDelMes(prev).length)).padStart(2, '0')}`
    Promise.all([api.resumenesEntre(`d_${prev}-01`, `d_${hasta}`), api.resumenesEntre(`dp_${prev}-01`, `dp_${hasta}`)])
      .then(([a, b]) => { if (vivo) setAntParcial(Object.values({ ...a, ...b }).reduce((t, x) => sumarEn(t, x), {})) })
      .catch(() => { if (vivo) setAntParcial({}) })
    return () => { vivo = false }
  }, [api, mes, actual, diaHoy])
  useEffect(() => {
    let vivo = true
    setApp(null)
    if (demo) { setApp({ visitas: 312, pedidos: 27, domicilios: 21, recoger: 6 }); return }
    estadisticasEntre(local.id, `${mes}-01`, `${mes}-31`).then(x => { if (vivo) setApp(x) }).catch(() => { if (vivo) setApp({ visitas: 0, pedidos: 0, domicilios: 0, recoger: 0 }) })
    return () => { vivo = false }
  }, [local.id, mes, demo])

  const resOk = res && res !== 'error' ? res : {}
  const r = resOk[`m_${mes}`] || null
  const enCurso = mes === actual
  // Mes cerrado: contra el anterior completo, solo si ese también fue un mes entero de uso (si el de
  // antes no tiene datos, el anterior fue el primero, a medias, y el % sería mentira).
  const prevCompleto = resOk[`m_${mesAnterior(mesAnterior(mes))}`] ? resOk[`m_${mesAnterior(mes)}`] : null
  const nDias = Math.min(diaHoy, diasDelMes(mesAnterior(mes)).length)
  // Sin los días guardados del mes anterior (datos viejos, o la demo) pero con el mes entero: a
  // prorrata, y se dice que es aproximado.
  const aProrrata = enCurso && antParcial && !antParcial.nVentas && prevCompleto?.nVentas
  const ant = !enCurso ? prevCompleto
    : aProrrata ? { nVentas: prevCompleto.nVentas, ventas: prevCompleto.ventas * nDias / diasDelMes(mesAnterior(mes)).length,
        gastos: (prevCompleto.gastos || 0) * nDias / diasDelMes(mesAnterior(mes)).length, nomina: (prevCompleto.nomina || 0) * nDias / diasDelMes(mesAnterior(mes)).length }
      : antParcial
  const g = ganancia(r), gAnt = ganancia(ant)
  const cambio = ant?.nVentas && gAnt ? Math.round((g - gAnt) / Math.abs(gAnt) * 100) : null
  const contra = !enCurso ? nombreMes(mesAnterior(mes))
    : aProrrata ? `${nombreMes(mesAnterior(mes))} a esta altura (aprox.)`
      : `el 1–${nDias} de ${nombreMes(mesAnterior(mes))}`
  const ticket = r?.nVentas ? Math.round(r.ventas / r.nVentas) : 0
  const antTicket = resOk[`m_${mesAnterior(mes)}`]
  const ticketAnt = antTicket?.nVentas ? Math.round(antTicket.ventas / antTicket.nVentas) : 0
  const platos = Object.entries(r?.porPlato || {}).filter(([k, p]) => k !== '_envio' && p.n > 0).sort((a, b) => b[1].n - a[1].n).slice(0, 5)
  const horas = Object.entries(r?.porHora || {}).map(([h, v]) => [Number(h), v]).filter(([, v]) => v > 0).sort((a, b) => a[0] - b[0])
  const maxHora = Math.max(1, ...horas.map(([, v]) => v))
  const serie = meses.map(m => ({ m, v: ganancia(resOk[`m_${m}`]), ventas: resOk[`m_${m}`]?.ventas || 0 }))
  const maxSerie = Math.max(1, ...serie.map(x => Math.max(x.ventas, Math.abs(x.v))))
  const tipos = r?.porTipo || {}

  const [errorBajar, setErrorBajar] = useState('')
  async function bajar(tipo) {
    setBajando(tipo); setErrorBajar('')
    // El PDF necesita una ventana: se abre YA, en el toque (después de esperar los datos el
    // navegador la bloquea), y se llena cuando lleguen.
    const ventana = tipo === 'pdf' ? window.open('', '_blank') : null
    try {
      const desde = `${mes}-01`, hasta = `${mes}-31`
      const [ventas, movs] = await Promise.all([api.ventasEntre(desde, hasta), api.movimientosEntre(desde, hasta)])
      const datos = { local, mes, resumen: r || {}, ventas: ventas.filter(v => v.estado === 'ok'), movimientos: movs.filter(m => m.estado === 'ok') }
      if (tipo === 'excel') descargarExcel(datos)
      else descargarPdf(datos, ventana)
    } catch (e) {
      ventana?.close()
      setErrorBajar(e?.message === 'ventana-bloqueada' ? 'Permite las ventanas emergentes para descargar el PDF.' : 'No se pudo descargar. Revisa el internet e intenta de nuevo.')
    } finally { setBajando('') }
  }

  return (
    <div className="pv-panel cu-panel">
      <div className="cu-nav">
        <button type="button" onClick={() => setMes(mesAnterior)} aria-label="Mes anterior">‹</button>
        <b>{nombreMes(mes)} {mes.slice(0, 4)}</b>
        <button type="button" onClick={() => setMes(m => { const [y, n] = m.split('-').map(Number); return n === 12 ? `${y + 1}-01` : `${y}-${String(n + 1).padStart(2, '0')}` })} disabled={mes >= actual} aria-label="Mes siguiente">›</button>
      </div>

      {res === 'error' ? <p className="pv-vacio">No se pudo cargar el mes. Revisa el internet.</p>
        : res === null ? <p className="pv-vacio">Cargando…</p> : (
        <>
          <section className="pv-card cu-ganancia">
            <small>Ganancia de {nombreMes(mes)}</small>
            <b className={g < 0 ? 'neg' : ''}>{cop(g)}</b>
            {cambio !== null && <span className={`cu-cambio ${cambio >= 0 ? 'sube' : 'baja'}`}>{cambio >= 0 ? '▲' : '▼'} {Math.abs(cambio)}% {cambio >= 0 ? 'más' : 'menos'} que {contra}</span>}
            <div className="cu-tabla">
              <span>Ventas</span><b>{cop(r?.ventas || 0)}</b>
              <span>Gastos y compras</span><b>− {cop(r?.gastos || 0)}</b>
              <span>Nómina</span><b>− {cop(r?.nomina || 0)}</b>
              <span className="tot">Ganancia</span><b className={`tot${g < 0 ? ' neg' : ''}`}>{cop(g)}</b>
            </div>
            {(r?.propinas > 0 || r?.descuentos > 0) && (
              <p className="pv-nota">{r?.propinas > 0 ? `🙌 Propinas ${cop(r.propinas)} (aparte)` : ''}{r?.propinas > 0 && r?.descuentos > 0 ? ' · ' : ''}{r?.descuentos > 0 ? `🏷️ Descuentos y cortesías ${cop(r.descuentos)}` : ''}</p>
            )}
          </section>

          <section className="pv-card cu-graf">
            <h3>Últimos 6 meses</h3>
            <div className="cu-barras" role="img" aria-label="Ventas y ganancia de los últimos 6 meses">
              {serie.map(x => (
                <button type="button" key={x.m} className={`cu-barra${x.m === mes ? ' on' : ''}`} onClick={() => setMes(x.m)} title={`${nombreMes(x.m)}: ventas ${cop(x.ventas)} · ganancia ${cop(x.v)}`}>
                  <span className="cu-barra-pista">
                    <i className="v" style={{ height: `${x.ventas / maxSerie * 100}%` }} />
                    <i className={`g${x.v < 0 ? ' neg' : ''}`} style={{ height: `${Math.abs(x.v) / maxSerie * 100}%` }} />
                  </span>
                  <small>{nombreMesCorto(x.m)}</small>
                </button>
              ))}
            </div>
            <p className="cu-leyenda"><i className="v" /> Ventas <i className="g" /> Ganancia</p>
          </section>

          <div className="cu-kpis">
            <div className="pv-card cu-kpi">
              <small>Ticket promedio</small>
              <b>{cop(ticket)}</b>
              {ticketAnt > 0 && ticket > 0 && <span className={`cu-cambio ${ticket >= ticketAnt ? 'sube' : 'baja'}`}>{ticket >= ticketAnt ? '▲' : '▼'} vs {cop(ticketAnt)}</span>}
              <span className="pv-nota">lo que gasta cada cliente</span>
            </div>
            <div className="pv-card cu-kpi">
              <small>Ventas</small>
              <b>{r?.nVentas || 0}</b>
              <span className="pv-nota">
                {[['mesa', '🪑'], ['llevar', '🥡'], ['recoger', '🛍️'], ['domicilio', '🛵'], ['caja', '⚡']].filter(([k]) => tipos[k] > 0).map(([k, e]) => `${e} ${tipos[k]}`).join(' · ') || '—'}
              </span>
            </div>
            <div className="pv-card cu-kpi">
              <small>Por la app</small>
              <b>{app ? app.visitas : '…'}</b>
              <span className="pv-nota">👁️ visitas al menú · 🛍️ {app?.pedidos ?? '…'} pedidos por WhatsApp{app?.domicilios && app.domicilios + app.recoger === app.pedidos ? ` (🛵 ${app.domicilios} domicilios · 🥡 ${app.recoger} para recoger)` : ''}</span>
            </div>
          </div>

          <div className="cu-dos">
            <section className="pv-card cu-lista">
              <h3>🏆 Lo más vendido</h3>
              {platos.length ? (
                <ol>
                  {platos.map(([k, p], i) => (
                    <li key={k}><span className="cu-pos">{i + 1}</span><span className="cu-nom">{p.nombre}</span><span className="pv-pedido-puntos" aria-hidden="true" /><b>{p.n}</b><small>{cop(p.monto)}</small></li>
                  ))}
                </ol>
              ) : <p className="pv-vacio">Aún no hay ventas este mes.</p>}
            </section>
            <section className="pv-card cu-lista">
              <h3>⏰ Horas pico</h3>
              {horas.length ? (
                <div className="cu-horas">
                  {horas.map(([h, v]) => (
                    <div key={h} className={`cu-hora${v === maxHora ? ' pico' : ''}`}>
                      <small>{h % 12 || 12}{h < 12 ? 'a' : 'p'}</small>
                      <span><i style={{ width: `${v / maxHora * 100}%` }} /></span>
                      <b>{cop(v)}</b>
                    </div>
                  ))}
                </div>
              ) : <p className="pv-vacio">Aún no hay ventas este mes.</p>}
            </section>
          </div>

          <section className="pv-card cu-bajar">
            <div>
              <h3>⬇️ Descargar {nombreMes(mes)}</h3>
              <p className="pv-nota">Ventas, gastos, nómina y el resumen, para tu contador o tu socio.</p>
            </div>
            <div className="cu-bajar-btns">
              <button type="button" className="pv-mandar" disabled={!!bajando} onClick={() => bajar('excel')}>{bajando === 'excel' ? 'Preparando…' : '📗 Excel'}</button>
              <button type="button" className="pv-mandar" disabled={!!bajando} onClick={() => bajar('pdf')}>{bajando === 'pdf' ? 'Preparando…' : '📄 PDF'}</button>
            </div>
            {errorBajar && <p className="pv-nota cu-error" role="alert">{errorBajar}</p>}
          </section>
        </>
      )}
    </div>
  )
}
