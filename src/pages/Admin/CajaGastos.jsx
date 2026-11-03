import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { cop } from '../../utils/money'
import { ms } from '../../services/comandas'
import { motivoErrorCuentas } from '../../services/cuentas'
import { jornadaDe, etiquetaJornada, horaCorta } from '../../utils/jornada'
import { cuentasDe, cuentaEfectivo, emojiCuenta, cuentasParaPagar } from '../../utils/cuentasDinero'
import { primerNombre } from './CajaVentas'
import { conTope } from '../../utils/conTope'
import { avisarDemo } from '../../components/Demo/eventosDemo'

// 💸 GASTOS (Caja, guía «Cuentas del negocio» D9 + S13): concepto y valor, y de qué cuenta salió
// la plata (por defecto el efectivo). Lista por día como las ventas. Equivocarse se arregla
// eliminando con motivo (queda tachado, con quién y por qué); el cajero solo los de hoy.
const numero = t => Number(String(t).replace(/\D/g, '')) || 0

export default function CajaGastos({ local, cuentasApi, usuario, esAdmin }) {
  const cuentas = cuentasDe(local)
  const cuentasSalida = cuentasParaPagar(local)   // sin el datáfono
  const [concepto, setConcepto] = useState('')
  const [valor, setValor] = useState('')
  const [cuenta, setCuenta] = useState(cuentaEfectivo(local).id)
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [lista, setLista] = useState(null)
  const [borrando, setBorrando] = useState(null)
  const [motivo, setMotivo] = useState('')
  const por = { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' }
  useEffect(() => cuentasApi.escucharMovimientos(l => setLista(l), e => setError(motivoErrorCuentas(e)), { tipo: 'gasto', n: 60 }), [cuentasApi])

  const hoy = jornadaDe(Date.now(), local.horario)
  const totales = useMemo(() => {
    const t = {}
    for (const g of lista || []) if (g.estado === 'ok') t[g.jornada] = (t[g.jornada] || 0) + g.monto
    return t
  }, [lista])

  // Un id por gasto que se está anotando: dos toques o un reintento escriben el MISMO gasto.
  const idGasto = useRef(null)
  const ocupado = useRef(false)
  async function anotar(e) {
    e.preventDefault()
    if (!concepto.trim() || !numero(valor) || ocupado.current) return
    ocupado.current = true
    if (!idGasto.current) idGasto.current = cuentasApi.nuevoIdMovimiento()
    setEstado('guardando'); setError('')
    try {
      await conTope(cuentasApi.registrarMovimiento({ id: idGasto.current, tipo: 'gasto', concepto, monto: numero(valor), cuenta }, por, local), 12000)
      idGasto.current = null
      avisarDemo('gasto')
      setOk(`✓ ${concepto.trim()} · ${cop(numero(valor))}`)
      setTimeout(() => setOk(''), 3000)
      setConcepto(''); setValor('')
    } catch (err) { setError(motivoErrorCuentas(err)) } finally { ocupado.current = false; setEstado('') }
  }
  const [eliminando, setEliminando] = useState(false)
  async function eliminar() {
    if (!motivo.trim() || eliminando) return
    setEliminando(true)
    try { await conTope(cuentasApi.eliminarMovimiento(borrando, por, motivo), 12000); setBorrando(null); setMotivo('') }
    catch (err) { setError(motivoErrorCuentas(err)) } finally { setEliminando(false) }
  }

  return (
    <div className="pv-panel">
      <h2 className="pv-panel-titulo">💸 Gastos y compras</h2>
      <form className="pv-card pv-gasto" onSubmit={anotar}>
        <input className="pv-gasto-concepto" placeholder="¿En qué se gastó? Ej: Carne y pollo" maxLength={60} value={concepto} onChange={e => { idGasto.current = null; setConcepto(e.target.value) }} />
        <input className="pv-gasto-valor" inputMode="numeric" placeholder="$0" value={valor ? cop(numero(valor)) : ''} onChange={e => { idGasto.current = null; setValor(e.target.value) }} />
        {cuentas.length > 1 && (
          <div className="cb-cuentas pv-gasto-cuentas" role="radiogroup" aria-label="De dónde salió la plata">
            <small>Salió de</small>
            {cuentasSalida.map(c => (
              <button type="button" key={c.id} role="radio" aria-checked={cuenta === c.id} className={cuenta === c.id ? 'on' : ''} onClick={() => setCuenta(c.id)}>
                <span aria-hidden="true">{emojiCuenta(c)}</span>{c.nombre}
              </button>
            ))}
          </div>
        )}
        <button className="pv-cobrar" disabled={!concepto.trim() || !numero(valor) || estado === 'guardando'}>
          {estado === 'guardando' ? 'Anotando…' : `Anotar gasto${numero(valor) ? ` · ${cop(numero(valor))}` : ''}`}
        </button>
        {ok && <p className="pv-ok" role="status">{ok}</p>}
        {error && <p className="pv-error" role="alert">⚠️ {error}</p>}
      </form>

      <div className="pv-card pv-ventas">
        {lista === null ? <p className="pv-vacio">Cargando…</p>
          : !lista.length ? <p className="pv-vacio">Todavía no hay gastos anotados.</p>
            : lista.map((g, i, arr) => (
              <Fragment key={g.id}>
                {(i === 0 || arr[i - 1].jornada !== g.jornada) && <div className="pv-dia"><span>{etiquetaJornada(g.jornada, hoy)}</span><b>{cop(totales[g.jornada] || 0)}</b></div>}
                <div className={`pv-venta pv-gasto-fila${g.estado !== 'ok' ? ' eliminada' : ''}`}>
                  <span className="pv-venta-hora">{horaCorta(ms(g.en))}</span>
                  <span className="pv-venta-info">
                    <b>{g.concepto || 'Gasto'}</b>
                    <small>
                      {g.estado !== 'ok'
                        ? `Eliminado por ${primerNombre(g.eliminado?.por)} · ${g.eliminado?.motivo || ''}`
                        : `${primerNombre(g.por)} · ${emojiCuenta(cuentas.find(c => c.id === g.cuenta))} ${cuentas.find(c => c.id === g.cuenta)?.nombre || ''}`}
                    </small>
                  </span>
                  <span className="pv-venta-total">− {cop(g.monto)}</span>
                  {g.estado === 'ok' && (esAdmin || g.jornada === hoy) && (
                    <button type="button" className="pv-x-mini" aria-label={`Eliminar ${g.concepto}`} onClick={() => { setBorrando(g); setMotivo('') }}>🗑</button>
                  )}
                </div>
              </Fragment>
            ))}
      </div>

      {borrando && (
        <div className="pv-hoja-fondo centro" onClick={() => setBorrando(null)}>
          <div className="pv-hoja pv-detalle" role="dialog" aria-modal="true" aria-label="Eliminar gasto" onClick={e => e.stopPropagation()}>
            <button type="button" className="pv-hoja-x" aria-label="Cerrar" onClick={() => setBorrando(null)}>✕</button>
            <h2>Eliminar gasto</h2>
            <p className="pv-nota">{borrando.concepto} · {cop(borrando.monto)}. La plata vuelve a su cuenta y queda tachado con tu nombre.</p>
            <textarea className="pv-motivo" autoFocus maxLength={140} placeholder="¿Por qué se elimina? (obligatorio)" value={motivo} onChange={e => setMotivo(e.target.value)} />
            <div className="pv-eliminar-acc">
              <button type="button" className="pv-link" onClick={() => setBorrando(null)}>Volver</button>
              <button type="button" className="pv-peligro" disabled={!motivo.trim() || eliminando} onClick={eliminar}>{eliminando ? 'Eliminando…' : 'Sí, eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
