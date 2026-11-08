import { useRef, useState } from 'react'
import { cop } from '../../utils/money'
import { motivoErrorCuentas } from '../../services/cuentas'
import { cuentasDe, cuentaEfectivo } from '../../utils/cuentasDinero'
import { DENOMINACIONES, MAX_POR_DENOMINACION, sumarConteo } from '../../utils/arqueo'
import { conTope } from '../../utils/conTope'

// 🧮 CONTAR LA CAJA (guía «Mejoras frente a Loggro» D17 y D18): billetes y monedas, cuando quieran.
// No abre ni cierra nada. El cajero cuenta A CIEGAS: no ve cuánto debería haber, solo que quedó
// guardado. El dueño ve al instante si sobra o falta y decide: ajustar el saldo o dejarlo así.
const numero = t => Math.min(MAX_POR_DENOMINACION, Number(String(t).replace(/\D/g, '')) || 0)

export function Diferencia({ valor }) {
  if (!valor) return <b className="ca-dif cuadra">Cuadra ✓</b>
  return <b className={`ca-dif ${valor > 0 ? 'sobra' : 'falta'}`}>{valor > 0 ? 'Sobran' : 'Faltan'} {cop(Math.abs(valor))}</b>
}

export default function ContarCaja({ local, cuentasApi, usuario, esAdmin, onCerrar }) {
  const efectivos = cuentasDe(local).filter(c => c.tipo === 'efectivo')
  const [cuenta, setCuenta] = useState((efectivos[0] || cuentaEfectivo(local)).id)
  const [conteo, setConteo] = useState({})
  const [estado, setEstado] = useState('')   // '' | 'guardando' | 'listo'
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const por = { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' }
  const total = sumarConteo(conteo)
  // Un id por conteo: dos toques o un reintento guardan el MISMO arqueo.
  const idArqueo = useRef(null)
  const poner = (valor, n) => { idArqueo.current = null; setConteo(c => ({ ...c, [valor]: Math.max(0, Math.min(MAX_POR_DENOMINACION, n)) })) }

  async function guardar() {
    if (estado === 'guardando') return
    if (!idArqueo.current) idArqueo.current = cuentasApi.nuevoIdArqueo()
    setEstado('guardando'); setError('')
    try {
      const r = await conTope(cuentasApi.contarCaja({ id: idArqueo.current, cuenta, conteo }, por, local), 15000)
      setResultado({ ...r, id: idArqueo.current, cuenta })
      setEstado('listo')
    } catch (e) { setError(motivoErrorCuentas(e)); setEstado('') }
  }

  const [revisando, setRevisando] = useState(false)
  async function revisar(accion) {
    if (revisando) return
    setRevisando(true); setError('')
    try { await conTope(cuentasApi.revisarArqueo(resultado, accion, por, local), 12000); onCerrar() }
    catch (e) { setError(motivoErrorCuentas(e)) } finally { setRevisando(false) }
  }

  return (
    <div className="pv-hoja-fondo centro" onClick={onCerrar}>
      <div className="pv-hoja ca-hoja" role="dialog" aria-modal="true" aria-label="Contar la caja" onClick={e => e.stopPropagation()}>
        <button type="button" className="pv-hoja-x" aria-label="Cerrar" onClick={onCerrar}>✕</button>
        <h2>🧮 Contar la caja</h2>

        {estado !== 'listo' ? (
          <>
            <p className="pv-nota">Cuenta cuántos billetes y monedas hay de cada valor. No cierra la caja: se puede contar cuando quieran.</p>
            {efectivos.length > 1 && (
              <div className="cb-cuentas" role="radiogroup" aria-label="Qué caja se cuenta">
                {efectivos.map(c => (
                  <button type="button" key={c.id} role="radio" aria-checked={cuenta === c.id} className={cuenta === c.id ? 'on' : ''} onClick={() => { idArqueo.current = null; setCuenta(c.id) }}>💵 {c.nombre}</button>
                ))}
              </div>
            )}
            <div className="ca-lista">
              {DENOMINACIONES.map(d => {
                const n = conteo[d.valor] || 0
                return (
                  <div key={d.valor} className={`ca-fila${n ? ' con' : ''}`}>
                    <span className="ca-denom"><span aria-hidden="true">{d.tipo === 'billete' ? '💵' : '🪙'}</span>{cop(d.valor)}</span>
                    <div className="ca-cant">
                      <button type="button" aria-label={`Uno menos de ${cop(d.valor)}`} disabled={!n} onClick={() => poner(d.valor, n - 1)}>−</button>
                      <input inputMode="numeric" aria-label={`Cuántos de ${cop(d.valor)}`} value={n || ''} placeholder="0" onChange={e => poner(d.valor, numero(e.target.value))} onFocus={e => e.target.select()} />
                      <button type="button" aria-label={`Uno más de ${cop(d.valor)}`} onClick={() => poner(d.valor, n + 1)}>+</button>
                    </div>
                    <span className="ca-sub">{n ? cop(n * d.valor) : ''}</span>
                  </div>
                )
              })}
            </div>
            <div className="ca-total"><span>Contaste</span><b>{cop(total)}</b></div>
            <button type="button" className="pv-cobrar" disabled={estado === 'guardando'} onClick={guardar}>
              {estado === 'guardando' ? 'Guardando…' : `Guardar conteo · ${cop(total)}`}
            </button>
          </>
        ) : esAdmin && resultado?.esperado != null ? (
          <div className="ca-resultado">
            <div className="ca-res-fila"><span>Contaste</span><b>{cop(resultado.contado)}</b></div>
            <div className="ca-res-fila"><span>Debería haber</span><b>{cop(resultado.esperado)}</b></div>
            <div className="ca-res-fila grande"><span>Diferencia</span><Diferencia valor={resultado.diferencia} /></div>
            {resultado.diferencia ? (
              <>
                <p className="pv-nota">«Ajustar» deja el saldo en {cop(resultado.contado)} con un {resultado.diferencia > 0 ? 'Meter' : 'Sacar'} de «Diferencia del arqueo». «Dejar así» solo lo anota.</p>
                <div className="pv-eliminar-acc">
                  <button type="button" className="pv-link" disabled={revisando} onClick={() => revisar('aceptado')}>Dejar así</button>
                  <button type="button" className="pv-cobrar ca-ajustar" disabled={revisando} onClick={() => revisar('ajustado')}>{revisando ? 'Ajustando…' : 'Ajustar el saldo'}</button>
                </div>
              </>
            ) : <button type="button" className="pv-cobrar" disabled={revisando} onClick={() => revisar('aceptado')}>Listo</button>}
          </div>
        ) : (
          <div className="ca-resultado">
            <p className="pv-ok" role="status">✓ Conteo guardado: {cop(resultado?.contado || 0)}</p>
            <p className="pv-nota">El dueño lo revisa en Cuentas.</p>
            <button type="button" className="pv-cobrar" onClick={onCerrar}>Listo</button>
          </div>
        )}
        {error && <p className="pv-error" role="alert">⚠️ {error}</p>}
      </div>
    </div>
  )
}
